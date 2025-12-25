import React, { Suspense, useState, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Experience from './components/Experience';
import GestureHandler from './components/GestureHandler';
import CosmicBackground from './components/CosmicBackground';

export type AppMode = 'tree' | 'scatter';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('tree');
  
  // Music State
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Smooth mode transition handler
  const handleModeChange = useCallback((newMode: AppMode) => {
    setMode(newMode);
  }, []);

  // Music Handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && audioRef.current) {
        const url = URL.createObjectURL(file);
        audioRef.current.src = url;
        audioRef.current.play()
            .then(() => setIsPlaying(true))
            .catch(err => console.log("Auto-play prevented:", err));
        setHasAudio(true);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
        audioRef.current.pause();
    } else {
        audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="w-full h-screen bg-black relative overflow-hidden">
      
      {/* --- UI LAYER --- */}
      {/* Wrapper with pointer-events-none to allow clicking through to canvas, but enable children interaction */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        
        {/* Top Left: Dedication & Title */}
        <div className="absolute top-8 left-8 flex flex-col items-start select-none">
            <h1 className="text-3xl md:text-5xl text-amber-100/90 font-cinzel tracking-[0.2em] mb-2 drop-shadow-[0_0_15px_rgba(255,215,0,0.3)]">
            MERRY CHRISTMAS
            </h1>
            <div className="h-[1px] w-32 bg-gradient-to-r from-amber-700 to-transparent mb-3"></div>
            <p className="text-amber-500/80 text-xs font-cinzel tracking-widest uppercase pl-1">
            For my dear friend ⭐
            </p>
        </div>

        {/* Bottom Left: Music Controls (Enable pointer events) */}
        <div className="absolute bottom-8 left-8 flex flex-col gap-3 items-start pointer-events-auto">
            <audio ref={audioRef} onEnded={() => setIsPlaying(false)} loop />
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept="audio/*" 
                className="hidden" 
            />

            <button 
                onClick={() => fileInputRef.current?.click()}
                className="group flex items-center gap-3 px-4 py-2 border border-amber-900/40 bg-black/40 hover:bg-amber-900/20 backdrop-blur-sm rounded-sm transition-all duration-300"
            >
                <span className="text-amber-500 group-hover:text-amber-300 transition-colors text-sm">♪</span>
                <span className="text-amber-500/80 group-hover:text-amber-200 font-cinzel text-xs tracking-widest uppercase transition-colors">
                Upload Music
                </span>
            </button>

            <button 
                onClick={togglePlay}
                disabled={!hasAudio}
                className={`group flex items-center gap-3 px-4 py-2 border border-amber-900/40 bg-black/40 backdrop-blur-sm rounded-sm transition-all duration-300 w-full ${!hasAudio ? 'opacity-40 cursor-not-allowed' : 'hover:bg-amber-900/20 cursor-pointer'}`}
            >
                <span className="text-amber-500 group-hover:text-amber-300 transition-colors text-xs">
                    {isPlaying ? 'II' : '▶'}
                </span>
                <span className="text-amber-500/80 group-hover:text-amber-200 font-cinzel text-xs tracking-widest uppercase transition-colors text-left">
                    {isPlaying ? 'Pause' : 'Play Music'}
                </span>
            </button>
        </div>
        
        {/* Center Left: Instructions */}
        <div className="absolute top-1/2 left-8 -translate-y-1/2 hidden md:flex flex-col gap-6 transition-opacity duration-1000 opacity-100">
            <div className={`transition-all duration-700 ${mode === 'tree' ? 'opacity-100 translate-x-0' : 'opacity-30 -translate-x-4'}`}>
                <span className="block text-amber-500 font-cinzel text-xs tracking-widest mb-1">FIST</span>
                <span className="block text-white/80 font-times italic text-sm">Aggregate & Form</span>
            </div>
            <div className={`transition-all duration-700 ${mode === 'scatter' ? 'opacity-100 translate-x-0' : 'opacity-30 -translate-x-4'}`}>
                <span className="block text-amber-500 font-cinzel text-xs tracking-widest mb-1">OPEN HAND</span>
                <span className="block text-white/80 font-times italic text-sm">Scatter & Dream</span>
            </div>
        </div>

        {/* Gesture Handler UI */}
        <GestureHandler onModeChange={handleModeChange} />
      </div>

      {/* --- 3D SCENE --- */}
      <Canvas
        dpr={[1, 2]} 
        // Set camera to frontal view directly
        camera={{ position: [0, 1.5, 18], fov: 40, near: 0.1, far: 100 }}
        gl={{ 
          antialias: true,
          alpha: false, 
          stencil: false,
          depth: true,
          toneMappingExposure: 1.2
        }}
      >
        <color attach="background" args={['#000000']} />
        
        <Suspense fallback={null}>
            {/* Background & Atmosphere */}
            <CosmicBackground />
            <fogExp2 attach="fog" args={['#000000', 0.015]} />

            {/* MAIN: Experience */}
            <Experience mode={mode} />
        </Suspense>

        <OrbitControls 
            enablePan={false} 
            enableZoom={true} 
            minDistance={8} 
            maxDistance={25}
            autoRotate={mode === 'tree'} 
            autoRotateSpeed={0.5}
            target={[0, 1.5, 0]} 
        />
      </Canvas>
    </div>
  );
};

export default App;