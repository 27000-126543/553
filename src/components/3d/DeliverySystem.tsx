import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { useTheaterStore } from '@/stores/useTheaterStore';
import { COLORS } from '@/constants/config';

export default function DeliverySystem() {
  const orders = useTheaterStore((s) => s.restockOrders);
  const delivering = orders.filter((o) => o.status === 'DELIVERING' && o.delivery);

  return (
    <group name="delivery-system">
      {delivering.map((order) =>
        order.delivery ? (
          <DeliveryPath
            key={order.id}
            points={order.delivery.path}
            progress={order.delivery.progress}
          />
        ) : null
      )}
    </group>
  );
}

function DeliveryPath({
  points,
  progress,
}: {
  points: { x: number; y: number; z: number }[];
  progress: number;
}) {
  const vanRef = useRef<THREE.Group>(null);
  const pathRef = useRef<any>(null);
  const flowRef = useRef<any>(null);

  const curve = useMemo(() => {
    const vec3Points = points.map(
      (p) => new THREE.Vector3(p.x, p.y + 0.3, p.z)
    );
    return new THREE.CatmullRomCurve3(vec3Points, false, 'catmullrom', 0.5);
  }, [points]);

  const lineGeometry = useMemo(() => {
    const pts = curve.getPoints(100);
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    return geo;
  }, [curve]);

  const flowPositions = useMemo(() => {
    const pts = curve.getPoints(100);
    return new Float32Array(pts.flatMap((p) => [p.x, p.y + 0.02, p.z]));
  }, [curve]);

  useFrame((state) => {
    if (vanRef.current) {
      const t = Math.min(1, progress);
      const pos = curve.getPointAt(t);
      vanRef.current.position.copy(pos);

      if (t < 1) {
        const tangent = curve.getTangentAt(t).normalize();
        const angle = Math.atan2(tangent.x, tangent.z);
        vanRef.current.rotation.y = angle;
      }
    }

    if (flowRef.current) {
      const geo = flowRef.current.geometry as THREE.BufferGeometry;
      const attr = geo.getAttribute('lineDistance') as THREE.BufferAttribute;
      if (attr) {
        const offset = (state.clock.getElapsedTime() * 0.3) % 1;
        (attr as any).needsUpdate = true;
        for (let i = 0; i < attr.count; i++) {
          attr.setX(i, ((i / attr.count) + offset) % 1);
        }
      }
    }
  });

  const linePoints = useMemo(() => {
    return curve.getPoints(100).map(p => [p.x, p.y, p.z] as [number, number, number]);
  }, [curve]);

  return (
    <group>
      <Line
        ref={pathRef as any}
        points={linePoints}
        color={COLORS.primary}
        transparent
        opacity={0.5}
        lineWidth={3}
      />

      <FlowLine curve={curve} flowRef={flowRef} />

      <group ref={vanRef}>
        <mesh position={[0, 0.35, 0]} castShadow>
          <boxGeometry args={[0.9, 0.5, 1.6]} />
          <meshStandardMaterial
            color={COLORS.primary}
            metalness={0.6}
            roughness={0.35}
            emissive={COLORS.primary}
            emissiveIntensity={0.35}
          />
        </mesh>
        <mesh position={[0, 0.75, -0.25]} castShadow>
          <boxGeometry args={[0.8, 0.4, 0.8]} />
          <meshStandardMaterial
            color="#ffffff"
            metalness={0.5}
            roughness={0.3}
          />
        </mesh>
        <mesh position={[0, 0.75, -0.55]}>
          <planeGeometry args={[0.7, 0.35]} />
          <meshStandardMaterial
            color="#003344"
            emissive={COLORS.primary}
            emissiveIntensity={0.3}
            transparent
            opacity={0.7}
          />
        </mesh>
        {[
          [-0.35, 0.12, 0.55],
          [0.35, 0.12, 0.55],
          [-0.35, 0.12, -0.45],
          [0.35, 0.12, -0.45],
        ].map((p, i) => (
          <mesh key={`wheel-${i}`} position={p as [number, number, number]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.14, 0.14, 0.1, 20]} />
            <meshStandardMaterial color="#111" metalness={0.8} roughness={0.4} />
          </mesh>
        ))}
        <mesh position={[0, 0.36, 0.81]}>
          <boxGeometry args={[0.7, 0.3, 0.02]} />
          <meshStandardMaterial
            color={COLORS.primary}
            emissive={COLORS.primary}
            emissiveIntensity={1.5}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
}

function FlowLine({
  curve,
  flowRef,
}: {
  curve: THREE.CatmullRomCurve3;
  flowRef: React.MutableRefObject<any>;
}) {
  const lineRef = useRef<any>(null);
  const [time, setTime] = useFrameForTime();

  const dashPoints = useMemo(() => {
    const allPts: [number, number, number][] = [];
    const segments = 100;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const p = curve.getPointAt(t);
      allPts.push([p.x, p.y + 0.05, p.z]);
    }
    return allPts;
  }, [curve]);

  const dashSize = 0.5;
  const gapSize = 0.5;
  const dashOffset = -time * 0.8;

  return (
    <Line
      ref={lineRef as any}
      points={dashPoints}
      color={COLORS.success}
      dashed
      dashSize={dashSize}
      gapSize={gapSize}
      dashOffset={dashOffset}
      transparent
      opacity={0.85}
      lineWidth={4}
    />
  );
}

function useFrameForTime() {
  const [time, setTime] = React.useState(0);
  useFrame((_, delta) => {
    setTime((t) => t + delta);
  });
  return [time, setTime] as const;
}
