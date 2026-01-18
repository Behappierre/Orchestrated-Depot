import type { EnergyTariff } from '../types';

export const mockTariff: EnergyTariff = {
  name: 'UK Commercial EV Tariff',
  currency: '£',
  periods: [
    {
      startHour: 0,
      endHour: 5,
      rate: 0.08,
      type: 'super-off-peak',
    },
    {
      startHour: 5,
      endHour: 7,
      rate: 0.12,
      type: 'off-peak',
    },
    {
      startHour: 7,
      endHour: 9,
      rate: 0.28,
      type: 'peak',
    },
    {
      startHour: 9,
      endHour: 16,
      rate: 0.15,
      type: 'standard',
    },
    {
      startHour: 16,
      endHour: 19,
      rate: 0.32,
      type: 'peak',
    },
    {
      startHour: 19,
      endHour: 22,
      rate: 0.15,
      type: 'standard',
    },
    {
      startHour: 22,
      endHour: 24,
      rate: 0.10,
      type: 'off-peak',
    },
  ],
};

// Helper function to get current rate
export function getCurrentRate(tariff: EnergyTariff, hour: number): number {
  const period = tariff.periods.find(
    (p) => hour >= p.startHour && hour < p.endHour
  );
  return period?.rate || 0.15;
}

// Helper to get tariff type color
export function getTariffColor(type: string): string {
  switch (type) {
    case 'super-off-peak':
      return '#22c55e';
    case 'off-peak':
      return '#4ade80';
    case 'standard':
      return '#fbbf24';
    case 'peak':
      return '#ef4444';
    default:
      return '#94a3b8';
  }
}
