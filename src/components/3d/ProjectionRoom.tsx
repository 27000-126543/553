import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useTheaterStore } from '@/stores/useTheaterStore';
import { COLORS } from '@/constants/config';

export default function ProjectionRoom() {
  const projectors = useTheaterStore((s) => s.projectors);

  return (
    <group name="projection-room" position={[0, 0, 18]}>
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[56, 0.1, 8]} />
        <meshStandardMaterial
          color="#0a1a0a"
          metalness={0.2}
          roughness={0.8}
        />
      </mesh>

      <mesh position={[0, 1.5, 3.8]}>
        <boxGeometry args={[54, 3, 0.4]} />
        <meshStandardMaterial
          color={COLORS.surfaceElevated}
          metalness={0.5}
          roughness={0.5}
        />
      </mesh>

      {projectors.map((p, idx) => (
        <ProjectorUnit key={p.id} projector={p} index={idx} />
      ))}

      <group position={[0, 3.8, 0]}>
        <mesh>
          <planeGeometry args={[16, 0.9]} />
          <meshBasicMaterial color={COLORS.background} transparent opacity={0.85} />
        </mesh>
        <Html center position={[0, 0, 0.01]}>
          <div className="text-center select-none">
            <div
              className="text-base font-bold tracking-widest"
              style={{
                color: '#00FFA3',
                textShadow: '0 0 15px #00FFA3',
                fontFamily: 'Orbitron, monospace',
              }}
            >
              ⚙ PROJECTION BOOTH 放映机房 ⚙
            </div>
            <div className="text-[10px] text-emerald-300/70 mt-0.5">
              {projectors.filter((p) => p.status === 'RUNNING').length} 运行 ·{' '}
              {projectors.filter((p) => p.status === 'FAULT').length} 故障
            </div>
          </div>
        </Html>
      </group>
    </group>
  );
}

interface ProjProps {
  projector: ReturnType<typeof useTheaterStore.getState>['projectors'][number];
  index: number;
}

function ProjectorUnit({ projector, index }: ProjProps) {
  const fanRef = useRef<THREE.Mesh>(null);
  const lensRef = useRef<THREE.Mesh>(null);

  const statusInfo = {
    RUNNING: { color: COLORS.success, label: '运行' },
    STANDBY: { color: COLORS.warning, label: '待机' },
    FAULT: { color: COLORS.danger, label: '故障' },
  }[projector.status];

  const lampPercent = (projector.lampHours / projector.lampMaxHours) * 100;
  const lampWarn = lampPercent > 85;
  const overTemp = projector.temperature > 40;

  useFrame((state, delta) => {
    if (fanRef.current && projector.status === 'RUNNING') {
      fanRef.current.rotation.z += delta * 25;
    }
    if (lensRef.current && projector.status === 'RUNNING') {
      const t = state.clock.getElapsedTime();
      (lensRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        2 + Math.sin(t * 3) * 0.5;
    }
  });

  const x = -20 + index * 8;

  return (
    <group position={[x, projector.position.y + 1.2, 0]}>
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[5, 1.8, 2.5]} />
        <meshStandardMaterial
          color="#151520"
          metalness={0.75}
          roughness={0.3}
          emissive={statusInfo.color}
          emissiveIntensity={projector.status === 'FAULT' ? 0.25 : 0.06}
        />
      </mesh>

      <mesh ref={lensRef} position={[0, 0, 1.35]}>
        <cylinderGeometry args={[0.55, 0.7, 0.4, 32]} />
        <meshStandardMaterial
          color="#0a0a0a"
          metalness={0.9}
          roughness={0.1}
          emissive={projector.status === 'FAULT' ? COLORS.danger : statusInfo.color}
          emissiveIntensity={projector.status === 'RUNNING' ? 2 : 0.3}
          toneMapped={false}
        />
      </mesh>

      <mesh position={[-1.8, 0.7, -1.1]}>
        <cylinderGeometry args={[0.12, 0.12, 0.08, 16]} />
        <meshBasicMaterial
          color={statusInfo.color}
          toneMapped={false}
          transparent
          opacity={0.95}
        />
      </mesh>

      <mesh ref={fanRef} position={[1.8, 0, -1.1]}>
        <boxGeometry args={[0.8, 0.04, 0.8]} />
        <meshStandardMaterial
          color={COLORS.textSecondary}
          metalness={0.6}
          roughness={0.4}
        />
      </mesh>

      <group position={[0, 1.8, -0.3]}>
        <Billboard>
          <Html center transform distanceFactor={11}>
            <div
              className="rounded-lg px-2 py-1.5 text-center backdrop-blur-md border whitespace-nowrap"
              style={{
                background: 'rgba(10, 22, 40, 0.92)',
                borderColor: statusInfo.color,
                boxShadow: `0 0 14px ${statusInfo.color}33`,
                minWidth: '130px',
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className="text-[10px] font-bold"
                  style={{ color: statusInfo.color }}
                >
                  🎥 {projector.name}
                </span>
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded"
                  style={{
                    background: `${statusInfo.color}22`,
                    color: statusInfo.color,
                    border: `1px solid ${statusInfo.color}55`,
                  }}
                >
                  {statusInfo.label}
                </span>
              </div>

              <div className="text-[9px] text-slate-400 space-y-0.5 text-left">
                <div className="flex justify-between">
                  <span>🌡 温度:</span>
                  <span style={{ color: overTemp ? COLORS.danger : COLORS.text }}>
                    {projector.temperature}°C
                  </span>
                </div>
                <div>
                  <div className="flex justify-between mb-0.5">
                    <span>💡 氙灯:</span>
                    <span
                      style={{
                        color: lampWarn ? COLORS.warning : COLORS.text,
                      }}
                    >
                      {projector.lampHours}/{projector.lampMaxHours}h
                    </span>
                  </div>
                  <div className="h-1 rounded bg-slate-700 overflow-hidden">
                    <div
                      className="h-full"
                      style={{
                        width: `${lampPercent}%`,
                        background: lampWarn ? COLORS.warning : COLORS.success,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Html>
        </Billboard>
      </group>

      {projector.status === 'RUNNING' && (
        <mesh position={[0, 0, 4]} rotation={[-Math.PI / 2.3, 0, 0]}>
          <coneGeometry args={[2, 6, 32, 1, true]} />
          <meshBasicMaterial
            color={COLORS.primary}
            transparent
            opacity={0.06}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}
