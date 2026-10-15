import { LandmarkPoint } from './mediapipe';
import { RecognizedGesture } from '../types/gestures';

/**
 * Geometric heuristic detector for gestures beyond MediaPipe's base 7 gestures,
 * running in real-time over the 21 3D hand landmarks.
 */
export function classifyFromLandmarks(
  landmarks: LandmarkPoint[]
): RecognizedGesture | null {
  if (!landmarks || landmarks.length < 21) return null;

  const lm = landmarks;

  const dist = (i: number, j: number) => {
    const dx = lm[i].x - lm[j].x;
    const dy = lm[i].y - lm[j].y;
    return Math.hypot(dx, dy);
  };

  // Hand scale reference (wrist to middle MCP)
  const handScale = dist(0, 9) || 0.15;

  // Relative distances from wrist (0)
  const isExtended = (tip: number, pip: number, mcp: number) => {
    const tipDist = dist(0, tip);
    const pipDist = dist(0, pip);
    const mcpDist = dist(0, mcp);
    return tipDist > pipDist * 1.15 && tipDist > mcpDist * 1.35;
  };

  const isCurled = (tip: number, mcp: number) => {
    return dist(0, tip) < dist(0, mcp) * 1.15;
  };

  // Finger extension states
  const indexExt = isExtended(8, 6, 5);
  const middleExt = isExtended(12, 10, 9);
  const ringExt = isExtended(16, 14, 13);
  const pinkyExt = isExtended(20, 18, 17);

  const indexCurled = isCurled(8, 5);
  const middleCurled = isCurled(12, 9);
  const ringCurled = isCurled(16, 13);
  const pinkyCurled = isCurled(20, 17);

  // Thumb state
  const thumbTipToPinkyMcp = dist(4, 17) / handScale;
  const thumbTipToMiddleMcp = dist(4, 9) / handScale;
  const thumbExt = dist(4, 2) / handScale > 0.65 && thumbTipToMiddleMcp > 0.65;
  const thumbTucked = thumbTipToPinkyMcp < 0.65 || thumbTipToMiddleMcp < 0.55;

  // Tip-to-tip distances normalized
  const thumbIndexDist = dist(4, 8) / handScale;
  const indexMiddleDist = dist(8, 12) / handScale;
  const thumbMiddleDist = dist(4, 12) / handScale;

  // 1. "OK / Perfect" (👌)
  // Thumb tip and index tip touching, middle, ring, and pinky upright
  if (thumbIndexDist < 0.35 && middleExt && ringExt && pinkyExt) {
    const confidence = Math.min(0.96, Math.max(0.78, 1 - thumbIndexDist));
    return {
      name: 'OK / Perfect',
      categoryName: 'OK_Sign',
      emoji: '👌',
      score: confidence,
      description: 'Thumb and index tips touching, others extended',
    };
  }

  // 2. "Call Me" (🤙)
  // Thumb and pinky extended, index, middle, ring curled
  if (thumbExt && pinkyExt && indexCurled && middleCurled && ringCurled) {
    return {
      name: 'Call Me',
      categoryName: 'Call_Me',
      emoji: '🤙',
      score: 0.89,
      description: 'Thumb and pinky outstretched (Shaka sign)',
    };
  }

  // 3. "Rock On / Horns" (🤘)
  // Index and pinky extended, middle and ring curled, thumb tucked or touching middle
  if (indexExt && pinkyExt && middleCurled && ringCurled && !thumbExt) {
    return {
      name: 'Rock On',
      categoryName: 'Rock_On',
      emoji: '🤘',
      score: 0.87,
      description: 'Index and pinky raised, middle fingers tucked',
    };
  }

  // 4. "Good Luck / Crossed Fingers" (🤞)
  // Index and middle extended close together or crossing, ring and pinky curled
  if (indexExt && middleExt && ringCurled && pinkyCurled && indexMiddleDist < 0.22) {
    return {
      name: 'Good Luck',
      categoryName: 'Crossed_Fingers',
      emoji: '🤞',
      score: 0.85,
      description: 'Middle finger crossed over index finger',
    };
  }

  // 5. "Finger Heart" (🫰)
  // Thumb tip touching or crossed over index DIP/PIP, other fingers curled
  const thumbToIndexPip = dist(4, 6) / handScale;
  if (thumbToIndexPip < 0.32 && middleCurled && ringCurled && pinkyCurled && !indexExt) {
    return {
      name: 'Finger Heart',
      categoryName: 'Finger_Heart',
      emoji: '🫰',
      score: 0.84,
      description: 'Thumb and index finger crossed in a mini heart',
    };
  }

  // 6. "Pinch / Little" (🤏)
  // Thumb and index tips held close (0.15 - 0.35 handScale), other fingers mostly curled
  if (thumbIndexDist > 0.12 && thumbIndexDist < 0.38 && middleCurled && ringCurled && !middleExt) {
    return {
      name: 'Pinch / Little',
      categoryName: 'Pinch',
      emoji: '🤏',
      score: 0.83,
      description: 'Thumb and index tips spaced slightly apart',
    };
  }

  // 7. "Four" (4️⃣)
  // Index, middle, ring, pinky all extended, thumb tucked
  if (indexExt && middleExt && ringExt && pinkyExt && thumbTucked) {
    return {
      name: 'Four',
      categoryName: 'Number_Four',
      emoji: '4️⃣',
      score: 0.91,
      description: 'Four fingers extended upright with thumb folded',
    };
  }

  // 8. "Three" (3️⃣)
  // Thumb, index, middle extended, ring & pinky curled
  if (thumbExt && indexExt && middleExt && ringCurled && pinkyCurled) {
    return {
      name: 'Three',
      categoryName: 'Number_Three',
      emoji: '3️⃣',
      score: 0.88,
      description: 'Thumb, index, and middle fingers extended',
    };
  }

  return null;
}
