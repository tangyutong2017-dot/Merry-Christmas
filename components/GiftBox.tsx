import React, { useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Float, Sparkles } from '@react-three/drei';

interface GiftBoxProps {
  onOpen: () => void;
}

const GiftBox: React.FC<GiftBoxProps> = ({ onOpen }) => {
  const groupRef = useRef<THREE.Group>(null);
  const lidRef = useRef<THREE.Group>(null);
  const [isOpening, setIsOpening] = useState(false);
  const [animationTime, setAnimationTime] = useState(0);

  // Materials
  const boxMaterial = new THREE.MeshStandardMaterial({ 
    color: '#8a0e0e', // Deep Christmas Red
    roughness: 0.3,
    metalness: 0.1,
  });
  
  const ribbonMaterial = new THREE.MeshStandardMaterial({ 
    color: '#FFD700', // Gold
    roughness: 0.2,
    metalness: 0.8,
    emissive: '#b8860b',
    emissiveIntensity: 0.2
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    if (!isOpening) {
      setIsOpening(true);
    }
  };

  useFrame((state, delta) => {
    if (isOpening) {
      setAnimationTime((prev) => prev + delta);
      
      const t = animationTime;

      if (lidRef.current) {
        // Animation Phase 1: Pop up
        const liftHeight = Math.min(t * 3, 4); // Lift up to 4 units
        lidRef.current.position.y = 0.5 + liftHeight;
        
        // Animation Phase 2: Rotate / Tumble away
        if (t > 0.2) {
             lidRef.current.rotation.x -= delta * 2;
             lidRef.current.rotation.z += delta * 1;
        }
      }

      // Animation Phase 3: Trigger Scene Switch
      // Wait for lid to clear and light to shine
      if (t > 1.5) {
        onOpen();
      }
    } else {
        // Idle hover animation handled by <Float> wrapper
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <group 
        ref={groupRef} 
        onClick={handleClick} 
        scale={1.5} 
        rotation={[0.3, -0.5, 0]}
        onPointerOver={() => document.body.style.cursor = 'pointer'}
        onPointerOut={() => document.body.style.cursor = 'auto'}
      >
        {/* Inner Light (Hidden until opening) */}
        {isOpening && (
            <pointLight 
                position={[0, 0, 0]} 
                intensity={10 + animationTime * 20} 
                distance={10} 
                color="#ffdd00" 
            />
        )}
        
        {/* Magic Particles when opening */}
        {isOpening && (
           <Sparkles 
             count={50} 
             scale={4} 
             size={6} 
             speed={2} 
             opacity={1} 
             color="#FFD700"
           />
        )}

        {/* --- LID GROUP --- */}
        <group ref={lidRef} position={[0, 0.51, 0]}>
          {/* Lid Body */}
          <mesh castShadow receiveShadow material={boxMaterial}>
            <boxGeometry args={[1.05, 0.2, 1.05]} />
          </mesh>
          {/* Lid Ribbon X */}
          <mesh position={[0, 0, 0]} material={ribbonMaterial}>
            <boxGeometry args={[0.22, 0.21, 1.06]} />
          </mesh>
          {/* Lid Ribbon Z */}
          <mesh position={[0, 0, 0]} material={ribbonMaterial}>
            <boxGeometry args={[1.06, 0.21, 0.22]} />
          </mesh>
          {/* Bow/Knot on top */}
          <mesh position={[0, 0.15, 0]} material={ribbonMaterial}>
            <torusGeometry args={[0.15, 0.05, 8, 20]} />
          </mesh>
           <mesh position={[0, 0.15, 0]} rotation={[0, Math.PI/2, 0]} material={ribbonMaterial}>
            <torusGeometry args={[0.15, 0.05, 8, 20]} />
          </mesh>
        </group>

        {/* --- BASE GROUP --- */}
        <group position={[0, -0.5, 0]}>
          {/* Box Body */}
          <mesh castShadow receiveShadow material={boxMaterial}>
            <boxGeometry args={[1, 1, 1]} />
          </mesh>
          {/* Ribbon Vertical */}
          <mesh material={ribbonMaterial}>
            <boxGeometry args={[0.2, 1.01, 1.01]} />
          </mesh>
          {/* Ribbon Horizontal */}
          <mesh material={ribbonMaterial}>
            <boxGeometry args={[1.01, 1.01, 0.2]} />
          </mesh>
        </group>
      </group>
    </Float>
  );
};

export default GiftBox;