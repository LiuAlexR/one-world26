import React, { Suspense, useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment } from "@react-three/drei";
import * as THREE from "three";

import BackgroundScene from "./BackgroundScene";

type WorldProps = { scrollY: number };

function ArtisticInkTrail() {
  const { camera, pointer, raycaster } = useThree();

  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  const target = useRef(new THREE.Vector3());
  const smoothed = useRef(new THREE.Vector3(0, 0, 0));
  const prev = useRef(new THREE.Vector3(0, 0, 0));
  const hasPrev = useRef(false);

  const cursorRef = useRef<THREE.Mesh>(null);
  const geomRef = useRef<THREE.BufferGeometry>(null);

  const MAX = 260;
  const LIFE = 0.65;
  const positions = useMemo(() => new Float32Array(MAX * 3), []);
  const ages = useMemo(() => new Float32Array(MAX), []);
  const vels = useMemo(() => new Float32Array(MAX * 2), []);
  const head = useRef(0);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: 0.2 }, // ✅ pixels. try 14–26
        uOpacity: { value: 0.95 },
        uColor: { value: new THREE.Color("#ffffff") },
      },
      vertexShader: `
        uniform float uSize;
        attribute float aAge;
        attribute vec2 aVel;
        varying float vAge;
        varying vec2 vVel;

        void main() {
          vAge = aAge;
          vVel = aVel;

          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

          float speed = length(aVel);
          float grow = clamp(speed * 1.6, 0.0, 3.2);

          float life = clamp(1.0 - aAge, 0.0, 1.0);
          float size = uSize * (1.0 + grow) * (0.35 + 0.65 * life);

          gl_PointSize = size * (300.0 / max(1.0, -mvPosition.z));
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uOpacity;
        uniform vec3 uColor;
        varying float vAge;
        varying vec2 vVel;

        float hash(vec2 p){
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        void main() {
          vec2 p = gl_PointCoord * 2.0 - 1.0;

          float speed = length(vVel);
          float ang = atan(vVel.y, vVel.x);
          float c = cos(ang);
          float s = sin(ang);
          mat2 R = mat2(c, -s, s, c);

          float stretch = 1.0 + clamp(speed * 1.2, 0.0, 2.5); // ✅ less smear
          vec2 pr = R * p;
          pr.x /= stretch;

          float r2 = dot(pr, pr);
          float blob = exp(-r2 * 3.8); // ✅ tighter blobs

          float n = hash(gl_PointCoord * 42.0 + uTime * 0.2);
          blob *= smoothstep(0.02, 1.0, blob + (n - 0.5) * 0.16);

          float life = clamp(1.0 - vAge, 0.0, 1.0);
          float alpha = blob * life * uOpacity;

          if(alpha < 0.01) discard;
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
    });
  }, []);

  useLayoutEffect(() => {
    const g = geomRef.current;
    if (!g) return;

    for (let i = 0; i < MAX; i++) {
      positions[i * 3 + 0] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
      ages[i] = 1.0;
      vels[i * 2 + 0] = 0;
      vels[i * 2 + 1] = 0;
    }

    const posAttr = new THREE.BufferAttribute(positions, 3);
    posAttr.setUsage(THREE.DynamicDrawUsage);
    g.setAttribute("position", posAttr);

    const ageAttr = new THREE.BufferAttribute(ages, 1);
    ageAttr.setUsage(THREE.DynamicDrawUsage);
    g.setAttribute("aAge", ageAttr);

    const velAttr = new THREE.BufferAttribute(vels, 2);
    velAttr.setUsage(THREE.DynamicDrawUsage);
    g.setAttribute("aVel", velAttr);
  }, [ages, positions, vels]);

  useFrame((state, dt) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;

    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.ray.intersectPlane(plane, target.current);
    if (!hit) return;

    smoothed.current.lerp(target.current, 0.35);
    if (cursorRef.current) cursorRef.current.position.copy(smoothed.current);

    const da = dt / LIFE;
    for (let i = 0; i < MAX; i++) ages[i] = Math.min(1.0, ages[i] + da);

    if (!hasPrev.current) {
      prev.current.copy(smoothed.current);
      hasPrev.current = true;
      return;
    }

    const dist = smoothed.current.distanceTo(prev.current);
    const spacing = 0.10;
    const steps = Math.min(40, Math.ceil(dist / spacing));

    const vx = (smoothed.current.x - prev.current.x) / Math.max(1e-4, dt);
    const vy = (smoothed.current.y - prev.current.y) / Math.max(1e-4, dt);

    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const i = head.current;

      positions[i * 3 + 0] = THREE.MathUtils.lerp(prev.current.x, smoothed.current.x, t);
      positions[i * 3 + 1] = THREE.MathUtils.lerp(prev.current.y, smoothed.current.y, t);
      positions[i * 3 + 2] = 0;

      ages[i] = 0.0;
      vels[i * 2 + 0] = vx * 0.02;
      vels[i * 2 + 1] = vy * 0.02;

      head.current = (head.current + 1) % MAX;
    }

    prev.current.copy(smoothed.current);

    const g = geomRef.current;
    if (g) {
      (g.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;
      (g.getAttribute("aAge") as THREE.BufferAttribute).needsUpdate = true;
      (g.getAttribute("aVel") as THREE.BufferAttribute).needsUpdate = true;
    }
  });

  return (
    <group>
      <points frustumCulled={false}>
        <bufferGeometry ref={geomRef} />
        <primitive object={material} attach="material" />
      </points>

      <mesh ref={cursorRef}>
        <sphereGeometry args={[0.08, 18, 18]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.85} depthWrite={false} />
      </mesh>
    </group>
  );
}

function World({ scrollY }: WorldProps) {
  // Optional: remove even this if you want absolutely no global motion
  const worldRef = useRef<THREE.Group | null>(null);

  useFrame((state) => {
    if (!worldRef.current) return;
    const x = state.pointer.x * 0.06;
    const y = state.pointer.y * 0.06;
    worldRef.current.rotation.x = THREE.MathUtils.lerp(worldRef.current.rotation.x, y, 0.05);
    worldRef.current.rotation.z = THREE.MathUtils.lerp(worldRef.current.rotation.z, -x, 0.05);
  });

  return (
    <group ref={worldRef}>
      <BackgroundScene scrollY={scrollY} />
    </group>
  );
}

export default function HeroScene({ scrollY }: { scrollY: number }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        background: "radial-gradient(circle at 30% 30%, #1a1a1a 0%, #000000 100%)",
      }}
    >
      <Canvas
        eventSource={document.body}
        eventPrefix="client"
        camera={{ position: [0, 0, 20], fov: 55 }}
        gl={{ alpha: true, antialias: true, premultipliedAlpha: true }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.15;
        }}
      >
        <Suspense fallback={null}>
          <fog attach="fog" args={["#03040A", 18, 70]} />

          <ambientLight intensity={0.22} />
          <directionalLight position={[3, 6, 4]} intensity={1.1} />
          <directionalLight position={[0, 2, -8]} intensity={0.5} />

          <Environment preset="night" environmentIntensity={0.85} />

          <World scrollY={scrollY} />
          <ArtisticInkTrail />

          <ContactShadows position={[0, -5, 0]} opacity={0.2} scale={25} blur={3} far={18} />
        </Suspense>
      </Canvas>
    </div>
  );
}
