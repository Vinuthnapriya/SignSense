/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { WebcamFeed } from './components/WebcamFeed';
import { RecognizedSignCard } from './components/RecognizedSignCard';
import { Footer } from './components/Footer';
import { SignDictionaryModal } from './components/SignDictionaryModal';
import { ModelStatus, RecognizedGesture, SUPPORTED_SIGNS } from './types/gestures';

export default function App() {
  const [modelStatus, setModelStatus] = useState<ModelStatus>({
    loaded: false,
    loading: true,
    error: null,
    delegate: 'GPU',
  });

  const [currentGesture, setCurrentGesture] = useState<RecognizedGesture | null>(null);
  const [otherScores, setOtherScores] = useState<Record<string, number>>({});
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);

  // Ref to debounce speech announcements
  const lastSpokenSignRef = useRef<string>('');
  const lastSpokenTimeRef = useRef<number>(0);

  const handleModelReady = useCallback((ready: boolean, error?: string) => {
    setModelStatus({
      loaded: ready,
      loading: false,
      error: error || null,
      delegate: 'GPU',
    });
  }, []);

  const handleGestureDetected = useCallback(
    (gesture: RecognizedGesture | null, others?: Record<string, number>) => {
      setCurrentGesture(gesture);
      if (others) {
        setOtherScores(others);
      }

      // Optional text-to-speech feedback for accessibility
      if (soundEnabled && gesture && gesture.name) {
        const now = Date.now();
        if (
          gesture.name !== lastSpokenSignRef.current ||
          now - lastSpokenTimeRef.current > 3000
        ) {
          lastSpokenSignRef.current = gesture.name;
          lastSpokenTimeRef.current = now;

          if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(gesture.name);
            utterance.rate = 1.0;
            window.speechSynthesis.speak(utterance);
          }
        }
      }
    },
    [soundEnabled]
  );

  const handleSelectDemoSign = (signName: string) => {
    const found = SUPPORTED_SIGNS.find(
      (s) => s.name.toLowerCase() === signName.toLowerCase()
    );
    if (found) {
      handleGestureDetected(
        {
          name: found.name,
          categoryName: found.categoryName,
          emoji: found.emoji,
          score: 0.92,
          handedness: 'Right',
          description: found.description,
        },
        {
          [found.categoryName]: 0.92,
          Victory: found.categoryName === 'Victory' ? 0.0 : 0.08,
          Open_Palm: found.categoryName === 'Open_Palm' ? 0.0 : 0.05,
          ILoveYou: found.categoryName === 'ILoveYou' ? 0.0 : 0.06,
          Thumb_Up: found.categoryName === 'Thumb_Up' ? 0.0 : 0.04,
        }
      );
    }
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col font-sans antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Header */}
      <Header
        modelStatus={modelStatus}
        onOpenGuide={() => setIsGuideOpen(true)}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
      />

      {/* Main Workspace Dashboard: Two-Column Layout */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          {/* Left Column: Webcam Feed Card (7 of 12 columns on desktop) */}
          <section className="lg:col-span-7 flex flex-col" aria-label="Webcam Feed Panel">
            <WebcamFeed
              onGestureDetected={handleGestureDetected}
              onModelReady={handleModelReady}
            />
          </section>

          {/* Right Column: Recognized Sign Card (5 of 12 columns on desktop) */}
          <section className="lg:col-span-5 flex flex-col" aria-label="Recognition Results Panel">
            <RecognizedSignCard
              currentGesture={currentGesture}
              otherScores={otherScores}
            />
          </section>
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Sign Dictionary Reference Guide Modal */}
      <SignDictionaryModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onSelectDemoSign={handleSelectDemoSign}
      />
    </div>
  );
}
