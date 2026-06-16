import type {
  Movie,
  Hall,
  HallRealtime,
  Showtime,
  BoxOfficeDataPoint,
  ConcessionItem,
  TicketMachine,
  CounterWindow,
  VIPRoom,
  Projector,
  AlertEvent,
  RestockOrder,
  KPIData,
  HeatLevel,
} from '@/types';

const MOVIE_POSTERS = [
  '🎬',
  '🎥',
  '🎞️',
  '🎭',
  '🎪',
  '🎨',
  '🎯',
  '🎲',
];

const MOVIE_DATA: Omit<Movie, 'id' | 'poster'>[] = [
  { title: '星际穿越：新纪元', duration: 168, rating: 9.2, genre: '科幻/冒险' },
  { title: '城市迷踪', duration: 125, rating: 8.5, genre: '悬疑/动作' },
  { title: '爱在黎明破晓时', duration: 110, rating: 8.8, genre: '爱情/文艺' },
  { title: '疯狂动物城2', duration: 108, rating: 8.9, genre: '动画/喜剧' },
  { title: '深海探险', duration: 135, rating: 8.3, genre: '冒险/纪录' },
  { title: '武侠风云录', duration: 142, rating: 8.7, genre: '武侠/动作' },
  { title: '末日救援', duration: 130, rating: 8.1, genre: '灾难/动作' },
  { title: '童年的庭院', duration: 98, rating: 9.0, genre: '剧情/家庭' },
];

export function generateMovies(): Movie[] {
  return MOVIE_DATA.map((m, i) => ({
    ...m,
    id: `movie-${i + 1}`,
    poster: MOVIE_POSTERS[i % MOVIE_POSTERS.length],
  }));
}

export function generateHalls(): Hall[] {
  const hallTypes: Hall['type'][] = ['IMAX', 'DOLBY', 'STANDARD', 'STANDARD', 'LUXE', 'STANDARD'];
  const halls: Hall[] = [];
  const startX = -20;
  const spacing = 8;

  for (let i = 0; i < 6; i++) {
    const type = hallTypes[i];
    const seats =
      type === 'IMAX' ? 400 : type === 'LUXE' ? 200 : type === 'DOLBY' ? 280 : 180;
    halls.push({
      id: `hall-${i + 1}`,
      number: i + 1,
      name: `${i + 1}号${type === 'STANDARD' ? '' : type}厅`,
      type,
      totalSeats: seats,
      screenSize: {
        width: type === 'IMAX' ? 28 : type === 'LUXE' ? 22 : type === 'DOLBY' ? 20 : 15,
        height: type === 'IMAX' ? 16 : type === 'LUXE' ? 12 : type === 'DOLBY' ? 11 : 8,
      },
      position: { x: startX + i * spacing, y: 0, z: 10 },
      rotation: 0,
    });
  }
  return halls;
}

export function generateHallRealtime(
  halls: Hall[],
  movies: Movie[],
  showtimes: Showtime[]
): Record<string, HallRealtime> {
  const result: Record<string, HallRealtime> = {};
  const now = Date.now();

  halls.forEach((hall) => {
    const currentShow = showtimes.find(
      (s) => s.hallId === hall.id && s.startTime.getTime() <= now && s.endTime.getTime() >= now
    );
    const upcomingShow = showtimes
      .filter((s) => s.hallId === hall.id && s.startTime.getTime() > now)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())[0];
    const activeShow = currentShow || upcomingShow;
    const occupied = activeShow
      ? Math.floor((activeShow.soldSeats / hall.totalSeats) * hall.totalSeats)
      : Math.floor(hall.totalSeats * 0.3);

    result[hall.id] = {
      hallId: hall.id,
      currentMovie: activeShow ? activeShow.movie : movies[0],
      currentShowtime: activeShow || null,
      occupiedSeats: occupied,
      occupancyRate: Math.round((occupied / hall.totalSeats) * 100),
      temperature: Math.round((22 + Math.random() * 4) * 10) / 10,
      humidity: Math.round((45 + Math.random() * 15) * 10) / 10,
      acStatus: (['COOLING', 'COOLING', 'VENTILATION', 'HEATING'] as const)[
        Math.floor(Math.random() * 4)
      ],
      pm25: Math.floor(15 + Math.random() * 20),
    };
  });
  return result;
}

