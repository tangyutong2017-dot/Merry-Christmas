import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

// Configuration
const STAR_RADIUS_OUTER = 1.0;
const STAR_RADIUS_INNER = 0.45;
const STAR_DEPTH = 0.35; // Thickness of the 3D star
const WIRE_PARTICLE_DENSITY = 120; // High density for "paved diamond/gold" look

const COLOR_GOLD = new THREE.Color('#FFD700');
const COLOR_DIAMOND = new THREE.Color('#FFFFFF');

const StarParticles: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const wireParticlesRef = useRef<THREE.Points>(null);

  // 1. Generate 3D Star Wireframe & Attached Particles
  const { linePositions, wireParticlePos, wireParticleColors, wireParticleSizes, wireParticlePhases } = useMemo(() => {
    const lines: number[] = [];
    const pPos: number[] = [];
    const pCol: number[] = [];
    const pSizes: number[] = [];
    const pPhases: number[] = [];

    // Vertices
    const frontHub = new THREE.Vector3(0, 0, STAR_DEPTH);
    const backHub = new THREE.Vector3(0, 0, -STAR_DEPTH);
    const tips: THREE.Vector3[] = [];
    const valleys: THREE.Vector3[] = [];

    for (let i = 0; i < 5; i++) {
      // 5 Points
      const angleTip = (i * 2 * Math.PI) / 5 + Math.PI / 2;
      const angleValley = angleTip + Math.PI / 5;

      tips.push(new THREE.Vector3(Math.cos(angleTip) * STAR_RADIUS_OUTER, Math.sin(angleTip) * STAR_RADIUS_OUTER, 0));
      valleys.push(new THREE.Vector3(Math.cos(angleValley) * STAR_RADIUS_INNER, Math.sin(angleValley) * STAR_RADIUS_INNER, 0));
    }

    // Helper to add edge and particles
    const addSegment = (v1: THREE.Vector3, v2: THREE.Vector3) => {
      // Line Segment
      lines.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z);

      // Particles along the line
      const dist = v1.distanceTo(v2);
      const count = Math.ceil(dist * WIRE_PARTICLE_DENSITY);
      
      for (let k = 0; k <= count; k++) {
        const t = k / count;
        // Linear interpolation
        const px = v1.x * (1 - t) + v2.x * t;
        const py = v1.y * (1 - t) + v2.y * t;
        const pz = v1.z * (1 - t) + v2.z * t;

        const jitter = 0.02; // Tight jitter to keep the shape sharp
        pPos.push(
          px + (Math.random() - 0.5) * jitter,
          py + (Math.random() - 0.5) * jitter,
          pz + (Math.random() - 0.5) * jitter
        );

        // Luxury Mix: Gold & Diamond
        // 80% Gold, 20% Diamond sparkles
        const isDiamond = Math.random() > 0.8;
        const c = isDiamond ? COLOR_DIAMOND : COLOR_GOLD;
        pCol.push(c.r, c.g, c.b);

        // Size
        // Diamonds are slightly larger to catch the eye
        const size = isDiamond ? (Math.random() * 2.5 + 1.0) : (Math.random() * 1.5 + 0.5);
        pSizes.push(size);

        // Blink phase
        pPhases.push(Math.random() * Math.PI * 2);
      }
    };

    // Construct Geometry
    for (let i = 0; i < 5; i++) {
      const tip = tips[i];
      const valley = valleys[i];
      const nextTip = tips[(i + 1) % 5];

      // Edges
      addSegment(tip, valley);
      addSegment(valley, nextTip);
      addSegment(frontHub, tip);
      addSegment(backHub, tip);
      addSegment(frontHub, valley);
      addSegment(backHub, valley);
    }

    return {
      linePositions: new Float32Array(lines),
      wireParticlePos: new Float32Array(pPos),
      wireParticleColors: new Float32Array(pCol),
      wireParticleSizes: new Float32Array(pSizes),
      wireParticlePhases: new Float32Array(pPhases),
    };
  }, []);

  // Animation
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const blinkSpeed = 80 / 60 * Math.PI * 2; // 80 BPM

    // Rotate Star
    if (groupRef.current) {
      groupRef.current.rotation.y = time * 0.25;
    }

    // Blink Particles
    if (wireParticlesRef.current) {
        const sizesAttr = wireParticlesRef.current.geometry.attributes.size;
        for (let i = 0; i < sizesAttr.count; i++) {
            const baseSize = wireParticleSizes[i];
            const phase = wireParticlePhases[i];
            
            // Sparkle effect
            const sine = Math.sin(time * blinkSpeed + phase);
            const intensity = sine > 0 ? sine : 0; 
            // Diamonds sparkle more intensely
            const scale = 1 + 1.2 * intensity;
            
            sizesAttr.setX(i, baseSize * scale);
        }
        sizesAttr.needsUpdate = true;
    }
  });

  return (
    <group ref={groupRef}>
      {/* 1. Wireframe Structure - Stronger Gold */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={linePositions.length / 3}
            array={linePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color={COLOR_GOLD}
          transparent
          opacity={0.6} // More solid wireframe
          depthWrite={false}
        />
      </lineSegments>

      {/* 2. Attached Particles (Jewels) */}
      <points ref={wireParticlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={wireParticlePos.length / 3}
            array={wireParticlePos}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={wireParticleColors.length / 3}
            array={wireParticleColors}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            count={wireParticleSizes.length}
            array={wireParticleSizes}
            itemSize={1}
          />
        </bufferGeometry>
        <pointsMaterial
          vertexColors
          transparent
          opacity={1.0}
          sizeAttenuation={true}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          size={0.12}
        />
      </points>
      
      {/* 3. Central Core Light (The Heart) */}
      <mesh>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshBasicMaterial 
            color={COLOR_GOLD} 
            transparent 
            opacity={0.9} 
            blending={THREE.AdditiveBlending} 
            depthWrite={false}
        />
      </mesh>
      
      {/* 4. Real Light Source for the scene */}
      <pointLight 
        color="#ffddaa" 
        intensity={2} 
        distance={10} 
        decay={2} 
      />
    </group>
  );
};

export default StarParticles;