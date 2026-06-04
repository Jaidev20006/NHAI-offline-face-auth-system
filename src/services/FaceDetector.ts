/**
 * FaceDetector — Mock implementation for demo
 * Simulates BlazeFace detection with realistic timing
 */

interface Detection {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  landmarks: Array<{ x: number; y: number }>;
}

let _frameCount = 0;

export async function detectFace(
  _pixelData: Uint8ClampedArray,
  frameWidth: number,
  frameHeight: number
): Promise<Detection | null> {
  // Simulate ~15ms inference
  await new Promise(r => setTimeout(r, 15));

  _frameCount++;

  // Simulate occasional no-detection for realism
  if (_frameCount % 8 === 0) return null;

  // Return realistic centered face detection
  const faceW = frameWidth * 0.45;
  const faceH = frameHeight * 0.55;
  const x = (frameWidth - faceW) / 2 + (Math.random() - 0.5) * 20;
  const y = (frameHeight - faceH) / 2.5 + (Math.random() - 0.5) * 10;

  return {
    x, y,
    width: faceW,
    height: faceH,
    confidence: 0.92 + Math.random() * 0.07,
    landmarks: Array.from({ length: 6 }, (_, i) => ({
      x: x + faceW * (0.2 + (i % 3) * 0.3),
      y: y + faceH * (0.25 + Math.floor(i / 3) * 0.4),
    })),
  };
}