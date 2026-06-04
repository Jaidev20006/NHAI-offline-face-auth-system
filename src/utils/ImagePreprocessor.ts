/**
 * ImagePreprocessor
 *
 * Prepares a raw camera frame for the face recognition model:
 *   1. Crop to detected face bounding box
 *   2. Resize to 112×112 (MobileFaceNet input)
 *   3. Apply CLAHE-style adaptive histogram equalisation (JS implementation)
 *      — compensates for harsh sunlight, deep shadow, and side-lit faces
 *   4. Normalise pixel values to [-1, 1]
 *   5. Return Float32Array in CHW layout (channels-first, 3×112×112)
 *
 * All processing runs on-device with no native modules, keeping the pipeline
 * pure JavaScript for cross-platform compatibility.
 */

const INPUT_SIZE = 112;
const CLAHE_CLIP_LIMIT = 2.0;
const CLAHE_TILE_SIZE = 8;

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Main entry point.  Accepts a pixel buffer (RGBA Uint8ClampedArray) from
 * react-native-vision-camera's frame processor and returns the model tensor.
 */
export function preprocessFace(
  pixelData: Uint8ClampedArray,
  frameWidth: number,
  frameHeight: number,
  bbox: BoundingBox
): Float32Array {
  // Step 1 — crop + resize to 112×112
  const cropped = cropAndResize(pixelData, frameWidth, frameHeight, bbox, INPUT_SIZE);

  // Step 2 — convert RGBA → grayscale for CLAHE, then back to RGB
  const gray = rgbaToGray(cropped);
  const equalised = clahe(gray, INPUT_SIZE, INPUT_SIZE, CLAHE_TILE_SIZE, CLAHE_CLIP_LIMIT);
  const rgb = mergeEqualised(cropped, equalised);

  // Step 3 — normalise to [-1, 1] and convert to CHW
  return normaliseToChw(rgb, INPUT_SIZE);
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function cropAndResize(
  src: Uint8ClampedArray,
  srcW: number,
  srcH: number,
  bbox: BoundingBox,
  outSize: number
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(outSize * outSize * 4);
  const scaleX = bbox.width  / outSize;
  const scaleY = bbox.height / outSize;

  for (let oy = 0; oy < outSize; oy++) {
    for (let ox = 0; ox < outSize; ox++) {
      const sx = Math.min(Math.floor(bbox.x + ox * scaleX), srcW - 1);
      const sy = Math.min(Math.floor(bbox.y + oy * scaleY), srcH - 1);
      const si = (sy * srcW + sx) * 4;
      const di = (oy * outSize + ox) * 4;
      out[di]     = src[si];
      out[di + 1] = src[si + 1];
      out[di + 2] = src[si + 2];
      out[di + 3] = 255;
    }
  }
  return out;
}

function rgbaToGray(rgba: Uint8ClampedArray): Uint8Array {
  const gray = new Uint8Array(rgba.length / 4);
  for (let i = 0; i < gray.length; i++) {
    const r = rgba[i * 4], g = rgba[i * 4 + 1], b = rgba[i * 4 + 2];
    gray[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  }
  return gray;
}

/**
 * Tile-based CLAHE (Contrast Limited Adaptive Histogram Equalisation).
 * Divides the image into tileSize×tileSize blocks, computes and clips a
 * histogram per block, then bilinearly interpolates at each pixel.
 */
function clahe(
  gray: Uint8Array,
  width: number,
  height: number,
  tileSize: number,
  clipLimit: number
): Uint8Array {
  const tilesX = Math.ceil(width  / tileSize);
  const tilesY = Math.ceil(height / tileSize);
  const tilePx = tileSize * tileSize;
  const clipCount = Math.round(clipLimit * tilePx / 256);

  // Build CDF LUT for each tile
  const luts: Uint8Array[][] = [];
  for (let ty = 0; ty < tilesY; ty++) {
    luts.push([]);
    for (let tx = 0; tx < tilesX; tx++) {
      const hist = new Uint32Array(256);
      const y0 = ty * tileSize, y1 = Math.min(y0 + tileSize, height);
      const x0 = tx * tileSize, x1 = Math.min(x0 + tileSize, width);
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          hist[gray[y * width + x]]++;
        }
      }
      // Clip
      let excess = 0;
      for (let b = 0; b < 256; b++) {
        if (hist[b] > clipCount) { excess += hist[b] - clipCount; hist[b] = clipCount; }
      }
      const redistrib = Math.floor(excess / 256);
      for (let b = 0; b < 256; b++) hist[b] += redistrib;
      // Build CDF → LUT
      const lut = new Uint8Array(256);
      let cdf = 0, cdfMin = -1;
      for (let b = 0; b < 256; b++) {
        cdf += hist[b];
        if (cdfMin < 0 && cdf > 0) cdfMin = cdf;
        lut[b] = Math.round(((cdf - cdfMin) / (tilePx - cdfMin)) * 255);
      }
      luts[ty].push(lut);
    }
  }

  // Bilinear interpolation
  const out = new Uint8Array(gray.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const px = gray[y * width + x];
      // tile coords (fractional)
      const txf = (x / tileSize) - 0.5;
      const tyf = (y / tileSize) - 0.5;
      const tx0 = Math.max(0, Math.floor(txf));
      const ty0 = Math.max(0, Math.floor(tyf));
      const tx1 = Math.min(tilesX - 1, tx0 + 1);
      const ty1 = Math.min(tilesY - 1, ty0 + 1);
      const wx  = txf - tx0, wy  = tyf - ty0;
      const v00 = luts[ty0][tx0][px], v01 = luts[ty0][tx1][px];
      const v10 = luts[ty1][tx0][px], v11 = luts[ty1][tx1][px];
      out[y * width + x] = Math.round(
        v00 * (1 - wx) * (1 - wy) +
        v01 *      wx  * (1 - wy) +
        v10 * (1 - wx) *      wy  +
        v11 *      wx  *      wy
      );
    }
  }
  return out;
}

function mergeEqualised(rgba: Uint8ClampedArray, eq: Uint8Array): Uint8ClampedArray {
  const out = new Uint8ClampedArray(rgba.length);
  for (let i = 0; i < eq.length; i++) {
    // Replace luminance channel, keep chrominance roughly scaled
    const orig = rgba[i * 4] * 0.299 + rgba[i * 4 + 1] * 0.587 + rgba[i * 4 + 2] * 0.114;
    const scale = orig > 1 ? eq[i] / orig : 1;
    out[i * 4]     = Math.min(255, Math.round(rgba[i * 4]     * scale));
    out[i * 4 + 1] = Math.min(255, Math.round(rgba[i * 4 + 1] * scale));
    out[i * 4 + 2] = Math.min(255, Math.round(rgba[i * 4 + 2] * scale));
    out[i * 4 + 3] = 255;
  }
  return out;
}

function normaliseToChw(rgba: Uint8ClampedArray, size: number): Float32Array {
  // Output: [3, 112, 112] channels-first, values in [-1, 1]
  const tensor = new Float32Array(3 * size * size);
  const channelSize = size * size;
  for (let i = 0; i < channelSize; i++) {
    tensor[i]                    = (rgba[i * 4]     / 127.5) - 1; // R
    tensor[channelSize + i]      = (rgba[i * 4 + 1] / 127.5) - 1; // G
    tensor[channelSize * 2 + i]  = (rgba[i * 4 + 2] / 127.5) - 1; // B
  }
  return tensor;
}
