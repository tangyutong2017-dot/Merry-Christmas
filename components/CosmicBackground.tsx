import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

const STAR_COUNT = 1200; // Reduced density (was 4000) for a sparser, cleaner look

// Shooting Star Sub-component
const ShootingStar = () => {
  const lineRef = useRef<THREE.LineSegments>(null);
  
  // Mutable state for animation (no re-renders)
  const state = useRef({
    active: false,
    start: new THREE.Vector3(),
    velocity: new THREE.Vector3(),
    timer: 0,
    life: 0
  }).current;

  useFrame((_, delta) => {
    // Spawn Logic
    if (!state.active) {
      // Low probability check per frame. 
      // Approx 0.2% chance per frame @ 60fps ~ 1 star every 8-10 seconds
      if (Math.random() < 0.002) { 
        spawn();
      } else {
        if (lineRef.current) lineRef.current.visible = false;
      }
      return;
    }

    // Animation Logic
    state.timer += delta;
    if (state.timer >= state.life) {
      state.active = false;
      if (lineRef.current) lineRef.current.visible = false;
      return;
    }

    if (lineRef.current) {
      lineRef.current.visible = true;
      const positions = lineRef.current.geometry.attributes.position.array as Float32Array;
      
      // Calculate head position
      const headX = state.start.x + state.velocity.x * state.timer;
      const headY = state.start.y + state.velocity.y * state.timer;
      const headZ = state.start.z + state.velocity.z * state.timer;

      // Tail trails behind
      const trailLag = 0.06; // Seconds behind
      const tailX = headX - state.velocity.x * trailLag;
      const tailY = headY - state.velocity.y * trailLag;
      const tailZ = headZ - state.velocity.z * trailLag;

      // Update Line Vertices
      positions[0] = headX;
      positions[1] = headY;
      positions[2] = headZ;
      positions[3] = tailX;
      positions[4] = tailY;
      positions[5] = tailZ;
      
      lineRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  const spawn = () => {
    state.active = true;
    state.timer = 0;
    state.life = 0.8 + Math.random() * 0.5; // Short lifespan
    
    // Spawn on a distant sphere
    const r = 60 + Math.random() * 20;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;

    state.start.setFromSphericalCoords(r, phi, theta);

    // Determine velocity (fly towards another random point)
    const endTheta = theta + (Math.random() - 0.5) * 3; 
    const endPhi = phi + (Math.random() - 0.5) * 3;
    const endPoint = new THREE.Vector3().setFromSphericalCoords(r, endPhi, endTheta);

    // Speed: 30-60 units per second
    state.velocity.subVectors(endPoint, state.start).normalize().multiplyScalar(30 + Math.random() * 30);
  };

  return (
    <lineSegments ref={lineRef}>
      <bufferGeometry>
        <bufferAttribute 
          attach="attributes-position" 
          count={2} 
          array={new Float32Array(6)} 
          itemSize={3} 
        />
      </bufferGeometry>
      {/* Bloom will make this white line glow nicely */}
      <lineBasicMaterial color="#ffffff" transparent opacity={0.7} />
    </lineSegments>
  );
};

const CosmicBackground: React.FC = () => {
  const mesh = useRef<THREE.Points>(null);

  const { positions, colors, sizes } = useMemo(() => {
    const pos = new Float32Array(STAR_COUNT * 3);
    const col = new Float32Array(STAR_COUNT * 3);
    const sz = new Float32Array(STAR_COUNT);
    
    // Luxury Cosmic Palette
    const colorPalette = [
        new THREE.Color('#ffffff'), // Pure Starlight
        new THREE.Color('#b3d9ff'), // faint Ice Blue
        new THREE.Color('#ffeebb'), // faint Champagne Gold
    ];

    for (let i = 0; i < STAR_COUNT; i++) {
      // Radius between 45 and 90 (Background layer)
      const r = 45 + Math.random() * 45;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1); 
      
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
      
      // Colors
      const c = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      const brightness = 0.3 + Math.random() * 0.7;
      
      col[i * 3] = c.r * brightness;
      col[i * 3 + 1] = c.g * brightness;
      col[i * 3 + 2] = c.b * brightness;
      
      // Sizes
      sz[i] = Math.random() * 1.5 + 0.5;
    }
    
    return { positions: pos, colors: col, sizes: sz };
  }, []);

  useFrame((state) => {
    if (mesh.current) {
      const t = state.clock.getElapsedTime();
      mesh.current.rotation.y = t * 0.015; // Slow rotation
      mesh.current.rotation.z = t * 0.003;
    }
  });

  return (
    <>
        <points ref={mesh}>
        <bufferGeometry>
            <bufferAttribute 
                attach="attributes-position" 
                count={STAR_COUNT} 
                array={positions} 
                itemSize={3} 
            />
            <bufferAttribute 
                attach="attributes-color" 
                count={STAR_COUNT} 
                array={colors} 
                itemSize={3} 
            />
            <bufferAttribute 
                attach="attributes-size" 
                count={STAR_COUNT} 
                array={sizes} 
                itemSize={1} 
            />
        </bufferGeometry>
        <pointsMaterial
            size={1.0}
            vertexColors
            transparent
            opacity={0.8}
            sizeAttenuation={true}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
        />
        </points>
        {/* Instantiate a couple of potential shooting stars */}
        <ShootingStar />
        <ShootingStar />
    </>
  );
};

export default CosmicBackground;