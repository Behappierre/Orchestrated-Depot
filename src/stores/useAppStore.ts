import { create } from 'zustand';
import type { ViewType, Vehicle, Charger, Depot, ScheduledDuty, Alert, Route, Scenario, EnergyTariff } from '../types';
import { mockVehicles } from '../data/mockFleet';
import { mockChargers } from '../data/mockChargers';
import { mockDepots } from '../data/mockDepots';
import { mockSchedule } from '../data/mockSchedule';
import { mockRoutes } from '../data/mockRoutes';
import { mockTariff } from '../data/mockTariff';
import { scenarios } from '../data/scenarios';
import { runOrchestration } from '../services/orchestrationEngine';

interface AppStore {
  // View state
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;

  // Theme
  isDarkMode: boolean;
  toggleDarkMode: () => void;

  // Selected depot
  selectedDepotId: string;
  setSelectedDepotId: (id: string) => void;

  // Data
  vehicles: Vehicle[];
  chargers: Charger[];
  depots: Depot[];
  schedule: ScheduledDuty[];
  routes: Route[];
  alerts: Alert[];
  tariff: EnergyTariff;

  // Simulation state
  simulationTime: Date;
  simulationSpeed: number;
  isSimulationRunning: boolean;
  setSimulationTime: (time: Date) => void;
  setSimulationSpeed: (speed: number) => void;
  setSimulationRunning: (running: boolean) => void;
  toggleSimulation: () => void;
  tick: () => void;

  // Scenario
  activeScenario: Scenario | null;
  scenarioProgress: number;
  comparisonMode: boolean;
  setActiveScenario: (scenario: Scenario | null) => void;
  setScenarioProgress: (progress: number) => void;
  toggleComparisonMode: () => void;

  // Available scenarios
  scenarios: Scenario[];

  // Actions
  updateVehicle: (id: string, updates: Partial<Vehicle>) => void;
  updateCharger: (id: string, updates: Partial<Charger>) => void;
  resolveAlert: (alertId: string, actionId: string) => void;
  runOrchestrationCheck: () => void;

  // Stats
  getStats: () => {
    fleetReadiness: number;
    chargerUptime: number;
    currentLoad: number;
    maxLoad: number;
    activeAlerts: number;
    vehiclesCharging: number;
    vehiclesDriving: number;
    vehiclesAtRisk: number;
    todayEnergyCost: number;
    todaySavings: number;
    co2Saved: number;
  };
}

// Initialize simulation time to 05:30 AM today
const getInitialSimTime = () => {
  const now = new Date();
  now.setHours(5, 30, 0, 0);
  return now;
};

