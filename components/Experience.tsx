import React from 'react';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import TreeParticles from './TreeParticles';
import StarParticles from './StarParticles';
import { AppMode } from '../App';

interface ExperienceProps {
  mode: AppMode;
}

const Experience: React.FC<ExperienceProps> = ({ mode }) => {
  return (
    <>
      {/* Lights */}
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1.0} color="#ffecd1" />
      
      {/* The Particle Tree */}
      <group position={[0, -2.5, 0]}>
        <TreeParticles mode={mode} />
      </group>

      {/* The Star */}
      <group position={[0, 5.7, 0]}>
        <StarParticles />
      </group>

      {/* 
         CRITICAL FIX FOR BLACK SCREEN:
         1. disableNormalPass={true}: Particles don't have normals, trying to calculate them causes glitches.
         2. multisampling={0}: Prevents MSAA conflicts in the composition buffer which often cause black screens on mobile/web.
      */}
      <EffectComposer disableNormalPass multisampling={0}>
        <Bloom 
          luminanceThreshold={0.2} 
          mipmapBlur 
          intensity={1.5} 
          radius={0.6} 
        />
        <Vignette eskil={false} offset={0.1} darkness={0.8} />
      </EffectComposer>
    </>
  );
};

export default Experience;