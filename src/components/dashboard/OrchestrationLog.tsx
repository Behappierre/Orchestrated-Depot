import { useState } from 'react';
import {
  Radio,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Zap,
  ArrowRightLeft,
  Eye,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { clsx } from 'clsx';
import type { Alert } from '../../types';

export function OrchestrationLog() {
  const { alerts, resolveAlert, simulationTime } = useAppStore();
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);

  const unresolvedAlerts = alerts.filter((a) => !a.isResolved);
  const resolvedAlerts = alerts.filter((a) => a.isResolved).slice(0, 3);

  const formatTimeRemaining = (deadline?: Date) => {
    if (!deadline) return null;
    const diff = deadline.getTime() - simulationTime.getTime();
    if (diff <= 0) return 'OVERDUE';
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `T-${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `T-${hours}h ${minutes % 60}m`;
  };

  const getSeverityStyles = (severity: Alert['severity']) => {
    switch (severity) {
      case 'Critical':
        return {
          card: 'border-l-red-500 bg-red-950/20',
          icon: 'text-red-400',
          badge: 'bg-red-500/20 text-red-400',
          pulse: true,
        };
      case 'Warning':
        return {
          card: 'border-l-amber-500 bg-amber-950/20',
          icon: 'text-amber-400',
          badge: 'bg-amber-500/20 text-amber-400',
          pulse: false,
        };
      default:
        return {
          card: 'border-l-blue-500 bg-blue-950/20',
          icon: 'text-blue-400',
          badge: 'bg-blue-500/20 text-blue-400',
          pulse: false,
        };
    }
  };

  return (
    <div className="glass-card h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Radio className="w-5 h-5 text-blue-400" />
            {unresolvedAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
            )}
          </div>
          <div>
            <h2 className="font-semibold text-white">Orchestration Log</h2>
            <p className="text-xs text-slate-400">Risk Center</p>
          </div>
        </div>
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300">
          {unresolvedAlerts.length} active
        </span>
      </div>

      {/* Alerts List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {unresolvedAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="font-medium text-white mb-1">System Optimal</h3>
            <p className="text-sm text-slate-400">
              No active alerts. All vehicles on track for scheduled departures.
            </p>
          </div>
        ) : (
          unresolvedAlerts.map((alert) => {
            const styles = getSeverityStyles(alert.severity);
            const isExpanded = expandedAlertId === alert.id;
            const timeRemaining = formatTimeRemaining(alert.deadlineTime);

            return (
              <div
                key={alert.id}
                className={clsx(
                  'rounded-lg border-l-4 overflow-hidden transition-all duration-200',
                  styles.card,
                  styles.pulse && 'pulse-danger'
                )}
              >
                {/* Alert Header */}
                <button
                  onClick={() => setExpandedAlertId(isExpanded ? null : alert.id)}
                  className="w-full p-3 text-left hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={clsx('w-5 h-5 mt-0.5 flex-shrink-0', styles.icon)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', styles.badge)}>
                          {alert.severity}
                        </span>
                        {timeRemaining && (
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {timeRemaining}
                          </span>
                        )}
                      </div>
                      <h3 className="font-medium text-white text-sm truncate">
                        {alert.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {alert.message}
                      </p>
                    </div>
                    <ChevronRight
                      className={clsx(
                        'w-5 h-5 text-slate-500 transition-transform',
                        isExpanded && 'rotate-90'
                      )}
                    />
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-3 pb-3 border-t border-slate-700/50 mt-1 pt-3 animate-slide-down">
                    {/* Impact */}
                    <div className="mb-3 p-2 rounded-lg bg-slate-800/50">
                      <div className="text-xs text-slate-400 mb-1">Impact if unresolved:</div>
                      <div className="text-sm text-white">{alert.impactDescription}</div>
                      {alert.penaltyRisk > 0 && (
                        <div className="text-xs text-red-400 mt-1">
                          Est. penalty risk: £{alert.penaltyRisk.toLocaleString()}
                        </div>
                      )}
                    </div>

                    {/* Proposed Actions */}
                    <div className="space-y-2">
                      <div className="text-xs text-slate-400 mb-2">
                        Recommended actions ({alert.confidenceScore}% confidence):
                      </div>
                      {alert.proposedActions.map((action) => (
                        <button
                          key={action.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            resolveAlert(alert.id, action.id);
                            setExpandedAlertId(null);
                          }}
                          className={clsx(
                            'w-full p-2 rounded-lg text-left transition-all',
                            action.isRecommended
                              ? 'bg-blue-500/20 border border-blue-500/30 hover:bg-blue-500/30'
                              : 'bg-slate-800/50 border border-slate-700 hover:bg-slate-700/50'
                          )}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {action.type === 'swap' && (
                              <ArrowRightLeft className="w-4 h-4 text-blue-400" />
                            )}
                            {action.type === 'prioritize' && (
                              <Zap className="w-4 h-4 text-amber-400" />
                            )}
                            {action.type === 'acknowledge' && (
                              <Eye className="w-4 h-4 text-slate-400" />
                            )}
                            <span className="font-medium text-sm text-white">
                              {action.label}
                            </span>
                            {action.isRecommended && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500 text-white font-medium">
                                RECOMMENDED
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400">{action.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-slate-500">
                              Confidence: {action.confidence}%
                            </span>
                            {action.estimatedSavings && (
                              <span className="text-[10px] text-emerald-400">
                                Est. savings: £{action.estimatedSavings}
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Resolved Alerts (collapsed) */}
        {resolvedAlerts.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <div className="text-xs text-slate-500 mb-2">Recently resolved</div>
            {resolvedAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/30 mb-1"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-slate-400 truncate flex-1">
                  {alert.title}
                </span>
                <span className="text-[10px] text-slate-500">
                  {alert.resolution}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
