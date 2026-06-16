import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Film,
  Thermometer,
  Droplets,
  Wind,
  Users,
  X,
  Clock,
  Star,
} from 'lucide-react';
import { useTheaterStore } from '@/stores/useTheaterStore';
import {
  COLORS,
  HEAT_COLOR_MAP,
  HALL_TYPE_LABELS,
  AC_STATUS_LABELS,
} from '@/constants/config';
import { cn, formatTime } from '@/utils';
import BoxOfficeChart from '../charts/BoxOfficeChart';

export default function HallDetailPanel() {
  const selectedHallId = useTheaterStore((s) => s.selectedHallId);
  const setSelectedHall = useTheaterStore((s) => s.setSelectedHall);
  const setSelectedDetail = useTheaterStore((s) => s.setSelectedDetail);
  const halls = useTheaterStore((s) => s.halls);
  const hallRealtimeMap = useTheaterStore((s) => s.hallRealtimeMap);
  const allShowtimes = useTheaterStore((s) => s.showtimes);
  const boxOfficeData = useTheaterStore((s) => s.boxOfficeData);
  const panelOpen = useTheaterStore((s) => s.panelOpen);
  const togglePanel = useTheaterStore((s) => s.togglePanel);

  const hall = useMemo(() => halls.find((h) => h.id === selectedHallId), [halls, selectedHallId]);
  const realtime = hallRealtimeMap[selectedHallId || ''];
  const showtimes = useMemo(
    () => allShowtimes.filter((st) => st.hallId === selectedHallId),
    [allShowtimes, selectedHallId]
  );

  const isOpen = panelOpen && selectedHallId;

  const upcomingShows = showtimes
    .filter((s) => s.endTime.getTime() > Date.now())
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
    .slice(0, 5);

  return (
    <AnimatePresence>
      {isOpen && hall && realtime && (
        <motion.div
          initial={{ x: -420, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -420, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed left-0 top-0 h-full w-[400px] glass z-50 flex flex-col"
        >
          <div className="p-4 border-b border-border/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{
                  background: `${COLORS.primary}22`,
                  border: `1px solid ${COLORS.primary}55`,
                }}
              >
                <Film className="w-5 h-5" style={{ color: COLORS.primary }} />
              </div>
              <div>
                <h2
                  className="font-display font-bold text-lg"
                  style={{ color: COLORS.primary, textShadow: `0 0 10px ${COLORS.primary}88` }}
                >
                  {hall.number}号厅
                </h2>
                <p className="text-xs text-text-secondary">
                  {HALL_TYPE_LABELS[hall.type]} · {hall.totalSeats}座
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => togglePanel(false)}
                className="p-2 rounded-lg hover:bg-bg-elevated transition-colors text-text-secondary hover:text-text"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 scan-line">
            {realtime.currentMovie && (
              <div className="glass-elevated rounded-xl p-4">
                <div className="flex gap-3">
                  <div
                    className="w-16 h-22 rounded-lg flex items-center justify-center text-3xl"
                    style={{
                      background: `linear-gradient(135deg, ${COLORS.primary}22, ${COLORS.vip}22)`,
                      border: `1px solid ${COLORS.primary}33`,
                      minHeight: '88px',
                      minWidth: '64px',
                    }}
                  >
                    {realtime.currentMovie.poster}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-text truncate">
                      {realtime.currentMovie.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-xs">
                      <span
                        className="px-2 py-0.5 rounded-full"
                        style={{
                          background: `${COLORS.vip}22`,
                          color: COLORS.vip,
                          border: `1px solid ${COLORS.vip}44`,
                        }}
                      >
                        {realtime.currentMovie.genre}
                      </span>
                      <span className="flex items-center gap-1 text-gold">
                        <Star className="w-3 h-3 fill-gold" />
                        {realtime.currentMovie.rating}
                      </span>
                      <span className="text-text-secondary">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {realtime.currentMovie.duration}分钟
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="text-text-secondary">
                        {realtime.currentShowtime
                          ? `${formatTime(realtime.currentShowtime.startTime)} - ${formatTime(realtime.currentShowtime.endTime)}`
                          : '等待排片'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-4 gap-2">
                  <InfoCard
                    icon={<Users className="w-3.5 h-3.5" />}
                    label="上座率"
                    value={`${realtime.occupancyRate}%`}
                    color={HEAT_COLOR_MAP[realtime.occupancyRate < 30 ? 1 : realtime.occupancyRate < 50 ? 2 : realtime.occupancyRate < 70 ? 3 : realtime.occupancyRate < 85 ? 4 : 5]}
                    subValue={`${realtime.occupiedSeats}/${hall.totalSeats}`}
                  />
                  <InfoCard
                    icon={<Thermometer className="w-3.5 h-3.5" />}
                    label="温度"
                    value={`${realtime.temperature}°`}
                    color={realtime.temperature > 26 ? COLORS.danger : COLORS.primary}
                  />
                  <InfoCard
                    icon={<Droplets className="w-3.5 h-3.5" />}
                    label="湿度"
                    value={`${realtime.humidity}%`}
                    color={COLORS.primary}
                  />
                  <InfoCard
                    icon={<Wind className="w-3.5 h-3.5" />}
                    label="空调"
                    value={AC_STATUS_LABELS[realtime.acStatus].label.slice(0, 2)}
                    color={AC_STATUS_LABELS[realtime.acStatus].color}
                    subValue={`PM2.5 ${realtime.pm25}`}
                  />
                </div>
              </div>
            )}

            <div className="glass rounded-xl p-4">
              <h3 className="font-bold text-sm text-text mb-3 flex items-center gap-2">
                <span
                  className="w-1.5 h-4 rounded-full"
                  style={{ background: COLORS.gold }}
                />
                近24小时票房与客流
              </h3>
              <BoxOfficeChart data={boxOfficeData} hallId={selectedHallId || undefined} height={180} />
            </div>

            <div className="glass rounded-xl p-4">
              <h3 className="font-bold text-sm text-text mb-3 flex items-center gap-2">
                <span
                  className="w-1.5 h-4 rounded-full"
                  style={{ background: COLORS.success }}
                />
                排片热力 · 即将上映
              </h3>
              <div className="space-y-2">
                {upcomingShows.map((show) => (
                  <div
                    key={show.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-bg-surface/50 border border-border/30 hover:border-primary/30 transition-colors"
                  >
                    <div
                      className="w-1 h-full min-h-[40px] rounded-full"
                      style={{ background: HEAT_COLOR_MAP[show.heatLevel] }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-text truncate">
                        {show.movie.title}
                      </div>
                      <div className="text-xs text-text-secondary mt-0.5">
                        {formatTime(show.startTime)} - {formatTime(show.endTime)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{
                          background: `${HEAT_COLOR_MAP[show.heatLevel]}22`,
                          color: HEAT_COLOR_MAP[show.heatLevel],
                          border: `1px solid ${HEAT_COLOR_MAP[show.heatLevel]}44`,
                        }}
                      >
                        {show.predictedOccupancy}%
                      </div>
                      <div className="text-[10px] text-text-muted mt-1">
                        {show.soldSeats}人已购
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function InfoCard({
  icon,
  label,
  value,
  color,
  subValue,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  subValue?: string;
}) {
  return (
    <div
      className="text-center p-2 rounded-lg"
      style={{ background: `${color}11`, border: `1px solid ${color}22` }}
    >
      <div className="flex items-center justify-center mb-1" style={{ color }}>
        {icon}
      </div>
      <div className="text-[10px] text-text-secondary">{label}</div>
      <div
        className="text-sm font-bold mt-0.5"
        style={{ color, textShadow: `0 0 6px ${color}88` }}
      >
        {value}
      </div>
      {subValue && <div className="text-[9px] text-text-muted">{subValue}</div>}
    </div>
  );
}
