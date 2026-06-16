import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import type { Hall } from '@/types';
import { useTheaterStore } from '@/stores/useTheaterStore';
import {
  COLORS,
  HEAT_COLOR_MAP,
  HALL_TYPE_LABELS,
  AC_STATUS_LABELS,
} from '@/constants/config';
import { cn } from '@/utils';

interface Props {
  hall: Hall;
  index: number;
}

export default function HallUnit({ hall, index }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const realtime = useTheaterStore((s) => s.hallRealtimeMap[hall.id]);
  const selectedHallId = useTheaterStore((s) => s.selectedHallId);
  const setSelectedHall = useTheaterStore((s) => s.setSelectedHall);
  const setSelectedDetail = useTheaterStore((s) => s.setSelectedDetail);
  const showtimes = useTheaterStore((s) =>
    s.showtimes.filter((st) => st.hallId === hall.id)
  );

  const isSelected = selectedHallId === hall.id;

  const occupancy = realtime?.occupancyRate || 0;
  const heatLevel = useMemo(() => {
    if (occupancy < 30) return 1;
    if (occupancy < 50) return 2;
    if (occupancy < 70) return 3;
    if (occupancy < 85) return 4;
    return 5;
  }, [occupancy]);

  const hallColor = hall.type === 'IMAX' ? '#9D4EDD' : hall.type === 'DOLBY' ? '#00D4FF' : hall.type === 'LUXE' ? '#FFD700' : COLORS.border;

  useFrame((state) => {
    if (!groupRef.current) return;
    const targetScale = hovered || isSelected ? 1.02 : 1;
    groupRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      0.1
    );
    const glow =
      state.clock.getElapsedTime() * 0.8 + index * 0.3;
    const glowIntensity = 0.4 + Math.sin(glow) * 0.15;
    groupRef.current.userData.glowIntensity = isSelected ? glowIntensity + 0.3 : glowIntensity * (hovered ? 1.5 : 1);
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    setSelectedHall(isSelected ? null : hall.id);
    setSelectedDetail('HALL', isSelected ? null : hall.id);
  };

  const nextShowtime = showtimes
    .filter((s) => s.startTime.getTime() > Date.now())
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())[0];

  return (
    <group
      ref={groupRef}
      position={[hall.position.x, hall.position.y + 0.01, hall.position.z]}
      rotation={[0, hall.rotation, 0]}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
    >
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[7, 3, 7]} />
        <meshStandardMaterial
          color={hallColor}
          metalness={0.55}
          roughness={0.45}
          transparent
          opacity={0.35}
          emissive={isSelected ? HEAT_COLOR_MAP[heatLevel] : COLORS.primary}
          emissiveIntensity={isSelected ? 0.25 : 0.08}
        />
      </mesh>

      <mesh position={[0, 1.5, -3.48]}>
        <boxGeometry args={[6.8, 2.9, 0.04]} />
        <meshStandardMaterial
          color={COLORS.surfaceElevated}
          metalness={0.8}
          roughness={0.2}
          transparent
          opacity={0.85}
          emissive={HEAT_COLOR_MAP[heatLevel]}
          emissiveIntensity={0.15}
        />
      </mesh>

      <mesh position={[0, 0.9, -3.45]}>
        <boxGeometry args={[1.2, 1.8, 0.08]} />
        <meshStandardMaterial
          color={isSelected ? COLORS.success : COLORS.primaryDim}
          metalness={0.6}
          roughness={0.3}
          emissive={isSelected ? COLORS.success : COLORS.primary}
          emissiveIntensity={0.6}
        />
      </mesh>

      <group position={[0, 2.3, -3.4]}>
        <mesh>
          <planeGeometry args={[6, 0.5]} />
          <meshBasicMaterial color={COLORS.background} transparent opacity={0.85} />
        </mesh>
        <Html center transform distanceFactor={8} position={[0, 0, 0.01]}>
          <div className="whitespace-nowrap text-center select-none">
            <div
              className={cn(
                'text-[11px] font-bold leading-tight',
                isSelected ? 'text-emerald-300' : 'text-cyan-300'
              )}
              style={{
                textShadow: '0 0 8px currentColor',
                fontFamily: 'Orbitron, monospace',
              }}
            >
              HALL {hall.number} · {HALL_TYPE_LABELS[hall.type]}
            </div>
            <div
              className="text-[9px] mt-0.5"
              style={{ color: HEAT_COLOR_MAP[heatLevel] }}
            >
              上座 {occupancy}%
            </div>
          </div>
        </Html>
      </group>

      {realtime && (
        <group position={[0, 3.6, 0]}>
          <Billboard follow lockX={false} lockY={false} position={[0, 0, 0]}>
            <Html center transform distanceFactor={12} zIndexRange={[0, 0]}>
              <div
                className="rounded-lg p-2 backdrop-blur-md border whitespace-nowrap select-none"
                style={{
                  background: 'rgba(10, 22, 40, 0.9)',
                  borderColor: isSelected ? COLORS.success : COLORS.primary,
                  boxShadow: `0 0 20px ${isSelected ? 'rgba(0,255,163,0.25)' : 'rgba(0,212,255,0.2)'}`,
                  minWidth: '180px',
                }}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-bold text-cyan-300">
                    {hall.number}号厅实时
                  </span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                    style={{
                      background: `${HEAT_COLOR_MAP[heatLevel]}22`,
                      color: HEAT_COLOR_MAP[heatLevel],
                      border: `1px solid ${HEAT_COLOR_MAP[heatLevel]}66`,
                    }}
                  >
                    {occupancy}%
                  </span>
                </div>
                {realtime.currentMovie && (
                  <div className="text-[10px] text-slate-200 mb-1 truncate max-w-[170px]">
                    🎬 {realtime.currentMovie.title}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-1 text-[9px]">
                  <div className="flex items-center gap-1 text-slate-400">
                    <span>🌡️</span>
                    <span style={{ color: AC_STATUS_LABELS[realtime.acStatus].color }}>
                      {realtime.temperature}°C
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400">
                    <span>💧</span>
                    <span className="text-slate-200">{realtime.humidity}%</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400">
                    <span>🪑</span>
                    <span className="text-slate-200">
                      {realtime.occupiedSeats}/{hall.totalSeats}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400">
                    <span>❄️</span>
                    <span style={{ color: AC_STATUS_LABELS[realtime.acStatus].color }}>
                      {AC_STATUS_LABELS[realtime.acStatus].label}
                    </span>
                  </div>
                </div>
                {nextShowtime && (
                  <div
                    className="mt-1.5 pt-1.5 border-t border-slate-700/50 text-[9px] text-amber-300"
                  >
                    下一场: {nextShowtime.movie.title.slice(0, 8)} ·{' '}
                    {nextShowtime.startTime.toLocaleTimeString('zh-CN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                )}
              </div>
            </Html>
          </Billboard>
        </group>
      )}

      <mesh position={[0, 0.05, 0]}>
        <ringGeometry args={[3.6, 3.8, 48]} />
        <meshBasicMaterial
          color={isSelected ? COLORS.success : HEAT_COLOR_MAP[heatLevel]}
          transparent
          opacity={isSelected ? 0.8 : 0.4 + (hovered ? 0.3 : 0)}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
