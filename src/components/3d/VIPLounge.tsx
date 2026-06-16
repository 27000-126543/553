import { Html, Billboard } from '@react-three/drei';
import { useTheaterStore } from '@/stores/useTheaterStore';
import { COLORS } from '@/constants/config';

const LEVEL_COLORS: Record<string, string> = {
  GOLD: '#FFD700',
  PLATINUM: '#E5E4E2',
  DIAMOND: '#B9F2FF',
};

export default function VIPLounge() {
  const rooms = useTheaterStore((s) => s.vipRooms);

  return (
    <group name="vip-lounge" position={[0, 5.5, 0]}>
      <mesh position={[0, -0.02, 8]}>
        <boxGeometry args={[48, 0.04, 8]} />
        <meshStandardMaterial
          color="#1a0a2a"
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>

      <mesh position={[0, 1, 8]}>
        <boxGeometry args={[46, 2, 7]} />
        <meshStandardMaterial
          color="#2a1a4a"
          metalness={0.4}
          roughness={0.55}
          transparent
          opacity={0.2}
        />
      </mesh>

      {rooms.map((room, idx) => (
        <VIPRoomUnit key={room.id} room={room} index={idx} />
      ))}

      <group position={[0, 2.8, 11.5]}>
        <mesh>
          <planeGeometry args={[18, 0.9]} />
          <meshBasicMaterial color={COLORS.background} transparent opacity={0.85} />
        </mesh>
        <Html center position={[0, 0, 0.01]}>
          <div className="text-center select-none">
            <div
              className="text-base font-bold tracking-widest"
              style={{
                color: COLORS.vip,
                textShadow: `0 0 15px ${COLORS.vip}`,
                fontFamily: 'Orbitron, monospace',
              }}
            >
              ✦ VIP LOUNGE 尊享休息室 ✦
            </div>
            <div className="text-[10px] text-purple-300/70 mt-0.5">
              {rooms.filter((r) => r.status === 'IN_USE').length} 使用中 ·{' '}
              {rooms.filter((r) => r.status === 'RESERVED').length} 已预定
            </div>
          </div>
        </Html>
      </group>
    </group>
  );
}

interface RoomProps {
  room: ReturnType<typeof useTheaterStore.getState>['vipRooms'][number];
  index: number;
}

function VIPRoomUnit({ room, index }: RoomProps) {
  const statusColors: Record<string, { bg: string; border: string; text: string }> = {
    IDLE: { bg: '#0F2137', border: COLORS.textMuted, text: COLORS.textMuted },
    IN_USE: { bg: '#2a0a2a', border: COLORS.vip, text: COLORS.vip },
    RESERVED: { bg: '#2a2200', border: COLORS.gold, text: COLORS.gold },
  };
  const c = statusColors[room.status];
  const x = -15 + index * 6;
  const levelColor = room.customerLevel ? LEVEL_COLORS[room.customerLevel] : null;

  return (
    <group position={[x, 0, room.position.z - 0 + 8]}>
      <mesh position={[0, 0.8, 0]} castShadow>
        <boxGeometry args={[4.5, 1.6, 4]} />
        <meshStandardMaterial
          color={c.bg}
          metalness={0.5}
          roughness={0.45}
          emissive={room.status === 'IN_USE' ? COLORS.vip : room.status === 'RESERVED' ? COLORS.gold : '#000'}
          emissiveIntensity={room.status === 'IDLE' ? 0 : 0.18}
        />
      </mesh>

      <mesh position={[0, 0.8, 2.02]}>
        <boxGeometry args={[4.3, 1.55, 0.04]} />
        <meshStandardMaterial
          color={COLORS.surfaceElevated}
          metalness={0.8}
          roughness={0.2}
          transparent
          opacity={0.5}
          emissive={c.border}
          emissiveIntensity={0.2}
        />
      </mesh>

      {levelColor && (
        <mesh position={[0, 1.65, 0]}>
          <torusGeometry args={[0.25, 0.04, 8, 24]} />
          <meshStandardMaterial
            color={levelColor}
            emissive={levelColor}
            emissiveIntensity={1}
            toneMapped={false}
          />
        </mesh>
      )}

      <group position={[0, 2.3, 0]}>
        <Billboard>
          <Html center transform distanceFactor={11}>
            <div
              className="rounded-lg px-2 py-1.5 text-center backdrop-blur-md border whitespace-nowrap"
              style={{
                background: 'rgba(10, 22, 40, 0.92)',
                borderColor: c.border,
                boxShadow: `0 0 14px ${c.border}33`,
                minWidth: '110px',
              }}
            >
              <div
                className="text-[10px] font-bold mb-1"
                style={{ color: c.text, textShadow: `0 0 6px ${c.border}88` }}
              >
                💎 {room.name}
              </div>
              <div
                className="text-[9px] px-1.5 py-0.5 rounded inline-block"
                style={{
                  background: `${c.border}22`,
                  color: c.text,
                  border: `1px solid ${c.border}55`,
                }}
              >
                {room.status === 'IDLE' && '空闲'}
                {room.status === 'IN_USE' && '使用中'}
                {room.status === 'RESERVED' && '已预定'}
              </div>
              {room.customerName && (
                <div className="text-[9px] text-slate-300 mt-1">
                  👤 {room.customerName}
                  {room.customerLevel && (
                    <span
                      className="ml-1"
                      style={{ color: LEVEL_COLORS[room.customerLevel] }}
                    >
                      [{room.customerLevel}]
                    </span>
                  )}
                </div>
              )}
              {room.remainingMinutes > 0 && (
                <div className="text-[8px] text-cyan-400 mt-0.5">
                  剩余 {room.remainingMinutes} 分钟
                </div>
              )}
            </div>
          </Html>
        </Billboard>
      </group>
    </group>
  );
}
