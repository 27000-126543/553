import { create } from 'zustand';
import type {
  AreaType,
  AlertEvent,
  BoxOfficeDataPoint,
  ConcessionItem,
  CounterWindow,
  GuidePath,
  Hall,
  HallRealtime,
  KPIData,
  Movie,
  Projector,
  RestockOrder,
  Showtime,
  TicketMachine,
  VIPRoom,
  CameraMode,
  SchedulingConflict,
} from '@/types';
import {
  generateBoxOfficeData,
  generateConcessionItems,
  generateCounterWindows,
  generateHallRealtime,
  generateHalls,
  generateInitialAlerts,
  generateKPIData,
  generateMovies,
  generateProjectors,
  generateRestockOrders,
  generateShowtimes,
  generateTicketMachines,
  generateVIPRooms,
} from '@/services/mockData';
import { QUEUE_THRESHOLD, SCHEDULING } from '@/constants/config';
import { generateId } from '@/utils';

interface TheaterState {
  initialized: boolean;
  cameraMode: CameraMode;
  focusArea: AreaType | null;
  selectedHallId: string | null;
  selectedDetailType: 'HALL' | 'MACHINE' | 'CONCESSION' | null;
  selectedDetailId: string | null;
  panelOpen: boolean;
  currentRoute: AreaType | 'DASHBOARD';

  movies: Movie[];
  halls: Hall[];
  hallRealtimeMap: Record<string, HallRealtime>;
  showtimes: Showtime[];
  boxOfficeData: BoxOfficeDataPoint[];
  concessionItems: ConcessionItem[];
  ticketMachines: TicketMachine[];
  counterWindows: CounterWindow[];
  vipRooms: VIPRoom[];
  projectors: Projector[];
  alerts: AlertEvent[];
  restockOrders: RestockOrder[];
  guidePaths: GuidePath[];
  schedulingConflicts: SchedulingConflict[];
  kpiData: KPIData;

  simulationIntervalId: number | null;

  initialize: () => void;
  startRealtimeSimulation: () => void;
  stopRealtimeSimulation: () => void;

  setCameraMode: (mode: CameraMode) => void;
  setFocusArea: (area: AreaType | null) => void;
  setSelectedHall: (id: string | null) => void;
  setSelectedDetail: (
    type: 'HALL' | 'MACHINE' | 'CONCESSION' | null,
    id: string | null
  ) => void;
  togglePanel: (open?: boolean) => void;
  setCurrentRoute: (route: AreaType | 'DASHBOARD') => void;

  acknowledgeAlert: (alertId: string) => void;
  resolveAlert: (alertId: string) => void;

  approveRestockLevel: (orderId: string, level: 1 | 2 | 3, comment: string) => void;
  rejectRestock: (orderId: string, level: 1 | 2 | 3, comment: string) => void;

  openCounterWindow: (windowId: string) => void;
  detectQueueAlerts: () => void;
  detectSchedulingConflicts: () => void;
  adjustSchedulingConflict: (conflictId: string) => void;

  updateKPI: () => void;
}

