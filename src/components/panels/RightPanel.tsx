import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Check,
  X,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { useTheaterStore } from '@/stores/useTheaterStore';
import { COLORS, RESTOCK_STATUS_LABELS, QUEUE_THRESHOLD, DISPATCH_EVENT_COLORS, AREA_LABELS } from '@/constants/config';
import { cn, formatDateTime } from '@/utils';

export default function RightPanel() {
  const [activeTab, setActiveTab] = useState<'alerts' | 'scheduling' | 'approval' | 'dispatch'>('alerts');
  const [filteredAlertId, setFilteredAlertId] = useState<string | null>(null);
  const alerts = useTheaterStore((s) => s.alerts);
  const conflicts = useTheaterStore((s) => s.schedulingConflicts);
  const orders = useTheaterStore((s) => s.restockOrders);
  const dispatchEvents = useTheaterStore((s) => s.dispatchEvents);
  const acknowledgeAlert = useTheaterStore((s) => s.acknowledgeAlert);
  const resolveAlert = useTheaterStore((s) => s.resolveAlert);
  const adjustSchedulingConflict = useTheaterStore((s) => s.adjustSchedulingConflict);
  const approveRestockLevel = useTheaterStore((s) => s.approveRestockLevel);
  const rejectRestock = useTheaterStore((s) => s.rejectRestock);
  const setFocusArea = useTheaterStore((s) => s.setFocusArea);

  const tabs = [
    { id: 'alerts', label: '告警中心', icon: AlertTriangle, count: alerts.filter(a => a.status !== 'RESOLVED').length },
    { id: 'scheduling', label: '排片调度', icon: Clock, count: conflicts.filter(c => !c.notified).length },
    { id: 'approval', label: '审批中心', icon: CheckCircle, count: orders.filter(o => ['MANAGER_PENDING', 'OPERATIONS_PENDING', 'STORE_PENDING'].includes(o.status)).length },
    { id: 'dispatch', label: '调度日志', icon: User, count: dispatchEvents.length },
  ] as const;

  const activeAlerts = alerts
    .filter((a) => {
      if (filteredAlertId) return a.id === filteredAlertId || a.id === filteredAlertId;
      return a.status !== 'RESOLVED';
    })
    .sort((a, b) => b.createdAt - a.createdAt);

  const handleDispatchEventClick = (event: any) => {
    if (event.area && event.area !== 'SYSTEM') {
      setFocusArea(event.area as any);
    }

    const alertRelatedTypes = ['QUEUE_WINDOW_OPEN', 'GUIDE_PATH_CREATE', 'GUIDE_PATH_COMPLETE', 'WINDOW_ALL_OPEN_WARNING'];
    const approvalRelatedTypes = ['STOCK_RESTOCK_AUTO', 'RESTOCK_APPROVE', 'RESTOCK_REJECT', 'RESTOCK_DELIVERED'];
    const scheduleRelatedTypes = ['SCHEDULE_ADJUST'];

    if (alertRelatedTypes.includes(event.type)) {
      setActiveTab('alerts');
      setFilteredAlertId(event.relatedAlertId || null);
    } else if (approvalRelatedTypes.includes(event.type)) {
      setActiveTab('approval');
      setFilteredAlertId(null);
    } else if (scheduleRelatedTypes.includes(event.type)) {
      setActiveTab('scheduling');
      setFilteredAlertId(null);
    }
  };

  return (
    <motion.div
      initial={{ x: 420, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200, delay: 0.3 }}
      className="fixed right-4 top-20 h-[calc(100vh-6rem)] w-[380px] glass rounded-2xl z-30 flex flex-col overflow-hidden"
    >
      <div className="p-3 border-b border-border/50 flex items-center gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 px-2 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all',
                isActive
                  ? 'bg-primary/15 text-primary border border-primary/40'
                  : 'text-text-secondary hover:text-text hover:bg-bg-elevated/50'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.count > 0 && (
                <span
                  className="min-w-[16px] h-[16px] rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                  style={{
                    background: tab.id === 'alerts' ? COLORS.danger : tab.id === 'scheduling' ? COLORS.warning : COLORS.primary,
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        <AnimatePresence mode="wait">
          {activeTab === 'alerts' && (
            <motion.div
              key="alerts"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-2.5"
            >
              {filteredAlertId && (
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-between">
                  <span className="text-xs text-primary">正在筛选相关告警</span>
                  <button
                    onClick={() => setFilteredAlertId(null)}
                    className="text-xs text-primary hover:text-primary/80 font-medium"
                  >
                    清除筛选
                  </button>
                </div>
              )}
              {activeAlerts.length === 0 ? (
                <div className="text-center py-12 text-text-muted">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">当前无活跃告警</p>
                </div>
              ) : (
                activeAlerts.map((alert) => {
                  const levelConfig = {
                    INFO: { color: COLORS.primary, label: '提示' },
                    WARNING: { color: COLORS.warning, label: '警告' },
                    CRITICAL: { color: COLORS.danger, label: '严重' },
                  }[alert.level];

                  return (
                    <motion.div
                      key={alert.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        'p-3 rounded-xl border transition-all',
                        alert.status === 'NEW' && 'animate-glow-pulse',
                        {
                          'bg-danger/5 border-danger/40': alert.level === 'CRITICAL',
                          'bg-warning/5 border-warning/40': alert.level === 'WARNING',
                          'bg-primary/5 border-primary/40': alert.level === 'INFO',
                        }
                      )}
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{
                            background: `${levelConfig.color}22`,
                            border: `1px solid ${levelConfig.color}44`,
                          }}
                        >
                          <AlertTriangle className="w-4 h-4" style={{ color: levelConfig.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                              style={{
                                background: `${levelConfig.color}22`,
                                color: levelConfig.color,
                                border: `1px solid ${levelConfig.color}44`,
                              }}
                            >
                              {levelConfig.label}
                            </span>
                            <span className="text-[10px] text-text-muted">
                              {formatDateTime(alert.createdAt)}
                            </span>
                          </div>
                          <h4 className="font-medium text-sm text-text mt-1">{alert.title}</h4>
                          <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">
                            {alert.description}
                          </p>
                          {alert.handlerName && (
                            <div className="text-[10px] text-text-muted mt-1 flex items-center gap-1">
                              <User className="w-2.5 h-2.5" />
                              处理人: {alert.handlerName}
                            </div>
                          )}
                          <div className="flex gap-2 mt-2">
                            {alert.status === 'NEW' && (
                              <button
                                onClick={() => acknowledgeAlert(alert.id)}
                                className="flex-1 text-[10px] py-1.5 rounded-lg bg-primary/15 text-primary border border-primary/40 hover:bg-primary/25 transition-colors font-medium"
                              >
                                确认收到
                              </button>
                            )}
                            {alert.status === 'ACKNOWLEDGED' && (
                              <button
                                onClick={() => resolveAlert(alert.id)}
                                className="flex-1 text-[10px] py-1.5 rounded-lg bg-success/15 text-success border border-success/40 hover:bg-success/25 transition-colors font-medium"
                              >
                                标记已解决
                              </button>
                            )}
                            <button
                              onClick={() => resolveAlert(alert.id)}
                              className="px-2 py-1.5 rounded-lg text-text-secondary hover:text-text hover:bg-bg-elevated/50 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          )}

          {activeTab === 'scheduling' && (
            <motion.div
              key="scheduling"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-2.5"
            >
              {conflicts.length === 0 ? (
                <div className="text-center py-12 text-text-muted">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">排片运行正常</p>
                  <p className="text-xs mt-1">所有场次间隔均 ≥ 20分钟</p>
                </div>
              ) : (
                conflicts.map((conflict) => {
                  const hall = useTheaterStore.getState().halls.find((h) => h.id === conflict.hallId);
                  return (
                    <div
                      key={conflict.id}
                      className="p-3 rounded-xl border border-warning/40 bg-warning/5"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-warning/20 border border-warning/40">
                          <Clock className="w-4 h-4 text-warning" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-warning">
                              场次间隔不足
                            </span>
                            <span className="text-[10px] text-text-muted">
                              {hall?.number}号厅
                            </span>
                          </div>
                          <p className="text-xs text-text mt-1">
                            当前间隔仅 <span className="font-bold text-warning">{conflict.gapMinutes}分钟</span>，建议调整
                          </p>
                          {conflict.adjustedTime && (
                            <p className="text-[11px] text-success mt-1">
                              ✓ 已自动延后 {conflict.adjustedTime} 分钟
                            </p>
                          )}
                          <div className="flex gap-2 mt-2">
                            {!conflict.notified && (
                              <button
                                onClick={() => adjustSchedulingConflict(conflict.id)}
                                className="flex-1 text-[10px] py-1.5 rounded-lg bg-primary/15 text-primary border border-primary/40 hover:bg-primary/25 transition-colors font-medium"
                              >
                                自动调整并推送
                              </button>
                            )}
                            {conflict.notified && (
                              <span className="flex-1 text-[10px] py-1.5 rounded-lg bg-success/10 text-success border border-success/30 text-center font-medium">
                                ✓ 已处理
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </motion.div>
          )}

          {activeTab === 'approval' && (
            <motion.div
              key="approval"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {orders.length === 0 ? (
                <div className="text-center py-12 text-text-muted">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">暂无审批请求</p>
                </div>
              ) : (
                orders.map((order) => (
                  <ApprovalOrderCard
                    key={order.id}
                    order={order}
                    onApprove={approveRestockLevel}
                    onReject={rejectRestock}
                  />
                ))
              )}
            </motion.div>
          )}

          {activeTab === 'dispatch' && (
            <motion.div
              key="dispatch"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-text-secondary">
                  共 {dispatchEvents.length} 条调度记录
                </span>
                <div className="flex gap-1">
                  {Object.entries(DISPATCH_EVENT_COLORS).slice(0, 5).map(([type, info]) => (
                    <span
                      key={type}
                      className="text-[9px] px-1.5 py-0.5 rounded"
                      style={{ background: info.bg, color: info.color }}
                    >
                      {info.label}
                    </span>
                  ))}
                </div>
              </div>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {dispatchEvents.length === 0 ? (
                  <div className="text-center py-12 text-text-muted">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">暂无调度记录</p>
                  </div>
                ) : (
                  dispatchEvents.map((event) => {
                    const eventInfo = DISPATCH_EVENT_COLORS[event.type] || {
                      color: COLORS.textMuted,
                      bg: 'rgba(255,255,255,0.05)',
                      label: event.type,
                    };
                    return (
                      <div
                        key={event.id}
                        className="p-2.5 rounded-lg border border-border/40 glass hover:border-primary/30 transition-colors cursor-pointer"
                        onClick={() => handleDispatchEventClick(event)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ background: eventInfo.color }}
                            />
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 font-medium"
                              style={{ background: eventInfo.bg, color: eventInfo.color }}
                            >
                              {eventInfo.label}
                            </span>
                            <span className="text-xs font-medium text-text truncate">
                              {event.title}
                            </span>
                          </div>
                        </div>
                        <p className="text-[11px] text-text-secondary mt-1.5 ml-3.5 line-clamp-2">
                          {event.description}
                        </p>
                        <div className="flex items-center justify-between mt-1.5 ml-3.5">
                          <span className="text-[10px] text-text-muted">
                            {AREA_LABELS[event.area] || event.area}
                          </span>
                          <span className="text-[10px] text-text-muted">
                            {new Date(event.timestamp).toLocaleString('zh-CN', {
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </span>
                        </div>
                        <div className="ml-3.5 mt-1 flex items-center gap-1">
                          <span className="text-[9px] text-text-muted">操作人:</span>
                          <span className="text-[9px] text-primary">{event.operator}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

interface ApprovalOrderCardProps {
  order: ReturnType<typeof useTheaterStore.getState>['restockOrders'][number];
  onApprove: (orderId: string, level: 1 | 2 | 3, comment: string) => void;
  onReject: (orderId: string, level: 1 | 2 | 3, comment: string) => void;
}

function ApprovalOrderCard({ order, onApprove, onReject }: ApprovalOrderCardProps) {
  const [comment, setComment] = useState('');
  const [expanded, setExpanded] = useState(false);
  const concessionItems = useTheaterStore((s) => s.concessionItems);
  const statusInfo = RESTOCK_STATUS_LABELS[order.status];
  const pendingLevel =
    order.status === 'MANAGER_PENDING'
      ? 1
      : order.status === 'OPERATIONS_PENDING'
      ? 2
      : order.status === 'STORE_PENDING'
      ? 3
      : null;

  const getStockInfo = (sku: string) => {
    return concessionItems.find((c) => c.sku === sku);
  };

  return (
    <div className="p-3 rounded-xl border border-border/60 glass">
      <div
        className="flex items-center justify-between mb-2 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-text">{order.id}</span>
          <ChevronDown
            className={cn(
              'w-3.5 h-3.5 text-text-muted transition-transform',
              expanded ? 'rotate-180' : ''
            )}
          />
        </div>
        <span
          className="text-[10px] px-2 py-0.5 rounded-full font-medium"
          style={{
            background: `${statusInfo.color}22`,
            color: statusInfo.color,
            border: `1px solid ${statusInfo.color}44`,
          }}
        >
          {statusInfo.label}
        </span>
      </div>

      <div className="space-y-2 mb-3">
        {order.items.map((item, i) => {
          const stockInfo = getStockInfo(item.sku);
          const isLow = stockInfo && stockInfo.currentStock <= stockInfo.safetyStock;
          return (
            <div key={i} className="text-xs">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">{item.name}</span>
                <span className="text-text font-medium">× {item.quantity}</span>
              </div>
              {expanded && stockInfo && (
                <div className="flex items-center justify-between mt-1.5 text-[10px] bg-bg-elevated/50 rounded px-2 py-1.5">
                  <div className="flex items-center gap-3">
                    <span className="text-text-muted">当前: <span className="text-text">{stockInfo.currentStock}</span></span>
                    <span className="text-text-muted">安全线: <span className={isLow ? 'text-danger' : 'text-text'}>{stockInfo.safetyStock}</span></span>
                  </div>
                  {isLow && (
                    <span className="text-danger flex items-center gap-0.5">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      不足
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-xs border-t border-border/40 pt-2 mb-2">
        <span className="text-text-secondary">合计金额</span>
        <span className="font-bold text-gold">¥{order.totalAmount.toLocaleString()}</span>
      </div>

      {expanded && (
        <div className="mb-3 p-2 rounded-lg bg-bg-elevated/30 border border-border/40">
          <div className="text-[10px] text-text-muted mb-2 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            审批时间线
          </div>
          <div className="space-y-2">
            {order.approvals.map((ap) => {
              const isCompleted = !!ap.signedAt;
              const isCurrent = pendingLevel === ap.level && !isCompleted;
              return (
                <div key={ap.level} className="flex items-start gap-2">
                  <div
                    className={cn(
                      'w-2 h-2 rounded-full mt-0.5 flex-shrink-0',
                      isCompleted
                        ? 'bg-success'
                        : isCurrent
                        ? 'bg-warning animate-pulse'
                        : 'bg-bg-elevated'
                    )}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          'text-[11px] font-medium',
                          isCompleted
                            ? 'text-text'
                            : isCurrent
                            ? 'text-warning'
                            : 'text-text-muted'
                        )}
                      >
                        {ap.approverName}
                      </span>
                      {isCompleted && (
                        <span className="text-[9px] text-success flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5" />
                          已通过
                        </span>
                      )}
                      {isCurrent && (
                        <span className="text-[9px] text-warning">待处理</span>
                      )}
                    </div>
                    {isCompleted && ap.signedAt && (
                      <div className="text-[9px] text-text-muted mt-0.5">
                        {new Date(ap.signedAt).toLocaleString('zh-CN', {
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {ap.comment && ` · ${ap.comment}`}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {pendingLevel && (
        <div className="space-y-2">
          <input
            type="text"
            placeholder="审批意见..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full text-xs px-3 py-2 rounded-lg bg-bg-elevated/50 border border-border/50 text-text placeholder-text-muted focus:outline-none focus:border-primary/50"
          />
          <div className="flex gap-2">
            <button
              onClick={() => onApprove(order.id, pendingLevel as 1 | 2 | 3, comment || '同意')}
              className="flex-1 text-[11px] py-2 rounded-lg bg-success/15 text-success border border-success/40 hover:bg-success/25 transition-colors font-medium flex items-center justify-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              通过
            </button>
            <button
              onClick={() => onReject(order.id, pendingLevel as 1 | 2 | 3, comment || '驳回')}
              className="flex-1 text-[11px] py-2 rounded-lg bg-danger/15 text-danger border border-danger/40 hover:bg-danger/25 transition-colors font-medium flex items-center justify-center gap-1"
            >
              <XCircle className="w-3.5 h-3.5" />
              驳回
            </button>
          </div>
        </div>
      )}

      {order.delivery && (
        <div className="mt-2 p-2 rounded-lg bg-primary/5 border border-primary/30">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-secondary flex items-center gap-1">
              <ChevronRight className="w-3 h-3" />
              {order.delivery.carrier}
            </span>
            <span className="text-primary font-medium">
              {order.delivery.status === 'DELIVERED'
                ? '已送达'
                : `${Math.round(order.delivery.progress * 100)}%`}
            </span>
          </div>
          <div className="h-1.5 bg-bg-elevated rounded-full mt-1.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-vip transition-all"
              style={{ width: `${order.delivery.progress * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
