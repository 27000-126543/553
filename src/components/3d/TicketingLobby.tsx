import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useTheaterStore } from '@/stores/useTheaterStore';
import {
  COLORS,
  TICKET_MACHINE_STATUS_LABELS,
  QUEUE_THRESHOLD,
} from '@/constants/config';
import { useTheaterStore as _ts } from '@/stores/useTheaterStore';

export default function TicketingLobby() {
  const ticketMachines = useTheaterStore((s) => s.ticketMachines);
  const counterWindows = useTheaterStore((s) => s.counterWindows);
  const openCounterWindow = useTheaterStore((s) => s.openCounterWindow);

  return (
    <group name="ticketing-lobby" position={[0, 0, -14]}>
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[50, 0.1, 10]} />
        <meshStandardMaterial
          color={COLORS.surfaceElevated}
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>

      <group position={[0, 0, 0]}>
        {ticketMachines.map((machine, idx) => (
          <TicketMachineUnit
            key={machine.id}
            machine={machine}
            index={idx}
          />
        ))}
      </group>

      <group position={[0, 0, 1]}>
        {counterWindows.map((cw, idx) => (
          <CounterWindowUnit
            key={cw.id}
            window={cw}
            index={idx}
            onOpen={() => openCounterWindow(cw.id)}
          />
        ))}
      </group>

      <group position={[0, 3.8, -4]}>
        <mesh>
          <planeGeometry args={[20, 1.2]} />
          <meshBasicMaterial
            color={COLORS.background}
            transparent
            opacity={0.8}
          />
        </mesh>
        <Html center position={[0, 0, 0.01]}>
          <div className="text-center select-none">
            <div
              className="text-lg font-bold tracking-widest"
              style={{
                color: COLORS.primary,
                textShadow: `0 0 15px ${COLORS.primary}`,
                fontFamily: 'Orbitron, monospace',
              }}
            >
              ◈ TICKETING HALL 售票大厅 ◈
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              自助取票 · 人工窗口 · 会员服务
            </div>
          </div>
        </Html>
      </group>
    </group>
  );
}

interface MachineProps {
  machine: ReturnType<typeof _ts.getState>['ticketMachines'][number];
  index: number;
}

