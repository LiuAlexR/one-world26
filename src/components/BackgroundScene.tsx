import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type ShapeDef = {
  id: number;
  position: [number, number, number];
  size: number;
  shapeType: number;
  color: string;
  speed: number;
};

function FloatingShape({
  id,
  position,
  size,
  shapeType,
  color,
  speed,
  hoveredId,
  setHoveredId,
}: ShapeDef & {
  hoveredId: number | null;
  setHoveredId: (id: number | null) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const isHovered = hoveredId === id;

  useFrame((state) => {
    if (!meshRef.current) return;

    // local motion
    meshRef.current.rotation.x = state.clock.elapsedTime * speed * 0.3;
    meshRef.current.rotation.y = state.clock.elapsedTime * speed * 0.2;
    meshRef.current.rotation.z = state.clock.elapsedTime * speed * 0.15;

    meshRef.current.position.x = position[0] + Math.sin(state.clock.elapsedTime * speed * 0.5) * 1;
    meshRef.current.position.y = position[1] + Math.cos(state.clock.elapsedTime * speed * 0.3) * 1;
    meshRef.current.position.z = position[2] + Math.sin(state.clock.elapsedTime * speed * 0.4) * 0.5;
  });

  return (
    <mesh
      ref={meshRef}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHoveredId(id);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHoveredId(null);
      }}
    >
      {shapeType === 0 && <boxGeometry args={[size, size, size]} />}
      {shapeType === 1 && <octahedronGeometry args={[size, 0]} />}
      {shapeType === 2 && <tetrahedronGeometry args={[size, 0]} />}
      {shapeType === 3 && <icosahedronGeometry args={[size, 0]} />}
      {shapeType === 4 && <torusGeometry args={[size * 0.6, size * 0.2, 8, 16]} />}
      {shapeType === 5 && <coneGeometry args={[size * 0.7, size * 1.4, 8]} />}

      <meshBasicMaterial
        color={isHovered ? "#7AA7FF" : color}
        opacity={isHovered ? 0.9 : 0.4}
        transparent
        wireframe
        depthWrite={false}
      />
    </mesh>
  );
}

function RandomShapes({
  scrollY,
  hoveredId,
  setHoveredId,
}: {
  scrollY: number;
  hoveredId: number | null;
  setHoveredId: (id: number | null) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);

  const shapes = useMemo<ShapeDef[]>(() => {
    const colors = ["#ffffff", "#e5e7eb", "#d1d5db", "#9ca3af"];
    const count = 40;

    return Array.from({ length: count }, (_, i) => {
      const x = (Math.random() - 0.5) * 40;
      const y = (Math.random() - 0.5) * 50;
      const z = -5 + (Math.random() - 0.5) * 30;
      const size = 0.5 + Math.random() * 2;
      const shapeType = Math.floor(Math.random() * 6);
      const color = colors[Math.floor(Math.random() * colors.length)];
      const speed = 0.3 + Math.random() * 0.7;

      return { id: i, position: [x, y, z], size, shapeType, color, speed };
    });
  }, []);

    useFrame(() => {
    if (!groupRef.current) return;

    groupRef.current.position.y = -scrollY * 0.01;
    // no global rotation — let individual shapes float
    groupRef.current.rotation.set(0, 0, 0);
    });


  return (
    <group ref={groupRef}>
      {shapes.map((s) => (
        <FloatingShape key={s.id} {...s} hoveredId={hoveredId} setHoveredId={setHoveredId} />
      ))}
    </group>
  );
}

function DottedLines({ scrollY }: { scrollY: number }) {
  const linesRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!linesRef.current) return;
    linesRef.current.position.y = -scrollY * 0.005;
  });

  const lines = useMemo(() => {
    const lineCount = 30;
    const colors = ["#ffffff", "#d1d5db", "#9ca3af"];

    return Array.from({ length: lineCount }, (_, i) => {
      const startX = (Math.random() - 0.5) * 30;
      const startY = (Math.random() - 0.5) * 40;
      const startZ = -5 + (Math.random() - 0.5) * 25;

      const endX = startX + (Math.random() - 0.5) * 10;
      const endY = startY + (Math.random() - 0.5) * 10;
      const endZ = startZ + (Math.random() - 0.5) * 8;

      const dotCount = 15;
      const positions: number[] = [];
      for (let j = 0; j < dotCount; j++) {
        const t = j / (dotCount - 1);
        positions.push(
          startX + (endX - startX) * t,
          startY + (endY - startY) * t,
          startZ + (endZ - startZ) * t
        );
      }

      return (
        <points key={i}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={positions.length / 3}
              array={new Float32Array(positions)}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.15}
            color={colors[Math.floor(Math.random() * colors.length)]}
            opacity={0.6}
            transparent
            depthWrite={false}
          />
        </points>
      );
    });
  }, []);

  return <group ref={linesRef}>{lines}</group>;
}

function ParticleField({ scrollY }: { scrollY: number }) {
  const particlesRef = useRef<THREE.Points>(null);

  const particles = useMemo(() => {
    const count = 200;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    return positions;
  }, []);

  useFrame((state) => {
    if (!particlesRef.current) return;
    particlesRef.current.rotation.y = state.clock.elapsedTime * 0.01;
    particlesRef.current.position.y = -scrollY * 0.008;
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={particles.length / 3} array={particles} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.1} color="#ffffff" opacity={0.5} transparent sizeAttenuation depthWrite={false} />
    </points>
  );
}

export default function BackgroundScene({ scrollY }: { scrollY: number }) {
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  return (
    <group>
      <RandomShapes scrollY={scrollY} hoveredId={hoveredId} setHoveredId={setHoveredId} />
      <DottedLines scrollY={scrollY} />
      <ParticleField scrollY={scrollY} />
    </group>
  );
}
