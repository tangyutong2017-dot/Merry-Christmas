import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, GestureRecognizer } from '@mediapipe/tasks-vision';

interface GestureHandlerProps {
  onModeChange: (mode: 'tree' | 'scatter') => void;
}

const GestureHandler: React.FC<GestureHandlerProps> = ({ onModeChange }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const recognizerRef = useRef<GestureRecognizer | null>(null);
  const lastProcessedRef = useRef<number>(0);
  const [currentGesture, setCurrentGesture] = useState<string>("Initializing...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const init = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
        );
        
        if (!active) return;

        recognizerRef.current = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });
        
        if (!active) return;
        
        try {
           await startWebcam();
        } catch (camError) {
           console.error("Webcam failed:", camError);
           setError("Camera Access Denied");
           setCurrentGesture("Camera Blocked");
        }

      } catch (e) {
        console.error("Failed to load MediaPipe:", e);
        if (active) {
            setError("AI Load Failed");
            setCurrentGesture("Error loading AI");
        }
      }
    };

    init();
    return () => { active = false; };
  }, []);

  const startWebcam = async () => {
    if (videoRef.current) {
        // Explicitly check for mediaDevices support
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error("Browser API not supported");
        }
        
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;
        videoRef.current.addEventListener('loadeddata', predictWebcam);
    }
  };

  const predictWebcam = async () => {
    const video = videoRef.current;
    const recognizer = recognizerRef.current;
    
    if (!video || !recognizer) return;

    // Safety check if video is ready
    if (video.readyState < 2) {
        requestAnimationFrame(predictWebcam);
        return;
    }

    try {
        if (video.currentTime !== lastProcessedRef.current) {
            lastProcessedRef.current = video.currentTime;
            
            const results = recognizer.recognizeForVideo(video, Date.now());

            if (results.gestures.length > 0) {
                const name = results.gestures[0][0].categoryName;
                
                // Custom Logic
                let detectedMode: 'tree' | 'scatter' | null = null;
                let displayGesture = name;

                if (name === 'Open_Palm') {
                    detectedMode = 'scatter';
                    displayGesture = "Open Hand (Scatter)";
                } else if (name === 'Closed_Fist') {
                    detectedMode = 'tree';
                    displayGesture = "Fist (Tree)";
                }

                setCurrentGesture(displayGesture);
                if (detectedMode) {
                    onModeChange(detectedMode);
                }
            } else {
                setCurrentGesture("No Hand Detected");
            }
        }
    } catch (err) {
        console.warn("Prediction error:", err);
    }

    requestAnimationFrame(predictWebcam);
  };

  if (error) {
    return (
        <div className="absolute bottom-4 right-4 z-50 opacity-70">
            <div className="bg-red-900/50 border border-red-500/50 p-2 rounded backdrop-blur-md">
                <p className="text-red-300 font-cinzel text-xs">{error}</p>
            </div>
        </div>
    );
  }

  return (
    <div className="absolute bottom-4 right-4 z-50 flex flex-col items-end opacity-70 hover:opacity-100 transition-opacity">
        <div className="bg-black/80 border border-amber-900/50 p-2 mb-2 rounded shadow-2xl backdrop-blur-md">
            <p className="text-amber-500 font-cinzel text-xs uppercase tracking-widest text-right">Gesture AI</p>
            <p className="text-white/90 font-times text-sm italic text-right">{currentGesture}</p>
        </div>
        <div className="relative w-32 h-24 rounded-lg overflow-hidden border border-amber-900/30 bg-black">
            <video 
                ref={videoRef} 
                className="w-full h-full object-cover transform scale-x-[-1]" 
                autoPlay 
                playsInline 
                muted
            />
        </div>
    </div>
  );
};

export default GestureHandler;