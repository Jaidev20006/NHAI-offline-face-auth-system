// ─── Recognition thresholds ───────────────────────────────────────────────────
export const FACE_MATCH_THRESHOLD = 0.72;   // cosine similarity — tune upward for stricter
export const LIVENESS_EAR_THRESHOLD = 0.22; // eye aspect ratio below this = blink
export const LIVENESS_MAR_THRESHOLD = 0.55; // mouth aspect ratio above this = smile
export const LIVENESS_YAW_THRESHOLD = 18;   // degrees — head turn left/right
export const LIVENESS_CHALLENGE_TIMEOUT_MS = 15000;
export const MULTI_FRAME_COUNT = 3;         // frames averaged for final embedding

// ─── Model asset paths (place .ort files under android/app/src/main/assets/) ──
export const BLAZEFACE_MODEL = 'blazeface.ort';
export const MOBILEFACENET_MODEL = 'mobilefacenet_arcface.ort';

// ─── Database ─────────────────────────────────────────────────────────────────
export const DB_NAME = 'nhai_faceauth.db';

// ─── Encryption ───────────────────────────────────────────────────────────────
// Store the actual key in Android Keystore / iOS Secure Enclave in production
export const ENCRYPTION_KEY_ALIAS = 'nhai_face_auth_key';

// ─── AWS (replace with your actual values) ────────────────────────────────────
export const AWS_CONFIG = {
  region: 'ap-south-1',
  apiEndpoint: 'https://YOUR_API_GATEWAY_URL/prod',
  s3Bucket: 'nhai-attendance-sync',
};

// ─── Sync ─────────────────────────────────────────────────────────────────────
export const SYNC_BATCH_SIZE = 50;
export const SYNC_RETRY_LIMIT = 3;
export const SYNC_RETRY_DELAY_MS = 2000;
