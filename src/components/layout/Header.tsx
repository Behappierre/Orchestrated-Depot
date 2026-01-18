import { useState } from 'react';
import {
  Bell,
  Moon,
  Sun,
  MapPin,
  Play,
  Pause,
  ChevronDown,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { clsx } from 'clsx';

const viewTitles: Record<string, string> = {
  dashboard: 'Orchestrated Depot Overview',
  map: 'Live Network Control',
  fleet: 'Fleet Operations',
  energy: 'Energy & Infrastructure',
  scenarios: 'Scenario Playback',
  guide: 'Demo Guide',
};

const systemIntegrations = [
  { name: 'Optibus', status: 'active' },
  { name: 'ViriCiti', status: 'active' },
  { name: 'ChargePoint', status: 'active' },
  { name: 'Grid Sync', status: 'warning' },
];

export function Header() {
  const {
    currentView,
    isDarkMode,
    toggleDarkMode,
    selectedDepotId,
    setSelectedDepotId,
    depots,
    simulationTime,
    simulationSpeed,
    setSimulationSpeed,
    isSimulationRunning,
    toggleSimulation,
    alerts,
  } = useAppStore();

  const [showDepotDropdown, setShowDepotDropdown] = useState(false);
  const selectedDepot = depots.find((d) => d.id === selectedDepotId);
  const unreadAlerts = alerts.filter((a) => !a.isResolved).length;

  // Format time
  const timeString = simulationTime.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const dateString = simulationTime.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <header className="h-14 bg-slate-900/80 backdrop-blur-sm border-b border-slate-800 flex items-center px-4 gap-4 relative z-50">
      {/* Title & Location */}
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-white">
          {viewTitles[currentView] || 'Overview'}
        </h1>

        {/* Depot Selector */}
        <div className="relative">
          <button
            onClick={() => setShowDepotDropdown(!showDepotDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-sm"
          >
            <MapPin className="w-4 h-4 text-blue-400" />
            <span>{selectedDepot?.name || 'Select Depot'}</span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {showDepotDropdown && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-[100] overflow-hidden">
              {depots.map((depot) => (
                <button
                  key={depot.id}
                  onClick={() => {
                    setSelectedDepotId(depot.id);
                    setShowDepotDropdown(false);
                  }}
                  className={clsx(
                    'w-full px-4 py-2 text-left text-sm hover:bg-slate-700 transition-colors',
                    depot.id === selectedDepotId && 'bg-blue-500/20 text-blue-400'
                  )}
                >
                  <div className="font-medium">{depot.name}</div>
                  <div className="text-xs text-slate-400">{depot.location}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Live Ticker */}
      <div className="flex-1 overflow-hidden mx-4">
        <div className="ticker-container h-6 flex items-center">
          <div className="ticker-content text-xs text-slate-400">
            <span className="mx-4">SYSTEM STATUS: OPTIMAL</span>
            <span className="mx-4 text-emerald-400">GRID LOAD: 45% STABLE</span>
            <span className="mx-4">WEATHER: 8°C CLOUDY</span>
            <span className="mx-4">SHIFT SUPERVISOR: D. ADAMS</span>
            <span className="mx-4 text-blue-400">NEXT PULL-OUT: {alerts.length > 0 ? 'BUS-101 06:15' : '15 MINS'}</span>
            <span className="mx-4 text-emerald-400">SAFETY INCIDENT FREE: 142 DAYS</span>
            {/* Duplicate for seamless loop */}
            <span className="mx-4">SYSTEM STATUS: OPTIMAL</span>
            <span className="mx-4 text-emerald-400">GRID LOAD: 45% STABLE</span>
            <span className="mx-4">WEATHER: 8°C CLOUDY</span>
            <span className="mx-4">SHIFT SUPERVISOR: D. ADAMS</span>
            <span className="mx-4 text-blue-400">NEXT PULL-OUT: {alerts.length > 0 ? 'BUS-101 06:15' : '15 MINS'}</span>
            <span className="mx-4 text-emerald-400">SAFETY INCIDENT FREE: 142 DAYS</span>
          </div>
        </div>
      </div>

      {/* System Status Indicators */}
      <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-800/50">
        {systemIntegrations.map((sys) => (
          <div
            key={sys.name}
            className="flex items-center gap-1.5 text-xs"
            title={`${sys.name}: ${sys.status}`}
          >
            <span
              className={clsx(
                'w-1.5 h-1.5 rounded-full',
                sys.status === 'active' && 'bg-emerald-400 shadow-glow-success',
                sys.status === 'warning' && 'bg-amber-400 shadow-glow-warning',
                sys.status === 'error' && 'bg-red-400 shadow-glow-danger'
              )}
            />
            <span className="text-slate-400">{sys.name}</span>
          </div>
        ))}
      </div>

      {/* Simulation Controls */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700">
        <button
          onClick={toggleSimulation}
          className={clsx(
            'p-1 rounded transition-colors',
            isSimulationRunning ? 'text-emerald-400 hover:bg-emerald-500/20' : 'text-slate-400 hover:bg-slate-700'
          )}
          title={isSimulationRunning ? 'Pause Simulation' : 'Start Simulation'}
        >
          {isSimulationRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>

        <div className="flex items-center gap-1 text-xs">
          {[1, 2, 4, 8].map((speed) => (
            <button
              key={speed}
              onClick={() => setSimulationSpeed(speed)}
              className={clsx(
                'px-1.5 py-0.5 rounded transition-colors',
                simulationSpeed === speed
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-slate-500 hover:text-white'
              )}
            >
              {speed}x
            </button>
          ))}
        </div>

        <div className="pl-2 border-l border-slate-700">
          <div className="font-mono text-sm font-semibold text-white">{timeString}</div>
          <div className="text-[10px] text-slate-500 leading-none">{dateString}</div>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Toggle Theme"
        >
          {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>

        <button
          className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadAlerts > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadAlerts > 9 ? '9+' : unreadAlerts}
            </span>
          )}
        </button>

        {/* User Avatar */}
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
          DA
        </div>
      </div>
    </header>
  );
}
