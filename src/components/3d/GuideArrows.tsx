import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useTheaterStore } from '@/stores/useTheaterStore';
import { COLORS } from '@/constants/config';

export default function GuideArrows() {
  const guidePaths = useTheaterStore((s) => s.guidePaths);
  const activePaths = guidePaths.filter((p) => p.active);

  if (activePaths.length === 0) return null;

  return (
    <group name="guide-arrows">
      {activePaths.map((path) => (
        <GuideArrow key={path.id} points={path.points} />
      ))}
    </group>
  );
}

function GuideArrow({ points }: { points: { x: number; y: number; z: number }[] }) {
  const groupRef = useRef<THREE.Group>(null);
  const flowRef = useRef<THREE.InstancedMesh>(null);
  const arrowCount = 8;
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const curve = useMemo(() => {
    const vec3Points = points.map(
      (p) => new THREE.Vector3(p.x, p.y + 0.5, p.z)
    );
    return new THREE.CatmullRomCurve3(vec3Points, false, 'catmullrom', 0.3);
  }, [points]);

  const tubeGeometry = useMemo(() => {
    return new THREE.TubeGeometry(curve, 64, 0.04, 8, false);
  }, [curve]);

  useFrame((state) => {
    if (!flowRef.current) return;
    const t = (state.clock.getElapsedTime() * 0.4) % 1;

    for (let i = 0; i < arrowCount; i++) {
      const offset = (i / arrowCount + t) % 1;
      const pos = curve.getPointAt(offset);
      const tangent = curve.getTangentAt(offset).normalize();
      const angle = Math.atan2(tangent.x, tangent.z);

      dummy.position.copy(pos);
      dummy.rotation.y = angle;
      dummy.rotation.x = -Math.PI / 2;
      dummy.updateMatrix();

      flowRef.current.setMatrixAt(i, dummy.matrix);
    }
    flowRef.current.instanceMatrix.needsUpdate = true;
  });

  const arrowGeometry = useMemo(
    () => new THREE.ConeGeometry(0.15, 0.4, 6),
    []
  );

  return (
    <group ref={groupRef}>
      <mesh geometry={tubeGeometry}>
        <meshBasicMaterial
          color={COLORS.success}
          transparent
          opacity={0.35}
          toneMapped={false}
        />
      </mesh>

      <instancedMesh
        ref={flowRef}
        args={[arrowGeometry, undefined, arrowCount]}
        frustumCulled={false}
      >
        <meshBasicMaterial
          color={COLORS.success}
          toneMapped={false}
          transparent
          opacity={0.9}
        />
      </instancedMesh>

      <mesh geometry={tubeGeometry}>
        <meshBasicMaterial
          color={COLORS.success}
          transparent
          opacity={0.15}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
