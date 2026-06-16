import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
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
import GuideArrows from './GuideArrows';
import { COLORS } from '@/constants/config';

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
  const controlsRef = useRef<any>(null);

  useFrame((_, delta) => {
    if (cameraMode === 'AUTO_ROTATE' && controlsRef.current) {
      controlsRef.current.autoRotate = true;
      controlsRef.current.autoRotateSpeed = 0.5;
    } else if (controlsRef.current) {
      controlsRef.current.autoRotate = false;
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
          <GuideArrows />
        </>
      )}
      <EffectComposer multisampling={0} enableNormalPass={false}>
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
