import { useState, useMemo } from 'react';
import {
  Bus,
  Search,
  Filter,
  Battery,
  Thermometer,
  Gauge,
  Clock,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { clsx } from 'clsx';
import type { Vehicle } from '../../types';

type SortField = 'id' | 'soc' | 'soh' | 'efficiency' | 'status';
type SortDirection = 'asc' | 'desc';

export function FleetView() {
  const { vehicles, selectedDepotId, schedule } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const depotVehicles = vehicles.filter((v) => v.depotId === selectedDepotId);

  const filteredVehicles = useMemo(() => {
    return depotVehicles
      .filter((v) => {
        const matchesSearch =
          v.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.model.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        let aVal: string | number = a[sortField];
        let bVal: string | number = b[sortField];

        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = (bVal as string).toLowerCase();
        }

        if (sortDirection === 'asc') {
          return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        }
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      });
  }, [depotVehicles, searchQuery, statusFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSoCColor = (soc: number) => {
    if (soc >= 80) return 'text-emerald-400';
    if (soc >= 50) return 'text-amber-400';
    return 'text-red-400';
  };

  const getSoHColor = (soh: number) => {
    if (soh >= 95) return 'text-emerald-400';
    if (soh >= 85) return 'text-amber-400';
    return 'text-red-400';
  };

  const getEfficiencyColor = (eff: number) => {
    if (eff <= 1.2) return 'text-emerald-400';
    if (eff <= 1.4) return 'text-amber-400';
    return 'text-red-400';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Charging':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Driving':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Idle':
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      case 'Faulted':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'Maintenance':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const statuses = ['all', 'Charging', 'Driving', 'Idle', 'Faulted', 'Maintenance'];

  return (
    <div className="h-full flex gap-4">
      {/* Main Table */}
      <div className="flex-1 glass-card flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bus className="w-5 h-5 text-blue-400" />
            <div>
              <h2 className="font-semibold text-white">Fleet Overview</h2>
              <p className="text-xs text-slate-400">
                {filteredVehicles.length} of {depotVehicles.length} vehicles
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search vehicle..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-48 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1">
              <Filter className="w-4 h-4 text-slate-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s === 'all' ? 'All Status' : s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="data-table">
            <thead className="sticky top-0 bg-slate-900/95 backdrop-blur-sm z-10">
              <tr>
                <th
                  className="cursor-pointer hover:text-white"
                  onClick={() => handleSort('id')}
                >
                  <div className="flex items-center gap-1">
                    Vehicle ID
                    {sortField === 'id' && (
                      <ChevronDown
                        className={clsx('w-4 h-4', sortDirection === 'desc' && 'rotate-180')}
                      />
                    )}
                  </div>
                </th>
                <th>Model</th>
                <th
                  className="cursor-pointer hover:text-white"
                  onClick={() => handleSort('status')}
                >
                  Status
                </th>
                <th
                  className="cursor-pointer hover:text-white"
                  onClick={() => handleSort('soc')}
                >
                  <div className="flex items-center gap-1">
                    <Battery className="w-3 h-3" />
                    SoC
                  </div>
                </th>
                <th
                  className="cursor-pointer hover:text-white"
                  onClick={() => handleSort('soh')}
                >
                  SoH
                </th>
                <th
                  className="cursor-pointer hover:text-white"
                  onClick={() => handleSort('efficiency')}
                >
                  <div className="flex items-center gap-1">
                    <Gauge className="w-3 h-3" />
                    Efficiency
                  </div>
                </th>
                <th>Assignment</th>
                <th>Driver Score</th>
                <th>Cycles</th>
                <th>
                  <div className="flex items-center gap-1">
                    <Thermometer className="w-3 h-3" />
                    Temp
                  </div>
                </th>
                <th>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Sync
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map((vehicle) => {
                const duty = schedule.find((d) => d.vehicleId === vehicle.id);
                const isAtRisk =
                  vehicle.soc < vehicle.requiredSoC && vehicle.status !== 'Charging';

                return (
                  <tr
                    key={vehicle.id}
                    onClick={() => setSelectedVehicle(vehicle)}
                    className={clsx(
                      'cursor-pointer',
                      selectedVehicle?.id === vehicle.id && 'bg-blue-500/10',
                      isAtRisk && 'bg-red-950/10'
                    )}
                  >
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{vehicle.id}</span>
                        {isAtRisk && (
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                        )}
                        {vehicle.nextService === 'Urgent' && (
                          <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] rounded">
                            SERVICE
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div>
                        <span className="text-slate-300">{vehicle.model}</span>
                        <div className="text-xs text-slate-500">{vehicle.manufacturer}</div>
                      </div>
                    </td>
                    <td>
                      <span
                        className={clsx(
                          'px-2 py-1 rounded-full text-xs font-medium border',
                          getStatusBadge(vehicle.status)
                        )}
                      >
                        {vehicle.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className={clsx('font-semibold', getSoCColor(vehicle.soc))}>
                          {vehicle.soc}%
                        </span>
                        <div className="w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={clsx(
                              'h-full rounded-full',
                              vehicle.soc >= 80 && 'bg-emerald-500',
                              vehicle.soc >= 50 && vehicle.soc < 80 && 'bg-amber-500',
                              vehicle.soc < 50 && 'bg-red-500'
                            )}
                            style={{ width: `${vehicle.soc}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className={getSoHColor(vehicle.soh)}>{vehicle.soh}%</td>
                    <td>
                      <span className={getEfficiencyColor(vehicle.efficiency)}>
                        {vehicle.efficiency.toFixed(2)}
                      </span>
                      <span className="text-xs text-slate-500 ml-1">kWh/km</span>
                    </td>
                    <td>
                      {duty ? (
                        <div>
                          <span className="text-slate-300">{duty.id}</span>
                          <div className="text-xs text-slate-500">{duty.routeName}</div>
                        </div>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={clsx(
                          'font-medium',
                          vehicle.driverScore >= 90 && 'text-emerald-400',
                          vehicle.driverScore >= 75 && vehicle.driverScore < 90 && 'text-amber-400',
                          vehicle.driverScore < 75 && 'text-red-400'
                        )}
                      >
                        {vehicle.driverScore}
                      </span>
                    </td>
                    <td>
                      <span
                        className={clsx(
                          vehicle.cycles > 1000 ? 'text-red-400' : 'text-slate-400'
                        )}
                      >
                        {vehicle.cycles}
                      </span>
                    </td>
                    <td className="text-slate-400">{vehicle.batteryTemp}°C</td>
                    <td>
                      <span className="font-mono text-xs text-slate-500">{vehicle.lastSync}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Panel */}
      {selectedVehicle && (
        <div className="w-80 glass-card p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">{selectedVehicle.id}</h3>
            <button
              onClick={() => setSelectedVehicle(null)}
              className="text-slate-400 hover:text-white"
            >
              &times;
            </button>
          </div>

          <div className="space-y-4">
            {/* SoC Ring */}
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    fill="none"
                    stroke="#334155"
                    strokeWidth="8"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    fill="none"
                    stroke={
                      selectedVehicle.soc >= 80
                        ? '#22c55e'
                        : selectedVehicle.soc >= 50
                        ? '#f59e0b'
                        : '#ef4444'
                    }
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(selectedVehicle.soc / 100) * 226} 226`}
                    style={{
                      filter: `drop-shadow(0 0 6px ${
                        selectedVehicle.soc >= 80
                          ? '#22c55e'
                          : selectedVehicle.soc >= 50
                          ? '#f59e0b'
                          : '#ef4444'
                      })`,
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-white">{selectedVehicle.soc}%</span>
                  <span className="text-[10px] text-slate-400">SoC</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="text-sm text-slate-400">Range Remaining</div>
                <div className="text-2xl font-bold text-white">
                  {selectedVehicle.rangeRemaining} km
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <div className="text-xs text-slate-400">Battery Health</div>
                <div className={clsx('text-lg font-bold', getSoHColor(selectedVehicle.soh))}>
                  {selectedVehicle.soh}%
                </div>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <div className="text-xs text-slate-400">Temperature</div>
                <div className="text-lg font-bold text-white">{selectedVehicle.batteryTemp}°C</div>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <div className="text-xs text-slate-400">Efficiency</div>
                <div
                  className={clsx(
                    'text-lg font-bold',
                    getEfficiencyColor(selectedVehicle.efficiency)
                  )}
                >
                  {selectedVehicle.efficiency.toFixed(2)}
                </div>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <div className="text-xs text-slate-400">Cycles</div>
                <div className="text-lg font-bold text-white">{selectedVehicle.cycles}</div>
              </div>
            </div>

            {/* Service Info */}
            <div className="p-3 bg-slate-800/50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Next Service</span>
                <span
                  className={clsx(
                    'text-sm font-medium',
                    selectedVehicle.nextService === 'Urgent'
                      ? 'text-red-400'
                      : 'text-slate-300'
                  )}
                >
                  {selectedVehicle.nextService}
                </span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-slate-400">Odometer</span>
                <span className="text-sm text-slate-300">
                  {selectedVehicle.odometer.toLocaleString()} km
                </span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-slate-400">Connection</span>
                <span className="text-sm text-slate-300">{selectedVehicle.connectionType}</span>
              </div>
            </div>

            {/* Charging Info (if charging) */}
            {selectedVehicle.status === 'Charging' && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Battery className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-blue-400">Charging</span>
                </div>
                <div className="text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Time remaining:</span>
                    <span className="text-white">{selectedVehicle.chargingTimeRemaining} min</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span>Target SoC:</span>
                    <span className="text-white">{selectedVehicle.targetSoC}%</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span>Charger:</span>
                    <span className="text-white">{selectedVehicle.chargerId}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
