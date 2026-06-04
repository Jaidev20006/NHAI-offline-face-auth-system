/**
 * Computes cosine similarity between two Float32Arrays (512-dim embeddings).
 * Returns a value in [-1, 1]. Higher = more similar. Threshold ~0.72 for same person.
 */
export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length) throw new Error('Embedding dimension mismatch');
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot   += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * Averages multiple embeddings (multi-frame ensemble).
 * Returns a new L2-normalised Float32Array.
 */
export function averageEmbeddings(embeddings: Float32Array[]): Float32Array {
  if (embeddings.length === 0) throw new Error('No embeddings to average');
  const dim = embeddings[0].length;
  const avg = new Float32Array(dim);
  for (const emb of embeddings) {
    for (let i = 0; i < dim; i++) avg[i] += emb[i];
  }
  // L2 normalise
  let norm = 0;
  for (let i = 0; i < dim; i++) norm += avg[i] * avg[i];
  norm = Math.sqrt(norm);
  for (let i = 0; i < dim; i++) avg[i] = avg[i] / (norm + 1e-10);
  return avg;
}

/**
 * Serialises a Float32Array to a Base64 string for encrypted DB storage.
 */
const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function bytesToBase64(bytes: Uint8Array): string {
  let result = '';
  let i = 0;
  for (; i + 2 < bytes.length; i += 3) {
    const chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    result += BASE64_CHARS[(chunk >>> 18) & 0x3f]
      + BASE64_CHARS[(chunk >>> 12) & 0x3f]
      + BASE64_CHARS[(chunk >>> 6) & 0x3f]
      + BASE64_CHARS[chunk & 0x3f];
  }

  if (i < bytes.length) {
    const rem = bytes.length - i;
    const chunk = (bytes[i] << 16) | ((rem === 2 ? bytes[i + 1] : 0) << 8);
    result += BASE64_CHARS[(chunk >>> 18) & 0x3f]
      + BASE64_CHARS[(chunk >>> 12) & 0x3f]
      + (rem === 2 ? BASE64_CHARS[(chunk >>> 6) & 0x3f] : '=')
      + '=';
  }

  return result;
}

function base64ToBytes(b64: string): Uint8Array {
  const cleaned = b64.replace(/[^A-Za-z0-9+/=]/g, '');
  const padding = cleaned.endsWith('==') ? 2 : cleaned.endsWith('=') ? 1 : 0;
  const length = (cleaned.length * 3) / 4 - padding;
  const bytes = new Uint8Array(length);

  let byteIndex = 0;
  for (let i = 0; i < cleaned.length; i += 4) {
    const chunk =
      (BASE64_CHARS.indexOf(cleaned[i]) << 18) |
      (BASE64_CHARS.indexOf(cleaned[i + 1]) << 12) |
      (BASE64_CHARS.indexOf(cleaned[i + 2]) << 6) |
      BASE64_CHARS.indexOf(cleaned[i + 3]);

    bytes[byteIndex++] = (chunk >>> 16) & 0xff;
    if (cleaned[i + 2] !== '=') {
      bytes[byteIndex++] = (chunk >>> 8) & 0xff;
    }
    if (cleaned[i + 3] !== '=') {
      bytes[byteIndex++] = chunk & 0xff;
    }
  }

  return bytes;
}

export function embeddingToBase64(emb: Float32Array): string {
  return bytesToBase64(new Uint8Array(emb.buffer));
}

/**
 * Deserialises a Base64 string back to a Float32Array.
 */
export function base64ToEmbedding(b64: string): Float32Array {
  return new Float32Array(base64ToBytes(b64).buffer);
}
