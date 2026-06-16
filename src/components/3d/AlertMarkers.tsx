import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useTheaterStore } from '@/stores/useTheaterStore';
import { COLORS } from '@/constants/config';

const LEVEL_CONFIG: Record<string, { color: string; speed: number }> = {
  INFO: { color: COLORS.primary, speed: 1.5 },
  WARNING: { color: COLORS.warning, speed: 2.5 },
  CRITICAL: { color: COLORS.danger, speed: 4 },
};

export default function AlertMarkers() {
  const alerts = useTheaterStore((s) => s.alerts);
  const activeAlerts = alerts.filter((a) => a.status !== 'RESOLVED');

  return (
    <group name="alert-markers">
      {activeAlerts.map((alert) => (
        <AlertMarker
          key={alert.id}
          position={[
            alert.location3d.x,
            alert.location3d.y + (alert.type === 'DEVICE' ? 3 : 5),
            alert.location3d.z,
          ]}
          level={alert.level}
        />
      ))}
    </group>
  );
}

function AlertMarker({
  position,
  level,
}: {
  position: [number, number, number];
  level: 'INFO' | 'WARNING' | 'CRITICAL';
}) {
  const groupRef = useRef<THREE.Group>(null);
  const beamRef = useRef<THREE.Mesh>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  const config = LEVEL_CONFIG[level];

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * config.speed;
    if (groupRef.current) {
      groupRef.current.position.y =
        position[1] + Math.sin(t) * 0.4 + 0.5;
      groupRef.current.rotation.y += 0.02 * config.speed;
    }
    if (beamRef.current) {
      const mat = beamRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.3 + Math.abs(Math.sin(t)) * 0.35;
    }
    if (pulseRef.current) {
      const s = 1 + (Math.sin(t * 2) + 1) * 0.3;
      pulseRef.current.scale.set(s, s, s);
      const mat = pulseRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.6 - Math.abs(Math.sin(t * 2)) * 0.5;
    }
  });

  return (
    <group position={position}>
      <mesh ref={beamRef} position={[0, 3, 0]}>
        <cylinderGeometry args={[0.08, 0.3, 6, 16, 1, true]} />
        <meshBasicMaterial
          color={config.color}
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      <group ref={groupRef}>
        <mesh ref={pulseRef}>
          <sphereGeometry args={[0.45, 16, 16]} />
          <meshBasicMaterial
            color={config.color}
            transparent
            opacity={0.4}
            toneMapped={false}
            depthWrite={false}
          />
        </mesh>

        <mesh>
          <octahedronGeometry args={[0.28, 0]} />
          <meshStandardMaterial
            color={config.color}
            emissive={config.color}
            emissiveIntensity={1.5}
            toneMapped={false}
            metalness={0.5}
            roughness={0.3}
          />
        </mesh>

        <mesh position={[0, 0, 0.3]}>
          <ringGeometry args={[0.3, 0.35, 24]} />
          <meshBasicMaterial
            color={config.color}
            side={THREE.DoubleSide}
            transparent
            opacity={0.8}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
}
