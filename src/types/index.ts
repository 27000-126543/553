export type HallType = 'STANDARD' | 'IMAX' | 'DOLBY' | 'LUXE';
export type ACStatus = 'COOLING' | 'HEATING' | 'VENTILATION' | 'OFF' | 'FAULT';
export type TicketMachineStatus = 'ONLINE' | 'OFFLINE' | 'FAULT';
export type AlertType = 'QUEUE' | 'STOCK' | 'DEVICE' | 'EMERGENCY' | 'SCHEDULE';
export type AlertLevel = 'INFO' | 'WARNING' | 'CRITICAL';
export type AlertStatus = 'NEW' | 'ACKNOWLEDGED' | 'PROCESSING' | 'RESOLVED';
export type RestockStatus =
  | 'DRAFT'
  | 'MANAGER_PENDING'
  | 'OPERATIONS_PENDING'
  | 'STORE_PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'DELIVERING'
  | 'COMPLETED';
export type ConcessionCategory = 'SNACK' | 'BEVERAGE' | 'MEAL' | 'MERCHANDISE';
export type AreaType =
  | 'HALLS'
  | 'TICKETING'
  | 'CONCESSION'
  | 'VIP'
  | 'PROJECTION'
  | 'CONTROL';
export type CameraMode = 'ORBIT' | 'FIRST_PERSON' | 'AUTO_ROTATE';
export type HeatLevel = 1 | 2 | 3 | 4 | 5;
export type VIPRoomStatus = 'IDLE' | 'IN_USE' | 'RESERVED';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Movie {
  id: string;
  title: string;
  poster: string;
  duration: number;
  rating: number;
  genre: string;
}

export interface Hall {
  id: string;
  number: number;
  name: string;
  type: HallType;
  totalSeats: number;
  screenSize: { width: number; height: number };
  position: Vec3;
  rotation: number;
}

export interface HallRealtime {
  hallId: string;
  currentMovie: Movie | null;
  currentShowtime: Showtime | null;
  occupiedSeats: number;
  occupancyRate: number;
  temperature: number;
  humidity: number;
  acStatus: ACStatus;
  pm25: number;
}

export interface Showtime {
  id: string;
  hallId: string;
  movieId: string;
  movie: Movie;
  startTime: Date;
  endTime: Date;
  soldSeats: number;
  predictedOccupancy: number;
  heatLevel: HeatLevel;
}

export interface BoxOfficeDataPoint {
  timestamp: number;
  boxOffice: number;
  footfall: number;
  hallId?: string;
}

export interface ConcessionItem {
  sku: string;
  name: string;
  category: ConcessionCategory;
  currentStock: number;
  safetyStock: number;
  dangerStock: number;
  unitPrice: number;
  shelfPosition: { row: number; col: number };
  position: Vec3;
}

export interface RestockApproval {
  level: 1 | 2 | 3;
  approverId: string;
  approverName: string;
  comment: string;
  signedAt: number | null;
}

export interface RestockOrder {
  id: string;
  items: { sku: string; name: string; quantity: number; unitPrice: number }[];
  totalAmount: number;
  status: RestockStatus;
  applicantId: string;
  applicantName: string;
  approvals: RestockApproval[];
  delivery: {
    carrier: string;
    eta: number;
    progress: number;
    path: Vec3[];
    status: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED';
  } | null;
  createdAt: number;
}

export interface TicketMachine {
  id: string;
  status: TicketMachineStatus;
  queueLength: number;
  paperRemaining: number;
  position: Vec3;
}

export interface CounterWindow {
  id: string;
  name: string;
  open: boolean;
  queueLength: number;
  position: Vec3;
}

export interface VIPRoom {
  id: string;
  name: string;
  status: VIPRoomStatus;
  customerName: string | null;
  customerLevel: 'GOLD' | 'PLATINUM' | 'DIAMOND' | null;
  remainingMinutes: number;
  position: Vec3;
}

export interface Projector {
  id: string;
  name: string;
  status: 'RUNNING' | 'STANDBY' | 'FAULT';
  lampHours: number;
  lampMaxHours: number;
  temperature: number;
  position: Vec3;
}

export interface AlertEvent {
  id: string;
  type: AlertType;
  level: AlertLevel;
  title: string;
  description: string;
  location3d: Vec3;
  status: AlertStatus;
  createdAt: number;
  handlerId?: string;
  handlerName?: string;
}

export interface GuidePath {
  id: string;
  from: Vec3;
  to: Vec3;
  points: Vec3[];
  active: boolean;
}

export interface SchedulingConflict {
  id: string;
  hallId: string;
  showtime1Id: string;
  showtime2Id: string;
  gapMinutes: number;
  adjustedTime: number | null;
  notified: boolean;
}

export interface KPIData {
  todayBoxOffice: number;
  yesterdayBoxOffice: number;
  todayFootfall: number;
  yesterdayFootfall: number;
  concessionRevenue: number;
  avgOccupancy: number;
  vipRevenue: number;
  activeAlerts: number;
}