export function generateShowtimes(halls: Hall[], movies: Movie[]): Showtime[] {
  const showtimes: Showtime[] = [];
  const now = new Date();
  now.setMinutes(0, 0, 0);
  const today9am = new Date(now);
  today9am.setHours(9, 0, 0, 0);

  halls.forEach((hall) => {
    let currentTime = new Date(today9am);
    let idx = 0;

    while (currentTime.getHours() < 24) {
      const movie = movies[Math.floor(Math.random() * movies.length)];
      const startTime = new Date(currentTime);
      const endTime = new Date(startTime.getTime() + movie.duration * 60 * 1000);
      const predicted = 0.3 + Math.random() * 0.65;
      const sold = Math.floor(hall.totalSeats * predicted * (0.6 + Math.random() * 0.4));

      const heatLevel = (Math.ceil(predicted * 5) as HeatLevel) || 1;

      showtimes.push({
        id: `show-${hall.id}-${idx}`,
        hallId: hall.id,
        movieId: movie.id,
        movie,
        startTime,
        endTime,
        soldSeats: Math.min(sold, hall.totalSeats),
        predictedOccupancy: Math.round(predicted * 100),
        heatLevel,
      });

      currentTime = new Date(endTime.getTime() + (15 + Math.floor(Math.random() * 15)) * 60 * 1000);
      idx++;
    }
  });
  return showtimes;
}

export function generateBoxOfficeData(halls: Hall[]): BoxOfficeDataPoint[] {
  const data: BoxOfficeDataPoint[] = [];
  const now = Date.now();
  const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;
  const interval = 30 * 60 * 1000;

  for (let t = twentyFourHoursAgo; t <= now; t += interval) {
    const hour = new Date(t).getHours();
    const hourFactor =
      hour >= 10 && hour <= 12
        ? 0.7
        : hour >= 13 && hour <= 15
        ? 0.9
        : hour >= 16 && hour <= 18
        ? 1.2
        : hour >= 19 && hour <= 22
        ? 1.6
        : 0.2;

    const base = 3000 + Math.random() * 2000;
    const noise = (Math.random() - 0.5) * 800;

    data.push({
      timestamp: t,
      boxOffice: Math.max(0, Math.round((base * hourFactor + noise) * 100) / 100),
      footfall: Math.max(0, Math.round(base * hourFactor * 0.06 + noise * 0.03)),
    });
  }

  halls.forEach((hall) => {
    for (let t = twentyFourHoursAgo; t <= now; t += interval) {
      const hour = new Date(t).getHours();
      const hourFactor = hour >= 19 && hour <= 22 ? 1.8 : hour >= 13 && hour <= 17 ? 1.0 : 0.3;
      data.push({
        timestamp: t,
        boxOffice: Math.round((400 + Math.random() * 300) * hourFactor),
        footfall: Math.round((5 + Math.random() * 5) * hourFactor),
        hallId: hall.id,
      });
    }
  });

  return data;
}

export function generateConcessionItems(): ConcessionItem[] {
  const itemsData = [
    { name: '中桶爆米花', category: 'SNACK' as const, safety: 40, danger: 15, price: 28 },
    { name: '大桶爆米花', category: 'SNACK' as const, safety: 30, danger: 10, price: 38 },
    { name: '焦糖爆米花', category: 'SNACK' as const, safety: 25, danger: 8, price: 35 },
    { name: '薯条(大)', category: 'SNACK' as const, safety: 30, danger: 10, price: 22 },
    { name: '热狗', category: 'MEAL' as const, safety: 20, danger: 5, price: 25 },
    { name: '鸡米花', category: 'SNACK' as const, safety: 25, danger: 8, price: 28 },
    { name: '可口可乐(中)', category: 'BEVERAGE' as const, safety: 60, danger: 20, price: 15 },
    { name: '可口可乐(大)', category: 'BEVERAGE' as const, safety: 50, danger: 15, price: 20 },
    { name: '橙汁', category: 'BEVERAGE' as const, safety: 30, danger: 8, price: 18 },
    { name: '矿泉水', category: 'BEVERAGE' as const, safety: 80, danger: 30, price: 8 },
    { name: '哈根达斯', category: 'SNACK' as const, safety: 15, danger: 5, price: 35 },
    { name: '电影主题杯', category: 'MERCHANDISE' as const, safety: 20, danger: 5, price: 68 },
  ];

  return itemsData.map((item, i) => {
    const current = Math.floor(item.danger + Math.random() * (item.safety * 1.5));
    return {
      sku: `SKU-${String(i + 1).padStart(4, '0')}`,
      name: item.name,
      category: item.category,
      currentStock: current,
      safetyStock: item.safety,
      dangerStock: item.danger,
      unitPrice: item.price,
      shelfPosition: { row: Math.floor(i / 4), col: i % 4 },
      position: {
        x: 12 + (i % 4) * 2.2,
        y: 0.5 + Math.floor(i / 4) * 0.8,
        z: -10,
      },
    };
  });
}

