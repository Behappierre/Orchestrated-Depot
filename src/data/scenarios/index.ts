import type { Scenario } from '../../types';

// The "05:47 Crisis" scenario from the whitepaper executive summary
const morningCrisisScenario: Scenario = {
  id: 'morning-crisis',
  name: 'The 05:47 Crisis',
  description:
    'Temperature drops overnight. One charger goes offline at 03:00. Two vehicles are charging slower than planned. Without orchestration, this becomes a service failure at 06:30.',
  duration: 180, // 3 hours of scenario time (03:00 - 06:00)
  startTime: '03:00',
  endTime: '06:30',
  difficulty: 'Hard',
  tags: ['charger-fault', 'cold-weather', 'pull-out-risk', 'vehicle-swap'],

  initialState: {
    weather: {
      temperature: 2,
      condition: 'Cold snap',
    },
  },

  events: [
    {
      id: 'evt-1',
      time: '03:00',
      type: 'fault',
      title: 'Charger Offline',
      description: 'CH-C01 loses communication with BUS-101. Vehicle stops charging at 32% SoC.',
      chargerIds: ['CH-C01'],
      vehicleId: 'BUS-101',
      vehicleIds: ['BUS-101'],
      faultType: 'communication-timeout',
      highlight: true,
      showNotification: true,
    },
    {
      id: 'evt-2',
      time: '03:15',
      type: 'weather',
      title: 'Temperature Drop',
      description: 'Ambient temperature drops to -2°C. Battery charge acceptance reduced by 15%.',
      temperatureChange: -4,
      highlight: true,
      showNotification: true,
    },
    {
      id: 'evt-3',
      time: '03:30',
      type: 'alert',
      title: 'Slow Charging Detected',
      description: 'BUS-103 and BUS-106 charging 20% slower than expected due to cold batteries.',
      vehicleIds: ['BUS-103', 'BUS-106'],
      showNotification: true,
    },
    {
      id: 'evt-4',
      time: '04:00',
      type: 'alert',
      title: 'Pull-out Risk Identified',
      description:
        'Orchestration detects BUS-101 will only reach 58% by 06:15 departure. Vehicle swap recommended.',
      vehicleId: 'BUS-101',
      vehicleIds: ['BUS-101'],
      highlight: true,
      showNotification: true,
    },
    {
      id: 'evt-5',
      time: '04:05',
      type: 'resolution',
      title: 'Auto-Resolution Proposed',
      description:
        'Swap BUS-101 (32% SoC) with BUS-105 (98% SoC) for DUTY-001. Confidence: 94%.',
      vehicleIds: ['BUS-101', 'BUS-105'],
      showNotification: true,
    },
    {
      id: 'evt-6',
      time: '04:10',
      type: 'resolution',
      title: 'Swap Approved',
      description: 'Dispatcher approves vehicle swap. BUS-105 reassigned to DUTY-001.',
      vehicleId: 'BUS-105',
      vehicleIds: ['BUS-105'],
      showNotification: true,
    },
    {
      id: 'evt-7',
      time: '05:00',
      type: 'alert',
      title: 'Grid Preconditioning',
      description: 'Pre-heating BUS-105 cabin on grid power to preserve battery for route.',
      vehicleId: 'BUS-105',
      vehicleIds: ['BUS-105'],
      showNotification: false,
    },
    {
      id: 'evt-8',
      time: '05:47',
      type: 'alert',
      title: 'Crisis Point (Without Orchestration)',
      description:
        'At this moment, without orchestration, dispatch would discover BUS-101 cannot depart. With orchestration, the problem was solved 1h 45m ago.',
      highlight: true,
      showNotification: true,
    },
    {
      id: 'evt-9',
      time: '06:15',
      type: 'departure',
      title: 'Successful Pull-out',
      description: 'BUS-105 departs on time for DUTY-001 with 97% SoC.',
      vehicleId: 'BUS-105',
      vehicleIds: ['BUS-105'],
      showNotification: true,
    },
  ],

  hasComparison: true,
  comparisonLabel: 'Without Orchestration',
};

// Cold Weather Impact scenario
const coldWeatherScenario: Scenario = {
  id: 'cold-weather',
  name: 'Cold Weather Impact',
  description:
    'Demonstrates 38% range reduction in extreme cold. HVAC consumes 50%+ of energy. Orchestration adjusts duty assignments automatically.',
  duration: 240,
  startTime: '04:00',
  endTime: '08:00',
  difficulty: 'Medium',
  tags: ['cold-weather', 'range-reduction', 'hvac', 'duty-reassignment'],

  initialState: {
    weather: {
      temperature: -5,
      condition: 'Extreme cold',
    },
  },

  events: [
    {
      id: 'cold-1',
      time: '04:00',
      type: 'weather',
      title: 'Extreme Cold Warning',
      description: 'Temperature: -5°C. Expected range reduction: 38%. HVAC pre-heating recommended.',
      temperatureChange: -10,
      highlight: true,
      showNotification: true,
    },
    {
      id: 'cold-2',
      time: '04:15',
      type: 'alert',
      title: 'Route Energy Recalculation',
      description:
        'Route 5A energy requirement increased from 180 kWh to 248 kWh due to HVAC demand.',
      showNotification: true,
    },
    {
      id: 'cold-3',
      time: '04:30',
      type: 'alert',
      title: 'Insufficient Range Warning',
      description: '3 vehicles may not complete full duty cycles. Shorter routes recommended.',
      vehicleIds: ['BUS-104', 'BUS-107', 'BUS-112'],
      highlight: true,
      showNotification: true,
    },
    {
      id: 'cold-4',
      time: '05:00',
      type: 'resolution',
      title: 'Duty Reassignment',
      description:
        'Orchestration reassigns 3 vehicles to shorter routes. Pulls in reserve vehicle for Route 73.',
      showNotification: true,
    },
  ],

  hasComparison: true,
  comparisonLabel: 'Manual Planning',
};

