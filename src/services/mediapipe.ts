import { FilesetResolver, GestureRecognizer } from '@mediapipe/tasks-vision';
import { RecognizedGesture, SUPPORTED_SIGNS } from '../types/gestures';

// Connections for 21 MediaPipe hand landmarks
export const HAND_CONNECTIONS: [number, number][] = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle
  [9, 10], [10, 11], [11, 12],
  // Ring
  [13, 14], [14, 15], [15, 16],
  // Pinky
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Palm connections
  [5, 9], [9, 13], [13, 17],
];

let recognizerInstance: GestureRecognizer | null = null;
let initPromise: Promise<GestureRecognizer> | null = null;

export async function getGestureRecognizer(): Promise<GestureRecognizer> {
  if (recognizerInstance) return recognizerInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      try {
        recognizerInstance = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 2,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        return recognizerInstance;
      } catch (gpuError) {
        console.warn('Failed GPU delegate, falling back to CPU:', gpuError);
        recognizerInstance = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numHands: 2,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        return recognizerInstance;
      }
    } catch (err) {
      initPromise = null;
      throw err;
    }
  })();

  return initPromise;
}

export interface LandmarkPoint {
  x: number;
  y: number;
  z?: number;
}

/**
 * Draws the skeletal mesh and landmark dots with hex #00E676
 */
export function drawHandLandmarks(
  ctx: CanvasRenderingContext2D,
  landmarksList: LandmarkPoint[][],
  width: number,
  height: number,
  mirror: boolean = true
) {
  ctx.save();
  ctx.clearRect(0, 0, width, height);

  for (const landmarks of landmarksList) {
    if (!landmarks || landmarks.length === 0) continue;

    // Helper to get pixel coordinates (accounting for video mirroring)
    const getPos = (pt: LandmarkPoint) => {
      const x = mirror ? (1 - pt.x) * width : pt.x * width;
      const y = pt.y * height;
      return { x, y };
    };

    // 1. Draw glowing background lines
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(0, 230, 118, 0.45)';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const [startIdx, endIdx] of HAND_CONNECTIONS) {
      const p1 = landmarks[startIdx];
      const p2 = landmarks[endIdx];
      if (!p1 || !p2) continue;
      const pos1 = getPos(p1);
      const pos2 = getPos(p2);
      ctx.beginPath();
      ctx.moveTo(pos1.x, pos1.y);
      ctx.lineTo(pos2.x, pos2.y);
      ctx.stroke();
    }

    // 2. Draw solid bright green connector lines (#00E676)
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#00E676';
    for (const [startIdx, endIdx] of HAND_CONNECTIONS) {
      const p1 = landmarks[startIdx];
      const p2 = landmarks[endIdx];
      if (!p1 || !p2) continue;
      const pos1 = getPos(p1);
      const pos2 = getPos(p2);
      ctx.beginPath();
      ctx.moveTo(pos1.x, pos1.y);
      ctx.lineTo(pos2.x, pos2.y);
      ctx.stroke();
    }

    // 3. Draw landmark nodes
    landmarks.forEach((pt, index) => {
      const pos = getPos(pt);
      const isFingertip = [4, 8, 12, 16, 20].includes(index);
      const isWrist = index === 0;

      const radius = isFingertip ? 6 : isWrist ? 7 : 4.5;

      // Outer glow circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius + 2, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(0, 230, 118, 0.35)';
      ctx.fill();

      // Main vibrant green circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = '#00E676';
      ctx.fill();

      // White inner core
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, isFingertip ? 2.5 : 2, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    });
  }

  ctx.restore();
}

/**
 * Normalizes MediaPipe gesture name to friendly sign info
 */
export function mapMediaPipeGesture(categoryName: string, score: number): RecognizedGesture {
  const match = SUPPORTED_SIGNS.find(
    (s) => s.categoryName.toLowerCase() === categoryName.toLowerCase()
  );

  if (match) {
    return {
      name: match.name,
      categoryName: match.categoryName,
      emoji: match.emoji,
      score,
    };
  }

  // Fallbacks for standard cases
  if (categoryName === 'None' || !categoryName) {
    return {
      name: 'Unrecognized',
      categoryName: 'None',
      emoji: '✋',
      score,
    };
  }

  return {
    name: categoryName.replace(/_/g, ' '),
    categoryName,
    emoji: '✨',
    score,
  };
}
