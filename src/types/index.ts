// ============================================================================
// VEHICLE TYPES
// ============================================================================

export type VehicleStatus = 'Charging' | 'Idle' | 'Driving' | 'Faulted' | 'Maintenance';
export type ConnectionType = 'CCS2' | 'OppCharge' | 'Pantograph';

export interface Vehicle {
  id: string;
  model: string;
  manufacturer: 'Mercedes' | 'Volvo' | 'BYD' | 'Solaris';
  depotId: string;

  // State of Charge
  soc: number;              // Current SoC %
  requiredSoC: number;      // Required SoC for next duty
  targetSoC: number;        // Target SoC after charging

  // Status
  status: VehicleStatus;
  chargerId: string | null;
  location: string;
  assignedDuty: string | null;

  // Position (for map)
  lat: number;
  lng: number;
  route?: string;
  progress?: number;        // 0-1 progress along route

  // Telemetry
  soh: number;              // State of Health %
  odometer: number;         // km
  efficiency: number;       // kWh/km
  driverScore: number;      // 0-100
  cycles: number;           // Battery cycles
  batteryTemp: number;      // Celsius
  ambientTemp: number;      // Celsius
  hvacLoad: number;         // kW

  // Service
  nextService: string;      // Date or "Urgent"
  lastSync: string;         // Time since last data sync
  connectionType: ConnectionType;

  // Predictions
  predictedSoCAtDeparture: number;
  chargingTimeRemaining: number; // minutes
  rangeRemaining: number;   // km
}

// ============================================================================
// CHARGER TYPES
// ============================================================================

export type ChargerStatus = 'Active' | 'Available' | 'Faulted' | 'Offline' | 'Scheduled';

export interface Charger {
  id: string;
  depotId: string;
  zone: string;

  // Specs
  power: number;            // kW max
  connectionType: ConnectionType;

  // Status
  status: ChargerStatus;
  connectedVehicle: string | null;
  faultCode?: string;
  faultDescription?: string;

  // Real-time metrics
  voltage: number;          // V
  current: number;          // A
  powerDelivery: number;    // kW actual
  temperature: number;      // Celsius

  // Session
  sessionEnergy: number;    // kWh delivered this session
  sessionStart?: Date;
  estimatedCompletion?: Date;

  // Position for depot map
  x: number;
  y: number;
}

// ============================================================================
// DEPOT TYPES
// ============================================================================

export interface GridConstraint {
  startHour: number;
  endHour: number;
  maxCapacityPercent: number;
  description: string;
  months?: number[];        // Optional: only apply in these months
}

export interface Depot {
  id: string;
  name: string;
  location: string;

  // Position
  lat: number;
  lng: number;

  // Grid
  maxCapacity: number;      // MW
  currentLoad: number;      // kW
  constraints: GridConstraint[];

  // Stats
  totalChargers: number;
  activeChargers: number;
  totalVehicles: number;
  vehiclesOnSite: number;
}

// ============================================================================
// SCHEDULE TYPES
// ============================================================================

export interface ScheduledDuty {
  id: string;
  depotId: string;
  vehicleId: string;

  // Timing
  departureTime: string;    // HH:MM
  returnTime: string;       // HH:MM

  // Route
  routeId: string;
  routeName: string;
  distanceKm: number;
  estimatedEnergyKwh: number;

  // Crew
  driver: string;
  driverId: string;

  // Requirements
  requiredSoC: number;

  // Status
  status: 'Scheduled' | 'At Risk' | 'Critical' | 'Departed' | 'Completed' | 'Cancelled';
}

export interface Route {
  id: string;
  name: string;
  color: string;
  depotId: string;

  // Path
  waypoints: [number, number][];

  // Profile
  distanceKm: number;
  estimatedDurationMin: number;
  averageEnergyKwh: number;
  elevationGain: number;
  stops: number;
}

// ============================================================================
// ALERT TYPES
// ============================================================================

export type AlertSeverity = 'Critical' | 'Warning' | 'Info';
export type AlertCategory =
  | 'pull-out-risk'
  | 'charging-fault'
  | 'soc-deviation'
  | 'grid-constraint'
  | 'opportunity-charging'
  | 'maintenance'
  | 'driver-conflict'
  | 'cross-depot';

export interface Alert {
  id: string;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  message: string;

  // Context
  vehicleId?: string;
  chargerId?: string;
  dutyId?: string;
  depotId: string;

  // Timing
  timestamp: Date;
  deadlineTime?: Date;      // When action must be taken

  // Resolution
  isResolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolution?: string;

  // Impact
  impactDescription: string;
  affectedServices: number;
  penaltyRisk: number;      // £ potential penalty

  // Proposed actions
  proposedActions: ProposedAction[];
  confidenceScore: number;  // 0-100
}

export interface ProposedAction {
  id: string;
  label: string;
  description: string;
  type: 'swap' | 'reassign' | 'prioritize' | 'escalate' | 'acknowledge';

  // For swaps
  sourceVehicleId?: string;
  targetVehicleId?: string;

  // Metadata
  confidence: number;
  estimatedSavings?: number;
  isRecommended: boolean;
}

// ============================================================================
// SCENARIO TYPES
// ============================================================================

export interface ScenarioEvent {
  id: string;
  time: string;             // HH:MM format for timeline
  timestamp?: Date;         // Scenario time (computed)
  type: 'fault' | 'weather' | 'delay' | 'alert' | 'resolution' | 'departure' | 'arrival';
  title: string;
  description: string;

  // Effects
  vehicleId?: string;       // Single vehicle shorthand
  vehicleIds?: string[];
  chargerIds?: string[];

  // For faults
  faultType?: string;

  // For weather
  temperatureChange?: number;

  // Visual
  highlight?: boolean;
  showNotification?: boolean;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  duration: number;         // minutes (scenario time)

  // Time range
  startTime: string;        // HH:MM
  endTime: string;          // HH:MM

  // Difficulty for UI
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];

  // Initial state overrides
  initialState: Partial<{
    vehicles: Partial<Vehicle>[];
    chargers: Partial<Charger>[];
    weather: { temperature: number; condition: string };
  }>;

  // Events timeline
  events: ScenarioEvent[];

  // Comparison
  hasComparison: boolean;
  comparisonLabel?: string;
}

// ============================================================================
// TARIFF TYPES
// ============================================================================

export interface TariffPeriod {
  startHour: number;
  endHour: number;
  rate: number;             // £/kWh
  type: 'peak' | 'standard' | 'off-peak' | 'super-off-peak';
}

export interface EnergyTariff {
  name: string;
  currency: string;
  periods: TariffPeriod[];
}

// ============================================================================
// APP STATE TYPES
// ============================================================================

export type ViewType = 'dashboard' | 'map' | 'fleet' | 'energy' | 'scenarios' | 'guide';

export interface SimulationState {
  isRunning: boolean;
  speed: number;            // 1x, 2x, 4x, 8x
  currentTime: Date;
  elapsedMinutes: number;
}

export interface AppState {
  // Current view
  currentView: ViewType;
  selectedDepotId: string;

  // Theme
  isDarkMode: boolean;

  // Simulation
  simulation: SimulationState;

  // Active scenario
  activeScenario: Scenario | null;
  scenarioProgress: number; // 0-1
  comparisonMode: boolean;

  // Notifications
  unreadAlertCount: number;
}
