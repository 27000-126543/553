import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  MapPin,
  Layers,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useTheaterStore } from '@/stores/useTheaterStore';
import { COLORS } from '@/constants/config';
import { cn } from '@/utils';

export default function BottomStatusBar() {
  const simulating = useTheaterStore((s) => s.simulationIntervalId !== null);
  const startRealtimeSimulation = useTheaterStore((s) => s.startRealtimeSimulation);
  const stopRealtimeSimulation = useTheaterStore((s) => s.stopRealtimeSimulation);
  const currentRoute = useTheaterStore((s) => s.currentRoute);
  const setCurrentRoute = useTheaterStore((s) => s.setCurrentRoute);
  const focusArea = useTheaterStore((s) => s.focusArea);
  const setFocusArea = useTheaterStore((s) => s.setFocusArea);
  const cameraMode = useTheaterStore((s) => s.cameraMode);

  const areaList = [
    { id: 'HALLS', label: '影厅区' },
    { id: 'TICKETING', label: '售票大厅' },
    { id: 'CONCESSION', label: '卖品区' },
    { id: 'VIP', label: 'VIP区' },
    { id: 'PROJECTION', label: '放映机房' },
    { id: 'CONTROL', label: '总控中心' },
  ] as const;

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="fixed bottom-4 left-4 z-30 flex items-center gap-2"
    >
      <div className="glass rounded-xl px-3 py-2 flex items-center gap-2 border-border/60">
        <button
          onClick={() => (simulating ? stopRealtimeSimulation() : startRealtimeSimulation())}
          className={cn(
            'p-2 rounded-lg transition-all flex items-center gap-1.5 text-xs font-medium',
            simulating
              ? 'bg-success/15 text-success border border-success/40 hover:bg-success/25'
              : 'bg-primary/15 text-primary border border-primary/40 hover:bg-primary/25'
          )}
        >
          {simulating ? (
            <>
              <Pause className="w-4 h-4" />
              暂停模拟
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              实时模拟
            </>
          )}
        </button>

        <button
          onClick={() => {
            setFocusArea(null);
            setCurrentRoute('DASHBOARD');
          }}
          className="p-2 rounded-lg bg-bg-elevated/50 text-text-secondary hover:text-text hover:bg-bg-elevated transition-colors"
          title="复位视角"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-border/50 mx-1" />

        <div className="flex items-center gap-1">
          {areaList.map((area) => (
            <button
              key={area.id}
              onClick={() => {
                if (focusArea === area.id) {
                  setFocusArea(null);
                  setCurrentRoute('DASHBOARD');
                } else {
                  setFocusArea(area.id);
                  setCurrentRoute(area.id);
                }
              }}
              className={cn(
                'px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all flex items-center gap-1',
                focusArea === area.id || currentRoute === area.id
                  ? 'bg-primary/15 text-primary border border-primary/40'
                  : 'text-text-secondary hover:text-text hover:bg-bg-elevated/50'
              )}
            >
              <MapPin className="w-3 h-3" />
              {area.label}
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-border/50 mx-1" />

        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-bg-elevated/30">
          <Layers className="w-3.5 h-3.5 text-text-muted" />
          <span className="text-[10px] text-text-secondary">
            相机: <span style={{ color: COLORS.primary }}>
              {cameraMode === 'ORBIT' ? '环绕' : cameraMode === 'FIRST_PERSON' ? '漫游' : '巡游'}
            </span>
          </span>
        </div>
      </div>

      <AnimatePresence>
        {simulating && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="glass rounded-xl px-3 py-2 flex items-center gap-2 border-success/40 bg-success/5"
          >
            <div className="relative w-2 h-2">
              <div
                className="absolute inset-0 rounded-full bg-success animate-ping"
                style={{ opacity: 0.5 }}
              />
              <div className="absolute inset-0 rounded-full bg-success" />
            </div>
            <span className="text-[11px] font-medium text-success">
              实时数据流已连接
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
