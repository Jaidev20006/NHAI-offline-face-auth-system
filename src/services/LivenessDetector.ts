/**
 * LivenessDetector — Mock implementation for demo
 */

export type LivenessChallenge = 'BLINK' | 'SMILE' | 'TURN_LEFT' | 'TURN_RIGHT';

export const CHALLENGE_PROMPTS: Record<LivenessChallenge, string> = {
  BLINK: '😉  Blink slowly',
  SMILE: '😊  Smile naturally',
  TURN_LEFT: '👈  Turn head left',
  TURN_RIGHT: '👉  Turn head right',
};

export interface FaceLandmarks {
  keypoints: Array<{ x: number; y: number }>;
  faceWidth: number;
}

export function passiveTextureCheck(
  _gray: Uint8Array,
  _width: number,
  _height: number
): boolean {
  // Always pass in demo mode
  return true;
}

export function generateChallengeSequence(): LivenessChallenge[] {
  const all: LivenessChallenge[] = ['BLINK', 'SMILE', 'TURN_LEFT', 'TURN_RIGHT'];
  return all.sort(() => Math.random() - 0.5).slice(0, 2);
}

export function evaluateChallenge(
  _challenge: LivenessChallenge,
  _landmarks: FaceLandmarks
): boolean {
  // Always pass in demo mode
  return true;
}