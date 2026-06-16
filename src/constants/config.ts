export const COLORS = {
  background: '#0A1628',
  surface: '#0F2137',
  surfaceElevated: '#162A45',
  border: '#1E3A5F',
  primary: '#00D4FF',
  primaryDim: '#0099BB',
  success: '#00FFA3',
  warning: '#FF8C00',
  danger: '#FF3B5C',
  gold: '#FFD700',
  vip: '#9D4EDD',
  text: '#E8F4FD',
  textSecondary: '#8BA3C0',
  textMuted: '#5A7594',
  heat: ['#00FFA3', '#8CFF00', '#FFD700', '#FF8C00', '#FF3B5C'],
} as const;

export const HEAT_COLOR_MAP: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: COLORS.heat[0],
  2: COLORS.heat[1],
  3: COLORS.heat[2],
  4: COLORS.heat[3],
  5: COLORS.heat[4],
};

export const HALL_TYPE_LABELS: Record<string, string> = {
  STANDARD: '标准厅',
  IMAX: 'IMAX厅',
  DOLBY: '杜比厅',
  LUXE: '巨幕厅',
};

export const AC_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  COOLING: { label: '制冷中', color: COLORS.primary },
  HEATING: { label: '制热中', color: COLORS.warning },
  VENTILATION: { label: '通风', color: COLORS.success },
  OFF: { label: '关闭', color: COLORS.textMuted },
  FAULT: { label: '故障', color: COLORS.danger },
};

export const TICKET_MACHINE_STATUS_LABELS: Record<
  string,
  { label: string; color: string }
> = {
  ONLINE: { label: '在线', color: COLORS.success },
  OFFLINE: { label: '离线', color: COLORS.textMuted },
  FAULT: { label: '故障', color: COLORS.danger },
};

export const RESTOCK_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT: { label: '草稿', color: COLORS.textMuted },
  MANAGER_PENDING: { label: '待卖品经理审批', color: COLORS.warning },
  OPERATIONS_PENDING: { label: '待运营经理审批', color: COLORS.primary },
  STORE_PENDING: { label: '待店长审批', color: COLORS.gold },
  APPROVED: { label: '审批通过', color: COLORS.success },
  REJECTED: { label: '已驳回', color: COLORS.danger },
  DELIVERING: { label: '配送中', color: COLORS.primary },
  COMPLETED: { label: '已完成', color: COLORS.success },
};

export const QUEUE_THRESHOLD = {
  WARNING: 10,
  RESOLVE: 5,
} as const;

export const SCHEDULING = {
  MIN_GAP_MINUTES: 20,
  CLEANING_MINUTES: 15,
} as const;

export const AREA_LABELS: Record<string, string> = {
  HALLS: '影厅区域',
  TICKETING: '售票大厅',
  CONCESSION: '卖品区',
  VIP: 'VIP休息室',
  PROJECTION: '放映机房',
  CONTROL: '总控中心',
};

export const CINEMA_DIMENSIONS = {
  width: 60,
  depth: 40,
  height: 15,
  floorHeight: 5,
} as const;

export const DISPATCH_EVENT_COLORS: Record<string, { color: string; bg: string; label: string }> = {
  QUEUE_WINDOW_OPEN: { color: '#00D4AA', bg: 'rgba(0, 212, 170, 0.1)', label: '自动开窗' },
  GUIDE_PATH_CREATE: { color: '#00FF88', bg: 'rgba(0, 255, 136, 0.1)', label: '分流引导' },
  GUIDE_PATH_COMPLETE: { color: '#88CCFF', bg: 'rgba(136, 204, 255, 0.1)', label: '分流完成' },
  STOCK_RESTOCK_AUTO: { color: '#FFB800', bg: 'rgba(255, 184, 0, 0.1)', label: '自动补货' },
  RESTOCK_APPROVE: { color: '#00D4AA', bg: 'rgba(0, 212, 170, 0.1)', label: '审批通过' },
  RESTOCK_REJECT: { color: '#FF4D4F', bg: 'rgba(255, 77, 79, 0.1)', label: '审批驳回' },
  RESTOCK_DELIVERED: { color: '#2F54FF', bg: 'rgba(47, 84, 255, 0.1)', label: '配送完成' },
  SCHEDULE_ADJUST: { color: '#9254DE', bg: 'rgba(146, 84, 222, 0.1)', label: '排片调整' },
  WINDOW_ALL_OPEN_WARNING: { color: '#FF7A45', bg: 'rgba(255, 122, 69, 0.1)', label: '窗口告警' },
};
