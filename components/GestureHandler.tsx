import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, GestureRecognizer } from '@mediapipe/tasks-vision';

interface GestureHandlerProps {
  onModeChange: (mode: 'tree' | 'scatter') => void;
}

const GestureHandler: React.FC<GestureHandlerProps> = ({ onModeChange }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);
  const recognizerRef = useRef<GestureRecognizer | null>(null);
  const lastProcessedRef = useRef<number>(0);
  const [currentGesture, setCurrentGesture] = useState<string>("Initializing...");

  useEffect(() => {
    const init = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
        );
        
        recognizerRef.current = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });
        
        setLoaded(true);
        startWebcam();
      } catch (e) {
        console.error("Failed to load MediaPipe:", e);
        setCurrentGesture("Error loading AI");
      }
    };

    init();
  }, []);

  const startWebcam = async () => {
    if (videoRef.current) {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      videoRef.current.addEventListener('loadeddata', predictWebcam);
    }
  };

  const predictWebcam = async () => {
    const video = videoRef.current;
    const recognizer = recognizerRef.current;
    
    if (!video || !recognizer) return;

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

    requestAnimationFrame(predictWebcam);
  };

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