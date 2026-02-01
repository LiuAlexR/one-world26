"use client";
import { useState, useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { PreparedZip, TooltipInfo } from "./types";
import { DROP_HEIGHT, DROP_DURATION, springEase } from "./geometry";

// ─── ZipMesh ─────────────────────────────────────────────────────────────────
export function ZipMesh({
  prepared,
  onHover,
  onUnhover,
}: {
  prepared: PreparedZip;
  onHover: (info: TooltipInfo) => void;
  onUnhover: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const elapsedRef = useRef(0);

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: prepared.color,
        emissive: prepared.color,
        emissiveIntensity: 0.15,
        roughness: 0.6,
        metalness: 0.1,
      }),
    [prepared.color],
  );

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    // Drop animation
    elapsedRef.current += delta;
    const t = elapsedRef.current - prepared.delay;
    let y: number;
    if (t < 0) y = DROP_HEIGHT;
    else if (t < DROP_DURATION) y = DROP_HEIGHT * (1 - springEase(t));
    else y = 0;
    meshRef.current.position.y = y;

    // Hover glow
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    const target = hovered ? 0.6 : 0.15;
    mat.emissiveIntensity += (target - mat.emissiveIntensity) * 0.1;
  });

  return (
    <mesh
      ref={meshRef}
      geometry={prepared.geometry}
      material={material}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, DROP_HEIGHT, 0]}
      onPointerEnter={(e) => {
        setHovered(true);
        onHover({
          zip: prepared.zip,
          energyValue: prepared.energyValue,
          percentError: prepared.percentError,
          screenX: e.clientX,
          screenY: e.clientY,
        });
      }}
      onPointerMove={(e) => {
        onHover({
          zip: prepared.zip,
          energyValue: prepared.energyValue,
          percentError: prepared.percentError,
          screenX: e.clientX,
          screenY: e.clientY,
        });
      }}
      onPointerLeave={() => {
        setHovered(false);
        onUnhover();
      }}
    />
  );
}

// ─── ZipEdges ────────────────────────────────────────────────────────────────
export function ZipEdges({ prepared }: { prepared: PreparedZip }) {
  const ref = useRef<THREE.LineSegments>(null);
  const elapsedRef = useRef(0);

  const edgesGeo = useMemo(
    () => new THREE.EdgesGeometry(prepared.geometry, 15),
    [prepared.geometry],
  );
  const mat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: "#ffffff",
        transparent: true,
        opacity: 0.2,
      }),
    [],
  );

  useFrame((_, delta) => {
    if (!ref.current) return;
    elapsedRef.current += delta;
    const t = elapsedRef.current - prepared.delay;
    let y: number;
    if (t < 0) y = DROP_HEIGHT;
    else if (t < DROP_DURATION) y = DROP_HEIGHT * (1 - springEase(t));
    else y = 0;
    ref.current.position.y = y;
  });

  return (
    <lineSegments
      ref={ref}
      geometry={edgesGeo}
      material={mat}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, DROP_HEIGHT, 0]}
    />
  );
}
