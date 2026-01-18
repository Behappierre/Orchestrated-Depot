import {
  LayoutDashboard,
  Map,
  Bus,
  Zap,
  Play,
  Layers,
  BookOpen,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import type { ViewType } from '../../types';
import { clsx } from 'clsx';

const navItems: { id: ViewType; icon: typeof LayoutDashboard; label: string }[] = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'map', icon: Map, label: 'Map' },
  { id: 'fleet', icon: Bus, label: 'Fleet' },
  { id: 'energy', icon: Zap, label: 'Energy' },
  { id: 'scenarios', icon: Play, label: 'Scenarios' },
  { id: 'guide', icon: BookOpen, label: 'Guide' },
];

export function Sidebar() {
  const { currentView, setCurrentView, alerts } = useAppStore();
  const unreadAlerts = alerts.filter((a) => !a.isResolved).length;

  return (
    <nav className="w-16 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-4">
      {/* Logo */}
      <div className="mb-8 p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
        <Layers className="w-6 h-6 text-white" />
      </div>

      {/* Navigation */}
      <ul className="flex-1 flex flex-col gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <li key={item.id}>
              <button
                onClick={() => setCurrentView(item.id)}
                className={clsx(
                  'relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200',
                  isActive
                    ? 'bg-blue-500/20 text-blue-400 shadow-glow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                )}
                title={item.label}
              >
                <Icon className="w-5 h-5" />

                {/* Alert indicator for dashboard */}
                {item.id === 'dashboard' && unreadAlerts > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadAlerts > 9 ? '9+' : unreadAlerts}
                  </span>
                )}

                {/* Active indicator */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-400 rounded-r-full" />
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {/* Bottom spacer */}
      <div className="mt-auto pt-4 border-t border-slate-800">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-xs font-bold text-slate-900">
          NC
        </div>
      </div>
    </nav>
  );
}
