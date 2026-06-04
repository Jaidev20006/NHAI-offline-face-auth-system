/**
 * Encryption
 *
 * Wraps react-native-aes-crypto to provide AES-256-CBC encrypt/decrypt
 * for face embeddings stored in SQLite.  The key is derived from a
 * device-specific secret using PBKDF2 so it is unique per installation.
 *
 * In production: derive the salt from Android Keystore / iOS Secure Enclave.
 */

import Aes from 'react-native-aes-crypto';

const PBKDF2_ITERATIONS = 10000;
const KEY_SIZE_BITS = 256;
// Salt should be stored in Keystore/SecureEnclave — hardcoded here for prototype
const PROTOTYPE_SALT = 'NHAI_FACE_AUTH_SALT_2025';

let _key: string | null = null;

async function getKey(): Promise<string> {
  if (_key) return _key;
  // Derive a 256-bit key from a device identifier + salt
  _key = await Aes.pbkdf2('NHAI_DEVICE_KEY', PROTOTYPE_SALT, PBKDF2_ITERATIONS, KEY_SIZE_BITS);
  return _key;
}

/**
 * Encrypts a Base64-encoded embedding string.
 * Returns { cipher, iv } — both stored in the DB row.
 */
export async function encryptEmbedding(
  plainBase64: string
): Promise<{ cipher: string; iv: string }> {
  const key = await getKey();
  const iv  = await Aes.randomKey(16);
  const cipher = await Aes.encrypt(plainBase64, key, iv, 'aes-256-cbc');
  return { cipher, iv };
}

/**
 * Decrypts a ciphertext + iv pair back to the original Base64 embedding.
 */
export async function decryptEmbedding(cipher: string, iv: string): Promise<string> {
  const key = await getKey();
  return Aes.decrypt(cipher, key, iv, 'aes-256-cbc');
}