// Grid Constraint scenario
const gridConstraintScenario: Scenario = {
  id: 'grid-constraint',
  name: 'Peak Demand Navigation',
  description:
    'Evening peak (16:00-19:00) requires 50% power reduction at North Depot. Smart charging optimizes within constraints.',
  duration: 300,
  startTime: '15:30',
  endTime: '20:30',
  difficulty: 'Medium',
  tags: ['grid-constraint', 'peak-demand', 'smart-charging', 'cost-savings'],

  initialState: {},

  events: [
    {
      id: 'grid-1',
      time: '15:30',
      type: 'alert',
      title: 'Peak Period Approaching',
      description:
        'North Depot grid constraint active in 30 minutes. Current load: 1.2 MW. Required: < 0.9 MW.',
      highlight: true,
      showNotification: true,
    },
    {
      id: 'grid-2',
      time: '15:45',
      type: 'resolution',
      title: 'Smart Charging Activated',
      description:
        'Reducing CH-N01, CH-N02 to 50% power. Prioritizing vehicles with earliest morning departures.',
      chargerIds: ['CH-N01', 'CH-N02'],
      showNotification: true,
    },
    {
      id: 'grid-3',
      time: '16:00',
      type: 'alert',
      title: 'Peak Period Active',
      description: 'Grid constraint enforced. Load reduced to 0.85 MW. All vehicles on track.',
      highlight: true,
      showNotification: true,
    },
    {
      id: 'grid-4',
      time: '19:00',
      type: 'resolution',
      title: 'Peak Period Ended',
      description:
        'Full charging resumed. Estimated savings: £342 in demand charges avoided.',
      showNotification: true,
    },
  ],

  hasComparison: true,
  comparisonLabel: 'Unmanaged Charging',
};

// Cascade Failure scenario
const cascadeScenario: Scenario = {
  id: 'cascade-failure',
  name: 'Opportunity Charging Cascade',
  description:
    'A minor delay at 14:00 cascades into evening service failure without orchestration intervention.',
  duration: 360,
  startTime: '14:00',
  endTime: '20:00',
  difficulty: 'Easy',
  tags: ['delay', 'opportunity-charging', 'cascade-prevention', 'early-intervention'],

  initialState: {},

  events: [
    {
      id: 'cascade-1',
      time: '14:00',
      type: 'delay',
      title: 'Traffic Delay',
      description: 'BUS-108 delayed 15 minutes on Route 5A due to road closure.',
      vehicleId: 'BUS-108',
      vehicleIds: ['BUS-108'],
      showNotification: true,
    },
    {
      id: 'cascade-2',
      time: '14:20',
      type: 'alert',
      title: 'Charging Window Missed',
      description:
        'BUS-108 misses scheduled opportunity charge at terminus. SoC: 35% vs required 45%.',
      vehicleId: 'BUS-108',
      vehicleIds: ['BUS-108'],
      highlight: true,
      showNotification: true,
    },
    {
      id: 'cascade-3',
      time: '14:30',
      type: 'alert',
      title: 'Cascade Risk Detected',
      description:
        'Without intervention, BUS-108 cannot complete evening service. Projected stranded at 18:45.',
      vehicleId: 'BUS-108',
      vehicleIds: ['BUS-108'],
      highlight: true,
      showNotification: true,
    },
    {
      id: 'cascade-4',
      time: '14:35',
      type: 'resolution',
      title: 'Early Intervention',
      description:
        'Orchestration redirects BUS-108 to depot fast charger. BUS-115 covers remaining Route 5A trips.',
      vehicleIds: ['BUS-108', 'BUS-115'],
      showNotification: true,
    },
    {
      id: 'cascade-5',
      time: '15:30',
      type: 'resolution',
      title: 'Crisis Averted',
      description: 'BUS-108 charged to 85%. Rejoining evening service at 16:00.',
      vehicleId: 'BUS-108',
      vehicleIds: ['BUS-108'],
      showNotification: true,
    },
  ],

  hasComparison: true,
  comparisonLabel: 'Without Early Detection',
};

export const scenarios: Scenario[] = [
  morningCrisisScenario,
  coldWeatherScenario,
  gridConstraintScenario,
  cascadeScenario,
];

export { morningCrisisScenario, coldWeatherScenario, gridConstraintScenario, cascadeScenario };
