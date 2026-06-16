import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Html, Billboard } from '@react-three/drei';
import { useTheaterStore } from '@/stores/useTheaterStore';
import { COLORS } from '@/constants/config';

export default function ConcessionStand() {
  const items = useTheaterStore((s) => s.concessionItems);
  const orders = useTheaterStore((s) => s.restockOrders);

  return (
    <group name="concession-stand" position={[0, 0, -10]}>
      <mesh position={[18, 0.05, 0]}>
        <boxGeometry args={[24, 0.1, 10]} />
        <meshStandardMaterial
          color="#1a1205"
          metalness={0.2}
          roughness={0.8}
        />
      </mesh>

      <mesh position={[18, 1, 3.5]} castShadow>
        <boxGeometry args={[22, 2, 2]} />
        <meshStandardMaterial
          color={COLORS.surfaceElevated}
          metalness={0.5}
          roughness={0.5}
        />
      </mesh>

      <mesh position={[18, 2.1, 3.48]}>
        <boxGeometry args={[22, 0.15, 0.08]} />
        <meshStandardMaterial
          color={COLORS.gold}
          metalness={0.9}
          roughness={0.1}
          emissive={COLORS.gold}
          emissiveIntensity={0.4}
        />
      </mesh>

      <group position={[18, 0, 0]}>
        {items.map((item, idx) => (
          <ShelfItem key={item.sku} item={item} index={idx} />
        ))}
      </group>

      <group position={[18, 4, 2]}>
        <mesh>
          <planeGeometry args={[16, 1]} />
          <meshBasicMaterial color={COLORS.background} transparent opacity={0.8} />
        </mesh>
        <Html center position={[0, 0, 0.01]}>
          <div className="text-center select-none">
            <div
              className="text-base font-bold tracking-wider"
              style={{
                color: COLORS.gold,
                textShadow: `0 0 12px ${COLORS.gold}`,
                fontFamily: 'Orbitron, monospace',
              }}
            >
              🍿 CONCESSION STAND 卖品区 🍿
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {orders.filter((o) => o.status === 'DELIVERING').length} 单配送中 ·{' '}
              {items.filter((i) => i.currentStock <= i.safetyStock).length} 项库存预警
            </div>
          </div>
        </Html>
      </group>
    </group>
  );
}

interface ItemProps {
  item: ReturnType<typeof useTheaterStore.getState>['concessionItems'][number];
  index: number;
}

function ShelfItem({ item, index }: ItemProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const setSelectedDetail = useTheaterStore((s) => s.setSelectedDetail);
  const selectedDetailId = useTheaterStore((s) => s.selectedDetailId);

  const isLow = item.currentStock <= item.safetyStock;
  const isDanger = item.currentStock <= item.dangerStock;
  const statusColor = isDanger
    ? COLORS.danger
    : isLow
    ? COLORS.warning
    : COLORS.success;

  useFrame((state) => {
    if (!meshRef.current) return;
    if (isLow) {
      const t = state.clock.getElapsedTime() * 2 + index * 0.5;
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = (isDanger ? 0.6 : 0.4) + Math.sin(t) * 0.25;
    }
  });

  const isSelected = selectedDetailId === item.sku;
  const x = 12 + (index % 4) * 2.2 - 18;
  const y = 0.8 + Math.floor(index / 4) * 0.9;
  const z = -10 + 10;

  return (
    <group
      position={[x, y, z]}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedDetail('CONCESSION', isSelected ? null : item.sku);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
      }}
    >
      <mesh position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[1.8, 0.04, 1]} />
        <meshStandardMaterial
          color="#2a1f0e"
          metalness={0.6}
          roughness={0.4}
        />
      </mesh>

      <mesh ref={meshRef} position={[0, 0.5, 0]}>
        <boxGeometry args={[1.5, 0.55, 0.75]} />
        <meshStandardMaterial
          color={COLORS.surface}
          metalness={0.4}
          roughness={0.5}
          emissive={statusColor}
          emissiveIntensity={isLow ? 0.4 : 0.05}
        />
      </mesh>

      <mesh position={[0, 0.72, 0.39]}>
        <planeGeometry args={[1.3, 0.22]} />
        <meshBasicMaterial
          color={isDanger ? '#300' : isLow ? '#332200' : '#002211'}
        />
      </mesh>

      <group position={[0, 1.4, 0]}>
        <Billboard>
          <Html center transform distanceFactor={10}>
            <div
              className="rounded-md px-1.5 py-1 text-center backdrop-blur-md border whitespace-nowrap"
              style={{
                background: 'rgba(10, 22, 40, 0.92)',
                borderColor: isSelected ? COLORS.success : statusColor,
                boxShadow: `0 0 12px ${statusColor}44`,
                minWidth: '100px',
              }}
            >
              <div className="text-[10px] font-bold text-slate-100 mb-0.5 truncate max-w-[110px]">
                {item.name}
              </div>
              <div className="flex items-center justify-center gap-1 text-[9px] mb-1">
                <span
                  className="px-1 py-0.5 rounded font-bold"
                  style={{
                    background: `${statusColor}22`,
                    color: statusColor,
                    border: `1px solid ${statusColor}55`,
                  }}
                >
                  库存 {item.currentStock}
                </span>
                <span className="text-slate-500">/ {item.safetyStock}</span>
              </div>
              <div className="h-1 rounded bg-slate-700 overflow-hidden">
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${Math.min(100, (item.currentStock / (item.safetyStock * 2)) * 100)}%`,
                    background: statusColor,
                    boxShadow: `0 0 4px ${statusColor}`,
                  }}
                />
              </div>
              <div className="text-[8px] text-amber-400 mt-1">
                ¥{item.unitPrice} · {item.sku}
              </div>
            </div>
          </Html>
        </Billboard>
      </group>
    </group>
  );
}
