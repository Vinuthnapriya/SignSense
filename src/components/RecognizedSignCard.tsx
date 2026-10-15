import React, { useState } from 'react';
import { Sparkles, Info, Layers } from 'lucide-react';
import { RecognizedGesture, SUPPORTED_SIGNS } from '../types/gestures';

interface OtherPrediction {
  name: string;
  emoji: string;
  score: number; // 0 to 1
  categoryName: string;
}

interface RecognizedSignCardProps {
  currentGesture: RecognizedGesture | null;
  otherScores?: Record<string, number>;
}

export const RecognizedSignCard: React.FC<RecognizedSignCardProps> = ({
  currentGesture,
  otherScores = {},
}) => {
  const [showAllSigns, setShowAllSigns] = useState<boolean>(false);

  // Default values matching the blueprint if no active gesture is detected yet
  const displaySign = currentGesture ? currentGesture.name : 'Peace';
  const displayEmoji = currentGesture ? currentGesture.emoji : '✌️';
  const displayConfidence = currentGesture ? currentGesture.score * 100 : 79.4;

  const currentDef = SUPPORTED_SIGNS.find(
    (s) => s.name.toLowerCase() === displaySign.toLowerCase()
  );

  const isLiveDetection = Boolean(currentGesture);

  // Compute other predictions list
  const getOtherPredictions = (): OtherPrediction[] => {
    // Standard default blueprint alternatives
    const candidateList = SUPPORTED_SIGNS.filter(
      (item) => item.name.toLowerCase() !== displaySign.toLowerCase()
    );

    // If showing all, return up to 7 top items; otherwise top 3
    const limit = showAllSigns ? 6 : 3;

    // Prioritize standard blueprint items: Hello, I Love You, Yes / Good
    const prioritized = [...candidateList].sort((a, b) => {
      const scoreA = otherScores[a.categoryName] ?? 0;
      const scoreB = otherScores[b.categoryName] ?? 0;
      if (scoreA !== scoreB) return scoreB - scoreA;

      // Secondary preference for classic items
      const classic = ['Open_Palm', 'ILoveYou', 'Thumb_Up', 'OK_Sign', 'Call_Me', 'Victory'];
      const indexA = classic.indexOf(a.categoryName);
      const indexB = classic.indexOf(b.categoryName);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return 0;
    });

    return prioritized.slice(0, limit).map((item) => {
      const score = otherScores[item.categoryName] ?? 0.0;
      return {
        name: item.name,
        emoji: item.emoji,
        score,
        categoryName: item.categoryName,
      };
    });
  };

  const otherPredictions = getOtherPredictions();

  return (
    <div
      className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 sm:p-8 flex flex-col justify-between h-full"
      aria-live="polite"
    >
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-neutral-900 tracking-tight">
              Recognized Sign
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            {isLiveDetection ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00E676]" />
                Active Inference
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-500 bg-neutral-100 px-2.5 py-0.5 rounded-full border border-neutral-200">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                Demonstration State
              </span>
            )}
          </div>
        </div>

        {/* Main Output: Prominent center-aligned section */}
        <div className="py-6 sm:py-10 flex flex-col items-center justify-center text-center">
          {/* Large Emoji */}
          <div
            className="text-7xl sm:text-8xl select-none mb-3 transition-transform duration-300 hover:scale-105 filter drop-shadow-sm"
            role="img"
            aria-label={`Sign emoji: ${displaySign}`}
          >
            {displayEmoji}
          </div>

          {/* Massive Bold Title */}
          <h3 className="text-4xl sm:text-5xl font-black tracking-tight text-neutral-900 mb-1">
            {displaySign}
          </h3>

          {/* Small Subtitle */}
          <p className="text-xs sm:text-sm font-medium text-neutral-400 uppercase tracking-widest">
            Predicted sign
          </p>

          {/* Extra metadata: Handedness & sign description */}
          <div className="mt-2.5 flex items-center justify-center gap-2 flex-wrap">
            {currentGesture?.handedness && (
              <span className="text-xs font-medium text-neutral-600 bg-neutral-100 px-2.5 py-0.5 rounded-full border border-neutral-200">
                {currentGesture.handedness} Hand
              </span>
            )}
            {currentDef?.group && (
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {currentDef.group}
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar Section: Horizontal confidence bar stretching across the card */}
        <div className="w-full my-3">
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span className="text-neutral-500 uppercase tracking-wider text-[11px]">
              Confidence Score
            </span>
            <span className="text-neutral-900 font-mono text-sm font-bold">
              {displayConfidence.toFixed(1)}%
            </span>
          </div>

          {/* The Progress Bar with Solid Bright Green fill track (#00E676) */}
          <div
            className="w-full h-3.5 bg-neutral-100 rounded-full overflow-hidden p-0.5 border border-neutral-200"
            role="progressbar"
            aria-valuenow={Math.round(displayConfidence)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Confidence score: ${displayConfidence.toFixed(1)}%`}
          >
            <div
              className="h-full rounded-full transition-all duration-300 ease-out"
              style={{
                width: `${Math.min(100, Math.max(0, displayConfidence))}%`,
                backgroundColor: '#00E676',
                boxShadow: '0 0 10px rgba(0, 230, 118, 0.45)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Section: "OTHER PREDICTIONS" in muted capital letters */}
      <div className="mt-5 pt-5 border-t border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-neutral-400 tracking-wider uppercase">
            Other Predictions
          </h4>
          <button
            type="button"
            onClick={() => setShowAllSigns((prev) => !prev)}
            className="text-[11px] font-medium text-emerald-700 hover:text-emerald-800 transition-colors flex items-center gap-1"
          >
            <Layers className="w-3 h-3" />
            <span>{showAllSigns ? 'Standard View' : 'Show More Signs'}</span>
          </button>
        </div>

        {/* Vertical list of alternative classes */}
        <div className="space-y-2.5">
          {otherPredictions.map((pred) => {
            const pct = (pred.score * 100).toFixed(1);
            const hasScore = pred.score > 0.001;

            return (
              <div
                key={pred.name}
                className="flex items-center gap-3 p-1.5 sm:p-2 rounded-xl hover:bg-neutral-50 transition-colors"
              >
                {/* Emoji & Label */}
                <span className="text-lg select-none w-6 text-center" aria-hidden="true">
                  {pred.emoji}
                </span>
                <span className="text-xs sm:text-sm font-medium text-neutral-700 w-24 sm:w-28 truncate">
                  {pred.name}
                </span>

                {/* Progress Bar Tracker: empty or grayed-out when 0.0% */}
                <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden border border-neutral-200/70">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${pred.score * 100}%`,
                      backgroundColor: hasScore ? '#00E676' : '#d4d4d4',
                    }}
                  />
                </div>

                {/* Far Right Percentage */}
                <span className="text-xs font-mono font-medium text-neutral-400 w-12 text-right">
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