export function generateTicketMachines(): TicketMachine[] {
  const machines: TicketMachine[] = [];
  for (let i = 0; i < 8; i++) {
    const isFault = Math.random() < 0.08;
    machines.push({
      id: `tm-${i + 1}`,
      status: isFault ? 'FAULT' : Math.random() < 0.05 ? 'OFFLINE' : 'ONLINE',
      queueLength: isFault
        ? 0
        : i === 3
        ? 13
        : i === 0
        ? 8
        : Math.floor(Math.random() * 9),
      paperRemaining: Math.floor(15 + Math.random() * 85),
      position: { x: -22 + i * 2.5, y: 0, z: -14 },
    });
  }
  return machines;
}

export function generateCounterWindows(): CounterWindow[] {
  const windows: CounterWindow[] = [];
  for (let i = 0; i < 5; i++) {
    windows.push({
      id: `cw-${i + 1}`,
      name: `人工窗口${i + 1}`,
      open: i < 2,
      queueLength: i < 2 ? Math.floor(Math.random() * 6) : 0,
      position: { x: -8 + i * 2.5, y: 0, z: -14 },
    });
  }
  return windows;
}

export function generateVIPRooms(): VIPRoom[] {
  const statuses: VIPRoom['status'][] = ['IN_USE', 'IDLE', 'RESERVED', 'IN_USE', 'IDLE', 'IN_USE'];
  const names = ['星辰厅', '银河厅', '钻石厅', '皇家厅', '翡翠厅', '明珠厅'];
  const levels: VIPRoom['customerLevel'][] = ['DIAMOND', null, 'GOLD', 'PLATINUM', null, 'DIAMOND'];
  return statuses.map((s, i) => ({
    id: `vip-${i + 1}`,
    name: names[i],
    status: s,
    customerName: s === 'IDLE' ? null : ['张先生', null, '李女士', '王总', null, '陈总'][i],
    customerLevel: s === 'IDLE' ? null : levels[i],
    remainingMinutes: s === 'IN_USE' ? Math.floor(30 + Math.random() * 120) : 0,
    position: { x: -15 + i * 6, y: 5.5, z: 8 },
  }));
}

export function generateProjectors(): Projector[] {
  const projectors: Projector[] = [];
  for (let i = 0; i < 6; i++) {
    const maxHours = 6000;
    const used = Math.floor(2000 + Math.random() * 3500);
    projectors.push({
      id: `proj-${i + 1}`,
      name: `放映机-${i + 1}`,
      status: i === 4 ? 'FAULT' : Math.random() < 0.1 ? 'STANDBY' : 'RUNNING',
      lampHours: used,
      lampMaxHours: maxHours,
      temperature: Math.round((32 + Math.random() * 10) * 10) / 10,
      position: { x: -20 + i * 8, y: 0, z: 18 },
    });
  }
  return projectors;
}

export function generateInitialAlerts(
  ticketMachines: TicketMachine[],
  concessionItems: ConcessionItem[],
  projectors: Projector[]
): AlertEvent[] {
  const alerts: AlertEvent[] = [];
  const now = Date.now();

  const queueAlert = ticketMachines.find((m) => m.queueLength >= 10);
  if (queueAlert) {
    alerts.push({
      id: 'alert-queue-1',
      type: 'QUEUE',
      level: 'WARNING',
      title: '取票机排队过长',
      description: `${queueAlert.id.replace('tm-', '')}号取票机排队人数达${queueAlert.queueLength}人，建议增开人工窗口`,
      location3d: queueAlert.position,
      status: 'NEW',
      createdAt: now - 5 * 60 * 1000,
    });
  }

  concessionItems
    .filter((item) => item.currentStock <= item.safetyStock)
    .forEach((item, idx) => {
      alerts.push({
        id: `alert-stock-${idx}`,
        type: 'STOCK',
        level: item.currentStock <= item.dangerStock ? 'CRITICAL' : 'WARNING',
        title: `${item.name}库存不足`,
        description: `当前库存${item.currentStock}，安全库存${item.safetyStock}，请及时补货`,
        location3d: item.position,
        status: 'NEW',
        createdAt: now - (10 + idx * 5) * 60 * 1000,
      });
    });

  projectors
    .filter((p) => p.status === 'FAULT')
    .forEach((p, idx) => {
      alerts.push({
        id: `alert-device-${idx}`,
        type: 'DEVICE',
        level: 'CRITICAL',
        title: `${p.name}故障`,
        description: `设备温度${p.temperature}℃，检测到异常状态，请立即处理`,
        location3d: p.position,
        status: 'PROCESSING',
        createdAt: now - 2 * 60 * 1000,
        handlerId: 'tech-1',
        handlerName: '王技术',
      });
    });

  return alerts;
}

