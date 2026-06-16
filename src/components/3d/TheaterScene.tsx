import { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, SMAA } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useTheaterStore } from '@/stores/useTheaterStore';
import TheaterBuilding from './TheaterBuilding';
import HallRow from './HallRow';
import TicketingLobby from './TicketingLobby';
import ConcessionStand from './ConcessionStand';
import VIPLounge from './VIPLounge';
import ProjectionRoom from './ProjectionRoom';
import ControlCenter from './ControlCenter';
import AlertMarkers from './AlertMarkers';
import DeliverySystem from './DeliverySystem';
import { COLORS } from '@/constants/config';

const AREA_CAMERA_CONFIG: Record<string, { target: [number, number, number]; offset: [number, number, number] }> = {
  HALLS: { target: [0, 3, 0], offset: [0, 18, 30] },
  TICKETING: { target: [0, 3, -14], offset: [0, 12, -2] },
  CONCESSION: { target: [0, 3, -10], offset: [0, 12, 2] },
  VIP: { target: [0, 5.5, 0], offset: [0, 12, 15] },
  PROJECTION: { target: [0, 3, 18], offset: [0, 12, 6] },
  CONTROL: { target: [0, 10, 8], offset: [0, 15, 20] },
  DEFAULT: { target: [0, 3, 0], offset: [0, 22, 45] },
};

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[120, 90]} />
      <meshStandardMaterial
        color={COLORS.surface}
        metalness={0.3}
        roughness={0.8}
      />
      <gridHelper args={[120, 60, COLORS.border, COLORS.border]} position={[0, 0.01, 0]} />
    </mesh>
  );
}

function TheaterLighting() {
  return (
    <>
      <ambientLight intensity={0.25} color="#8BA3C0" />
      <directionalLight
        position={[20, 30, 15]}
        intensity={0.6}
        color="#E8F4FD"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />
      <pointLight position={[-20, 8, -15]} intensity={0.8} color={COLORS.primary} distance={30} />
      <pointLight position={[15, 8, -10]} intensity={0.6} color={COLORS.gold} distance={25} />
      <pointLight position={[0, 10, 10]} intensity={0.5} color="#FFFFFF" distance={35} />
      <spotLight
        position={[0, 18, 0]}
        angle={0.6}
        penumbra={0.5}
        intensity={0.8}
        color={COLORS.primaryDim}
        target-position={[0, 0, 0]}
      />
    </>
  );
}

function AutoRotateRig() {
  const cameraMode = useTheaterStore((s) => s.cameraMode);
  const focusArea = useTheaterStore((s) => s.focusArea);
  const setFocusArea = useTheaterStore((s) => s.setFocusArea);
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();

  const targetPos = useMemo(() => new THREE.Vector3(), []);
  const targetLookAt = useMemo(() => new THREE.Vector3(), []);
  const animatingRef = useRef(false);

  useEffect(() => {
    if (!controlsRef.current) return;

    const configKey = focusArea || 'DEFAULT';
    const config = AREA_CAMERA_CONFIG[configKey] || AREA_CAMERA_CONFIG.DEFAULT;

    targetLookAt.set(config.target[0], config.target[1], config.target[2]);
    targetPos.set(
      config.target[0] + config.offset[0],
      config.target[1] + config.offset[1],
      config.target[2] + config.offset[2]
    );
    animatingRef.current = true;
  }, [focusArea, targetPos, targetLookAt]);

  useFrame((_, delta) => {
    if (!controlsRef.current) return;

    if (cameraMode === 'AUTO_ROTATE' && !animatingRef.current) {
      controlsRef.current.autoRotate = true;
      controlsRef.current.autoRotateSpeed = 0.5;
    } else {
      controlsRef.current.autoRotate = false;
    }

    if (animatingRef.current) {
      camera.position.lerp(targetPos, 0.05);
      controlsRef.current.target.lerp(targetLookAt, 0.05);
      controlsRef.current.update();

      const distToTarget = camera.position.distanceTo(targetPos);
      const distToLookAt = controlsRef.current.target.distanceTo(targetLookAt);
      if (distToTarget < 0.1 && distToLookAt < 0.1) {
        animatingRef.current = false;
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={cameraMode !== 'FIRST_PERSON'}
      maxPolarAngle={Math.PI / 2.1}
      minDistance={10}
      maxDistance={80}
      target={[0, 3, 0]}
      onEnd={() => {
        if (animatingRef.current) return;
        if (focusArea) setFocusArea(null);
      }}
    />
  );
}

function SceneRoot() {
  const initialized = useTheaterStore((s: any) => s.initialized);

  return (
    <>
      <TheaterLighting />
      <Stars radius={150} depth={60} count={3000} factor={4} fade speed={0.5} />
      <fog attach="fog" args={[COLORS.background, 40, 120]} />
      <Ground />
      {initialized && (
        <>
          <TheaterBuilding />
          <HallRow />
          <TicketingLobby />
          <ConcessionStand />
          <VIPLounge />
          <ProjectionRoom />
          <ControlCenter />
          <AlertMarkers />
          <DeliverySystem />
        </>
      )}
      <EffectComposer multisampling={0}>
        <Bloom
          intensity={0.6}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
        <Vignette eskil={false} offset={0.3} darkness={0.7} />
        <SMAA />
      </EffectComposer>
      <AutoRotateRig />
    </>
  );
}

export default function TheaterScene() {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 28, 35], fov: 50, near: 0.1, far: 500 }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.1,
        powerPreference: 'high-performance',
      }}
      dpr={[1, 2]}
      style={{ background: COLORS.background }}
    >
      <SceneRoot />
    </Canvas>
  );
}
