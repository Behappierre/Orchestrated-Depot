import type { Depot } from '../types';
import { belfastDepots } from './belfast';

export const mockDepots: Depot[] = [
  {
    id: 'central',
    ...belfastDepots.central,
    maxCapacity: 2.4, // MW
    currentLoad: 850, // kW
    constraints: [
      {
        startHour: 0,
        endHour: 24,
        maxCapacityPercent: 100,
        description: 'No restrictions',
      },
    ],
    totalChargers: 12,
    activeChargers: 10,
    totalVehicles: 25,
    vehiclesOnSite: 20,
  },
  {
    id: 'north',
    ...belfastDepots.north,
    maxCapacity: 1.8, // MW
    currentLoad: 620, // kW
    constraints: [
      {
        startHour: 16,
        endHour: 19,
        maxCapacityPercent: 50,
        description: '50% cap during evening peak (16:00-19:00)',
      },
    ],
    totalChargers: 8,
    activeChargers: 7,
    totalVehicles: 15,
    vehiclesOnSite: 12,
  },
  {
    id: 'east',
    ...belfastDepots.east,
    maxCapacity: 1.2, // MW
    currentLoad: 380, // kW
    constraints: [
      {
        startHour: 7,
        endHour: 19,
        maxCapacityPercent: 0,
        description: 'No charging 07:00-19:00 (Nov-Mar)',
        months: [11, 12, 1, 2, 3],
      },
    ],
    totalChargers: 6,
    activeChargers: 5,
    totalVehicles: 10,
    vehiclesOnSite: 8,
  },
];