export const useTheaterStore = create<TheaterState>((set, get) => ({
  initialized: false,
  cameraMode: 'ORBIT',
  focusArea: null,
  selectedHallId: null,
  selectedDetailType: null,
  selectedDetailId: null,
  panelOpen: true,
  currentRoute: 'DASHBOARD',

  movies: [],
  halls: [],
  hallRealtimeMap: {},
  showtimes: [],
  boxOfficeData: [],
  concessionItems: [],
  ticketMachines: [],
  counterWindows: [],
  vipRooms: [],
  projectors: [],
  alerts: [],
  restockOrders: [],
  guidePaths: [],
  schedulingConflicts: [],
  kpiData: generateKPIData(),

  simulationIntervalId: null,

  initialize: () => {
    if (get().initialized) return;

    const movies = generateMovies();
    const halls = generateHalls();
    const showtimes = generateShowtimes(halls, movies);
    const hallRealtimeMap = generateHallRealtime(halls, movies, showtimes);
    const boxOfficeData = generateBoxOfficeData(halls);
    const concessionItems = generateConcessionItems();
    const ticketMachines = generateTicketMachines();
    const counterWindows = generateCounterWindows();
    const vipRooms = generateVIPRooms();
    const projectors = generateProjectors();
    const alerts = generateInitialAlerts(ticketMachines, concessionItems, projectors);
    const restockOrders = generateRestockOrders(concessionItems);

    set({
      initialized: true,
      movies,
      halls,
      showtimes,
      hallRealtimeMap,
      boxOfficeData,
      concessionItems,
      ticketMachines,
      counterWindows,
      vipRooms,
      projectors,
      alerts,
      restockOrders,
    });

    get().detectQueueAlerts();
    get().detectSchedulingConflicts();
  },

  startRealtimeSimulation: () => {
    if (get().simulationIntervalId) return;

    const interval = window.setInterval(() => {
      const state = get();

      const updatedMachines = state.ticketMachines.map((m) => {
        if (m.status !== 'ONLINE') return m;
        const delta = Math.floor(Math.random() * 5) - 2;
        return {
          ...m,
          queueLength: Math.max(0, Math.min(20, m.queueLength + delta)),
        };
      });

      const updatedRealtime: Record<string, HallRealtime> = {};
      Object.entries(state.hallRealtimeMap).forEach(([id, rt]) => {
        const deltaOcc = (Math.random() - 0.5) * 3;
        const newOcc = Math.max(
          5,
          Math.min(100, Math.round(rt.occupancyRate + deltaOcc))
        );
        updatedRealtime[id] = {
          ...rt,
          occupancyRate: newOcc,
          occupiedSeats: Math.floor(
            (state.halls.find((h) => h.id === id)?.totalSeats || 180) * (newOcc / 100)
          ),
          temperature: Math.round((rt.temperature + (Math.random() - 0.5) * 0.3) * 10) / 10,
          humidity: Math.round((rt.humidity + (Math.random() - 0.5) * 1) * 10) / 10,
        };
      });

      const updatedConcession = state.concessionItems.map((item) => {
        const sold = Math.random() < 0.3 ? Math.floor(Math.random() * 3) : 0;
        return {
          ...item,
          currentStock: Math.max(0, item.currentStock - sold),
        };
      });

      const updatedOrders = state.restockOrders.map((order) => {
        if (order.status === 'DELIVERING' && order.delivery) {
          const newProgress = Math.min(1, order.delivery.progress + 0.005);
          if (newProgress >= 1) {
            return {
              ...order,
              status: 'COMPLETED' as const,
              delivery: { ...order.delivery, progress: 1, status: 'DELIVERED' as const },
            };
          }
          return {
            ...order,
            delivery: { ...order.delivery, progress: newProgress },
          };
        }
        return order;
      });

      set({
        ticketMachines: updatedMachines,
        hallRealtimeMap: { ...state.hallRealtimeMap, ...updatedRealtime },
        concessionItems: updatedConcession,
        restockOrders: updatedOrders,
      });

      get().detectQueueAlerts();
      get().updateKPI();
    }, 3000);

    set({ simulationIntervalId: interval });
  },

  stopRealtimeSimulation: () => {
    const id = get().simulationIntervalId;
    if (id) {
      clearInterval(id);
      set({ simulationIntervalId: null });
    }
  },

  setCameraMode: (mode) => set({ cameraMode: mode }),
  setFocusArea: (area) => set({ focusArea: area }),
  setSelectedHall: (id) => set({ selectedHallId: id }),
  setSelectedDetail: (type, id) =>
    set({
      selectedDetailType: type,
      selectedDetailId: id,
      panelOpen: type ? true : get().panelOpen,
    }),
  togglePanel: (open) =>
    set({ panelOpen: typeof open === 'boolean' ? open : !get().panelOpen }),
  setCurrentRoute: (route) => set({ currentRoute: route, focusArea: route === 'DASHBOARD' ? null : (route as AreaType) }),

  acknowledgeAlert: (alertId) =>
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === alertId
          ? { ...a, status: 'ACKNOWLEDGED' as const, handlerId: 'current-user', handlerName: '当前用户' }
          : a
      ),
    })),

  resolveAlert: (alertId) =>
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === alertId ? { ...a, status: 'RESOLVED' as const } : a
      ),
    })),

  approveRestockLevel: (orderId, level, comment) =>
    set((state) => {
      const orders = state.restockOrders.map((order) => {
        if (order.id !== orderId) return order;
        const approvals = order.approvals.map((ap) =>
          ap.level === level
            ? { ...ap, comment, signedAt: Date.now() }
            : ap
        );

        let status = order.status;
        if (level === 1) status = 'OPERATIONS_PENDING';
        if (level === 2) status = 'STORE_PENDING';
        if (level === 3) status = 'APPROVED';

        if (status === 'APPROVED') {
          status = 'DELIVERING';
        }

        let delivery = order.delivery;
        if (level === 3 && !order.delivery) {
          delivery = {
            carrier: '顺丰冷链',
            eta: Date.now() + 60 * 60 * 1000,
            progress: 0,
            path: [
              { x: -35, y: 0.5, z: -25 },
              { x: -25, y: 0.5, z: -25 },
              { x: -10, y: 0.5, z: -15 },
              { x: 5, y: 0.5, z: -10 },
              { x: 18, y: 0.5, z: -10 },
            ],
            status: 'IN_TRANSIT',
          };
        }

        return { ...order, approvals, status, delivery };
      });
      return { restockOrders: orders };
    }),

  rejectRestock: (orderId, level, comment) =>
    set((state) => ({
      restockOrders: state.restockOrders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: 'REJECTED',
              approvals: order.approvals.map((ap) =>
                ap.level === level ? { ...ap, comment, signedAt: Date.now() } : ap
              ),
            }
          : order
      ),
    })),

  openCounterWindow: (windowId) =>
    set((state) => ({
      counterWindows: state.counterWindows.map((w) =>
        w.id === windowId ? { ...w, open: true } : w
      ),
      guidePaths: state.guidePaths.length
        ? state.guidePaths
        : state.ticketMachines
            .filter((m) => m.queueLength >= QUEUE_THRESHOLD.WARNING)
            .map((m) => {
              const target = state.counterWindows.find((cw) => cw.id === windowId);
              return {
                id: generateId('guide'),
                from: m.position,
                to: target?.position || { x: 0, y: 0, z: -14 },
                points: [
                  m.position,
                  { x: (m.position.x + (target?.position.x || 0)) / 2, y: 0.3, z: -13 },
                  target?.position || { x: 0, y: 0, z: -14 },
                ],
                active: true,
              };
            }),
    })),

  detectQueueAlerts: () => {
    const state = get();
    const now = Date.now();
    const existingIds = new Set(
      state.alerts.filter((a) => a.type === 'QUEUE').map((a) => a.description)
    );
    const newAlerts: AlertEvent[] = [];

    state.ticketMachines.forEach((m) => {
      if (m.queueLength >= QUEUE_THRESHOLD.WARNING) {
        const desc = `${m.id.replace('tm-', '')}号取票机排队人数达${m.queueLength}人`;
        if (!existingIds.has(desc)) {
          newAlerts.push({
            id: generateId('alert'),
            type: 'QUEUE',
            level: 'WARNING',
            title: '取票机排队告警',
            description: desc,
            location3d: m.position,
            status: 'NEW',
            createdAt: now,
          });
        }
      }
    });

    if (newAlerts.length) {
      set((s) => ({ alerts: [...newAlerts, ...s.alerts] }));
    }
  },

  detectSchedulingConflicts: () => {
    const state = get();
    const conflicts: SchedulingConflict[] = [];
    const halls = state.halls;

    halls.forEach((hall) => {
      const hallShows = state.showtimes
        .filter((s) => s.hallId === hall.id)
        .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

      for (let i = 0; i < hallShows.length - 1; i++) {
        const curr = hallShows[i];
        const next = hallShows[i + 1];
        const gap = (next.startTime.getTime() - curr.endTime.getTime()) / (1000 * 60);
        if (gap < SCHEDULING.MIN_GAP_MINUTES) {
          conflicts.push({
            id: generateId('conflict'),
            hallId: hall.id,
            showtime1Id: curr.id,
            showtime2Id: next.id,
            gapMinutes: Math.round(gap),
            adjustedTime: null,
            notified: false,
          });
        }
      }
    });

    if (conflicts.length) {
      const conflictAlerts: AlertEvent[] = conflicts
        .filter((c) => !state.alerts.some((a) => a.description.includes(c.showtime1Id)))
        .map((c, idx) => ({
          id: generateId('alert-s'),
          type: 'SCHEDULE',
          level: 'WARNING' as const,
          title: '排片间隔不足',
          description: `${state.halls.find((h) => h.id === c.hallId)?.name}场次间隔仅${c.gapMinutes}分钟，建议调整`,
          location3d: state.halls.find((h) => h.id === c.hallId)?.position || {
            x: 0,
            y: 2,
            z: 0,
          },
          status: 'NEW' as const,
          createdAt: Date.now() - idx * 30000,
        }));

      set({
        schedulingConflicts: conflicts,
        alerts: [...conflictAlerts, ...state.alerts],
      });
    }
  },

  adjustSchedulingConflict: (conflictId) =>
    set((state) => {
      const conflict = state.schedulingConflicts.find((c) => c.id === conflictId);
      if (!conflict) return {};

      const adjustedMins = SCHEDULING.MIN_GAP_MINUTES - conflict.gapMinutes + 5;
      return {
        schedulingConflicts: state.schedulingConflicts.map((c) =>
          c.id === conflictId
            ? { ...c, adjustedTime: adjustedMins, notified: true }
            : c
        ),
        showtimes: state.showtimes.map((s) =>
          s.id === conflict.showtime2Id
            ? {
                ...s,
                startTime: new Date(s.startTime.getTime() + adjustedMins * 60 * 1000),
                endTime: new Date(s.endTime.getTime() + adjustedMins * 60 * 1000),
              }
            : s
        ),
      };
    }),

  updateKPI: () => {
    const state = get();
    const factor = 1 + (Math.random() - 0.5) * 0.005;
    set({
      kpiData: {
        ...state.kpiData,
        todayBoxOffice: Math.round(state.kpiData.todayBoxOffice * factor),
        todayFootfall: Math.round(state.kpiData.todayFootfall * factor),
        activeAlerts: state.alerts.filter((a) => a.status !== 'RESOLVED').length,
      },
    });
  },
}));
