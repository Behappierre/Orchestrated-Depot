import {
  CheckCircle2,
  Zap,
  Gauge,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Leaf,
  Battery,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { clsx } from 'clsx';
import { AnimatedCounter } from '../shared/AnimatedCounter';
import { ProgressRing } from '../shared/ProgressRing';

export function KPIRibbon() {
  const { getStats, tariff, simulationTime } = useAppStore();
  const stats = getStats();

  const currentHour = simulationTime.getHours();
  const currentPeriod = tariff.periods.find(
    (p) => currentHour >= p.startHour && currentHour < p.endHour
  );

  const kpis = [
    {
      label: 'Fleet Readiness',
      value: stats.fleetReadiness,
      unit: '%',
      icon: CheckCircle2,
      trend: stats.fleetReadiness >= 95 ? 'up' : 'down',
      trendValue: stats.fleetReadiness >= 95 ? '+2%' : '-3%',
      status: stats.fleetReadiness >= 95 ? 'success' : stats.fleetReadiness >= 85 ? 'warning' : 'danger',
      subtext: `${stats.vehiclesCharging + stats.vehiclesDriving} active`,
      showRing: true,
    },
    {
      label: 'Charger Uptime',
      value: stats.chargerUptime,
      unit: '%',
      icon: Zap,
      trend: 'up',
      trendValue: '+0.2%',
      status: stats.chargerUptime >= 95 ? 'success' : 'warning',
      subtext: 'Last 24h',
      showRing: true,
    },
    {
      label: 'Grid Load',
      value: Math.round((stats.currentLoad / stats.maxLoad) * 100),
      unit: '%',
      icon: Gauge,
      trend: 'stable',
      status: stats.currentLoad / stats.maxLoad > 0.85 ? 'warning' : 'success',
      subtext: `${Math.round(stats.currentLoad)}kW / ${Math.round(stats.maxLoad)}kW`,
      showRing: true,
    },
    {
      label: 'Energy Rate',
      value: currentPeriod?.rate || 0.15,
      unit: '/kWh',
      prefix: '£',
      icon: Battery,
      status: currentPeriod?.type === 'peak' ? 'danger' : currentPeriod?.type === 'off-peak' ? 'success' : 'warning',
      subtext: currentPeriod?.type?.replace('-', ' ').toUpperCase() || 'STANDARD',
    },
    {
      label: 'Today Savings',
      value: stats.todaySavings,
      unit: '',
      prefix: '£',
      icon: TrendingUp,
      trend: 'up',
      trendValue: '+12%',
      status: 'success',
      subtext: 'vs peak charging',
    },
    {
      label: 'CO2 Avoided',
      value: stats.co2Saved,
      unit: 'kg',
      icon: Leaf,
      trend: 'up',
      status: 'success',
      subtext: 'This month',
    },
    {
      label: 'Active Alerts',
      value: stats.activeAlerts,
      unit: '',
      icon: AlertTriangle,
      status: stats.activeAlerts > 2 ? 'danger' : stats.activeAlerts > 0 ? 'warning' : 'success',
      subtext: stats.activeAlerts === 0 ? 'All clear' : `${stats.vehiclesAtRisk} at risk`,
      pulse: stats.activeAlerts > 0,
    },
  ];

  return (
    <div className="grid grid-cols-7 gap-3">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        const statusColors = {
          success: 'text-emerald-400',
          warning: 'text-amber-400',
          danger: 'text-red-400',
        };
        const statusBg = {
          success: 'bg-emerald-500/10',
          warning: 'bg-amber-500/10',
          danger: 'bg-red-500/10',
        };

        return (
          <div
            key={kpi.label}
            className={clsx(
              'glass-card p-4 flex flex-col gap-2 transition-all duration-200 hover:scale-[1.02]',
              kpi.pulse && 'pulse-danger'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">
                {kpi.label}
              </span>
              <div
                className={clsx(
                  'p-1.5 rounded-lg',
                  statusBg[kpi.status as keyof typeof statusBg]
                )}
              >
                <Icon
                  className={clsx(
                    'w-4 h-4',
                    statusColors[kpi.status as keyof typeof statusColors]
                  )}
                />
              </div>
            </div>

            <div className="flex items-end gap-2">
              {kpi.showRing ? (
                <ProgressRing
                  value={kpi.value as number}
                  size={48}
                  strokeWidth={4}
                  status={kpi.status as 'success' | 'warning' | 'danger'}
                />
              ) : null}

              <div className="flex-1">
                <div className="flex items-baseline gap-1">
                  {kpi.prefix && (
                    <span className="text-lg font-semibold text-slate-400">
                      {kpi.prefix}
                    </span>
                  )}
                  <AnimatedCounter
                    value={kpi.value as number}
                    className={clsx(
                      'text-2xl font-bold tracking-tight',
                      statusColors[kpi.status as keyof typeof statusColors]
                    )}
                    decimals={kpi.label === 'Energy Rate' ? 2 : 0}
                  />
                  {kpi.unit && (
                    <span className="text-sm text-slate-400">{kpi.unit}</span>
                  )}
                </div>

                {kpi.trend && kpi.trendValue && (
                  <div
                    className={clsx(
                      'flex items-center gap-1 text-xs mt-1',
                      kpi.trend === 'up' && 'text-emerald-400',
                      kpi.trend === 'down' && 'text-red-400',
                      kpi.trend === 'stable' && 'text-slate-400'
                    )}
                  >
                    {kpi.trend === 'up' && <TrendingUp className="w-3 h-3" />}
                    {kpi.trend === 'down' && <TrendingDown className="w-3 h-3" />}
                    <span>{kpi.trendValue}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="text-xs text-slate-500">{kpi.subtext}</div>
          </div>
        );
      })}
    </div>
  );
}
