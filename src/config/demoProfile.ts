const profiles = {
  general: {
    id: 'general', label: 'General depot demo', initialView: 'dashboard',
    title: 'Orchestrated Depot | Digital Control Tower',
    mapDescription: 'General demo · simulated fleet, depots and chargers',
    networkControlLabel: 'Show all demo depots',
  },
  translink: {
    id: 'translink', label: 'Translink demo', initialView: 'control',
    title: 'Translink Demo | Service Control Decisions',
    mapDescription: 'Belfast demo · simulated fleet and chargers at approximate depot locations',
    networkControlLabel: 'Show all Belfast depots',
  },
} as const;

// A document navigation starts a fresh, independent in-memory demonstration.
// Accept the requested URL with either case and with an optional trailing slash.
export function getDemoProfile(pathname: string) {
  return pathname.replace(/\/+$/, '').toLowerCase() === '/translink'
    ? profiles.translink : profiles.general;
}

export const activeDemoProfile = getDemoProfile(typeof window === 'undefined' ? '/' : window.location.pathname);
