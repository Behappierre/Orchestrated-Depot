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
  control: 'Service Control Decisions',
  dashboard: 'Orchestrated Depot Overview',
  map: 'Live Network Control',
  fleet: 'Fleet Operations',
  energy: 'Energy & Infrastructure',
  scenarios: 'Scenario Playback',
  guide: 'Demo Guide',
};

const systemIntegrations = [
  'AVL', 'Timetable', 'Fleet / charging',
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
    <header className="h-14 shrink-0 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 flex items-center px-4 gap-4 relative z-50">
      {/* Title & Location */}
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-white whitespace-nowrap">
          {viewTitles[currentView] || 'Overview'}
        </h1>

        {/* Depot Selector */}
        <div className="relative">
          <button
            aria-label="Select depot"
            aria-expanded={showDepotDropdown}
            aria-controls="depot-menu"
            onClick={() => setShowDepotDropdown(!showDepotDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-sm"
          >
            <MapPin className="w-4 h-4 text-blue-400" />
            <span className="whitespace-nowrap">{selectedDepot?.name || 'Select Depot'}</span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {showDepotDropdown && (
            <div id="depot-menu" className="absolute top-full left-0 mt-1 w-72 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl z-[100] overflow-hidden" onKeyDown={(event) => { if (event.key === 'Escape') setShowDepotDropdown(false); }}>
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

      <div className="flex-1 min-w-0 overflow-hidden mx-2 text-xs text-slate-400">
        <span className="block truncate">{currentView === 'control'
          ? 'Same inputs. Consistent rules. Controller decides.'
          : 'Belfast operational simulation · illustrative data'}</span>
      </div>

      {/* System Status Indicators */}
      <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-800/50">
        <span className="text-[10px] uppercase text-slate-500 whitespace-nowrap">Demo feeds</span>
        {systemIntegrations.map((sys) => (
          <div
            key={sys}
            className="flex items-center gap-1.5 text-xs"
            title={`${sys}: illustrative data, no live connection`}
          >
            <span
              className="w-1.5 h-1.5 rounded-full bg-blue-400"
            />
            <span className="text-slate-400 whitespace-nowrap">{sys}</span>
          </div>
        ))}
      </div>

      {/* Simulation Controls */}
      {currentView === 'control' ? (
        <span className="px-3 py-2 rounded-lg bg-blue-500/10 text-blue-300 text-xs whitespace-nowrap">Worked example</span>
      ) : <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700">
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
      </div>}

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
