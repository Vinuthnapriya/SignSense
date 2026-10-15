export interface RecognizedGesture {
  name: string;
  categoryName: string;
  emoji: string;
  score: number; // 0 to 1
  handedness?: 'Left' | 'Right';
  description?: string;
}

export interface PredictionItem {
  id: string;
  name: string;
  emoji: string;
  score: number;
}

export interface ModelStatus {
  loaded: boolean;
  loading: boolean;
  error: string | null;
  delegate: 'GPU' | 'CPU';
}

export interface SignDefinition {
  id: string;
  categoryName: string;
  name: string;
  emoji: string;
  description: string;
  group: 'Greeting & Social' | 'Responses' | 'Numbers & Hands' | 'Expressions';
}

export const SUPPORTED_SIGNS: readonly SignDefinition[] = [
  // Greetings & Social
  { id: 'peace', categoryName: 'Victory', name: 'Peace', emoji: '✌️', description: 'Index and middle fingers extended in a V', group: 'Greeting & Social' },
  { id: 'hello', categoryName: 'Open_Palm', name: 'Hello', emoji: '👋', description: 'Open palm facing the camera', group: 'Greeting & Social' },
  { id: 'ily', categoryName: 'ILoveYou', name: 'I Love You', emoji: '🤟', description: 'Thumb, index, and pinky extended in ASL', group: 'Greeting & Social' },
  { id: 'call_me', categoryName: 'Call_Me', name: 'Call Me', emoji: '🤙', description: 'Thumb and pinky outstretched (Shaka sign)', group: 'Greeting & Social' },
  
  // Responses
  { id: 'yes', categoryName: 'Thumb_Up', name: 'Yes / Good', emoji: '👍', description: 'Thumb pointing upright with closed fist', group: 'Responses' },
  { id: 'no', categoryName: 'Thumb_Down', name: 'No / Bad', emoji: '👎', description: 'Thumb pointing downward', group: 'Responses' },
  { id: 'ok', categoryName: 'OK_Sign', name: 'OK / Perfect', emoji: '👌', description: 'Thumb and index tips touching, others extended', group: 'Responses' },
  { id: 'stop', categoryName: 'Stop_Palm', name: 'Stop / Wait', emoji: '🛑', description: 'Firm open palm facing directly forward', group: 'Responses' },
  
  // Expressions & Gestures
  { id: 'rock', categoryName: 'Rock_On', name: 'Rock On', emoji: '🤘', description: 'Index and pinky raised, middle fingers tucked', group: 'Expressions' },
  { id: 'crossed', categoryName: 'Crossed_Fingers', name: 'Good Luck', emoji: '🤞', description: 'Middle finger crossed over index finger', group: 'Expressions' },
  { id: 'finger_heart', categoryName: 'Finger_Heart', name: 'Finger Heart', emoji: '🫰', description: 'Thumb and index finger crossed in a mini heart', group: 'Expressions' },
  { id: 'pinch', categoryName: 'Pinch', name: 'Pinch / Little', emoji: '🤏', description: 'Thumb and index tips spaced slightly apart', group: 'Expressions' },
  { id: 'fist', categoryName: 'Closed_Fist', name: 'Fist / Power', emoji: '✊', description: 'All fingers clenched tightly into a fist', group: 'Expressions' },

  // Numbers & Pointers
  { id: 'point', categoryName: 'Pointing_Up', name: 'Point / One', emoji: '☝️', description: 'Index finger extended pointing upward', group: 'Numbers & Hands' },
  { id: 'three', categoryName: 'Number_Three', name: 'Three', emoji: '3️⃣', description: 'Thumb, index, and middle fingers extended', group: 'Numbers & Hands' },
  { id: 'four', categoryName: 'Number_Four', name: 'Four', emoji: '4️⃣', description: 'Four fingers extended upright with thumb folded', group: 'Numbers & Hands' },
] as const;