export const useAppStore = create<AppStore>((set, get) => ({
  // Initial state
  currentView: 'dashboard',
  isDarkMode: true,
  selectedDepotId: 'central',

  // Data
  vehicles: mockVehicles,
  chargers: mockChargers,
  depots: mockDepots,
  schedule: mockSchedule,
  routes: mockRoutes,
  alerts: [],
  tariff: mockTariff,

  // Simulation
  simulationTime: getInitialSimTime(),
  simulationSpeed: 1,
  isSimulationRunning: true,

  // Scenario
  activeScenario: null,
  scenarioProgress: 0,
  comparisonMode: false,
  scenarios: scenarios,

  // View actions
  setCurrentView: (view) => set({ currentView: view }),

  toggleDarkMode: () => {
    set((state) => {
      const newMode = !state.isDarkMode;
      document.documentElement.classList.toggle('dark', newMode);
      document.documentElement.classList.toggle('light', !newMode);
      return { isDarkMode: newMode };
    });
  },

  setSelectedDepotId: (id) => set({ selectedDepotId: id }),

  // Simulation actions
  setSimulationTime: (time) => set({ simulationTime: time }),
  setSimulationSpeed: (speed) => set({ simulationSpeed: speed }),
  setSimulationRunning: (running) => set({ isSimulationRunning: running }),
  toggleSimulation: () => set((state) => ({ isSimulationRunning: !state.isSimulationRunning })),

  tick: () => {
    const state = get();
    if (!state.isSimulationRunning) return;

    // Advance time by 1 minute per tick (scaled by speed)
    const newTime = new Date(state.simulationTime.getTime() + 60000 * state.simulationSpeed);

    // Update vehicles
    const updatedVehicles = state.vehicles.map((vehicle) => {
      const updated = { ...vehicle };

      if (vehicle.status === 'Driving' && vehicle.route) {
        // Move along route
        updated.progress = ((vehicle.progress || 0) + 0.02 * state.simulationSpeed) % 1;

        // Drain SoC (rounded to 1 decimal)
        updated.soc = Math.round(Math.max(0, vehicle.soc - 0.05 * state.simulationSpeed) * 10) / 10;

        // Update position based on route
        const route = state.routes.find((r) => r.name === vehicle.route);
        if (route && route.waypoints.length > 1) {
          const totalSegments = route.waypoints.length - 1;
          const scaledProgress = updated.progress * totalSegments;
          const segmentIndex = Math.floor(scaledProgress);
          const segmentProgress = scaledProgress - segmentIndex;
          const nextIndex = Math.min(segmentIndex + 1, totalSegments);

          const p1 = route.waypoints[segmentIndex];
          const p2 = route.waypoints[nextIndex];

          updated.lat = p1[0] + (p2[0] - p1[0]) * segmentProgress;
          updated.lng = p1[1] + (p2[1] - p1[1]) * segmentProgress;
        }
      } else if (vehicle.status === 'Charging') {
        // Charge vehicle
        const charger = state.chargers.find((c) => c.id === vehicle.chargerId);
        if (charger && charger.status === 'Active') {
          // Charging rate depends on power and battery capacity (assume 300kWh battery)
          const chargeRate = (charger.power / 300) * 100 * (1 / 60) * state.simulationSpeed;
          updated.soc = Math.round(Math.min(100, vehicle.soc + chargeRate) * 10) / 10;
          updated.chargingTimeRemaining = Math.round(Math.max(0, ((vehicle.targetSoC - updated.soc) / chargeRate) * state.simulationSpeed));
          updated.predictedSoCAtDeparture = Math.round(Math.min(100, updated.soc + chargeRate * (updated.chargingTimeRemaining || 0)));
        }
      }

      // Update last sync
      updated.lastSync = `${Math.floor(Math.random() * 50 + 10)}ms`;

      return updated;
    });

    // Update chargers with real-time metrics
    const updatedChargers = state.chargers.map((charger) => {
      if (charger.status === 'Active' && charger.connectedVehicle) {
        return {
          ...charger,
          current: Math.round(charger.power > 100 ? 180 + Math.random() * 20 : 100 + Math.random() * 20),
          voltage: Math.round(charger.power > 100 ? 740 + Math.random() * 20 : 395 + Math.random() * 10),
          powerDelivery: Math.round(charger.power * (0.9 + Math.random() * 0.1)),
          sessionEnergy: Math.round((charger.sessionEnergy + (charger.power / 60) * state.simulationSpeed) * 10) / 10,
        };
      }
      return charger;
    });

    // Update depot loads
    const updatedDepots = state.depots.map((depot) => {
      const depotChargers = updatedChargers.filter((c) => c.depotId === depot.id && c.status === 'Active');
      const currentLoad = depotChargers.reduce((sum, c) => sum + c.powerDelivery, 0);
      return {
        ...depot,
        currentLoad,
        activeChargers: depotChargers.length,
      };
    });

    set({
      simulationTime: newTime,
      vehicles: updatedVehicles,
      chargers: updatedChargers,
      depots: updatedDepots,
    });

    // Run orchestration check
    get().runOrchestrationCheck();
  },

  // Scenario actions
  setActiveScenario: (scenario) => set({ activeScenario: scenario, scenarioProgress: 0 }),
  setScenarioProgress: (progress) => set({ scenarioProgress: progress }),
  toggleComparisonMode: () => set((state) => ({ comparisonMode: !state.comparisonMode })),

  // Data actions
  updateVehicle: (id, updates) =>
    set((state) => ({
      vehicles: state.vehicles.map((v) => (v.id === id ? { ...v, ...updates } : v)),
    })),

  updateCharger: (id, updates) =>
    set((state) => ({
      chargers: state.chargers.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),

  resolveAlert: (alertId, actionId) => {
    const state = get();
    const alert = state.alerts.find((a) => a.id === alertId);
    if (!alert) return;

    const action = alert.proposedActions.find((a) => a.id === actionId);
    if (!action) return;

    // Execute the action
    if (action.type === 'swap' && action.sourceVehicleId && action.targetVehicleId) {
      // Find the duty and swap vehicles
      const duty = state.schedule.find((d) => d.vehicleId === action.sourceVehicleId);
      if (duty) {
        set((state) => ({
          schedule: state.schedule.map((d) =>
            d.id === duty.id ? { ...d, vehicleId: action.targetVehicleId!, status: 'Scheduled' } : d
          ),
          vehicles: state.vehicles.map((v) => {
            if (v.id === action.sourceVehicleId) {
              return { ...v, assignedDuty: null };
            }
            if (v.id === action.targetVehicleId) {
              return { ...v, assignedDuty: duty.id };
            }
            return v;
          }),
          alerts: state.alerts.map((a) =>
            a.id === alertId
              ? { ...a, isResolved: true, resolvedAt: new Date(), resolution: action.label }
              : a
          ),
        }));
      }
    } else if (action.type === 'acknowledge') {
      set((state) => ({
        alerts: state.alerts.map((a) =>
          a.id === alertId
            ? { ...a, isResolved: true, resolvedAt: new Date(), resolution: 'Acknowledged' }
            : a
        ),
      }));
    }

    // Re-run orchestration
    get().runOrchestrationCheck();
  },

  runOrchestrationCheck: () => {
    const state = get();
    const newAlerts = runOrchestration(
      state.vehicles,
      state.chargers,
      state.schedule,
      state.depots,
      state.simulationTime
    );

    // Merge with existing unresolved alerts
    const existingUnresolved = state.alerts.filter((a) => !a.isResolved);
    const existingIds = new Set(existingUnresolved.map((a) => `${a.category}-${a.vehicleId || a.chargerId}`));

    const alertsToAdd = newAlerts.filter(
      (a) => !existingIds.has(`${a.category}-${a.vehicleId || a.chargerId}`)
    );

    set({
      alerts: [...existingUnresolved, ...alertsToAdd],
    });
  },

  // Stats
  getStats: () => {
    const state = get();
    const depot = state.depots.find((d) => d.id === state.selectedDepotId) || state.depots[0];
    const depotVehicles = state.vehicles.filter((v) => v.depotId === state.selectedDepotId);
    const depotChargers = state.chargers.filter((c) => c.depotId === state.selectedDepotId);
    const depotSchedule = state.schedule.filter((s) => s.depotId === state.selectedDepotId);

    const readyVehicles = depotSchedule.filter((duty) => {
      const vehicle = state.vehicles.find((v) => v.id === duty.vehicleId);
      return vehicle && vehicle.soc >= duty.requiredSoC - 5;
    }).length;

    const workingChargers = depotChargers.filter((c) => c.status !== 'Faulted' && c.status !== 'Offline').length;

    const vehiclesAtRisk = depotVehicles.filter((v) => {
      const duty = depotSchedule.find((d) => d.vehicleId === v.id);
      return duty && v.soc < duty.requiredSoC && v.status !== 'Charging';
    }).length;

    // Calculate energy costs
    const hour = state.simulationTime.getHours();
    const currentTariff = state.tariff.periods.find(
      (p) => hour >= p.startHour && hour < p.endHour
    );
    const currentRate = currentTariff?.rate || 0.15;

    const totalEnergyToday = depotChargers.reduce((sum, c) => sum + c.sessionEnergy, 0);
    const todayEnergyCost = totalEnergyToday * currentRate;

    // Estimate savings (vs always charging at peak)
    const peakRate = Math.max(...state.tariff.periods.map((p) => p.rate));
    const todaySavings = totalEnergyToday * peakRate - todayEnergyCost;

    // CO2 saved (vs diesel: ~2.68 kg CO2 per liter, ~3 km/L)
    const totalKm = depotVehicles.reduce((sum, v) => sum + v.odometer, 0) / 1000; // rough daily estimate
    const co2Saved = totalKm * 0.89; // kg CO2 saved per km vs diesel

    return {
      fleetReadiness: depotSchedule.length > 0 ? Math.round((readyVehicles / depotSchedule.length) * 100) : 100,
      chargerUptime: depotChargers.length > 0 ? Math.round((workingChargers / depotChargers.length) * 100) : 100,
      currentLoad: depot.currentLoad,
      maxLoad: depot.maxCapacity * 1000, // Convert MW to kW
      activeAlerts: state.alerts.filter((a) => !a.isResolved).length,
      vehiclesCharging: depotVehicles.filter((v) => v.status === 'Charging').length,
      vehiclesDriving: depotVehicles.filter((v) => v.status === 'Driving').length,
      vehiclesAtRisk,
      todayEnergyCost,
      todaySavings: Math.max(0, todaySavings),
      co2Saved,
    };
  },
}));