export function generateRestockOrders(
  concessionItems: ConcessionItem[]
): RestockOrder[] {
  const lowItems = concessionItems.filter((i) => i.currentStock <= i.safetyStock).slice(0, 5);
  const now = Date.now();

  const orders: RestockOrder[] = [
    {
      id: 'RO-2024-0616-001',
      items: lowItems.slice(0, 3).map((item) => ({
        sku: item.sku,
        name: item.name,
        quantity: item.safetyStock * 2,
        unitPrice: item.unitPrice * 0.6,
      })),
      totalAmount: 0,
      status: 'OPERATIONS_PENDING',
      applicantId: 'cm-1',
      applicantName: '刘经理',
      approvals: [
        {
          level: 1,
          approverId: 'cm-1',
          approverName: '刘经理(卖品经理)',
          comment: '库存确实不足，申请补货',
          signedAt: now - 2 * 60 * 60 * 1000,
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
      createdAt: now - 3 * 60 * 60 * 1000,
    },
    {
      id: 'RO-2024-0616-002',
      items: [
        {
          sku: concessionItems[6].sku,
          name: concessionItems[6].name,
          quantity: 200,
          unitPrice: concessionItems[6].unitPrice * 0.6,
        },
        {
          sku: concessionItems[7].sku,
          name: concessionItems[7].name,
          quantity: 150,
          unitPrice: concessionItems[7].unitPrice * 0.6,
        },
      ],
      totalAmount: 0,
      status: 'DELIVERING',
      applicantId: 'cm-1',
      applicantName: '刘经理',
      approvals: [
        {
          level: 1,
          approverId: 'cm-1',
          approverName: '刘经理',
          comment: '周末高峰前备货',
          signedAt: now - 8 * 60 * 60 * 1000,
        },
        {
          level: 2,
          approverId: 'om-1',
          approverName: '赵总监',
          comment: '同意，注意配送时效',
          signedAt: now - 7 * 60 * 60 * 1000,
        },
        {
          level: 3,
          approverId: 'sm-1',
          approverName: '孙店长',
          comment: '批准',
          signedAt: now - 6 * 60 * 60 * 1000,
        },
      ],
      delivery: {
        carrier: '顺丰冷链',
        eta: now + 45 * 60 * 1000,
        progress: 0.6,
        path: [
          { x: -35, y: 0.5, z: -25 },
          { x: -25, y: 0.5, z: -25 },
          { x: -10, y: 0.5, z: -15 },
          { x: 5, y: 0.5, z: -10 },
          { x: 18, y: 0.5, z: -10 },
        ],
        status: 'IN_TRANSIT',
      },
      createdAt: now - 9 * 60 * 60 * 1000,
    },
  ];

  orders.forEach((order) => {
    order.totalAmount = Math.round(
      order.items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0) * 100
    ) / 100;
  });

  return orders;
}

export function generateKPIData(): KPIData {
  return {
    todayBoxOffice: 286580,
    yesterdayBoxOffice: 245720,
    todayFootfall: 6842,
    yesterdayFootfall: 5935,
    concessionRevenue: 82340,
    avgOccupancy: 68.5,
    vipRevenue: 38600,
    activeAlerts: 7,
  };
}

export function generateDeliveryPath(): { x: number; y: number; z: number }[] {
  return [
    { x: -35, y: 0.5, z: -25 },
    { x: -28, y: 0.5, z: -25 },
    { x: -22, y: 0.5, z: -20 },
    { x: -15, y: 0.5, z: -15 },
    { x: -5, y: 0.5, z: -12 },
    { x: 5, y: 0.5, z: -10 },
    { x: 18, y: 0.5, z: -10 },
  ];
}