function TicketMachineUnit({ machine, index }: MachineProps) {
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const hasAlert = machine.queueLength >= QUEUE_THRESHOLD.WARNING;
  const setSelectedDetail = useTheaterStore((s) => s.setSelectedDetail);
  const selectedDetailId = useTheaterStore((s) => s.selectedDetailId);

  useFrame((state) => {
    if (!meshRef.current) return;
    if (hasAlert) {
      const pulse = 1 + Math.sin(state.clock.getElapsedTime() * 4) * 0.04;
      meshRef.current.scale.set(pulse, pulse, pulse);
    } else if (hovered) {
      meshRef.current.scale.lerp(new THREE.Vector3(1.05, 1.05, 1.05), 0.1);
    } else {
      meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
    }
  });

  const isSelected = selectedDetailId === machine.id;
  const statusColor = TICKET_MACHINE_STATUS_LABELS[machine.status].color;
  const bodyColor = hasAlert ? COLORS.danger : statusColor;

  return (
    <group
      ref={meshRef}
      position={[machine.position.x + 22, 0, machine.position.z + 14]}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedDetail('MACHINE', isSelected ? null : machine.id);
      }}
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
      <mesh position={[0, 0.9, 0]} castShadow>
        <boxGeometry args={[1.6, 1.8, 0.8]} />
        <meshStandardMaterial
          color={COLORS.surfaceElevated}
          metalness={0.75}
          roughness={0.25}
          emissive={bodyColor}
          emissiveIntensity={hasAlert ? 0.45 : 0.12}
        />
      </mesh>

      <mesh position={[0, 1.3, 0.41]}>
        <boxGeometry args={[1.1, 0.65, 0.02]} />
        <meshStandardMaterial
          color={machine.status === 'FAULT' ? '#1a0000' : '#001a1a'}
          emissive={bodyColor}
          emissiveIntensity={machine.status === 'ONLINE' ? 0.8 : 0.2}
        />
      </mesh>

      <mesh position={[0, 0.55, 0.41]}>
        <cylinderGeometry args={[0.18, 0.18, 0.12, 24]} />
        <meshStandardMaterial
          color={COLORS.border}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      <mesh position={[0, 1.88, 0]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial
          color={bodyColor}
          toneMapped={false}
          transparent
          opacity={0.9}
        />
      </mesh>

      <group position={[0, 2.4, 0]}>
        <Billboard>
          <Html center transform distanceFactor={10}>
            <div
              className="rounded-md px-2 py-1.5 text-center backdrop-blur-md border whitespace-nowrap"
              style={{
                background: 'rgba(10, 22, 40, 0.92)',
                borderColor: hasAlert ? COLORS.danger : isSelected ? COLORS.success : bodyColor,
                boxShadow: `0 0 15px ${hasAlert ? 'rgba(255,59,92,0.3)' : isSelected ? 'rgba(0,255,163,0.25)' : `${bodyColor}33`}`,
              }}
            >
              <div
                className="text-[10px] font-bold mb-1"
                style={{ color: bodyColor }}
              >
                取票机 #{String(index + 1).padStart(2, '0')}
              </div>
              <div className="flex items-center justify-center gap-2 text-[9px]">
                <span
                  className="px-1.5 py-0.5 rounded"
                  style={{
                    background: `${statusColor}22`,
                    color: statusColor,
                    border: `1px solid ${statusColor}55`,
                  }}
                >
                  {TICKET_MACHINE_STATUS_LABELS[machine.status].label}
                </span>
              </div>
              <div
                className="mt-1.5 text-[9px] font-bold"
                style={{
                  color: hasAlert ? COLORS.danger : COLORS.textSecondary,
                }}
              >
                👥 排队: {machine.queueLength}人
                {hasAlert && (
                  <span className="ml-1 animate-pulse">⚠️</span>
                )}
              </div>
              <div className="text-[8px] text-slate-500 mt-0.5">
                纸张: {machine.paperRemaining}%
              </div>
            </div>
          </Html>
        </Billboard>
      </group>

      {machine.queueLength > 0 && (
        <group position={[0, 0.1, -1.2]}>
          {Array.from({ length: Math.min(machine.queueLength, 6) }).map((_, i) => (
            <mesh key={i} position={[0, 0.4 + i * 0.02, -i * 0.4]}>
              <capsuleGeometry args={[0.15, 0.5, 4, 8]} />
              <meshStandardMaterial
                color={i === 0 ? COLORS.primary : COLORS.textSecondary}
                transparent
                opacity={0.6}
              />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

interface WindowProps {
  window: ReturnType<typeof _ts.getState>['counterWindows'][number];
  index: number;
  onOpen: () => void;
}

function CounterWindowUnit({ window: cw, index, onOpen }: WindowProps) {
  const [hovered, setHovered] = useState(false);
  const needsOpen = useTheaterStore(
    (s) =>
      s.ticketMachines.some((m) => m.queueLength >= QUEUE_THRESHOLD.WARNING) &&
      !cw.open
  );

  return (
    <group
      position={[cw.position.x + 8, 0, cw.position.z + 13]}
      onClick={(e) => {
        e.stopPropagation();
        if (!cw.open && needsOpen) onOpen();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        if ((!cw.open && needsOpen) || cw.open)
          document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
    >
      <mesh position={[0, 1.1, 0]} castShadow>
        <boxGeometry args={[2, 2.2, 0.6]} />
        <meshStandardMaterial
          color={COLORS.surfaceElevated}
          metalness={0.5}
          roughness={0.5}
        />
      </mesh>

      <mesh position={[0, 1.5, 0.31]}>
        <planeGeometry args={[1.6, 0.8]} />
        <meshStandardMaterial
          color={cw.open ? '#002a1a' : '#2a1a00'}
          emissive={cw.open ? COLORS.success : needsOpen ? COLORS.warning : COLORS.textMuted}
          emissiveIntensity={cw.open ? 0.5 : needsOpen && hovered ? 0.6 : 0.2}
        />
      </mesh>

      <group position={[0, 2.8, 0]}>
        <Billboard>
          <Html center transform distanceFactor={12}>
            <div
              className="rounded-md px-2 py-1.5 text-center backdrop-blur-md border"
              style={{
                background: 'rgba(10, 22, 40, 0.9)',
                borderColor: cw.open
                  ? COLORS.success
                  : needsOpen
                  ? COLORS.warning
                  : COLORS.border,
                minWidth: '90px',
              }}
            >
              <div
                className="text-[10px] font-bold"
                style={{
                  color: cw.open
                    ? COLORS.success
                    : needsOpen
                    ? COLORS.warning
                    : COLORS.textMuted,
                }}
              >
                {cw.name}
              </div>
              <div
                className="text-[9px] mt-0.5"
                style={{
                  color: cw.open
                    ? COLORS.textSecondary
                    : COLORS.textMuted,
                }}
              >
                {cw.open
                  ? `服务中 · ${cw.queueLength}人`
                  : needsOpen
                  ? hovered
                    ? '🖱️ 点击启用'
                    : '⚠️ 建议开启'
                  : '关闭'}
              </div>
            </div>
          </Html>
        </Billboard>
      </group>
    </group>
  );
}
