import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Film,
  Popcorn,
  Crown,
  AlertTriangle,
} from 'lucide-react';
import { useTheaterStore } from '@/stores/useTheaterStore';
import { COLORS } from '@/constants/config';
import { cn, formatCurrency, getYChangePercent } from '@/utils';

export default function KPIDashboard() {
  const kpi = useTheaterStore((s) => s.kpiData);
  const currentRoute = useTheaterStore((s) => s.currentRoute);

  const isVisible = currentRoute === 'CONTROL' || currentRoute === 'DASHBOARD';

  if (!isVisible) return null;

  const kpiCards = [
    {
      label: '今日票房',
      value: formatCurrency(kpi.todayBoxOffice),
      delta: getYChangePercent(kpi.todayBoxOffice, kpi.yesterdayBoxOffice),
      icon: DollarSign,
      color: COLORS.gold,
      trend: 'up',
    },
    {
      label: '观影人次',
      value: kpi.todayFootfall.toLocaleString(),
      delta: getYChangePercent(kpi.todayFootfall, kpi.yesterdayFootfall),
      icon: Users,
      color: COLORS.success,
      trend: 'up',
    },
    {
      label: '平均上座率',
      value: `${kpi.avgOccupancy.toFixed(1)}%`,
      delta: 5.2,
      icon: Film,
      color: COLORS.warning,
      trend: 'up',
    },
    {
      label: '卖品收入',
      value: formatCurrency(kpi.concessionRevenue),
      delta: 12.8,
      icon: Popcorn,
      color: COLORS.primary,
      trend: 'up',
    },
    {
      label: 'VIP收入',
      value: formatCurrency(kpi.vipRevenue),
      delta: -2.1,
      icon: Crown,
      color: COLORS.vip,
      trend: 'down',
    },
    {
      label: '活跃告警',
      value: kpi.activeAlerts.toString(),
      delta: 0,
      icon: AlertTriangle,
      color: kpi.activeAlerts > 5 ? COLORS.danger : COLORS.warning,
      trend: kpi.activeAlerts > 5 ? 'up' : 'neutral',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 w-[calc(100%-880px)] max-w-[800px] min-w-[500px]"
    >
      <div className="glass rounded-2xl p-4 border-border/60">
        <div className="grid grid-cols-6 gap-3">
          {kpiCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 + idx * 0.05 }}
                className="relative p-3 rounded-xl overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${card.color}11, ${card.color}05)`,
                  border: `1px solid ${card.color}33`,
                }}
              >
                <div className="absolute inset-0 scan-line opacity-30 pointer-events-none" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: `${card.color}22` }}
                    >
                      <Icon className="w-3.5 h-3.5" style={{ color: card.color }} />
                    </div>
                    {card.delta !== 0 && (
                      <div
                        className={cn(
                          'flex items-center gap-0.5 text-[9px] font-bold',
                          card.trend === 'up' ? 'text-success' : card.trend === 'down' ? 'text-danger' : 'text-text-muted'
                        )}
                      >
                        {card.trend === 'up' ? (
                          <TrendingUp className="w-2.5 h-2.5" />
                        ) : card.trend === 'down' ? (
                          <TrendingDown className="w-2.5 h-2.5" />
                        ) : null}
                        {card.delta > 0 ? '+' : ''}
                        {card.delta.toFixed(1)}%
                      </div>
                    )}
                  </div>
                  <div
                    className="text-lg font-bold leading-tight"
                    style={{
                      color: card.color,
                      textShadow: `0 0 10px ${card.color}66`,
                      fontFamily: 'Orbitron, monospace',
                    }}
                  >
                    {card.value}
                  </div>
                  <div className="text-[10px] text-text-secondary mt-0.5">
                    {card.label}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
