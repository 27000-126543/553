import { COLORS } from '@/constants/config';

export default function TheaterBuilding() {
  return (
    <group name="theater-building">
      <mesh position={[0, 2.5, -2]} castShadow receiveShadow>
        <boxGeometry args={[56, 5, 36]} />
        <meshStandardMaterial
          color={COLORS.surface}
          metalness={0.4}
          roughness={0.5}
          transparent
          opacity={0.25}
        />
      </mesh>

      <mesh position={[0, 5.25, 8]} castShadow>
        <boxGeometry args={[54, 0.5, 12]} />
        <meshStandardMaterial
          color={COLORS.surfaceElevated}
          metalness={0.5}
          roughness={0.4}
          transparent
          opacity={0.4}
        />
      </mesh>

      <mesh position={[0, 7.75, 8]} castShadow>
        <boxGeometry args={[30, 4.5, 10]} />
        <meshStandardMaterial
          color={COLORS.primaryDim}
          metalness={0.3}
          roughness={0.35}
          transparent
          opacity={0.2}
          emissive={COLORS.primary}
          emissiveIntensity={0.15}
        />
      </mesh>

      {[[-28, 2.5, -2], [28, 2.5, -2], [0, 2.5, -20]].map((pos, i) => (
        <mesh key={`pillar-${i}`} position={pos as [number, number, number]} castShadow>
          <boxGeometry args={[0.8, 5, 0.8]} />
          <meshStandardMaterial
            color={COLORS.border}
            metalness={0.7}
            roughness={0.3}
            emissive={COLORS.primary}
            emissiveIntensity={0.08}
          />
        </mesh>
      ))}

      <mesh position={[0, 0.15, -18]}>
        <boxGeometry args={[50, 0.3, 10]} />
        <meshStandardMaterial
          color={COLORS.surfaceElevated}
          metalness={0.5}
          roughness={0.6}
        />
      </mesh>

      <group position={[0, 5.3, -2]}>
        {Array.from({ length: 12 }).map((_, i) => (
          <mesh key={`neon-${i}`} position={[-24 + i * 4.36, 0, -17.8]}>
            <boxGeometry args={[3.5, 0.12, 0.05]} />
            <meshStandardMaterial
              color={COLORS.primary}
              emissive={COLORS.primary}
              emissiveIntensity={i % 2 === 0 ? 1.5 : 0.8}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}
