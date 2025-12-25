import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { AppMode } from '../App';

const TREE_HEIGHT = 8;
const TREE_BASE_RADIUS = 3.5;
const TREE_PARTICLE_COUNT = 6000;
const RIBBON_PARTICLE_COUNT = 2000;

// Color Palette
const COLOR_INK_GREEN_DARK = new THREE.Color('#011a09'); 
const COLOR_INK_GREEN_LIGHT = new THREE.Color('#0f3d1e'); 
const COLOR_LUXURY_GOLD = new THREE.Color('#FFD700'); 

const LIGHT_COLORS = [
  new THREE.Color('#ff0044'), // Holiday Red
  new THREE.Color('#ffcc00'), // Warm Gold
  new THREE.Color('#00ccff'), // Icy Blue
  new THREE.Color('#ff00cc'), // Magenta
  new THREE.Color('#ffffff'), // Bright White
];

interface TreeParticlesProps {
  mode: AppMode;
}

const TreeParticles: React.FC<TreeParticlesProps> = ({ mode }) => {
  const treeRef = useRef<THREE.Points>(null);
  const ribbonRef = useRef<THREE.Points>(null);

  // Store original/target positions
  const targets = useMemo(() => {
    // 1. Tree Form Positions
    const treePos = new Float32Array(TREE_PARTICLE_COUNT * 3);
    const scatterVel = new Float32Array(TREE_PARTICLE_COUNT * 3);
    
    const colors = new Float32Array(TREE_PARTICLE_COUNT * 3);
    // Note: Standard PointsMaterial uses 'size' prop, but we calculate sizes array 
    // in case we switch to a custom shader later. For now we use a larger global size.
    const sizes = new Float32Array(TREE_PARTICLE_COUNT);

    const tempColor = new THREE.Color();

    // --- Generate Tree & Colors ---
    for (let i = 0; i < TREE_PARTICLE_COUNT; i++) {
      // Tree: Cone Shape
      const hNorm = Math.random(); 
      const y = hNorm * TREE_HEIGHT;
      const rMax = (1 - hNorm) * TREE_BASE_RADIUS;
      const r = Math.sqrt(Math.random()) * rMax; 
      const theta = Math.random() * Math.PI * 2;
      
      const spiralTwist = y * 0.5;
      const tx = r * Math.cos(theta + spiralTwist);
      const tz = r * Math.sin(theta + spiralTwist);
      
      treePos[i * 3] = tx;
      treePos[i * 3 + 1] = y;
      treePos[i * 3 + 2] = tz;

      // --- Luxury Color Logic ---
      const isOuterShell = rMax > 0.1 && (r / rMax) > 0.85;
      const isLight = Math.random() > 0.88; // 12% are bulbs

      if (isLight) {
        if (isOuterShell && Math.random() > 0.4) {
            tempColor.copy(COLOR_LUXURY_GOLD);
        } else {
            const lightCol = LIGHT_COLORS[Math.floor(Math.random() * LIGHT_COLORS.length)];
            tempColor.copy(lightCol);
        }
      } else {
        if (isOuterShell && Math.random() > 0.45) {
            tempColor.copy(COLOR_LUXURY_GOLD);
            const shade = Math.random();
            if (shade > 0.8) tempColor.offsetHSL(0, 0, 0.2); 
            else tempColor.multiplyScalar(0.8); 
        } else {
            const mix = Math.random();
            tempColor.lerpColors(COLOR_INK_GREEN_DARK, COLOR_INK_GREEN_LIGHT, mix * mix);
        }
      }

      colors[i * 3] = tempColor.r;
      colors[i * 3 + 1] = tempColor.g;
      colors[i * 3 + 2] = tempColor.b;

      // Scatter Velocities
      scatterVel[i * 3] = (Math.random() - 0.5) * 12;
      scatterVel[i * 3 + 1] = (Math.random() - 0.5) * 12;
      scatterVel[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }

    return { treePos, scatterVel, colors, sizes };
  }, []);

  // Use a separate buffer for current positions that updates every frame
  const currentPositions = useMemo(() => {
    return new Float32Array(targets.treePos); 
  }, [targets]);

  // Ribbon setup
  const { ribbonPositions } = useMemo(() => {
    const pos = new Float32Array(RIBBON_PARTICLE_COUNT * 3);
    for (let i = 0; i < RIBBON_PARTICLE_COUNT; i++) {
      const t = i / RIBBON_PARTICLE_COUNT;
      const h = t * TREE_HEIGHT;
      const coneR = (1 - t) * TREE_BASE_RADIUS;
      const ribbonR = coneR + 0.2;
      const rotations = 4.5;
      const theta = t * Math.PI * 2 * rotations;
      const spread = 0.25;

      pos[i * 3] = (ribbonR + (Math.random()-0.5)*spread) * Math.cos(theta);
      pos[i * 3 + 1] = h + (Math.random()-0.5)*spread;
      pos[i * 3 + 2] = (ribbonR + (Math.random()-0.5)*spread) * Math.sin(theta);
    }
    return { ribbonPositions: pos };
  }, []);


  // Animation Loop
  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    // --- Update Tree Particles ---
    if (treeRef.current) {
      const posAttr = treeRef.current.geometry.attributes.position;
      const positions = posAttr.array as Float32Array;
      
      const lerpFactor = 0.05;

      for (let i = 0; i < TREE_PARTICLE_COUNT; i++) {
        const idx = i * 3;
        let tx = 0, ty = 0, tz = 0;

        if (mode === 'tree') {
            tx = targets.treePos[idx];
            ty = targets.treePos[idx + 1];
            tz = targets.treePos[idx + 2];
        } else if (mode === 'scatter') {
            const vx = targets.scatterVel[idx];
            const vy = targets.scatterVel[idx + 1];
            const vz = targets.scatterVel[idx + 2];
            
            tx = targets.treePos[idx] + vx * (Math.sin(time * 0.5) + 1.5);
            ty = targets.treePos[idx + 1] + vy * (Math.cos(time * 0.3) + 1.5);
            tz = targets.treePos[idx + 2] + vz * (Math.sin(time * 0.7) + 1.5);
        }

        positions[idx] += (tx - positions[idx]) * lerpFactor;
        positions[idx + 1] += (ty - positions[idx + 1]) * lerpFactor;
        positions[idx + 2] += (tz - positions[idx + 2]) * lerpFactor;
      }

      posAttr.needsUpdate = true;

      if (mode === 'tree') {
        treeRef.current.rotation.y += 0.001;
      }
    }

    // --- Update Ribbon ---
    if (ribbonRef.current) {
        const scaleTarget = mode === 'tree' ? 1 : (mode === 'scatter' ? 2 : 0);
        const currentScale = ribbonRef.current.scale.x;
        const newScale = currentScale + (scaleTarget - currentScale) * 0.05;
        
        ribbonRef.current.scale.set(newScale, newScale, newScale);
        ribbonRef.current.rotation.y = -time * 0.1;
        ribbonRef.current.visible = true;
    }
  });

  return (
    <group>
      {/* Morphing Particles */}
      <points ref={treeRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={TREE_PARTICLE_COUNT}
            array={currentPositions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={TREE_PARTICLE_COUNT}
            array={targets.colors}
            itemSize={3}
          />
        </bufferGeometry>
        {/* Increased Size for Visibility */}
        <pointsMaterial
          size={0.12} 
          vertexColors
          transparent
          opacity={0.9}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* White Ribbon */}
      <points ref={ribbonRef}>
        <bufferGeometry>
           <bufferAttribute
            attach="attributes-position"
            count={RIBBON_PARTICLE_COUNT}
            array={ribbonPositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#ffffff" 
          size={0.1}
          transparent
          opacity={0.6}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
};

export default TreeParticles;