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
  Vec3,
  VIPRoom,
  CameraMode,
  SchedulingConflict,
  DispatchEvent,
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
  dispatchEvents: DispatchEvent[];

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
  detectStockAlerts: () => void;
  addDispatchEvent: (event: Omit<DispatchEvent, 'id' | 'timestamp'>) => void;

  updateKPI: () => void;
}

export const TICKETING_LOBBY_OFFSET = { x: 0, y: 0, z: -14 };

function toGlobal(localPos: Vec3): Vec3 {
  return {
    x: localPos.x + TICKETING_LOBBY_OFFSET.x,
    y: localPos.y + TICKETING_LOBBY_OFFSET.y,
    z: localPos.z + TICKETING_LOBBY_OFFSET.z,
  };
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
  dispatchEvents: [],

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
    get().detectStockAlerts();
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

      let finalConcession = updatedConcession;
      const deliveredOrderIds: string[] = [];

      const updatedOrders = state.restockOrders.map((order) => {
        if (order.status === 'DELIVERING' && order.delivery) {
          const newProgress = Math.min(1, order.delivery.progress + 0.005);
          if (newProgress >= 1) {
            deliveredOrderIds.push(order.id);
            finalConcession = finalConcession.map((item) => {
              const orderItem = order.items.find((it) => it.sku === item.sku);
              if (orderItem) {
                return {
                  ...item,
                  currentStock: item.currentStock + orderItem.quantity,
                };
              }
              return item;
            });
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

      const alertsToResolve: AlertEvent[] = [];
      deliveredOrderIds.forEach((orderId) => {
        const order = state.restockOrders.find((o) => o.id === orderId);
        if (order) {
          const itemName = order.items[0]?.name;
          const relatedAlert = state.alerts.find(
            (a) =>
              a.type === 'STOCK' &&
              a.status !== 'RESOLVED' &&
              itemName &&
              a.description.includes(itemName)
          );
          if (relatedAlert) {
            alertsToResolve.push({ ...relatedAlert, status: 'RESOLVED' });
          }

          get().addDispatchEvent({
            type: 'RESTOCK_DELIVERED',
            title: '补货配送完成',
            description: `${order.items[0]?.name || '商品'}补货已送达，库存已自动补充`,
            area: 'CONCESSION',
            targetId: orderId,
            relatedAlertId: relatedAlert?.id,
            operator: '系统自动',
          });
        }
      });

      const finalAlerts = [...state.alerts];
      alertsToResolve.forEach((resolvedAlert) => {
        const idx = finalAlerts.findIndex((a) => a.id === resolvedAlert.id);
        if (idx >= 0) finalAlerts[idx] = resolvedAlert;
      });

      set({
        ticketMachines: updatedMachines,
        hallRealtimeMap: { ...state.hallRealtimeMap, ...updatedRealtime },
        concessionItems: finalConcession,
        restockOrders: updatedOrders,
        alerts: finalAlerts,
      });

      get().detectQueueAlerts();
      get().detectStockAlerts();
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

  approveRestockLevel: (orderId, level, comment) => {
    let orderAfter: RestockOrder | null = null;
    set((state) => {
      const orders = state.restockOrders.map((order) => {
        if (order.id !== orderId) return order;

        const expectedLevel =
          order.status === 'MANAGER_PENDING'
            ? 1
            : order.status === 'OPERATIONS_PENDING'
            ? 2
            : order.status === 'STORE_PENDING'
            ? 3
            : null;

        if (level !== expectedLevel) return order;

        const approvals = order.approvals.map((ap) =>
          ap.level === level
            ? { ...ap, comment, signedAt: Date.now() }
            : ap
        );

        let status = order.status;
        if (level === 1) status = 'OPERATIONS_PENDING';
        if (level === 2) status = 'STORE_PENDING';
        if (level === 3) status = 'APPROVED';

        let delivery = order.delivery;
        if (status === 'APPROVED') {
          status = 'DELIVERING';
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

        const result = { ...order, approvals, status, delivery };
        orderAfter = result;
        return result;
      });
      return { restockOrders: orders };
    });

    if (orderAfter) {
      const levelLabels: Record<number, string> = {
        1: '卖品经理',
        2: '运营经理',
        3: '店长',
      };
      const itemName = orderAfter.items[0]?.name;
      const relatedAlert = get().alerts.find(
        (a) =>
          a.type === 'STOCK' &&
          a.status !== 'RESOLVED' &&
          itemName &&
          a.description.includes(itemName)
      );
      get().addDispatchEvent({
        type: 'RESTOCK_APPROVE',
        title: `补货申请${levelLabels[level]}审批通过`,
        description: `${orderAfter.items[0]?.name || '商品'}补货单${levelLabels[level]}级审批通过`,
        area: 'CONCESSION',
        targetId: orderAfter.id,
        relatedAlertId: relatedAlert?.id,
        operator: levelLabels[level],
      });
    }
  },

  rejectRestock: (orderId, level, comment) => {
    let orderAfter: RestockOrder | null = null;
    set((state) => {
      const orders = state.restockOrders.map((order) => {
        if (order.id !== orderId) return order;
        const result = {
          ...order,
          status: 'REJECTED' as const,
          approvals: order.approvals.map((ap) =>
            ap.level === level ? { ...ap, comment, signedAt: Date.now() } : ap
          ),
        };
        orderAfter = result;
        return result;
      });
      return { restockOrders: orders };
    });
    if (orderAfter) {
      const levelLabels: Record<number, string> = {
        1: '卖品经理',
        2: '运营经理',
        3: '店长',
      };
      const itemName = orderAfter.items[0]?.name;
      const relatedAlert = get().alerts.find(
        (a) =>
          a.type === 'STOCK' &&
          a.status !== 'RESOLVED' &&
          itemName &&
          a.description.includes(itemName)
      );
      get().addDispatchEvent({
        type: 'RESTOCK_REJECT',
        title: `补货申请被${levelLabels[level]}驳回`,
        description: `${orderAfter.items[0]?.name || '商品'}补货单被${levelLabels[level]}驳回`,
        area: 'CONCESSION',
        targetId: orderAfter.id,
        relatedAlertId: relatedAlert?.id,
        operator: levelLabels[level],
      });
    }
  },

  openCounterWindow: (windowId) =>
    set((state) => ({
      counterWindows: state.counterWindows.map((w) =>
        w.id === windowId ? { ...w, open: true } : w
      ),
    })),

  detectQueueAlerts: () => {
    const state = get();
    const now = Date.now();
    const newAlerts: AlertEvent[] = [];
    let updatedWindows = [...state.counterWindows];
    let updatedPaths = [...state.guidePaths];
    let allWindowsOpenNotified = false;

    state.ticketMachines.forEach((m) => {
      if (m.status !== 'ONLINE') return;

      const machineNum = m.id.replace('tm-', '');
      const activeAlert = state.alerts.find(
        (a) =>
          a.type === 'QUEUE' &&
          a.status !== 'RESOLVED' &&
          a.description.includes(`${machineNum}号取票机`)
      );

      const activePath = updatedPaths.find(
        (p) => p.machineId === m.id && p.status === 'ACTIVE'
      );

      if (m.queueLength >= QUEUE_THRESHOLD.WARNING) {
        let currentAlert = activeAlert;

        if (!activeAlert) {
          const alert: AlertEvent = {
            id: generateId('alert'),
            type: 'QUEUE',
            level: m.queueLength >= 15 ? 'CRITICAL' : 'WARNING',
            title: '取票机排队告警',
            description: `${machineNum}号取票机排队人数达${m.queueLength}人`,
            location3d: toGlobal(m.position),
            status: 'NEW',
            createdAt: now,
          };
          newAlerts.push(alert);
          currentAlert = alert;
        }

        if (!activePath) {
          const closedWindows = updatedWindows.filter((w) => !w.open);
          let targetWindow: CounterWindow | undefined;
          const alertId = currentAlert?.id;

          if (closedWindows.length > 0) {
            const scored = closedWindows.map((w) => {
              const dx = w.position.x - m.position.x;
              const dz = w.position.z - m.position.z;
              const dist = Math.sqrt(dx * dx + dz * dz);
              return { window: w, score: -dist + w.queueLength * 0.5 };
            });
            scored.sort((a, b) => b.score - a.score);
            targetWindow = scored[0].window;

            updatedWindows = updatedWindows.map((w) =>
              w.id === targetWindow!.id ? { ...w, open: true } : w
            );

            get().addDispatchEvent({
              type: 'QUEUE_WINDOW_OPEN',
              title: '自动增开人工窗口',
              description: `${machineNum}号取票机排队拥堵，自动开启${targetWindow.name}`,
              area: 'TICKETING',
              targetId: targetWindow.id,
              relatedAlertId: alertId,
              operator: '系统自动',
            });
          } else {
            if (!state.alerts.some((a) => a.type === 'QUEUE' && a.title === '所有窗口已开启')) {
              allWindowsOpenNotified = true;
            }
            targetWindow = updatedWindows.reduce((best, w) => {
              if (!best) return w;
              return w.queueLength < best.queueLength ? w : best;
            }, undefined as CounterWindow | undefined);
          }

          if (targetWindow) {
            const fromPos = { ...m.position, y: 0.1 };
            const toPos = { ...targetWindow.position, y: 0.1 };
            const midPos = {
              x: (fromPos.x + toPos.x) / 2,
              y: 0.3,
              z: (fromPos.z + toPos.z) / 2,
            };

            const newPath: GuidePath = {
              id: generateId('guide'),
              from: fromPos,
              to: toPos,
              points: [fromPos, midPos, toPos],
              active: true,
              status: 'ACTIVE',
              machineId: m.id,
              windowId: targetWindow.id,
              createdAt: now,
            };
            updatedPaths.push(newPath);

            get().addDispatchEvent({
              type: 'GUIDE_PATH_CREATE',
              title: '生成分流引导路径',
              description: `${machineNum}号取票机 → ${targetWindow.name}`,
              area: 'TICKETING',
              targetId: newPath.id,
              relatedAlertId: alertId,
              operator: '系统自动',
            });
          }
        }
      } else if (m.queueLength < QUEUE_THRESHOLD.RESOLVE && activePath) {
        updatedPaths = updatedPaths.map((p) =>
          p.id === activePath.id ? { ...p, status: 'COMPLETED' as const, active: false } : p
        );

        const alertToResolve = state.alerts.find(
          (a) =>
            a.type === 'QUEUE' &&
            a.status !== 'RESOLVED' &&
            a.description.includes(`${machineNum}号取票机`)
        );
        if (alertToResolve) {
          newAlerts.push({ ...alertToResolve, status: 'RESOLVED' });
        }

        get().addDispatchEvent({
          type: 'GUIDE_PATH_COMPLETE',
          title: '分流引导完成',
          description: `${machineNum}号取票机排队已恢复正常`,
          area: 'TICKETING',
          targetId: activePath.id,
          relatedAlertId: alertToResolve?.id,
          operator: '系统自动',
        });
      }
    });

    if (allWindowsOpenNotified) {
      newAlerts.push({
        id: generateId('alert-w'),
        type: 'QUEUE',
        level: 'WARNING',
        title: '所有窗口已开启',
        description: '当前所有人工窗口均已开放，仍有取票机排队拥堵，请考虑增加临时窗口',
        location3d: toGlobal({ x: 0, y: 0, z: 1.5 }),
        status: 'NEW',
        createdAt: now,
      });
      get().addDispatchEvent({
        type: 'WINDOW_ALL_OPEN_WARNING',
        title: '窗口资源告警',
        description: '所有人工窗口已全开，仍有取票机拥堵',
        area: 'TICKETING',
        operator: '系统自动',
      });
    }

    updatedPaths = updatedPaths.filter((p) => p.status === 'ACTIVE');

    const updates: Partial<TheaterState> = {};
    if (newAlerts.length) {
      const finalAlerts = [...state.alerts];
      newAlerts.forEach((newAlert) => {
        const idx = finalAlerts.findIndex((a) => a.id === newAlert.id);
        if (idx >= 0) {
          finalAlerts[idx] = newAlert;
        } else {
          finalAlerts.unshift(newAlert);
        }
      });
      updates.alerts = finalAlerts;
    }
    if (JSON.stringify(updatedWindows) !== JSON.stringify(state.counterWindows)) {
      updates.counterWindows = updatedWindows;
    }
    if (JSON.stringify(updatedPaths) !== JSON.stringify(state.guidePaths)) {
      updates.guidePaths = updatedPaths;
    }
    if (Object.keys(updates).length) {
      set(updates as any);
    }
  },

  detectStockAlerts: () => {
    const state = get();
    const now = Date.now();
    const pendingStatuses: RestockOrder['status'][] = [
      'MANAGER_PENDING',
      'OPERATIONS_PENDING',
      'STORE_PENDING',
      'DELIVERING',
    ];
    const skusWithPendingOrder = new Set(
      state.restockOrders
        .filter((o) => pendingStatuses.includes(o.status))
        .flatMap((o) => o.items.map((it) => it.sku))
    );

    const newOrders: RestockOrder[] = [];
    const newAlerts: AlertEvent[] = [];

    state.concessionItems.forEach((item) => {
      if (item.currentStock > item.safetyStock) return;
      if (skusWithPendingOrder.has(item.sku)) return;

      const quantity = item.safetyStock * 2;
      const unitPrice = Math.round(item.unitPrice * 0.6 * 100) / 100;

      const order: RestockOrder = {
        id: generateId('RO'),
        items: [{ sku: item.sku, name: item.name, quantity, unitPrice }],
        totalAmount: Math.round(quantity * unitPrice * 100) / 100,
        status: 'MANAGER_PENDING',
        applicantId: 'system',
        applicantName: '系统自动',
        approvals: [
          {
            level: 1,
            approverId: 'cm-1',
            approverName: '刘经理(卖品经理)',
            comment: '',
            signedAt: null,
          },
          {
            level: 2,
            approverId: 'om-1',
            approverName: '赵总监(运营经理)',
            comment: '',
            signedAt: null,
          },
          {
            level: 3,
            approverId: 'sm-1',
            approverName: '孙店长',
            comment: '',
            signedAt: null,
          },
        ],
        delivery: null,
        createdAt: now,
      };
      newOrders.push(order);

      const existingAlert = state.alerts.find(
        (a) =>
          a.type === 'STOCK' &&
          a.status !== 'RESOLVED' &&
          a.description.includes(item.name)
      );
      let alertId: string | undefined;
      if (!existingAlert) {
        const alert: AlertEvent = {
          id: generateId('alert-stock'),
          type: 'STOCK',
          level: item.currentStock <= item.dangerStock ? 'CRITICAL' : 'WARNING',
          title: `${item.name}库存不足`,
          description: `当前库存${item.currentStock}，安全库存${item.safetyStock}，已自动生成补货申请`,
          location3d: item.position,
          status: 'NEW',
          createdAt: now,
        };
        newAlerts.push(alert);
        alertId = alert.id;
      } else {
        alertId = existingAlert.id;
      }

      get().addDispatchEvent({
        type: 'STOCK_RESTOCK_AUTO',
        title: '自动生成补货申请',
        description: `${item.name}库存不足，已自动生成补货申请`,
        area: 'CONCESSION',
        targetId: order.id,
        relatedAlertId: alertId,
        operator: '系统自动',
      });
    });

    if (newOrders.length || newAlerts.length) {
      set((s) => ({
        restockOrders: [...newOrders, ...s.restockOrders],
        alerts: [...newAlerts, ...s.alerts],
      }));
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

  adjustSchedulingConflict: (conflictId) => {
    let conflictHallName = '';
    let conflictGap = 0;
    let relatedAlertId: string | undefined;
    set((state) => {
      const conflict = state.schedulingConflicts.find((c) => c.id === conflictId);
      if (!conflict) return {};

      const adjustedMins = SCHEDULING.MIN_GAP_MINUTES - conflict.gapMinutes + 5;
      const hallName = state.halls.find((h) => h.id === conflict.hallId)?.name || '';
      conflictHallName = hallName;
      conflictGap = conflict.gapMinutes;

      const updatedAlerts = state.alerts.map((a) => {
        if (
          a.type === 'SCHEDULE' &&
          a.status !== 'RESOLVED' &&
          a.description.includes(hallName) &&
          a.description.includes(`${conflict.gapMinutes}分钟`)
        ) {
          relatedAlertId = a.id;
          return { ...a, status: 'RESOLVED' as const };
        }
        return a;
      });

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
        alerts: updatedAlerts,
      };
    });

    if (conflictHallName) {
      get().addDispatchEvent({
        type: 'SCHEDULE_ADJUST',
        title: '排片冲突自动调整',
        description: `${conflictHallName}场次间隔${conflictGap}分钟，已自动推后调整`,
        area: 'HALLS',
        targetId: conflictId,
        relatedAlertId,
        operator: '系统自动',
      });
    }
  },

  addDispatchEvent: (event) => {
    const newEvent: DispatchEvent = {
      ...event,
      id: generateId('evt'),
      timestamp: Date.now(),
    };
    set((state) => ({
      dispatchEvents: [newEvent, ...state.dispatchEvents].slice(0, 100),
    }));
  },

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
