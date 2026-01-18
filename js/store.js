class Store {
    constructor(initialData) {
        this.vehicles = JSON.parse(JSON.stringify(initialData.vehicles));
        this.chargers = JSON.parse(JSON.stringify(initialData.chargers));
        this.schedule = JSON.parse(JSON.stringify(initialData.schedule));
        this.routes = JSON.parse(JSON.stringify(initialData.routes)); // Store routes for sim
        this.alerts = [];
        this.runOrchestration();
        // Start Sim
        this.startSimulation();
    }

    startSimulation() {
        setInterval(() => {
            this.tick();
        }, 2000); // 2 second tick
    }

    tick() {
        this.vehicles.forEach(v => {
            if (v.status === 'Driving' && v.route) {
                // Simulate Movement along path
                v.progress = (v.progress || 0) + 0.05; // Move 5%
                if (v.progress > 1) v.progress = 0; // Loop for demo

                // Simple Linear Interpolation between route points
                const path = this.routes[v.route];
                if (path) {
                    const totalPoints = path.length - 1;
                    const scaledProgress = v.progress * totalPoints;
                    const index = Math.floor(scaledProgress);
                    const nextIndex = Math.min(index + 1, totalPoints);
                    const ratio = scaledProgress - index;

                    const p1 = path[index];
                    const p2 = path[nextIndex];

                    // Lerp Lat/Lng
                    v.lat = p1[0] + (p2[0] - p1[0]) * ratio;
                    v.lng = p1[1] + (p2[1] - p1[1]) * ratio;
                }

                // Simulate SoC Drain
                v.soc = Math.max(0, parseFloat((v.soc - 0.1).toFixed(1)));
            }
        });

        // Notify listeners (rudimentary observer pattern for demo)
        if (window.app && window.app.view) {
            window.app.view.updateMapMarkers();
            window.app.view.renderFleet(); // Update SoC in table
        }
    }

    /* --- Core Orchestration Logic --- */
    runOrchestration() {
        this.alerts = []; // Reset alerts

        // 1. Check for Charging/Pull-out Risks
        this.schedule.forEach(duty => {
            const vehicle = this.vehicles.find(v => v.id === duty.vehicleId);
            if (!vehicle) return;

            const charger = this.chargers.find(c => c.id === vehicle.chargerId);
            const isChargerFaulted = charger && charger.status !== 'Active';
            const isSoCCritical = vehicle.soc < vehicle.requiredSoC - 10;

            if (isSoCCritical && isChargerFaulted) {
                this.alerts.push({
                    id: `ALERT-${Date.now()}`,
                    type: 'Critical',
                    title: 'Pull-out Risk: Charger Fault',
                    message: `Vehicle ${vehicle.id} on ${charger.id} is not charging. Required for ${duty.departureTime}.`,
                    vehicleId: vehicle.id,
                    dutyId: duty.id,
                    timestamp: 'Just now'
                });
            } else if (vehicle.soc < vehicle.requiredSoC && !charger && vehicle.status === 'Idle') {
                this.alerts.push({
                    id: `ALERT-${Date.now()}`,
                    type: 'Warning',
                    title: 'Vehicle Not Charging',
                    message: `Vehicle ${vehicle.id} needs charge for ${duty.departureTime} but is Idle.`,
                    vehicleId: vehicle.id,
                    dutyId: duty.id,
                    timestamp: '5 min ago'
                });
            }
        });

        // 2. Grid Constraints (Mock check)
        const totalLoad = this.chargers.reduce((sum, c) => (c.status === 'Active' ? sum + c.power : sum), 0);
        if (totalLoad > 1000) {
            this.alerts.push({ type: 'Warning', title: 'Grid Load High', message: 'Approaching depot peak capacity.' });
        }
    }

    /* --- Actions --- */
    getOrchestrationOptions(alertId) {
        const alert = this.alerts.find(a => a.id === alertId);
        if (!alert) return [];

        const duty = this.schedule.find(d => d.id === alert.dutyId);
        if (!duty) return [];

        const candidates = this.vehicles.filter(v =>
            v.soc >= v.requiredSoC &&
            !v.assignedDuty &&
            v.status !== 'Faulted'
        );

        return candidates.map(v => ({
            label: `Swap with ${v.id} (${v.soc}%)`,
            action: 'SWAP',
            targetVehicleId: v.id,
            sourceVehicleId: alert.vehicleId,
            dutyId: alert.dutyId
        }));
    }

    resolveAlert(alertId, optionIndex) {
        const options = this.getOrchestrationOptions(alertId);
        const selected = options[optionIndex];

        if (selected && selected.action === 'SWAP') {
            console.log("Executing Swap: ", selected);

            const dutyIndex = this.schedule.findIndex(d => d.id === selected.dutyId);
            this.schedule[dutyIndex].vehicleId = selected.targetVehicleId;

            const sourceVehicle = this.vehicles.find(v => v.id === selected.sourceVehicleId);
            const targetVehicle = this.vehicles.find(v => v.id === selected.targetVehicleId);

            sourceVehicle.assignedDuty = null;
            targetVehicle.assignedDuty = selected.dutyId;

            this.runOrchestration();
            return true;
        }
        return false;
    }

    getDashboardStats() {
        const activeAlerts = this.alerts.length;
        const assignedVehicles = this.schedule.length;
        const readyVehicles = this.schedule.filter(d => {
            const v = this.vehicles.find(veh => veh.id === d.vehicleId);
            return v && v.soc >= v.requiredSoC - 5;
        }).length;

        return {
            activeAlerts,
            readiness: Math.round((readyVehicles / assignedVehicles) * 100) || 100,
            load: this.chargers.reduce((s, c) => c.status === 'Active' ? s + c.power : s, 0)
        };
    }
}
