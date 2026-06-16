import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Sparkles,
  BarChart3,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useTheaterStore } from '@/stores/useTheaterStore';
import { COLORS, SCHEDULING, HEAT_COLOR_MAP } from '@/constants/config';
import { cn, formatTime, heatLevelToColor } from '@/utils';
import ScheduleHeatmap from '../charts/ScheduleHeatmap';

export default function SchedulingCenter() {
  const [isOpen, setIsOpen] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState<'A' | 'B' | 'C'>('A');
  const halls = useTheaterStore((s) => s.halls);
  const showtimes = useTheaterStore((s) => s.showtimes);
  const conflicts = useTheaterStore((s) => s.schedulingConflicts);
  const adjustSchedulingConflict = useTheaterStore((s) => s.adjustSchedulingConflict);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => setGenerating(false), 2500);
  };

  const schemes = [
    { id: 'A', name: '票房最优', revenue: 32.8, occupancy: 76.5, color: COLORS.gold },
    { id: 'B', name: '均衡方案', revenue: 30.2, occupancy: 72.3, color: COLORS.primary },
    { id: 'C', name: '场次最多', revenue: 28.5, occupancy: 68.9, color: COLORS.success },
  ];

  const currentScheme = schemes.find((s) => s.id === selectedScheme)!;

  if (!isOpen) {
    return (
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-25 glass px-5 py-2.5 rounded-xl flex items-center gap-2 border-primary/40 hover:border-primary/60 transition-colors"
      >
        <Calendar className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-text">智能排片中心</span>
      </motion.button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 500, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 500, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 250 }}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-25 w-[900px] max-h-[500px] glass rounded-2xl border-border/60 flex flex-col overflow-hidden"
      >
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${COLORS.primary}22, ${COLORS.vip}22)`,
                border: `1px solid ${COLORS.primary}44`,
              }}
            >
              <Sparkles className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-primary text-glow">
                智能排片中心
              </h3>
              <p className="text-[10px] text-text-secondary">
                遗传算法优化 · 节假日预测 · 24小时上座率预测
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 rounded-lg bg-bg-elevated/50 border border-border/50">
              {schemes.map((scheme) => (
                <button
                  key={scheme.id}
                  onClick={() => setSelectedScheme(scheme.id as 'A' | 'B' | 'C')}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-[10px] font-medium transition-all',
                    selectedScheme === scheme.id
                      ? 'text-white shadow-glow'
                      : 'text-text-secondary hover:text-text'
                  )}
                  style={{
                    background: selectedScheme === scheme.id ? scheme.color : 'transparent',
                    boxShadow: selectedScheme === scheme.id ? `0 0 12px ${scheme.color}66` : 'none',
                  }}
                >
                  方案{scheme.id} · {scheme.name}
                </button>
              ))}
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-4 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-primary to-vip text-white hover:shadow-glow transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', generating && 'animate-spin')} />
              {generating ? '计算中...' : '重新生成'}
            </button>

            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg hover:bg-bg-elevated/50 text-text-secondary hover:text-text transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-3 border-b border-border/30 grid grid-cols-4 gap-2.5 bg-bg-surface/30">
          <SchemeStat
            label="预期总票房"
            value={`¥${currentScheme.revenue.toFixed(1)}万`}
            icon={<BarChart3 className="w-3.5 h-3.5" />}
            color={currentScheme.color}
          />
          <SchemeStat
            label="平均上座率"
            value={`${currentScheme.occupancy}%`}
            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
            color={COLORS.success}
          />
          <SchemeStat
            label="总场次"
            value={showtimes.length.toString()}
            icon={<Calendar className="w-3.5 h-3.5" />}
            color={COLORS.primary}
          />
          <SchemeStat
            label="场次冲突"
            value={conflicts.length.toString()}
            icon={<AlertTriangle className="w-3.5 h-3.5" />}
            color={conflicts.length > 0 ? COLORS.danger : COLORS.success}
          />
        </div>

        <div className="flex-1 overflow-hidden flex flex-col p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-medium text-text flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary" />
              排片热力图 · 方案{selectedScheme}
            </h4>
            <div className="flex items-center gap-1 text-[9px] text-text-secondary">
              <span className="w-16 h-1.5 rounded heat-gradient" />
              <span className="text-[9px]">低 → 高热度</span>
            </div>
          </div>
          <ScheduleHeatmap halls={halls} showtimes={showtimes} height={160} />

          {conflicts.length > 0 && (
            <div className="mt-2 p-2.5 rounded-xl bg-warning/5 border border-warning/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <span className="text-xs font-medium text-text">
                    检测到 {conflicts.length} 个场次间隔低于 {SCHEDULING.MIN_GAP_MINUTES} 分钟
                  </span>
                </div>
                <button
                  onClick={() => {
                    conflicts.forEach((c) => !c.notified && adjustSchedulingConflict(c.id));
                  }}
                  className="px-3 py-1 rounded-lg text-[10px] font-medium bg-primary/15 text-primary border border-primary/40 hover:bg-primary/25 transition-colors"
                >
                  一键自动调整
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function SchemeStat({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div
      className="p-2.5 rounded-xl flex items-center gap-2.5"
      style={{ background: `${color}11`, border: `1px solid ${color}22` }}
    >
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}22` }}
      >
        <div style={{ color }}>{icon}</div>
      </div>
      <div>
        <div className="text-[9px] text-text-secondary">{label}</div>
        <div
          className="text-sm font-bold leading-tight"
          style={{ color, textShadow: `0 0 6px ${color}66` }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}
