import { useState, useCallback, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Zap,
  TrendingUp,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { scenarios } from '../../data/scenarios';
import type { Scenario, ScenarioEvent } from '../../types';
import { clsx } from 'clsx';

export function ScenarioView() {
  const {
    simulationTime,
    setSimulationTime,
    isSimulationRunning,
    setSimulationRunning,
    simulationSpeed,
    setSimulationSpeed,
    alerts,
  } = useAppStore();

  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [processedEvents, setProcessedEvents] = useState<Set<string>>(new Set());
  const [scenarioStartTime, setScenarioStartTime] = useState<Date | null>(null);
  const [_currentEventIndex, setCurrentEventIndex] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Get current scenario time as minutes since midnight
  const currentMinutes = simulationTime.getHours() * 60 + simulationTime.getMinutes();

  // Calculate scenario progress
  const getScenarioProgress = useCallback(() => {
    if (!selectedScenario) return 0;
    const startMinutes = parseInt(selectedScenario.startTime.split(':')[0]) * 60 +
      parseInt(selectedScenario.startTime.split(':')[1]);
    const endMinutes = parseInt(selectedScenario.endTime.split(':')[0]) * 60 +
      parseInt(selectedScenario.endTime.split(':')[1]);
    const duration = endMinutes - startMinutes;
    const elapsed = currentMinutes - startMinutes;
    return Math.max(0, Math.min(100, (elapsed / duration) * 100));
  }, [selectedScenario, currentMinutes]);

  // Start a scenario
  const startScenario = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setProcessedEvents(new Set());
    setCurrentEventIndex(0);

    // Parse start time and set simulation
    const [hours, minutes] = scenario.startTime.split(':').map(Number);
    const startTime = new Date(simulationTime);
    startTime.setHours(hours, minutes, 0, 0);
    setScenarioStartTime(startTime);
    setSimulationTime(startTime);
    setSimulationRunning(true);
    setSimulationSpeed(4); // Start at 4x speed for demo
  };

  // Reset scenario
  const resetScenario = () => {
    if (selectedScenario && scenarioStartTime) {
      setSimulationTime(new Date(scenarioStartTime));
      setProcessedEvents(new Set());
      setCurrentEventIndex(0);
      setSimulationRunning(false);
    }
  };

  // Jump to specific event
  const jumpToEvent = (event: ScenarioEvent) => {
    const [hours, minutes] = event.time.split(':').map(Number);
    const eventTime = new Date(simulationTime);
    eventTime.setHours(hours, minutes, 0, 0);
    setSimulationTime(eventTime);
  };

  // Format time display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  // Get event icon
  const getEventIcon = (type: ScenarioEvent['type']) => {
    switch (type) {
      case 'fault':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'alert':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'resolution':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'departure':
        return <ChevronRight className="w-4 h-4 text-blue-400" />;
      case 'arrival':
        return <ChevronRight className="w-4 h-4 text-cyan-400 rotate-180" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  // Check if event time has passed
  const hasEventPassed = (eventTime: string) => {
    const [hours, minutes] = eventTime.split(':').map(Number);
    const eventMinutes = hours * 60 + minutes;
    return currentMinutes >= eventMinutes;
  };

  // Speed options
  const speedOptions = [1, 2, 4, 8, 16];

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Scenario Selector Header */}
      {!selectedScenario ? (
        <div className="flex-1 flex flex-col">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Scenario Playback</h2>
            <p className="text-slate-400">
              Experience pre-built operational scenarios that demonstrate how the Orchestrated Depot
              handles real-world challenges.
            </p>
          </div>

          {/* Scenario Cards */}
          <div className="grid grid-cols-2 gap-6">
            {scenarios.map((scenario) => (
              <div
                key={scenario.id}
                className="glass-card p-6 cursor-pointer hover:ring-1 hover:ring-blue-500/50 transition-all group"
                onClick={() => startScenario(scenario)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={clsx(
                      'px-3 py-1 rounded-full text-xs font-medium',
                      scenario.difficulty === 'Easy' && 'bg-emerald-500/20 text-emerald-400',
                      scenario.difficulty === 'Medium' && 'bg-amber-500/20 text-amber-400',
                      scenario.difficulty === 'Hard' && 'bg-red-500/20 text-red-400'
                    )}
                  >
                    {scenario.difficulty}
                  </div>
                  <div className="text-xs text-slate-500">
                    {scenario.startTime} - {scenario.endTime}
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                  {scenario.name}
                </h3>
                <p className="text-sm text-slate-400 mb-4">{scenario.description}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {scenario.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-slate-700/50 text-slate-300 text-xs rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {scenario.events.filter((e) => e.type === 'fault' || e.type === 'alert').length} events
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      ~{Math.round(
                        (parseInt(scenario.endTime.split(':')[0]) * 60 + parseInt(scenario.endTime.split(':')[1]) -
                        (parseInt(scenario.startTime.split(':')[0]) * 60 + parseInt(scenario.startTime.split(':')[1]))) / 60
                      )}h duration
                    </span>
                  </div>
                  <button className="text-blue-400 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                    Start <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Active Scenario Header */}
          <div className="glass-card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    setSelectedScenario(null);
                    setSimulationRunning(false);
                  }}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  ← Back
                </button>
                <div>
                  <h2 className="text-lg font-semibold text-white">{selectedScenario.name}</h2>
                  <p className="text-xs text-slate-400">{selectedScenario.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowComparison(!showComparison)}
                  className={clsx(
                    'px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all',
                    showComparison
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  )}
                >
                  <Layers className="w-4 h-4" />
                  Compare Mode
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 grid grid-cols-3 gap-4 min-h-0">
            {/* Timeline Panel */}
            <div className="glass-card p-4 flex flex-col">
              <h3 className="font-semibold text-white mb-4">Scenario Timeline</h3>

              <div className="flex-1 overflow-y-auto" ref={timelineRef}>
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-700" />

                  {/* Events */}
                  <div className="space-y-4">
                    {selectedScenario.events.map((event, index) => {
                      const passed = hasEventPassed(event.time);
                      return (
                        <div
                          key={index}
                          className={clsx(
                            'relative pl-10 cursor-pointer transition-all',
                            passed ? 'opacity-100' : 'opacity-50'
                          )}
                          onClick={() => jumpToEvent(event)}
                        >
                          {/* Timeline dot */}
                          <div
                            className={clsx(
                              'absolute left-2 w-5 h-5 rounded-full flex items-center justify-center',
                              passed
                                ? event.type === 'fault'
                                  ? 'bg-red-500/20'
                                  : event.type === 'resolution'
                                  ? 'bg-emerald-500/20'
                                  : 'bg-slate-700'
                                : 'bg-slate-800'
                            )}
                          >
                            {getEventIcon(event.type)}
                          </div>

                          {/* Event content */}
                          <div
                            className={clsx(
                              'p-3 rounded-lg transition-all',
                              passed ? 'bg-slate-800/50' : 'bg-slate-900/30'
                            )}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-mono text-slate-400">{event.time}</span>
                              <span
                                className={clsx(
                                  'text-xs px-2 py-0.5 rounded',
                                  event.type === 'fault' && 'bg-red-500/20 text-red-400',
                                  event.type === 'alert' && 'bg-amber-500/20 text-amber-400',
                                  event.type === 'resolution' && 'bg-emerald-500/20 text-emerald-400',
                                  event.type === 'departure' && 'bg-blue-500/20 text-blue-400',
                                  event.type === 'arrival' && 'bg-cyan-500/20 text-cyan-400'
                                )}
                              >
                                {event.type}
                              </span>
                            </div>
                            <p className="text-sm text-slate-300">{event.description}</p>
                            {event.vehicleId && (
                              <span className="text-xs text-slate-500 mt-1 block">
                                Vehicle: {event.vehicleId}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Visualization */}
            <div className="col-span-2 flex flex-col gap-4">
              {/* Current Status */}
              <div className="glass-card p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Current Simulation Time</div>
                    <div className="text-3xl font-bold text-white font-mono">
                      {formatTime(simulationTime)}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Speed selector */}
                    <div className="flex items-center gap-1">
                      {speedOptions.map((speed) => (
                        <button
                          key={speed}
                          onClick={() => setSimulationSpeed(speed)}
                          className={clsx(
                            'px-2 py-1 rounded text-xs font-medium transition-all',
                            simulationSpeed === speed
                              ? 'bg-blue-500 text-white'
                              : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                          )}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>

                    {/* Playback controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={resetScenario}
                        className="p-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setSimulationRunning(!isSimulationRunning)}
                        className={clsx(
                          'p-3 rounded-lg transition-all',
                          isSimulationRunning
                            ? 'bg-amber-500 text-white'
                            : 'bg-blue-500 text-white'
                        )}
                      >
                        {isSimulationRunning ? (
                          <Pause className="w-5 h-5" />
                        ) : (
                          <Play className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => setSimulationSpeed(Math.min(16, simulationSpeed * 2))}
                        className="p-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
                      >
                        <FastForward className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300"
                    style={{ width: `${getScenarioProgress()}%` }}
                  />
                  {/* Event markers */}
                  {selectedScenario.events.map((event, index) => {
                    const eventMinutes = parseInt(event.time.split(':')[0]) * 60 +
                      parseInt(event.time.split(':')[1]);
                    const startMinutes = parseInt(selectedScenario.startTime.split(':')[0]) * 60 +
                      parseInt(selectedScenario.startTime.split(':')[1]);
                    const endMinutes = parseInt(selectedScenario.endTime.split(':')[0]) * 60 +
                      parseInt(selectedScenario.endTime.split(':')[1]);
                    const position = ((eventMinutes - startMinutes) / (endMinutes - startMinutes)) * 100;

                    return (
                      <div
                        key={index}
                        className={clsx(
                          'absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full',
                          event.type === 'fault' && 'bg-red-500',
                          event.type === 'alert' && 'bg-amber-500',
                          event.type === 'resolution' && 'bg-emerald-500',
                          event.type === 'departure' && 'bg-blue-400',
                          event.type === 'arrival' && 'bg-cyan-400'
                        )}
                        style={{ left: `${position}%` }}
                        title={`${event.time}: ${event.description}`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Comparison View or Active Alerts */}
              {showComparison ? (
                <div className="flex-1 grid grid-cols-2 gap-4">
                  {/* Without Orchestration */}
                  <div className="glass-card p-4 ring-1 ring-red-500/30">
                    <div className="flex items-center gap-2 mb-4">
                      <XCircle className="w-5 h-5 text-red-400" />
                      <h3 className="font-semibold text-white">Without Orchestration</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                        <div className="text-sm text-red-400 font-medium mb-1">
                          Manual Detection
                        </div>
                        <p className="text-xs text-slate-400">
                          Problem discovered at 05:30 when driver reports issue
                        </p>
                      </div>
                      <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                        <div className="text-sm text-red-400 font-medium mb-1">
                          Reactive Response
                        </div>
                        <p className="text-xs text-slate-400">
                          Scramble to find replacement, 45+ min delay
                        </p>
                      </div>
                      <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                        <div className="text-sm text-red-400 font-medium mb-1">
                          Service Impact
                        </div>
                        <p className="text-xs text-slate-400">
                          3 routes affected, £2,400 penalty risk
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-red-500/20">
                      <div className="text-2xl font-bold text-red-400">-£4,200</div>
                      <div className="text-xs text-slate-500">Estimated daily impact</div>
                    </div>
                  </div>

                  {/* With Orchestration */}
                  <div className="glass-card p-4 ring-1 ring-emerald-500/30">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <h3 className="font-semibold text-white">With Orchestration</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                        <div className="text-sm text-emerald-400 font-medium mb-1">
                          Automatic Detection
                        </div>
                        <p className="text-xs text-slate-400">
                          Problem detected at 02:47, 3 hours before departure
                        </p>
                      </div>
                      <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                        <div className="text-sm text-emerald-400 font-medium mb-1">
                          Proactive Resolution
                        </div>
                        <p className="text-xs text-slate-400">
                          Automatic swap proposal, approved in 2 min
                        </p>
                      </div>
                      <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                        <div className="text-sm text-emerald-400 font-medium mb-1">
                          Service Continuity
                        </div>
                        <p className="text-xs text-slate-400">
                          All routes depart on time, zero disruption
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-emerald-500/20">
                      <div className="text-2xl font-bold text-emerald-400">+£850</div>
                      <div className="text-xs text-slate-500">Energy savings from optimization</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 glass-card p-4 flex flex-col">
                  <h3 className="font-semibold text-white mb-4">Active Alerts</h3>
                  <div className="flex-1 overflow-y-auto">
                    {alerts.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-slate-500">
                        <CheckCircle2 className="w-12 h-12 mb-2 text-emerald-400" />
                        <p className="text-sm">No active alerts</p>
                        <p className="text-xs">System operating normally</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {alerts.map((alert) => (
                          <div
                            key={alert.id}
                            className={clsx(
                              'p-4 rounded-lg border',
                              alert.severity === 'Critical' &&
                                'bg-red-500/10 border-red-500/30',
                              alert.severity === 'Warning' &&
                                'bg-amber-500/10 border-amber-500/30',
                              alert.severity === 'Info' && 'bg-blue-500/10 border-blue-500/30'
                            )}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span
                                className={clsx(
                                  'text-sm font-medium',
                                  alert.severity === 'Critical' && 'text-red-400',
                                  alert.severity === 'Warning' && 'text-amber-400',
                                  alert.severity === 'Info' && 'text-blue-400'
                                )}
                              >
                                {alert.title}
                              </span>
                              {alert.deadlineTime && (
                                <span className="text-xs text-slate-500">
                                  {Math.max(
                                    0,
                                    Math.round(
                                      (alert.deadlineTime.getTime() - simulationTime.getTime()) /
                                        60000
                                    )
                                  )}{' '}
                                  min remaining
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400">{alert.message}</p>
                            {alert.proposedActions && alert.proposedActions.length > 0 && (
                              <div className="mt-3 flex items-center gap-2">
                                <button className="px-3 py-1 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors">
                                  {alert.proposedActions[0].label}
                                </button>
                                <span className="text-xs text-slate-500">
                                  {alert.proposedActions[0].confidence}% confidence
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Key Metrics */}
              <div className="grid grid-cols-4 gap-4">
                <div className="glass-card p-4">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                    <Zap className="w-4 h-4" />
                    Active Chargers
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {useAppStore.getState().chargers.filter((c) => c.status === 'Active').length}
                    <span className="text-sm text-slate-400">
                      /{useAppStore.getState().chargers.length}
                    </span>
                  </div>
                </div>
                <div className="glass-card p-4">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    Active Alerts
                  </div>
                  <div className="text-2xl font-bold text-amber-400">{alerts.length}</div>
                </div>
                <div className="glass-card p-4">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Resolved
                  </div>
                  <div className="text-2xl font-bold text-emerald-400">
                    {processedEvents.size}
                  </div>
                </div>
                <div className="glass-card p-4">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                    <TrendingUp className="w-4 h-4" />
                    Scenario Progress
                  </div>
                  <div className="text-2xl font-bold text-blue-400">
                    {Math.round(getScenarioProgress())}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
