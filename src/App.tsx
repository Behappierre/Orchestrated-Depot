import { useEffect } from 'react';
import { useAppStore } from './stores/useAppStore';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/dashboard/DashboardView';
import { MapView } from './components/map/MapView';
import { FleetView } from './components/fleet/FleetView';
import { EnergyView } from './components/energy/EnergyView';
import { ScenarioView } from './components/scenarios/ScenarioView';
import { GuideView } from './components/guide/GuideView';

function App() {
  const { currentView, tick, isSimulationRunning, runOrchestrationCheck } = useAppStore();

  // Run simulation tick every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (isSimulationRunning) {
        tick();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [tick, isSimulationRunning]);

  // Run initial orchestration check
  useEffect(() => {
    runOrchestrationCheck();
  }, [runOrchestrationCheck]);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'map':
        return <MapView />;
      case 'fleet':
        return <FleetView />;
      case 'energy':
        return <EnergyView />;
      case 'scenarios':
        return <ScenarioView />;
      case 'guide':
        return <GuideView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-4">
          {renderView()}
        </main>
      </div>
    </div>
  );
}

export default App;
