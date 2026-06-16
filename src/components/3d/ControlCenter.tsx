import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useTheaterStore } from '@/stores/useTheaterStore';
import { COLORS } from '@/constants/config';

export default function ControlCenter() {
  const kpi = useTheaterStore((s) => s.kpiData);
  const alerts = useTheaterStore((s) => s.alerts);
  const activeAlerts = alerts.filter((a) => a.status !== 'RESOLVED').length;

  return (
    <group name="control-center" position={[0, 10, 8]}>
      <mesh position={[0, -0.02, 0]}>
        <boxGeometry args={[28, 0.04, 8]} />
        <meshStandardMaterial
          color="#0a0f1a"
          metalness={0.4}
          roughness={0.6}
        />
      </mesh>

      <mesh position={[0, 1.2, -3.6]}>
        <boxGeometry args={[26, 2.4, 0.5]} />
        <meshStandardMaterial
          color={COLORS.surface}
          metalness={0.5}
          roughness={0.4}
        />
      </mesh>

      <group position={[0, 1.2, -3.3]}>
        {Array.from({ length: 6 }).map((_, i) => (
          <mesh key={`screen-${i}`} position={[-10 + i * 4, 0, 0]}>
            <planeGeometry args={[3.5, 1.9]} />
            <meshStandardMaterial
              color="#001018"
              emissive={COLORS.primary}
              emissiveIntensity={0.25 + Math.sin(Date.now() * 0.001 + i) * 0.05}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>

      <ControlPanel position={[0, 0.7, 0]} />

      <group position={[0, 2.8, 0.5]}>
        <mesh>
          <planeGeometry args={[14, 1.1]} />
          <meshBasicMaterial color={COLORS.background} transparent opacity={0.9} />
        </mesh>
        <Html center position={[0, 0, 0.01]}>
          <div className="text-center select-none">
            <div
              className="text-sm font-bold tracking-[0.3em]"
              style={{
                color: COLORS.primary,
                textShadow: `0 0 18px ${COLORS.primary}`,
                fontFamily: 'Orbitron, monospace',
              }}
            >
              ◈ NERVE CENTER 总控指挥中心 ◈
            </div>
            <div className="flex items-center justify-center gap-4 mt-1 text-[10px]">
              <span style={{ color: COLORS.gold }}>
                💰 ¥{kpi.todayBoxOffice.toLocaleString()}
              </span>
              <span style={{ color: COLORS.success }}>
                👥 {kpi.todayFootfall.toLocaleString()}人次
              </span>
              <span
                style={{
                  color: activeAlerts > 5 ? COLORS.danger : COLORS.warning,
                }}
              >
                🚨 {activeAlerts}告警
              </span>
            </div>
          </div>
        </Html>
      </group>

      <mesh position={[0, 4.2, 0]}>
        <sphereGeometry args={[0.35, 24, 24]} />
        <meshStandardMaterial
          color={COLORS.primary}
          emissive={COLORS.primary}
          emissiveIntensity={1.2}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function ControlPanel({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity =
        0.35 + Math.sin(state.clock.getElapsedTime() * 1.5) * 0.1;
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef} position={[0, 0, 2]} castShadow>
        <boxGeometry args={[20, 0.9, 1.5]} />
        <meshStandardMaterial
          color="#0a1520"
          metalness={0.7}
          roughness={0.3}
          emissive={COLORS.primary}
          emissiveIntensity={0.3}
        />
      </mesh>

      {Array.from({ length: 8 }).map((_, i) => (
        <mesh
          key={`btn-${i}`}
          position={[-7.5 + i * 2.1, 0.5, 2.55]}
        >
          <boxGeometry args={[1.6, 0.08, 0.8]} />
          <meshStandardMaterial
            color={i % 3 === 0 ? COLORS.danger : i % 3 === 1 ? COLORS.warning : COLORS.success}
            emissive={i % 3 === 0 ? COLORS.danger : i % 3 === 1 ? COLORS.warning : COLORS.success}
            emissiveIntensity={0.6}
            toneMapped={false}
          />
        </mesh>
      ))}

      <group position={[0, 1.6, 3.5]}>
        <Billboard>
          <Html center transform distanceFactor={14}>
            <div
              className="grid grid-cols-4 gap-1.5 p-2 rounded-lg backdrop-blur-md border"
              style={{
                background: 'rgba(10, 22, 40, 0.9)',
                borderColor: COLORS.primary,
                boxShadow: `0 0 25px ${COLORS.primary}33`,
                minWidth: '340px',
              }}
            >
              {[
                { label: '今日票房', value: '¥' + (286580).toLocaleString(), color: COLORS.gold },
                { label: '观影人次', value: '6,842', color: COLORS.success },
                { label: '卖品收入', value: '¥82,340', color: COLORS.primary },
                { label: '平均上座', value: '68.5%', color: '#FF8C00' },
                { label: '昨日票房', value: '¥245,720', color: '#9D4EDD' },
                { label: 'VIP收入', value: '¥38,600', color: COLORS.vip },
                { label: '活跃告警', value: '7', color: COLORS.danger },
                { label: '设备状态', value: '正常', color: COLORS.success },
              ].map((k, i) => (
                <div
                  key={i}
                  className="px-1.5 py-1 rounded text-center"
                  style={{
                    background: `${k.color}11`,
                    border: `1px solid ${k.color}33`,
                  }}
                >
                  <div className="text-[8px] text-slate-400">{k.label}</div>
                  <div
                    className="text-[11px] font-bold"
                    style={{ color: k.color, textShadow: `0 0 6px ${k.color}88` }}
                  >
                    {k.value}
                  </div>
                </div>
              ))}
            </div>
          </Html>
        </Billboard>
      </group>
    </group>
  );
}
