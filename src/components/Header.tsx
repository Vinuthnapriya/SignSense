import React from 'react';
import { Hand, BookOpen, Volume2, VolumeX } from 'lucide-react';
import { ModelStatus } from '../types/gestures';

interface HeaderProps {
  modelStatus: ModelStatus;
  onOpenGuide: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  modelStatus,
  onOpenGuide,
  soundEnabled,
  onToggleSound,
}) => {
  return (
    <header className="w-full bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex flex-col sm:flex-row items-center justify-between gap-4 py-3 sm:py-0">
        {/* Left Side: Brand & Subtitle */}
        <div className="flex items-center gap-3.5 w-full sm:w-auto">
          <div
            className="w-10 h-10 rounded-xl bg-neutral-900 flex items-center justify-center text-white shadow-sm flex-shrink-0"
            aria-hidden="true"
          >
            <Hand className="w-5 h-5 text-neutral-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 leading-tight">
                SignSense
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-neutral-500 font-normal">
              Sign Language Recognition Using Deep Learning
            </p>
          </div>
        </div>

        {/* Right Side: Status Pills & Utilities */}
        <div className="flex items-center flex-wrap gap-2.5 sm:gap-3 w-full sm:w-auto justify-start sm:justify-end">
          {/* Pill 1: MediaPipe Gesture Recognizer */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-gray-300 bg-white text-xs font-medium text-neutral-700 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>MediaPipe Gesture Recognizer</span>
          </div>

          {/* Pill 2: TensorFlow Lite */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-gray-300 bg-white text-xs font-medium text-neutral-700 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            <span>TensorFlow Lite</span>
          </div>

          {/* Pill 3: Model: Ready */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-gray-300 bg-white text-xs font-medium text-neutral-700 shadow-xs">
            {modelStatus.loading ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>Model: Initializing...</span>
              </>
            ) : modelStatus.error ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span>Model: Error</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Model: Ready</span>
              </>
            )}
          </div>

          {/* Helper action: Audio speech read-out toggle */}
          <button
            type="button"
            onClick={onToggleSound}
            title={soundEnabled ? 'Speech audio enabled' : 'Speech audio muted'}
            aria-label={soundEnabled ? 'Speech audio enabled' : 'Speech audio muted'}
            className="p-1.5 rounded-full border border-gray-300 bg-white text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 transition-colors"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <VolumeX className="w-4 h-4 text-neutral-400" />
            )}
          </button>

          {/* Helper action: View Sign Dictionary */}
          <button
            type="button"
            onClick={onOpenGuide}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-gray-300 bg-white text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors shadow-xs"
          >
            <BookOpen className="w-3.5 h-3.5 text-neutral-500" />
            <span>Sign Guide</span>
          </button>
        </div>
      </div>
    </header>
  );
};
