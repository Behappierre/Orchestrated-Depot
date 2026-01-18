import { KPIRibbon } from './KPIRibbon';
import { OrchestrationLog } from './OrchestrationLog';
import { DepartureMatrix } from './DepartureMatrix';

export function DashboardView() {
  return (
    <div className="h-full flex flex-col gap-4">
      {/* KPI Ribbon */}
      <KPIRibbon />

      {/* Main Content Split */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Left: Orchestration Log */}
        <div className="w-[420px] flex-shrink-0">
          <OrchestrationLog />
        </div>

        {/* Right: Departure Matrix */}
        <div className="flex-1 min-w-0">
          <DepartureMatrix />
        </div>
      </div>
    </div>
  );
}
