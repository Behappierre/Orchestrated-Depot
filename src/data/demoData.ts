import { activeDemoProfile } from '../config/demoProfile';
import { mockVehicles as belfastVehicles } from './mockFleet';
import { mockDepots as belfastDepots } from './mockDepots';
import { mockRoutes as belfastRoutes } from './mockRoutes';
import { mockVehicles as generalVehicles } from './general/mockFleet';
import { mockDepots as generalDepots } from './general/mockDepots';
import { mockRoutes as generalRoutes } from './general/mockRoutes';

export const demoData = activeDemoProfile.id === 'translink'
  ? { vehicles: belfastVehicles, depots: belfastDepots, routes: belfastRoutes }
  : { vehicles: generalVehicles, depots: generalDepots, routes: generalRoutes };

export const demoMapCenter: [number, number] = activeDemoProfile.id === 'translink'
  ? [54.602, -5.94] : [51.532, -0.124];
