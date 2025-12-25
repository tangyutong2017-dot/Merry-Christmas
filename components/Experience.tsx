import React from 'react';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import TreeParticles from './TreeParticles';
import StarParticles from './StarParticles';
import { AppMode } from '../App';

interface ExperienceProps {
  mode: AppMode;
}

const Experience: React.FC<ExperienceProps> = ({ mode }) => {
  return (
    <>
      {/* Subtle Ambient Lighting for Scene */}
      <ambientLight intensity={0.1} />
      
      {/* The Particle Tree with Morphing Logic */}
      <group position={[0, -2.5, 0]}>
        <TreeParticles mode={mode} />
      </group>

      {/* The Star */}
      <group position={[0, 5.7, 0]}>
        <StarParticles />
      </group>

      {/* Cinematic Post Processing */}
      {/* Note: disableNormalPass removed for better compatibility */}
      <EffectComposer>
        <Bloom 
          luminanceThreshold={0.15} 
          mipmapBlur 
          intensity={0.6} 
          radius={0.5} 
        />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
        <Noise opacity={0.05} />
      </EffectComposer>
    </>
  );
};

export default Experience;