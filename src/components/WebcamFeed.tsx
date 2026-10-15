import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, CameraOff, Play, Pause, AlertCircle, Sparkles, ChevronRight } from 'lucide-react';
import { getGestureRecognizer, drawHandLandmarks, mapMediaPipeGesture } from '../services/mediapipe';
import { classifyFromLandmarks } from '../services/landmarkClassifier';
import { RecognizedGesture, SUPPORTED_SIGNS } from '../types/gestures';

interface WebcamFeedProps {
  onGestureDetected: (gesture: RecognizedGesture | null, otherScores?: Record<string, number>) => void;
  onModelReady: (ready: boolean, error?: string) => void;
}

export const WebcamFeed: React.FC<WebcamFeedProps> = ({
  onGestureDetected,
  onModelReady,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isCameraActive, setIsCameraActive] = useState<boolean>(true);
  const [isDetecting, setIsDetecting] = useState<boolean>(true);
  const [hasHand, setHasHand] = useState<boolean>(false);
  const [handInfo, setHandInfo] = useState<string>('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [fps, setFps] = useState<number>(0);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  // References for loop management
  const animationFrameId = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const streamRef = useRef<MediaStream | null>(null);
  const fpsCountRef = useRef<number>(0);
  const lastFpsTimeRef = useRef<number>(performance.now());
  const isDetectingRef = useRef<boolean>(isDetecting);
  isDetectingRef.current = isDetecting;

  // Initialize MediaPipe model
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await getGestureRecognizer();
        if (mounted) {
          onModelReady(true);
        }
      } catch (err: unknown) {
        console.error('Error loading MediaPipe Gesture Recognizer:', err);
        if (mounted) {
          const msg = err instanceof Error ? err.message : 'Failed to load model';
          onModelReady(false, msg);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [onModelReady]);

  // Start webcam
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
      setIsDemoMode(false);
    } catch (err: unknown) {
      console.warn('Webcam permission error or no camera:', err);
      const msg =
        err instanceof Error && err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in your browser settings.'
          : 'Unable to access camera device. Check your webcam connection.';
      setCameraError(msg);
      setIsCameraActive(false);
    }
  }, []);

  // Stop webcam
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setHasHand(false);
    setHandInfo('');
    // Clear canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }, []);

  // Handle detection toggle
  const toggleDetection = () => {
    setIsDetecting((prev) => {
      const next = !prev;
      if (!next) {
        setHasHand(false);
        setHandInfo('');
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
      return next;
    });
  };

  // Initial camera mount
  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [startCamera]);

  // Main real-time prediction loop
  useEffect(() => {
    let active = true;

    const processFrame = async () => {
      if (!active) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (
        isCameraActive &&
        isDetectingRef.current &&
        video &&
        canvas &&
        video.readyState >= 2 &&
        !video.paused &&
        !video.ended
      ) {
        // Match canvas dimensions to video
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }
        }

        if (video.currentTime !== lastVideoTimeRef.current) {
          lastVideoTimeRef.current = video.currentTime;

          try {
            const recognizer = await getGestureRecognizer();
            const results = recognizer.recognizeForVideo(video, performance.now());

            // FPS Calculation
            fpsCountRef.current++;
            const now = performance.now();
            if (now - lastFpsTimeRef.current >= 1000) {
              setFps(Math.round((fpsCountRef.current * 1000) / (now - lastFpsTimeRef.current)));
              fpsCountRef.current = 0;
              lastFpsTimeRef.current = now;
            }

            const ctx = canvas.getContext('2d');
            if (ctx && results) {
              if (results.landmarks && results.landmarks.length > 0) {
                setHasHand(true);

                // Draw bright green landmarks mesh (#00E676)
                drawHandLandmarks(
                  ctx,
                  results.landmarks,
                  canvas.width,
                  canvas.height,
                  true // Mirror mode for webcam self-view
                );

                // Handedness info
                let handednessText = '';
                if (results.handednesses && results.handednesses[0]?.[0]) {
                  handednessText = results.handednesses[0][0].categoryName;
                  setHandInfo(handednessText ? `${handednessText} Hand` : '');
                }

                // Process Gesture: First check geometric landmark detector, then MediaPipe recognizer
                const geomGesture = classifyFromLandmarks(results.landmarks[0]);
                const topGesture = results.gestures && results.gestures[0]?.[0];

                let finalGesture: RecognizedGesture | null = null;
                const others: Record<string, number> = {};

                if (geomGesture) {
                  finalGesture = {
                    ...geomGesture,
                    handedness:
                      handednessText === 'Left' || handednessText === 'Right'
                        ? handednessText
                        : undefined,
                  };
                  if (topGesture && topGesture.categoryName !== 'None') {
                    others[topGesture.categoryName] = topGesture.score;
                  }
                } else if (topGesture && topGesture.categoryName !== 'None') {
                  const mapped = mapMediaPipeGesture(
                    topGesture.categoryName,
                    topGesture.score
                  );
                  if (handednessText === 'Left' || handednessText === 'Right') {
                    mapped.handedness = handednessText;
                  }
                  finalGesture = mapped;

                  for (const g of results.gestures[0]) {
                    if (g.categoryName !== topGesture.categoryName) {
                      others[g.categoryName] = g.score;
                    }
                  }
                }

                onGestureDetected(finalGesture, others);
              } else {
                setHasHand(false);
                setHandInfo('');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                onGestureDetected(null);
              }
            }
          } catch (err) {
            console.error('Frame recognition error:', err);
          }
        }
      } else if (!isDetectingRef.current && canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      if (active) {
        animationFrameId.current = requestAnimationFrame(processFrame);
      }
    };

    animationFrameId.current = requestAnimationFrame(processFrame);

    return () => {
      active = false;
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isCameraActive, onGestureDetected]);

  // Demo simulator for testing all supported signs
  const triggerDemoGesture = (signId: string) => {
    setIsDemoMode(true);
    setHasHand(true);
    setHandInfo('Virtual Demo');

    const foundSign = SUPPORTED_SIGNS.find((s) => s.id === signId) || SUPPORTED_SIGNS[0];
    const score = 0.82 + Math.random() * 0.12;

    onGestureDetected(
      {
        name: foundSign.name,
        categoryName: foundSign.categoryName,
        emoji: foundSign.emoji,
        score,
        handedness: 'Right',
        description: foundSign.description,
      },
      {
        Victory: foundSign.id === 'peace' ? 0.0 : 0.08,
        Open_Palm: foundSign.id === 'hello' ? 0.0 : 0.05,
        ILoveYou: foundSign.id === 'ily' ? 0.0 : 0.06,
        Thumb_Up: foundSign.id === 'yes' ? 0.0 : 0.04,
      }
    );

    // Draw synthetic landmarks on canvas for demonstration
    if (canvasRef.current) {
      const c = canvasRef.current;
      c.width = 640;
      c.height = 480;
      const ctx = c.getContext('2d');
      if (ctx) {
        // Generate hand-shaped landmarks for Peace gesture
        const demoLandmarks = [
          { x: 0.5, y: 0.8 }, // 0: wrist
          { x: 0.44, y: 0.72 }, { x: 0.4, y: 0.65 }, { x: 0.38, y: 0.58 }, { x: 0.36, y: 0.52 }, // thumb
          { x: 0.46, y: 0.6 }, { x: 0.45, y: 0.48 }, { x: 0.44, y: 0.38 }, { x: 0.43, y: 0.28 }, // index up
          { x: 0.51, y: 0.6 }, { x: 0.53, y: 0.48 }, { x: 0.55, y: 0.38 }, { x: 0.57, y: 0.28 }, // middle up
          { x: 0.56, y: 0.62 }, { x: 0.55, y: 0.68 }, { x: 0.54, y: 0.72 }, { x: 0.53, y: 0.75 }, // ring curled
          { x: 0.6, y: 0.64 }, { x: 0.59, y: 0.7 }, { x: 0.58, y: 0.74 }, { x: 0.57, y: 0.77 }, // pinky curled
        ];
        drawHandLandmarks(ctx, [demoLandmarks], c.width, c.height, false);
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 sm:p-6 flex flex-col justify-between h-full">
      {/* Overhead Status Badges Header */}
      <div className="flex items-center justify-between mb-4">
        {/* Left Side: Green Dot & "Webcam Feed" */}
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isCameraActive ? 'bg-[#00E676] shadow-[0_0_8px_#00E676]' : 'bg-neutral-300'
            }`}
          />
          <h2 className="text-base font-semibold text-neutral-900 tracking-tight">
            Webcam Feed
          </h2>
          {isCameraActive && fps > 0 && (
            <span className="text-[11px] text-neutral-400 font-mono ml-1">
              ({fps} FPS)
            </span>
          )}
        </div>

        {/* Right Side: Blinking green dot with "LIVE - DETECTING" */}
        <div className="flex items-center gap-2">
          {isCameraActive && isDetecting ? (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-[#00E676] animate-pulse" />
              <span className="text-xs font-semibold text-emerald-800 tracking-wider">
                LIVE - DETECTING
              </span>
            </div>
          ) : !isCameraActive ? (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-100 border border-neutral-200">
              <span className="w-2 h-2 rounded-full bg-neutral-400" />
              <span className="text-xs font-semibold text-neutral-600 tracking-wider">
                CAMERA OFF
              </span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-xs font-semibold text-amber-800 tracking-wider">
                DETECTION PAUSED
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Video Container with Rounded Corners & Real-Time Canvas Overlay */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/11] bg-neutral-950 rounded-xl overflow-hidden flex items-center justify-center border border-neutral-200 shadow-inner">
        {/* HTML5 Video Element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isCameraActive ? 'opacity-100 scale-x-[-1]' : 'opacity-0'
          }`}
          aria-label="Live webcam video stream for sign language recognition"
        />

        {/* HTML5 Canvas overlay for real-time skeletal landmarks */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        />

        {/* Top-Left Corner Badge: "Hand detected" (white text on solid green background) */}
        {hasHand && isCameraActive && (
          <div className="absolute top-3.5 left-3.5 z-20 transition-all duration-200 animate-in fade-in">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#00E676] text-white font-medium text-xs shadow-md tracking-tight">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              Hand detected {handInfo ? `• ${handInfo}` : ''}
            </span>
          </div>
        )}

        {/* Demo Mode Badge if using simulator */}
        {isDemoMode && (
          <div className="absolute top-3.5 right-3.5 z-20">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-neutral-900/80 backdrop-blur-xs text-neutral-200 font-mono text-[11px] border border-neutral-700">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              Demo Gesture
            </span>
          </div>
        )}

        {/* Camera Off / Inactive Display */}
        {!isCameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-neutral-900 text-white z-20">
            <div className="w-14 h-14 rounded-full bg-neutral-800 flex items-center justify-center mb-3 text-neutral-400">
              <CameraOff className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-neutral-200 mb-1">
              Webcam is Disabled
            </h3>
            <p className="text-xs text-neutral-400 max-w-xs mb-4">
              Click &quot;Start Camera&quot; to begin real-time gesture recognition or test with interactive gestures below.
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={startCamera}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors shadow-xs"
              >
                <Camera className="w-3.5 h-3.5" />
                Start Camera
              </button>
            </div>
          </div>
        )}

        {/* Camera Error Display if Permission Denied */}
        {cameraError && isCameraActive && (
          <div className="absolute inset-x-4 bottom-4 p-3 bg-red-950/90 border border-red-800 text-red-100 rounded-lg text-xs z-30 flex items-start gap-2 shadow-lg backdrop-blur-xs">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">{cameraError}</p>
            </div>
            <button
              type="button"
              onClick={startCamera}
              className="text-red-300 hover:text-white underline text-xs ml-2"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Interactive Quick-Test Gestures Bar */}
      <div className="mt-3.5 pt-3 border-t border-neutral-100 flex flex-col gap-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-neutral-700 flex items-center gap-1.5 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Quick Test Signs:
          </span>
          <span className="text-[11px] text-neutral-400">
            {SUPPORTED_SIGNS.length} Signs Available
          </span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
          {SUPPORTED_SIGNS.map((sign) => (
            <button
              key={sign.id}
              type="button"
              onClick={() => triggerDemoGesture(sign.id)}
              title={sign.description}
              className="px-2.5 py-1 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-medium transition-colors whitespace-nowrap shrink-0 flex items-center gap-1"
            >
              <span>{sign.emoji}</span>
              <span>{sign.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Control Buttons */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3">
        {/* Bright red button: "Stop Detection" */}
        <button
          type="button"
          onClick={toggleDetection}
          className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-xs ${
            isDetecting
              ? 'bg-[#FF3B30] hover:bg-red-600 text-white active:scale-[0.99]'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-[0.99]'
          }`}
          aria-label={isDetecting ? 'Stop Detection' : 'Resume Detection'}
        >
          {isDetecting ? (
            <>
              <Pause className="w-4 h-4 fill-current" />
              <span>Stop Detection</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Resume Detection</span>
            </>
          )}
        </button>

        {/* White outline button: "Stop Camera" */}
        <button
          type="button"
          onClick={isCameraActive ? stopCamera : startCamera}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-neutral-50 text-neutral-800 font-semibold text-sm transition-all shadow-xs active:scale-[0.99]"
          aria-label={isCameraActive ? 'Stop Camera' : 'Start Camera'}
        >
          {isCameraActive ? (
            <>
              <CameraOff className="w-4 h-4 text-neutral-500" />
              <span>Stop Camera</span>
            </>
          ) : (
            <>
              <Camera className="w-4 h-4 text-neutral-700" />
              <span>Start Camera</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
