import { useMemo } from 'react';
import {
  Zap,
  TrendingUp,
  Leaf,
  DollarSign,
  Activity,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useAppStore } from '../../stores/useAppStore';
import { clsx } from 'clsx';
import { getTariffColor } from '../../data/mockTariff';

export function EnergyView() {
  const {
    chargers,
    depots,
    selectedDepotId,
    tariff,
    simulationTime,
    getStats,
  } = useAppStore();

  const stats = getStats();
  const selectedDepot = depots.find((d) => d.id === selectedDepotId);
  const depotChargers = chargers.filter((c) => c.depotId === selectedDepotId);

  // Generate 24-hour load profile data
  const loadProfileData = useMemo(() => {
    const data = [];
    const currentHour = simulationTime.getHours();

    for (let i = 0; i < 24; i++) {
      const period = tariff.periods.find((p) => i >= p.startHour && i < p.endHour);

      // Simulate load pattern (higher overnight for depot charging)
      let baseLoad = 400;
      if (i >= 0 && i < 6) baseLoad = 800 + Math.random() * 200; // Overnight charging
      else if (i >= 6 && i < 9) baseLoad = 600 + Math.random() * 100; // Morning ramp down
      else if (i >= 9 && i < 16) baseLoad = 200 + Math.random() * 100; // Day (vehicles out)
      else if (i >= 16 && i < 20) baseLoad = 300 + Math.random() * 150; // Evening return
      else baseLoad = 500 + Math.random() * 200; // Night buildup

      data.push({
        hour: `${String(i).padStart(2, '0')}:00`,
        load: Math.round(baseLoad),
        forecast: Math.round(baseLoad * (0.9 + Math.random() * 0.2)),
        limit: selectedDepot?.maxCapacity ? selectedDepot.maxCapacity * 1000 : 2400,
        rate: period?.rate || 0.15,
        tariffType: period?.type || 'standard',
        isCurrent: i === currentHour,
      });
    }
    return data;
  }, [tariff, selectedDepot, simulationTime]);

  const currentHour = simulationTime.getHours();
  const currentPeriod = tariff.periods.find(
    (p) => currentHour >= p.startHour && currentHour < p.endHour
  );

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Top Stats Row */}
      <div className="grid grid-cols-5 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
            <Activity className="w-4 h-4" />
            Current Load
          </div>
          <div className="text-2xl font-bold text-white">
            {Math.round(stats.currentLoad)} <span className="text-sm text-slate-400">kW</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {Math.round((stats.currentLoad / stats.maxLoad) * 100)}% of capacity
          </div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
            <DollarSign className="w-4 h-4" />
            Current Rate
          </div>
          <div className={clsx('text-2xl font-bold', getTariffColor(currentPeriod?.type || 'standard').replace('#', 'text-[#') + ']')}>
            £{currentPeriod?.rate.toFixed(2)} <span className="text-sm text-slate-400">/kWh</span>
          </div>
          <div
            className={clsx(
              'text-xs mt-1 px-2 py-0.5 rounded-full inline-block',
              currentPeriod?.type === 'peak' && 'bg-red-500/20 text-red-400',
              currentPeriod?.type === 'off-peak' && 'bg-emerald-500/20 text-emerald-400',
              currentPeriod?.type === 'super-off-peak' && 'bg-emerald-500/20 text-emerald-400',
              currentPeriod?.type === 'standard' && 'bg-amber-500/20 text-amber-400'
            )}
          >
            {currentPeriod?.type?.replace('-', ' ').toUpperCase()}
          </div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
            <TrendingUp className="w-4 h-4" />
            Today's Cost
          </div>
          <div className="text-2xl font-bold text-white">
            £{stats.todayEnergyCost.toFixed(0)}
          </div>
          <div className="text-xs text-emerald-400 mt-1">
            Saved £{stats.todaySavings.toFixed(0)} vs peak
          </div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
            <Leaf className="w-4 h-4" />
            CO2 Avoided
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            {Math.round(stats.co2Saved)} <span className="text-sm text-slate-400">kg</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">This month</div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
            <Zap className="w-4 h-4" />
            Charger Status
          </div>
          <div className="text-2xl font-bold text-white">
            {depotChargers.filter((c) => c.status === 'Active').length}
            <span className="text-sm text-slate-400">/{depotChargers.length} active</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {depotChargers.filter((c) => c.status === 'Faulted').length > 0 && (
              <span className="text-red-400">
                {depotChargers.filter((c) => c.status === 'Faulted').length} faulted
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-3 gap-4 min-h-0">
        {/* Load Profile Chart */}
        <div className="col-span-2 glass-card p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-white">Grid Load Profile (24h)</h3>
              <p className="text-xs text-slate-400">Actual vs forecast with tariff overlay</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-blue-500 rounded" />
                <span className="text-slate-400">Actual</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-slate-500 rounded" style={{ borderStyle: 'dashed' }} />
                <span className="text-slate-400">Forecast</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-red-500 rounded" />
                <span className="text-slate-400">Grid Limit</span>
              </div>
            </div>
          </div>

          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={loadProfileData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="loadGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="hour"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => `${v}kW`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number, name: string) => [
                    `${value} kW`,
                    name === 'load' ? 'Actual Load' : 'Forecast',
                  ]}
                />
                <ReferenceLine
                  y={selectedDepot?.maxCapacity ? selectedDepot.maxCapacity * 1000 : 2400}
                  stroke="#ef4444"
                  strokeDasharray="5 5"
                  label={{
                    value: 'Grid Limit',
                    fill: '#ef4444',
                    fontSize: 10,
                    position: 'right',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="load"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#loadGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="forecast"
                  stroke="#64748b"
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  fill="none"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Tariff Timeline */}
          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <div className="text-xs text-slate-400 mb-2">Tariff Timeline</div>
            <div className="flex h-4 rounded-full overflow-hidden">
              {tariff.periods.map((period, i) => {
                const width = ((period.endHour - period.startHour) / 24) * 100;
                return (
                  <div
                    key={i}
                    className="relative"
                    style={{ width: `${width}%`, backgroundColor: getTariffColor(period.type) }}
                    title={`${period.startHour}:00-${period.endHour}:00: £${period.rate}/kWh (${period.type})`}
                  >
                    {currentHour >= period.startHour && currentHour < period.endHour && (
                      <div className="absolute inset-0 border-2 border-white rounded animate-pulse" />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>24:00</span>
            </div>
          </div>
        </div>

        {/* Charger Grid */}
        <div className="glass-card p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-white">Charger Status</h3>
              <p className="text-xs text-slate-400">{selectedDepot?.name}</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-3 gap-2">
              {depotChargers.map((charger) => (
                <div
                  key={charger.id}
                  className={clsx(
                    'p-3 rounded-lg text-center transition-all hover:scale-105 cursor-pointer',
                    charger.status === 'Faulted' && 'ring-1 ring-red-500/50'
                  )}
                  style={{
                    background: `linear-gradient(135deg, ${
                      charger.status === 'Active'
                        ? 'rgba(59, 130, 246, 0.2)'
                        : charger.status === 'Faulted'
                        ? 'rgba(239, 68, 68, 0.2)'
                        : 'rgba(51, 65, 85, 0.5)'
                    }, transparent)`,
                  }}
                >
                  <div className="text-xs font-bold text-white mb-1">{charger.id}</div>
                  <div className="text-[10px] text-slate-400 mb-2">
                    {charger.power}kW {charger.connectionType}
                  </div>

                  <div
                    className={clsx(
                      'w-8 h-8 mx-auto rounded-lg flex items-center justify-center mb-2',
                      charger.status === 'Active' && 'bg-blue-500/30',
                      charger.status === 'Available' && 'bg-slate-600/30',
                      charger.status === 'Faulted' && 'bg-red-500/30 animate-pulse'
                    )}
                  >
                    <Zap
                      className={clsx(
                        'w-4 h-4',
                        charger.status === 'Active' && 'text-blue-400',
                        charger.status === 'Available' && 'text-slate-400',
                        charger.status === 'Faulted' && 'text-red-400'
                      )}
                    />
                  </div>

                  <div className="text-[10px] text-slate-400">
                    {charger.connectedVehicle || (
                      <span className={charger.status === 'Faulted' ? 'text-red-400' : ''}>
                        {charger.status === 'Faulted' ? charger.faultCode : 'Available'}
                      </span>
                    )}
                  </div>

                  {charger.status === 'Active' && (
                    <div className="mt-2 text-[10px]">
                      <div className="text-blue-400">
                        {Math.round(charger.powerDelivery)}kW
                      </div>
                      <div className="text-slate-500">
                        {charger.sessionEnergy.toFixed(1)} kWh
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded bg-blue-500" />
                <span className="text-slate-400">Active</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded bg-slate-500" />
                <span className="text-slate-400">Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded bg-red-500" />
                <span className="text-slate-400">Faulted</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded bg-amber-500" />
                <span className="text-slate-400">Scheduled</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
