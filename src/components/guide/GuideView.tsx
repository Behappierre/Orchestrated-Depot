import { useState } from 'react';
import {
  BookOpen,
  LayoutDashboard,
  Map,
  Bus,
  Zap,
  Play,
  AlertTriangle,
  Clock,
  TrendingUp,
  Layers,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { clsx } from 'clsx';

interface GuideSection {
  id: string;
  icon: typeof BookOpen;
  title: string;
  content: React.ReactNode;
}

export function GuideView() {
  const [expandedSection, setExpandedSection] = useState<string | null>('overview');

  const sections: GuideSection[] = [
    {
      id: 'overview',
      icon: Layers,
      title: 'The Orchestrated Depot',
      content: (
        <div className="space-y-4">
          <p>
            This demo showcases the <strong>Orchestrated Depot</strong> concept—a digital control
            tower that unifies fragmented operational systems into a single intelligent layer.
          </p>

          <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
            <h4 className="font-semibold text-white mb-2">The Core Problem</h4>
            <p className="text-sm text-slate-400">
              Electric bus operations rely on multiple specialist systems (scheduling, charging,
              telematics, energy management) that don't communicate. A problem detected at 22:00
              becomes a crisis at 05:30 when the first driver discovers their bus won't start.
            </p>
          </div>

          <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/30">
            <h4 className="font-semibold text-blue-400 mb-2">The Solution: Two-Layer Architecture</h4>
            <ul className="text-sm text-slate-300 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">1.</span>
                <span><strong>Specialist Systems Layer:</strong> Existing tools (Optibus, ViriCiti, ChargePoint) continue doing what they do best</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">2.</span>
                <span><strong>Orchestration Layer:</strong> A unified intelligence that monitors all systems, detects conflicts, and proposes resolutions</span>
              </li>
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/30">
              <h5 className="font-medium text-emerald-400 text-sm mb-1">Key Outcome</h5>
              <p className="text-xs text-slate-400">Morning pull-out guarantee with 15-25% energy cost reduction</p>
            </div>
            <div className="bg-amber-500/10 p-3 rounded-lg border border-amber-500/30">
              <h5 className="font-medium text-amber-400 text-sm mb-1">Human-in-the-Loop</h5>
              <p className="text-xs text-slate-400">Auto-execute, Approve-before-execute, or Escalate based on risk</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'dashboard',
      icon: LayoutDashboard,
      title: 'Dashboard View',
      content: (
        <div className="space-y-4">
          <p>
            The <strong>Risk Center</strong> provides real-time operational intelligence and
            surfaces problems before they become service failures.
          </p>

          <div className="space-y-3">
            <div className="bg-slate-800/50 p-3 rounded-lg">
              <h5 className="font-medium text-white text-sm mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                KPI Ribbon
              </h5>
              <ul className="text-xs text-slate-400 space-y-1">
                <li><strong>Fleet Readiness:</strong> % of vehicles ready for their next scheduled departure</li>
                <li><strong>Charger Uptime:</strong> Availability of charging infrastructure</li>
                <li><strong>Grid Load:</strong> Current power consumption vs. maximum capacity</li>
                <li><strong>Energy Rate:</strong> Current Time-of-Use tariff period (peak/off-peak)</li>
                <li><strong>Today's Savings:</strong> Cost avoided through smart charging optimization</li>
                <li><strong>CO2 Avoided:</strong> Environmental impact vs. diesel equivalent</li>
                <li><strong>Active Alerts:</strong> Unresolved issues requiring attention</li>
              </ul>
            </div>

            <div className="bg-slate-800/50 p-3 rounded-lg">
              <h5 className="font-medium text-white text-sm mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Orchestration Log
              </h5>
              <p className="text-xs text-slate-400 mb-2">
                Real-time feed of detected conflicts with proposed resolutions. Each alert includes:
              </p>
              <ul className="text-xs text-slate-400 space-y-1">
                <li>• <strong>Severity:</strong> Critical (red), Warning (amber), Info (blue)</li>
                <li>• <strong>Countdown Timer:</strong> Time remaining until action must be taken</li>
                <li>• <strong>Confidence Score:</strong> AI-generated confidence in the proposed action</li>
                <li>• <strong>Impact Preview:</strong> What happens if unresolved (services affected, penalty risk)</li>
                <li>• <strong>One-Click Resolution:</strong> Approve or reject with full audit trail</li>
              </ul>
            </div>

            <div className="bg-slate-800/50 p-3 rounded-lg">
              <h5 className="font-medium text-white text-sm mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                Departure Matrix
              </h5>
              <p className="text-xs text-slate-400">
                The next 2 hours of scheduled departures with SoC trajectory visualization.
                Shows current battery level vs. required level, with color-coded risk status.
                Filters allow focus on critical, at-risk, or ready vehicles.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'map',
      icon: Map,
      title: 'Map View',
      content: (
        <div className="space-y-4">
          <p>
            The <strong>Live Network Control</strong> view provides spatial awareness of your
            entire operation across multiple depots.
          </p>

          <div className="space-y-3">
            <div className="bg-slate-800/50 p-3 rounded-lg">
              <h5 className="font-medium text-white text-sm mb-2">Vehicle Markers</h5>
              <ul className="text-xs text-slate-400 space-y-1">
                <li>• <span className="text-blue-400">Blue:</span> Vehicle is charging</li>
                <li>• <span className="text-emerald-400">Green:</span> Vehicle on route, healthy SoC</li>
                <li>• <span className="text-red-400">Red:</span> Vehicle at risk (SoC below required level)</li>
              </ul>
            </div>

            <div className="bg-slate-800/50 p-3 rounded-lg">
              <h5 className="font-medium text-white text-sm mb-2">Charger Markers</h5>
              <ul className="text-xs text-slate-400 space-y-1">
                <li>• <span className="text-blue-400">Blue pulse:</span> Active charging session</li>
                <li>• <span className="text-slate-400">Grey:</span> Available</li>
                <li>• <span className="text-red-400">Red:</span> Faulted</li>
              </ul>
            </div>

            <div className="bg-slate-800/50 p-3 rounded-lg">
              <h5 className="font-medium text-white text-sm mb-2">Route Visualization</h5>
              <p className="text-xs text-slate-400">
                Toggle route overlays to see scheduled paths. Color-coded by route number.
                Depot zones show physical boundaries and any active grid constraints.
              </p>
            </div>

            <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/30">
              <h5 className="font-medium text-blue-400 text-sm mb-2">Multi-Depot Operations</h5>
              <p className="text-xs text-slate-300">
                This demo includes 3 depots: Central (12 chargers), North (8 chargers), and
                East (6 chargers). The orchestration layer can propose cross-depot swaps when needed.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'fleet',
      icon: Bus,
      title: 'Fleet View',
      content: (
        <div className="space-y-4">
          <p>
            The <strong>Fleet Operations</strong> view provides detailed telemetry for every
            vehicle in your electric fleet.
          </p>

          <div className="space-y-3">
            <div className="bg-slate-800/50 p-3 rounded-lg">
              <h5 className="font-medium text-white text-sm mb-2">Vehicle Telemetry</h5>
              <ul className="text-xs text-slate-400 space-y-1">
                <li>• <strong>SoC (State of Charge):</strong> Current battery percentage</li>
                <li>• <strong>SoH (State of Health):</strong> Battery degradation indicator</li>
                <li>• <strong>Efficiency:</strong> kWh/km consumption (affected by driving style, HVAC, terrain)</li>
                <li>• <strong>Battery Temperature:</strong> Critical for charging speed and range</li>
                <li>• <strong>HVAC Load:</strong> Heating/cooling power draw (major factor in cold weather)</li>
              </ul>
            </div>

            <div className="bg-amber-500/10 p-3 rounded-lg border border-amber-500/30">
              <h5 className="font-medium text-amber-400 text-sm mb-2">Cold Weather Impact</h5>
              <p className="text-xs text-slate-300">
                The whitepaper highlights that electric buses can experience <strong>38% range
                reduction</strong> in extreme cold, with HVAC consuming 50%+ of energy. The
                orchestration layer factors this into departure readiness calculations.
              </p>
            </div>

            <div className="bg-slate-800/50 p-3 rounded-lg">
              <h5 className="font-medium text-white text-sm mb-2">Detail Panel</h5>
              <p className="text-xs text-slate-400">
                Click any vehicle to see full details: assigned duty, driver, route information,
                charging history, and maintenance status. Vehicles with overdue maintenance are
                flagged and can trigger orchestration alerts.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'energy',
      icon: Zap,
      title: 'Energy View',
      content: (
        <div className="space-y-4">
          <p>
            The <strong>Energy & Infrastructure</strong> view manages the intersection of
            charging operations and grid constraints.
          </p>

          <div className="space-y-3">
            <div className="bg-slate-800/50 p-3 rounded-lg">
              <h5 className="font-medium text-white text-sm mb-2">Grid Load Profile</h5>
              <p className="text-xs text-slate-400">
                24-hour visualization showing actual consumption vs. forecast vs. grid limit.
                The red reference line indicates maximum allowed capacity. Exceeding this triggers
                demand charges and potential infrastructure damage.
              </p>
            </div>

            <div className="bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/30">
              <h5 className="font-medium text-emerald-400 text-sm mb-2">Smart Charging Optimization</h5>
              <p className="text-xs text-slate-300">
                The orchestration layer automatically shifts charging to off-peak periods when
                possible, achieving <strong>15-25% cost reduction</strong>. The tariff timeline
                shows current period (super-off-peak, off-peak, standard, peak) with rates.
              </p>
            </div>

            <div className="bg-slate-800/50 p-3 rounded-lg">
              <h5 className="font-medium text-white text-sm mb-2">Charger Status Grid</h5>
              <p className="text-xs text-slate-400">
                Visual matrix of all chargers with real-time status. Click any charger to see
                connected vehicle, power delivery, session energy, and estimated completion time.
                Faulted chargers show error codes.
              </p>
            </div>

            <div className="bg-red-500/10 p-3 rounded-lg border border-red-500/30">
              <h5 className="font-medium text-red-400 text-sm mb-2">Grid Constraints</h5>
              <p className="text-xs text-slate-300">
                Some depots have time-based restrictions (e.g., 50% capacity during 16:00-19:00
                peak demand). The orchestration layer automatically manages load within these
                constraints while ensuring all vehicles meet departure requirements.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'scenarios',
      icon: Play,
      title: 'Scenarios View',
      content: (
        <div className="space-y-4">
          <p>
            The <strong>Scenario Playback</strong> system demonstrates how the orchestration
            layer handles real-world operational challenges.
          </p>

          <div className="space-y-3">
            <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/30">
              <h5 className="font-medium text-red-400 text-sm mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                The 05:47 Crisis (From Whitepaper)
              </h5>
              <p className="text-xs text-slate-300 mb-2">
                This scenario recreates the executive summary example:
              </p>
              <ul className="text-xs text-slate-300 space-y-1">
                <li>• 03:00 - Charger goes offline, vehicle stuck at 32% SoC</li>
                <li>• 03:15 - Temperature drops, battery charge acceptance reduced</li>
                <li>• 04:00 - Orchestration detects pull-out risk 2+ hours early</li>
                <li>• 04:05 - Automatic swap proposal (94% confidence)</li>
                <li>• 05:47 - "Crisis point" where manual systems would first notice</li>
                <li>• 06:15 - Successful pull-out with swapped vehicle</li>
              </ul>
            </div>

            <div className="bg-slate-800/50 p-3 rounded-lg">
              <h5 className="font-medium text-white text-sm mb-2">Other Scenarios</h5>
              <ul className="text-xs text-slate-400 space-y-2">
                <li><strong>Cold Weather Impact:</strong> 38% range reduction, automatic duty reassignment</li>
                <li><strong>Peak Demand Navigation:</strong> Grid constraint handling, smart load reduction</li>
                <li><strong>Opportunity Charging Cascade:</strong> Minor delay cascading to evening failure</li>
              </ul>
            </div>

            <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/30">
              <h5 className="font-medium text-blue-400 text-sm mb-2">Comparison Mode</h5>
              <p className="text-xs text-slate-300">
                Toggle comparison mode to see side-by-side: what happens <strong>without</strong>
                orchestration (reactive, manual detection at 05:30) vs. <strong>with</strong>
                orchestration (proactive, automatic resolution at 04:05).
              </p>
            </div>

            <div className="bg-slate-800/50 p-3 rounded-lg">
              <h5 className="font-medium text-white text-sm mb-2">Playback Controls</h5>
              <p className="text-xs text-slate-400">
                Use play/pause, speed controls (1x-16x), and the timeline scrubber to navigate
                through scenarios. Event markers show problems (red), alerts (amber), and
                resolutions (green) along the timeline.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'terminology',
      icon: BookOpen,
      title: 'Key Terminology',
      content: (
        <div className="space-y-4">
          <p>
            Terms used in this demo align with the Orchestrated Depot whitepaper:
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800/50 p-3 rounded-lg">
              <h5 className="font-medium text-white text-sm">Pull-out</h5>
              <p className="text-xs text-slate-400">Vehicle departure from depot for scheduled service</p>
            </div>
            <div className="bg-slate-800/50 p-3 rounded-lg">
              <h5 className="font-medium text-white text-sm">SoC</h5>
              <p className="text-xs text-slate-400">State of Charge - battery level as percentage</p>
            </div>
            <div className="bg-slate-800/50 p-3 rounded-lg">
              <h5 className="font-medium text-white text-sm">SoH</h5>
              <p className="text-xs text-slate-400">State of Health - battery capacity vs. original</p>
            </div>
            <div className="bg-slate-800/50 p-3 rounded-lg">
              <h5 className="font-medium text-white text-sm">Opportunity Charging</h5>
              <p className="text-xs text-slate-400">Fast charging at route terminus during layover</p>
            </div>
            <div className="bg-slate-800/50 p-3 rounded-lg">
              <h5 className="font-medium text-white text-sm">Depot Charging</h5>
              <p className="text-xs text-slate-400">Overnight charging at home depot (typically slower, cheaper)</p>
            </div>
            <div className="bg-slate-800/50 p-3 rounded-lg">
              <h5 className="font-medium text-white text-sm">Time-of-Use (ToU)</h5>
              <p className="text-xs text-slate-400">Variable electricity pricing by time period</p>
            </div>
            <div className="bg-slate-800/50 p-3 rounded-lg">
              <h5 className="font-medium text-white text-sm">Grid Constraint</h5>
              <p className="text-xs text-slate-400">Maximum power draw limits (contractual or physical)</p>
            </div>
            <div className="bg-slate-800/50 p-3 rounded-lg">
              <h5 className="font-medium text-white text-sm">Stranded Vehicle</h5>
              <p className="text-xs text-slate-400">Vehicle unable to complete route due to insufficient charge</p>
            </div>
          </div>

          <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/30 mt-4">
            <h5 className="font-medium text-blue-400 text-sm mb-2">The Four Key Outcomes</h5>
            <ul className="text-xs text-slate-300 space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <strong>Morning pull-out guarantee:</strong> Every vehicle ready for first departure
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <strong>15-25% energy cost reduction:</strong> Smart charging optimization
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <strong>Crew decoupling from chaos:</strong> Drivers receive ready vehicles
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <strong>Disruption absorption:</strong> Problems resolved before they cascade
              </li>
            </ul>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-blue-500/20">
            <BookOpen className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Demo Guide</h1>
            <p className="text-sm text-slate-400">Understanding the Orchestrated Depot</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto space-y-2">
          {sections.map((section) => {
            const Icon = section.icon;
            const isExpanded = expandedSection === section.id;

            return (
              <div
                key={section.id}
                className="glass-card overflow-hidden"
              >
                <button
                  onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={clsx(
                      'p-2 rounded-lg',
                      isExpanded ? 'bg-blue-500/20' : 'bg-slate-800'
                    )}>
                      <Icon className={clsx(
                        'w-5 h-5',
                        isExpanded ? 'text-blue-400' : 'text-slate-400'
                      )} />
                    </div>
                    <span className={clsx(
                      'font-medium',
                      isExpanded ? 'text-white' : 'text-slate-300'
                    )}>
                      {section.title}
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 text-sm text-slate-300 animate-fade-in">
                    {section.content}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <div className="max-w-3xl mx-auto mt-6 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
          <p className="text-xs text-slate-500 text-center">
            This demo is based on the <strong className="text-slate-400">Orchestrated Depot whitepaper</strong>.
            All data is simulated for demonstration purposes. The orchestration logic reflects
            real-world operational patterns observed in electric bus fleet deployments.
          </p>
        </div>
      </div>
    </div>
  );
}
