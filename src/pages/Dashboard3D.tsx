import { useEffect } from 'react';
import TheaterScene from '../components/3d/TheaterScene';
import TopNavbar from '../components/ui/TopNavbar';
import BottomStatusBar from '../components/ui/BottomStatusBar';
import KPIDashboard from '../components/ui/KPIDashboard';
import HallDetailPanel from '../components/panels/HallDetailPanel';
import RightPanel from '../components/panels/RightPanel';
import SchedulingCenter from '../components/panels/SchedulingCenter';
import { useTheaterStore } from '../stores/useTheaterStore';

export default function Dashboard3D() {
  const initialize = useTheaterStore((s) => s.initialize);
  const startRealtimeSimulation = useTheaterStore((s) => s.startRealtimeSimulation);

  useEffect(() => {
    initialize();
    setTimeout(() => startRealtimeSimulation(), 1000);
    return () => {
      // cleanup
    };
  }, [initialize, startRealtimeSimulation]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-bg">
      <div className="absolute inset-0">
        <TheaterScene />
      </div>

      <TopNavbar />
      <HallDetailPanel />
      <RightPanel />
      <KPIDashboard />
      <BottomStatusBar />
      <SchedulingCenter />

      <div className="pointer-events-none fixed inset-0 scan-line opacity-20" />
    </div>
  );
}
