import React, { useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Float, Sparkles, RoundedBox, Text } from '@react-three/drei';

interface GiftBoxProps {
  onOpen: () => void;
}

const GiftBox: React.FC<GiftBoxProps> = ({ onOpen }) => {
  const groupRef = useRef<THREE.Group>(null);
  const lidRef = useRef<THREE.Group>(null);
  const [isOpening, setIsOpening] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [animationTime, setAnimationTime] = useState(0);

  // Materials
  const boxMaterial = new THREE.MeshStandardMaterial({ 
    color: '#e63946', // Cuter, slightly softer red
    roughness: 0.3,
    metalness: 0.1,
  });
  
  const ribbonMaterial = new THREE.MeshStandardMaterial({ 
    color: '#ffd700', // Gold
    roughness: 0.2,
    metalness: 0.4,
    emissive: '#ffae00',
    emissiveIntensity: 0.2
  });

  const dotMaterial = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.8 });

  const handleClick = (e: any) => {
    e.stopPropagation();
    if (!isOpening) {
      setIsOpening(true);
    }
  };

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    // Hover breathing effect (if not opening)
    if (!isOpening && groupRef.current) {
        const hoverScale = isHovered ? 1.05 : 1.0;
        const breath = 1 + Math.sin(t * 3) * 0.02;
        const targetScale = 3 * hoverScale * breath;
        
        // Smooth lerp
        groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }

    // Opening Animation
    if (isOpening) {
      setAnimationTime((prev) => prev + delta);
      const at = animationTime;

      if (lidRef.current && groupRef.current) {
        // 1. Anticipation (Squash) - very brief
        if (at < 0.1) {
             groupRef.current.scale.set(3.2, 2.5, 3.2); // Squash
        } 
        // 2. Pop
        else {
             // Lid flies off
             const flyTime = at - 0.1;
             lidRef.current.position.y = 0.52 + flyTime * flyTime * 30; // Faster pop
             lidRef.current.rotation.x = -flyTime * 15;
             lidRef.current.rotation.z = flyTime * 10;

             // Box expands then shrinks/fades
             const scale = Math.max(0, 3 - flyTime * 6); // Faster shrink
             groupRef.current.scale.setScalar(scale);
        }
      }

      // Trigger callback - Snappy transition (0.6s)
      if (at > 0.6) {
        onOpen();
      }
    }
  });

  // Generate random polka dots positions for the box
  const PolkaDots = () => (
    <group>
        {[...Array(6)].map((_, i) => (
            <group rotation={[0, (i * Math.PI) / 3, 0]} key={i}>
                <mesh position={[0.3, 0, 0.51]} material={dotMaterial}>
                    <circleGeometry args={[0.08, 16]} />
                </mesh>
                <mesh position={[-0.3, 0.25, 0.51]} material={dotMaterial}>
                    <circleGeometry args={[0.06, 16]} />
                </mesh>
                 <mesh position={[-0.2, -0.3, 0.51]} material={dotMaterial}>
                    <circleGeometry args={[0.07, 16]} />
                </mesh>
            </group>
        ))}
    </group>
  );

  return (
    <Float speed={2.5} rotationIntensity={0.4} floatIntensity={0.6}>
      <group 
        ref={groupRef} 
        onClick={handleClick} 
        scale={3} 
        position={[0, -1, 0]}
        onPointerOver={() => { setIsHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setIsHovered(false); document.body.style.cursor = 'auto'; }}
      >
        {/* Lights specific to the gift */}
        <pointLight position={[2, 2, 5]} intensity={1.5} color="#fff" />
        <ambientLight intensity={0.5} />

        {/* Inner Explosion Light */}
        {isOpening && (
            <pointLight 
                position={[0, 0.5, 0]} 
                intensity={10 + animationTime * 30} 
                distance={15} 
                color="#ffeb3b" 
            />
        )}
        
        {/* Magic Particles */}
        <Sparkles 
            count={isOpening ? 150 : 30} 
            scale={isOpening ? 8 : 2.5} 
            size={isOpening ? 15 : 4} 
            speed={isOpening ? 5 : 0.5} 
            opacity={0.8} 
            color="#FFD700"
        />

        {/* --- LID --- */}
        <group ref={lidRef} position={[0, 0.52, 0]}>
          <RoundedBox args={[1.1, 0.2, 1.1]} radius={0.08} smoothness={4} material={boxMaterial} />
          
          {/* Lid Ribbon */}
          <mesh position={[0, 0, 0]} material={ribbonMaterial} receiveShadow>
            <boxGeometry args={[0.25, 0.21, 1.12]} />
          </mesh>
          <mesh position={[0, 0, 0]} material={ribbonMaterial} receiveShadow>
            <boxGeometry args={[1.12, 0.21, 0.25]} />
          </mesh>
          
          {/* Big Bouncy Bow */}
          <group position={[0, 0.1, 0]} scale={1.2}>
            {/* Loops */}
            <mesh position={[0.15, 0.15, 0]} rotation={[0, 0, -Math.PI/4]} material={ribbonMaterial}>
                <torusGeometry args={[0.15, 0.08, 16, 32]} />
            </mesh>
            <mesh position={[-0.15, 0.15, 0]} rotation={[0, 0, Math.PI/4]} material={ribbonMaterial}>
                <torusGeometry args={[0.15, 0.08, 16, 32]} />
            </mesh>
            <mesh position={[0, 0.15, 0.15]} rotation={[Math.PI/4, 0, 0]} material={ribbonMaterial}>
                <torusGeometry args={[0.15, 0.08, 16, 32]} />
            </mesh>
            <mesh position={[0, 0.15, -0.15]} rotation={[-Math.PI/4, 0, 0]} material={ribbonMaterial}>
                <torusGeometry args={[0.15, 0.08, 16, 32]} />
            </mesh>
            {/* Center Knot */}
            <mesh position={[0, 0.12, 0]} material={ribbonMaterial}>
                <sphereGeometry args={[0.12, 16, 16]} />
            </mesh>
          </group>
        </group>

        {/* --- BOX BODY --- */}
        <group position={[0, 0, 0]}>
          <RoundedBox args={[1, 1, 1]} radius={0.08} smoothness={4} material={boxMaterial}>
          </RoundedBox>
          <PolkaDots />
          
          {/* Ribbons */}
          <mesh material={ribbonMaterial}>
            <boxGeometry args={[0.25, 1.02, 1.02]} />
          </mesh>
          <mesh material={ribbonMaterial}>
            <boxGeometry args={[1.02, 1.02, 0.25]} />
          </mesh>
        </group>

        {/* Cute Tag - Font removed to fix loading issues */}
        <group position={[0.4, 0.1, 0.55]} rotation={[0, 0, 0.2]}>
             <mesh>
                <boxGeometry args={[0.4, 0.3, 0.02]} />
                <meshStandardMaterial color="#fff" />
             </mesh>
             <Text 
                position={[0, 0, 0.02]} 
                fontSize={0.1} 
                color="#d00000" 
                // Font prop removed to use default font (faster load)
             >
                OPEN ME
             </Text>
        </group>

      </group>
    </Float>
  );
};

export default GiftBox;