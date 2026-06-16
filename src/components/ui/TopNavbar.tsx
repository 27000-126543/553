import { motion } from 'framer-motion';
import {
  Map,
  Clapperboard,
  ShoppingBag,
  Crown,
  Server,
  MonitorSmartphone,
  AlertTriangle,
  Settings,
  Bell,
  RefreshCw,
  Maximize2,
} from 'lucide-react';
import { useTheaterStore } from '@/stores/useTheaterStore';
import { COLORS, AREA_LABELS } from '@/constants/config';
import { cn } from '@/utils';

const NAV_ITEMS = [
  { id: 'DASHBOARD', icon: Map, label: '总览' },
  { id: 'HALLS', icon: Clapperboard, label: '影厅' },
  { id: 'TICKETING', icon: MonitorSmartphone, label: '售票' },
  { id: 'CONCESSION', icon: ShoppingBag, label: '卖品' },
  { id: 'VIP', icon: Crown, label: 'VIP' },
  { id: 'PROJECTION', icon: Server, label: '放映' },
  { id: 'CONTROL', icon: MonitorSmartphone, label: '总控' },
];

export default function TopNavbar() {
  const currentRoute = useTheaterStore((s) => s.currentRoute);
  const setCurrentRoute = useTheaterStore((s) => s.setCurrentRoute);
  const kpi = useTheaterStore((s) => s.kpiData);
  const activeAlerts = useTheaterStore((s) =>
    s.alerts.filter((a) => a.status !== 'RESOLVED').length
  );
  const cameraMode = useTheaterStore((s) => s.cameraMode);
  const setCameraMode = useTheaterStore((s) => s.setCameraMode);

  return (
    <motion.div
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="fixed top-0 left-0 right-0 z-40 glass border-b border-border/60"
    >
      <div className="px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.vip})`,
                boxShadow: `0 0 20px ${COLORS.primary}44`,
              }}
            >
              <Clapperboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1
                className="font-display font-bold text-lg tracking-wider"
                style={{
                  color: COLORS.primary,
                  textShadow: `0 0 12px ${COLORS.primary}88`,
                }}
              >
                CINEMA NERVE
              </h1>
              <p className="text-[10px] text-text-secondary tracking-wide">
                城市影院综合体 · 智能运营平台
              </p>
            </div>
          </div>

          <div className="h-8 w-px bg-border/60" />

          <div className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = currentRoute === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentRoute(item.id as any)}
                  className={cn(
                    'relative px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-all duration-300',
                    isActive
                      ? 'text-primary'
                      : 'text-text-secondary hover:text-text hover:bg-bg-elevated/50'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="active-nav"
                      className="absolute inset-0 rounded-lg border border-primary/40 bg-primary/10"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-4 text-xs">
            <KPIMini
              label="今日票房"
              value={`¥${kpi.todayBoxOffice.toLocaleString()}`}
              color={COLORS.gold}
            />
            <KPIMini
              label="观影人次"
              value={kpi.todayFootfall.toLocaleString()}
              color={COLORS.success}
            />
            <KPIMini
              label="平均上座"
              value={`${kpi.avgOccupancy}%`}
              color={COLORS.warning}
            />
          </div>

          <div className="h-8 w-px bg-border/60" />

          <div className="flex items-center gap-1 p-1 rounded-lg bg-bg-elevated/50 border border-border/50">
            {(['ORBIT', 'FIRST_PERSON', 'AUTO_ROTATE'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setCameraMode(mode)}
                className={cn(
                  'px-2.5 py-1.5 rounded-md text-[10px] font-medium transition-all',
                  cameraMode === mode
                    ? 'bg-primary text-bg-background shadow-glow'
                    : 'text-text-secondary hover:text-text'
                )}
                title={
                  mode === 'ORBIT' ? '环绕模式' : mode === 'FIRST_PERSON' ? '第一人称' : '自动巡游'
                }
              >
                {mode === 'ORBIT' ? '环绕' : mode === 'FIRST_PERSON' ? '漫游' : '巡游'}
              </button>
            ))}
          </div>

          <button className="relative p-2 rounded-lg hover:bg-bg-elevated/50 transition-colors text-text-secondary hover:text-text">
            <Bell className="w-5 h-5" />
            {activeAlerts > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                style={{
                  background: COLORS.danger,
                  boxShadow: `0 0 8px ${COLORS.danger}`,
                }}
              >
                {activeAlerts}
              </span>
            )}
          </button>

          <button className="p-2 rounded-lg hover:bg-bg-elevated/50 transition-colors text-text-secondary hover:text-text">
            <Maximize2 className="w-5 h-5" />
          </button>

          <button className="p-2 rounded-lg hover:bg-bg-elevated/50 transition-colors text-text-secondary hover:text-text">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function KPIMini({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="text-right">
      <div className="text-text-muted text-[10px]">{label}</div>
      <div
        className="font-bold text-sm"
        style={{ color, textShadow: `0 0 8px ${color}66` }}
      >
        {value}
      </div>
    </div>
  );
}
