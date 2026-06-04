/**
 * FaceRecognition — Mock implementation for demo
 * Simulates MobileFaceNet ArcFace with realistic timing and embeddings
 */

import { MULTI_FRAME_COUNT } from '../constants';
import { detectFace } from './FaceDetector';

// Generate a deterministic-ish 512-dim embedding from a seed
function generateEmbedding(seed: number = Math.random()): Float32Array {
  const emb = new Float32Array(512);
  let s = seed * 9301 + 49297;
  for (let i = 0; i < 512; i++) {
    s = (s * 9301 + 49297) % 233280;
    emb[i] = (s / 233280) * 2 - 1;
  }
  // L2 normalize
  let norm = 0;
  for (let i = 0; i < 512; i++) norm += emb[i] * emb[i];
  norm = Math.sqrt(norm);
  for (let i = 0; i < 512; i++) emb[i] /= norm;
  return emb;
}

// Stable per-session base embedding (simulates a real face)
let _baseEmbedding: Float32Array | null = null;

function getBaseEmbedding(): Float32Array {
  if (!_baseEmbedding) _baseEmbedding = generateEmbedding(0.42);
  return _baseEmbedding;
}

export async function getEmbeddingFromTensor(_input: Float32Array): Promise<Float32Array> {
  // Simulate ~120ms inference
  await new Promise(r => setTimeout(r, 120));
  // Return base embedding with tiny noise (same face each session)
  const base = getBaseEmbedding();
  const emb = new Float32Array(512);
  for (let i = 0; i < 512; i++) {
    emb[i] = base[i] + (Math.random() - 0.5) * 0.02;
  }
  return emb;
}

export async function getEnsembleEmbedding(
  frames: Array<{ data: Uint8ClampedArray; width: number; height: number }>
): Promise<Float32Array | null> {
  const embeddings: Float32Array[] = [];

  for (const frame of frames.slice(0, MULTI_FRAME_COUNT)) {
    const detection = await detectFace(frame.data, frame.width, frame.height);
    if (!detection) continue;
    // Simulate ~120ms per frame
    await new Promise(r => setTimeout(r, 120));
    embeddings.push(getBaseEmbedding());
  }

  if (embeddings.length === 0) return getBaseEmbedding();

  // Average embeddings
  const avg = new Float32Array(512);
  for (const e of embeddings) {
    for (let i = 0; i < 512; i++) avg[i] += e[i] / embeddings.length;
  }
  // L2 normalize
  let norm = 0;
  for (let i = 0; i < 512; i++) norm += avg[i] * avg[i];
  norm = Math.sqrt(norm);
  for (let i = 0; i < 512; i++) avg[i] /= norm;
  return avg;
}

export async function warmUpModels(): Promise<void> {
  // Simulate model loading time
  await new Promise(r => setTimeout(r, 800));
  console.log('[FaceRecognition] Mock models ready');
}