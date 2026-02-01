"use client";
import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { ZipMesh, ZipEdges } from "./ZipMesh";
import type { PreparedZip, TooltipInfo } from "./types";

// ─── Camera reset ────────────────────────────────────────────────────────────
function CameraSetup({ trigger }: { trigger: number }) {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 70, 65);
    camera.lookAt(0, 0, 0);
  }, [camera, trigger]);
  return null;
}

// ─── Scene ───────────────────────────────────────────────────────────────────
export default function Scene({
  zips,
  sceneKey,
  onHover,
  onUnhover,
}: {
  zips: PreparedZip[];
  sceneKey: number; // changes → remount → drop animation replays
  onHover: (info: TooltipInfo) => void;
  onUnhover: () => void;
}) {
  return (
    <>
      <CameraSetup trigger={sceneKey} />
      <OrbitControls
        target={[0, 0, 0]}
        maxPolarAngle={Math.PI}
        minDistance={20}
        maxDistance={200}
      />

      <ambientLight intensity={0.4} />
      <directionalLight position={[30, 80, 60]} intensity={0.8} />
      <pointLight position={[-40, 50, -40]} intensity={0.3} color="#6688cc" />

      {/* Key forces full remount when anything that affects geometry changes */}
      <group key={sceneKey}>
        {zips.map((z) => (
          <group key={z.id}>
            <ZipMesh prepared={z} onHover={onHover} onUnhover={onUnhover} />
            <ZipEdges prepared={z} />
          </group>
        ))}
      </group>
    </>
  );
}
