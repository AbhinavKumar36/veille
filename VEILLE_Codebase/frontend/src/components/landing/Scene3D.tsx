import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sphere, Line, Stars, useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Optimized connection arcs
function Arcs({ points, color = "#4edea3" }: { points: THREE.Vector3[][], color?: string }) {
  return (
    <group>
      {points.map((curvePoints, i) => (
        <Line 
          key={i} 
          points={curvePoints} 
          color={color} 
          lineWidth={0.5} 
          transparent 
          opacity={0.3} 
        />
      ))}
    </group>
  );
}

// Optimized network nodes using InstancedMesh
function NetworkNodes({ count = 200, radius = 5.05 }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Ensure it updates on mount
  useFrame(() => {
    if (meshRef.current && !meshRef.current.userData.initialized) {
      for (let i = 0; i < count; i++) {
        const phi = Math.acos(-1 + (2 * i) / count);
        const theta = Math.sqrt(count * Math.PI) * phi;
        dummy.position.setFromSphericalCoords(radius, phi, theta);
        dummy.lookAt(0, 0, 0);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
      meshRef.current.userData.initialized = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <circleGeometry args={[0.02, 8]} />
      <meshBasicMaterial color="#4edea3" transparent opacity={0.8} />
    </instancedMesh>
  );
}

function TexturedGlobe() {
  // Using a high-res Earth night map for the glowing cities effect
  const earthNightTexture = useTexture('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_lights_2048.png');
  
  return (
    <Sphere args={[5, 64, 64]}>
      <meshStandardMaterial 
        map={earthNightTexture}
        color="#111820" // Dark base color for the oceans/land
        emissiveMap={earthNightTexture}
        emissive="#ffffff" // Tint the city lights with our brand cyan/green!
        emissiveIntensity={2.0}
        roughness={0.9} 
        metalness={0.1} 
        transparent
        opacity={0.95}
      />
    </Sphere>
  );
}

function Earth() {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      // Slow rotation
      groupRef.current.rotation.y += 0.0005;
      
      // Scroll-based manipulation
      const scrollY = window.scrollY;
      const maxScroll = document.body.scrollHeight - window.innerHeight;
      const scrollProgress = maxScroll > 0 ? scrollY / maxScroll : 0;
      
      // Rotate earth to face a specific "cluster" as we scroll
      // and pull it up slightly
      groupRef.current.position.y = -scrollProgress * 2;
      groupRef.current.position.z = scrollProgress * 5;
      
      // Add slight tilt based on scroll
      groupRef.current.rotation.x = scrollProgress * 0.5;
    }
  });

  return (
    <group ref={groupRef}>
      <Suspense fallback={
        <Sphere args={[5, 64, 64]}>
          <meshStandardMaterial color="#05070A" roughness={0.7} metalness={0.2} />
        </Sphere>
      }>
        <TexturedGlobe />
      </Suspense>
      
      {/* Atmosphere glow */}
      <Sphere args={[5.2, 32, 32]}>
        <meshBasicMaterial color="#4edea3" transparent opacity={0.03} side={THREE.BackSide} />
      </Sphere>

      <NetworkNodes count={400} />
    </group>
  );
}

function CameraRig() {
  const { camera } = useThree();
  
  useFrame(() => {
    const scrollY = window.scrollY;
    const maxScroll = document.body.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? scrollY / maxScroll : 0;
    
    // Smoothly interpolate camera position
    // Start at Z=12, move closer and pan as user scrolls
    const targetZ = 12 - (progress * 6);
    const targetY = progress * 2;
    
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.05);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.05);
    camera.lookAt(0, 0, 0);
  });
  
  return null;
}

export default function Scene3D() {
  return (
    <div className="fixed inset-0 w-full h-full z-0 pointer-events-none bg-[#020305]">
      <Canvas camera={{ position: [0, 0, 12], fov: 45 }}>
        <color attach="background" args={['#020305']} />
        <ambientLight intensity={0.1} />
        <directionalLight position={[10, 10, 5]} intensity={0.5} color="#ffffff" />
        <directionalLight position={[-10, -10, -5]} intensity={0.2} color="#4edea3" />
        
        <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
        
        <Earth />
        <CameraRig />
      </Canvas>
    </div>
  );
}
