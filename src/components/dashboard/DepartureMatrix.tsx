import { useState } from 'react';
import {
  ListChecks,
  Clock,
  User,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  MoreVertical,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { clsx } from 'clsx';

type FilterStatus = 'all' | 'critical' | 'at-risk' | 'ready';

export function DepartureMatrix() {
  const { schedule, vehicles, alerts, selectedDepotId } = useAppStore();
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<'time' | 'status'>('time');

  // Filter schedule for selected depot and upcoming departures
  const depotSchedule = schedule
    .filter((duty) => {
      if (duty.depotId !== selectedDepotId) return false;
      if (duty.status === 'Completed' || duty.status === 'Cancelled') return false;

      // Filter by status
      if (filter === 'critical' && duty.status !== 'Critical') return false;
      if (filter === 'at-risk' && duty.status !== 'At Risk' && duty.status !== 'Critical') return false;
      if (filter === 'ready' && duty.status !== 'Scheduled') return false;

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'time') {
        return a.departureTime.localeCompare(b.departureTime);
      }
      // Sort by status severity
      const statusOrder = { Critical: 0, 'At Risk': 1, Scheduled: 2, Departed: 3 };
      return (statusOrder[a.status as keyof typeof statusOrder] || 4) -
             (statusOrder[b.status as keyof typeof statusOrder] || 4);
    });

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'Critical':
        return { badge: 'bg-red-500/20 text-red-400 border-red-500/30', row: 'bg-red-950/10' };
      case 'At Risk':
        return { badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30', row: 'bg-amber-950/10' };
      case 'Scheduled':
        return { badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', row: '' };
      case 'Departed':
        return { badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30', row: 'opacity-60' };
      default:
        return { badge: 'bg-slate-500/20 text-slate-400 border-slate-500/30', row: '' };
    }
  };

  // Mini sparkline for SoC trajectory
  const SoCSparkline = ({ current, target }: { current: number; target: number }) => {
    const width = 60;
    const height = 20;
    const currentX = (current / 100) * width;
    const targetX = (target / 100) * width;

    return (
      <svg width={width} height={height} className="inline-block ml-2">
        {/* Background */}
        <rect x="0" y="8" width={width} height="4" rx="2" fill="#334155" />
        {/* Current fill */}
        <rect
          x="0"
          y="8"
          width={currentX}
          height="4"
          rx="2"
          fill={current >= target ? '#22c55e' : current >= target - 10 ? '#f59e0b' : '#ef4444'}
        />
        {/* Target marker */}
        <line
          x1={targetX}
          y1="4"
          x2={targetX}
          y2="16"
          stroke="#94a3b8"
          strokeWidth="2"
          strokeDasharray="2,2"
        />
        {/* Current marker */}
        <circle
          cx={currentX}
          cy="10"
          r="3"
          fill={current >= target ? '#22c55e' : current >= target - 10 ? '#f59e0b' : '#ef4444'}
        />
      </svg>
    );
  };

  return (
    <div className="glass-card h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <ListChecks className="w-5 h-5 text-blue-400" />
          <div>
            <h2 className="font-semibold text-white">Morning Departure Matrix</h2>
            <p className="text-xs text-slate-400">Next 2 hours</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          {(['all', 'critical', 'at-risk', 'ready'] as FilterStatus[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={clsx(
                'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                filter === f
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
            >
              {f === 'all' ? 'All' : f === 'at-risk' ? 'At Risk' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="data-table">
          <thead className="sticky top-0 bg-slate-900/95 backdrop-blur-sm z-10">
            <tr>
              <th className="w-28">Block/Duty</th>
              <th className="w-32">Vehicle</th>
              <th className="w-20">Location</th>
              <th className="w-20 cursor-pointer hover:text-white" onClick={() => setSortBy('time')}>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Dep Time
                  {sortBy === 'time' && <ChevronDown className="w-3 h-3" />}
                </div>
              </th>
              <th className="w-40">SoC Trajectory</th>
              <th className="w-24 cursor-pointer hover:text-white" onClick={() => setSortBy('status')}>
                Status
                {sortBy === 'status' && <ChevronDown className="w-3 h-3" />}
              </th>
              <th className="w-28">Driver</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {depotSchedule.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-slate-400">
                  No scheduled departures matching filter
                </td>
              </tr>
            ) : (
              depotSchedule.map((duty) => {
                const vehicle = vehicles.find((v) => v.id === duty.vehicleId);
                const alert = alerts.find((a) => a.dutyId === duty.id && !a.isResolved);
                const styles = getStatusStyles(duty.status);

                if (!vehicle) return null;

                const socColor =
                  vehicle.soc >= duty.requiredSoC
                    ? 'text-emerald-400'
                    : vehicle.soc >= duty.requiredSoC - 10
                    ? 'text-amber-400'
                    : 'text-red-400';

                return (
                  <tr
                    key={duty.id}
                    className={clsx(
                      'transition-colors hover:bg-slate-800/50',
                      styles.row
                    )}
                  >
                    <td>
                      <div className="font-medium text-white">{duty.id}</div>
                      <div className="text-xs text-slate-500">{duty.routeName}</div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{vehicle.id}</span>
                        {alert && (
                          <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
                        )}
                      </div>
                      <div className="text-xs text-slate-500">{vehicle.model}</div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1 text-slate-300">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        <span className="text-xs">{vehicle.location}</span>
                      </div>
                    </td>
                    <td>
                      <span className="font-mono font-bold text-white">
                        {duty.departureTime}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center">
                        <span className={clsx('font-medium', socColor)}>
                          {vehicle.soc}%
                        </span>
                        <span className="text-slate-500 mx-1">→</span>
                        <span className="text-slate-400">{duty.requiredSoC}%</span>
                        <SoCSparkline current={vehicle.soc} target={duty.requiredSoC} />
                      </div>
                    </td>
                    <td>
                      <span
                        className={clsx(
                          'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border',
                          styles.badge
                        )}
                      >
                        {duty.status === 'Critical' || duty.status === 'At Risk' ? (
                          <AlertTriangle className="w-3 h-3" />
                        ) : duty.status === 'Scheduled' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : null}
                        {duty.status === 'At Risk' ? 'AT RISK' : duty.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3 text-slate-500" />
                        <span className="text-sm text-slate-300 truncate max-w-[80px]">
                          {duty.driver}
                        </span>
                      </div>
                    </td>
                    <td>
                      <button className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Summary */}
      <div className="p-3 border-t border-slate-700/50 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <span>
            {depotSchedule.filter((d) => d.status === 'Critical').length} critical
          </span>
          <span>
            {depotSchedule.filter((d) => d.status === 'At Risk').length} at risk
          </span>
          <span>
            {depotSchedule.filter((d) => d.status === 'Scheduled').length} ready
          </span>
        </div>
        <span>
          {depotSchedule.filter((d) => d.status === 'Departed').length} departed today
        </span>
      </div>
    </div>
  );
}
