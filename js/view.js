class View {
    constructor(store) {
        this.store = store;
        this.app = null;

        // Element References
        this.notificationsList = document.getElementById('notifications-list');
        this.scheduleBody = document.getElementById('schedule-table-body');

        // Navigation References
        this.navLinks = document.querySelectorAll('.nav-links li');
        this.views = document.querySelectorAll('.app-view');
        this.pageTitle = document.getElementById('page-title');

        // New Views References
        this.fleetBody = document.getElementById('fleet-table-body');
        this.chargerGrid = document.getElementById('charger-grid');
        this.energyLoadCanvas = document.getElementById('energyLoadCanvas');

        // Theme Toggle
        this.themeToggleBtn = document.getElementById('theme-toggle');
        if (this.themeToggleBtn) {
            this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());
        }

        // Map State
        this.mapInstance = null;
        this.vehicleMarkers = {};
        this.currentTheme = 'dark'; // Default

        // Initial Render
        this.renderAll();
    }

    /* --- Theme Handling --- */
    toggleTheme() {
        document.body.classList.toggle('light-mode');
        this.currentTheme = document.body.classList.contains('light-mode') ? 'light' : 'dark';

        // Refresh Map if it exists
        if (this.mapInstance) {
            this.mapInstance.remove();
            this.mapInstance = null;
            this.vehicleMarkers = {}; // Clear markers ref
            this.initLeafletMap();
        }
    }

    /* --- Navigation --- */
    switchView(viewName) {
        this.navLinks.forEach(link => {
            if (link.dataset.view === viewName) link.classList.add('active');
            else link.classList.remove('active');
        });

        this.views.forEach(view => view.style.display = 'none');
        const activeView = document.getElementById(`view-${viewName}`);
        if (activeView) activeView.style.display = 'block';

        const titles = {
            'dashboard': 'Orchestrated Depot Overview',
            'map': 'Live Network Control | Zone A',
            'fleet': 'Fleet Operations | Real-Time Telemetry',
            'energy': 'Energy & Infrastructure | 11kV Grid Connection',
            'settings': 'System Settings'
        };
        this.pageTitle.textContent = titles[viewName] || 'Overview';

        if (viewName === 'fleet') this.renderFleet();
        if (viewName === 'energy') this.renderEnergy();
        if (viewName === 'map') {
            setTimeout(() => {
                this.initLeafletMap();
                this.mapInstance.invalidateSize();
            }, 100);
        }
    }

    renderAll() {
        this.renderNotifications();
        this.renderSchedule();
        this.updateStats();
        this.renderFleet();
        this.renderEnergy();
    }

    /* --- Leaflet Map Integration (Dynamic Theme) --- */
    initLeafletMap() {
        if (this.mapInstance) return;

        const center = [51.5320, -0.1240];
        this.mapInstance = L.map('fullMapCanvas', { zoomControl: false, attributionControl: false }).setView(center, 15);
        L.control.zoom({ position: 'bottomright' }).addTo(this.mapInstance);

        // Dynamic Tile Selection
        const tileUrl = this.currentTheme === 'light'
            ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png' // Positron
            : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'; // Dark Matter

        L.tileLayer(tileUrl, {
            subdomains: 'abcd', maxZoom: 20
        }).addTo(this.mapInstance);

        this.drawZones();

        const routes = MOCK_DATA.routes;
        for (const [name, path] of Object.entries(routes)) {
            const color = name === 'Route 5A' ? '#ef4444' : '#10b981';
            L.polyline(path, { color: color, weight: 3, opacity: 0.8, dashArray: '5, 10' }).addTo(this.mapInstance);
        }

        this.store.vehicles.forEach(v => { this.updateVehicleMarker(v); });
    }

    drawZones() {
        const depotCoords = [[51.5330, -0.1250], [51.5330, -0.1230], [51.5310, -0.1230], [51.5310, -0.1250]];
        L.polygon(depotCoords, { color: '#3b82f6', weight: 1, fillColor: '#3b82f6', fillOpacity: 0.1 }).addTo(this.mapInstance)
            .bindTooltip("Charging Zone A", { permanent: true, direction: "center", className: "map-label" });
    }

    updateMapMarkers() {
        if (!this.mapInstance) return;
        this.store.vehicles.forEach(v => { this.updateVehicleMarker(v); });
    }

    updateVehicleMarker(vehicle) {
        if (!vehicle.lat || !vehicle.lng) return;

        let color = '#10b981'; // Green
        if (vehicle.soc < vehicle.requiredSoC && vehicle.status !== 'Charging') color = '#ef4444';
        else if (vehicle.status === 'Charging') color = '#3b82f6';

        // Adjust glow for light mode visibility if needed, but neon usually works on both
        const icon = L.divIcon({
            className: 'custom-bus-icon',
            html: `<div style="background-color: ${color}; width: 10px; height: 10px; border-radius: 50%; box-shadow: 0 0 8px ${color}; border: 2px solid #fff;"></div>`,
            iconSize: [14, 14], iconAnchor: [7, 7]
        });

        const popupContent = `
            <div style="font-family: Inter; font-size: 11px; color: #333;">
                <strong style="color: #000">${vehicle.id}</strong><br>
                SoC: <b>${vehicle.soc}%</b> | Status: ${vehicle.status}<br>
                Driver: ${vehicle.driverScore || 90}/100
            </div>
        `;

        if (this.vehicleMarkers[vehicle.id]) {
            this.vehicleMarkers[vehicle.id].setLatLng([vehicle.lat, vehicle.lng]);
            this.vehicleMarkers[vehicle.id].setIcon(icon);
            this.vehicleMarkers[vehicle.id].setPopupContent(popupContent);
        } else {
            const marker = L.marker([vehicle.lat, vehicle.lng], { icon: icon }).addTo(this.mapInstance);
            marker.bindPopup(popupContent);
            this.vehicleMarkers[vehicle.id] = marker;
        }
    }

    /* --- High Density Fleet View --- */
    renderFleet() {
        if (!this.fleetBody) return;
        this.fleetBody.innerHTML = '';
        this.store.vehicles.forEach(v => {
            const row = document.createElement('tr');

            const scoreColor = v.driverScore > 90 ? '#10b981' : (v.driverScore > 80 ? '#f59e0b' : '#ef4444');
            const cycleColor = v.cycles > 1000 ? '#ef4444' : '#94a3b8';
            const rowTextColor = this.currentTheme === 'light' ? '#1e293b' : '#fff';

            row.innerHTML = `
                <td style="font-weight:600; color: ${rowTextColor};">${v.id}</td>
                <td>${v.model}</td>
                <td><span class="status-badge" style="background:rgba(128,128,128,0.1); color:var(--text-primary); border:none;">${v.status}</span></td>
                <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="width:24px; text-align:right;">${v.soc}%</span>
                         <div style="width: 50px; height: 4px; background: var(--border-color); border-radius: 2px;">
                            <div style="width: ${v.soc}%; background: ${this.getSoCColor(v.soc)}; height: 100%; box-shadow: 0 0 5px ${this.getSoCColor(v.soc)};"></div>
                        </div>
                    </div>
                </td>
                <td>${v.assignedDuty || '<span style="color:var(--text-muted)">-</span>'}</td>
                <td style="color:${this.getSoCColor(v.soh)}">${v.soh}%</td>
                <td style="font-weight:600;">${v.efficiency} <span style="font-size:9px; color:var(--text-muted)">kWh/km</span></td>
                <td><span style="color:${scoreColor}">${v.driverScore}</span></td>
                <td style="color:${cycleColor}">${v.cycles}</td>
                <td>${v.batteryTemp}°C</td>
                <td style="text-align:right; font-family:'Courier New'">${v.lastSync}</td>
            `;
            this.fleetBody.appendChild(row);
        });
    }

    /* --- Orchestration Log (Risk Center) --- */
    renderNotifications() {
        if (!this.notificationsList) return;
        this.notificationsList.innerHTML = '';

        if (this.store.alerts.length === 0) {
            this.notificationsList.innerHTML = `
                <div class="log-item">
                    <div class="log-body" style="text-align:center; color: var(--text-muted); padding: 20px;">
                        <i class="fa-solid fa-check-circle" style="font-size: 24px; margin-bottom: 10px; color: var(--accent-green);"></i><br>
                        System Optimal
                    </div>
                </div>`;
            return;
        }

        this.store.alerts.forEach(alert => {
            const el = document.createElement('div');
            el.className = `log-item ${alert.type.toLowerCase()}`;
            el.innerHTML = `
                <div class="log-header">
                    <span class="log-title"><i class="fa-solid fa-triangle-exclamation"></i> ${alert.title}</span>
                    <span class="log-timer">T-30m</span>
                </div>
                <div class="log-body">
                    ${alert.message}
                </div>
                <div class="log-actions">
                    <button class="action-btn resolve" onclick="app.handleClick('RESOLVE', '${alert.id}')">Auto-Resolve</button>
                    <button class="action-btn investigate" onclick="app.handleClick('INVESTIGATE', '${alert.id}')">Investigate</button>
                </div>
            `;
            this.notificationsList.appendChild(el);
        });
    }

    renderSchedule() {
        if (!this.scheduleBody) return;
        this.scheduleBody.innerHTML = '';
        this.store.schedule.forEach(duty => {
            const vehicle = this.store.vehicles.find(v => v.id === duty.vehicleId);
            const alert = this.store.alerts.find(a => a.dutyId === duty.id);
            if (!vehicle) return;

            const statusClass = alert ? 'risk' : (vehicle.soc >= vehicle.requiredSoC ? 'ok' : 'warning');
            const statusText = alert ? 'RISK' : 'READY';
            const rowTextColor = this.currentTheme === 'light' ? '#1e293b' : '#fff';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="font-weight: 500; color: ${rowTextColor};">${duty.id}</td>
                <td>${vehicle.id} <span style="color:var(--text-muted); font-size:10px;">${vehicle.model}</span></td>
                <td>${vehicle.location}</td>
                <td style="font-family:'Courier New'; font-weight:700;">${duty.departureTime}</td>
                <td>${vehicle.soc}% → <span style="color:var(--text-muted)">${Math.max(0, vehicle.soc - 20)}%</span></td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td><i class="fa-solid fa-ellipsis-vertical" style="color:var(--text-muted); cursor:pointer;"></i></td>
            `;
            this.scheduleBody.appendChild(row);
            this.scheduleBody.appendChild(row);
        });
    }

    renderEnergy() {
        if (!this.chargerGrid) return;
        this.chargerGrid.innerHTML = '';
        this.store.chargers.forEach(c => {
            const div = document.createElement('div');
            div.className = `charger-item ${c.status === 'Faulted' ? 'faulted' : (c.status === 'Active' ? 'active' : '')}`;
            const idColor = this.currentTheme === 'light' ? '#1e293b' : '#fff';

            div.innerHTML = `
                <div style="font-size:11px; font-weight:700; color:${idColor};">${c.id}</div>
                <div style="font-size:9px; color:var(--text-muted); margin: 4px 0;">${c.power}kW / ${c.connectionType || 'CCS2'}</div>
                <i class="fa-solid fa-bolt" style="color: ${c.status === 'Active' ? '#3b82f6' : 'var(--text-secondary)'}; font-size:14px; margin: 5px 0;"></i>
                <div style="font-size:10px; color:var(--text-secondary)">${c.connectedVehicle || 'Empty'}</div>
                ${c.status === 'Active' ? `<div style="font-size:9px; color:#3b82f6; margin-top:4px;">${c.current}A / ${c.voltage}V</div>` : ''}
             `;
            this.chargerGrid.appendChild(div);
        });
        if (this.energyLoadCanvas) this.drawEnergyChart(this.energyLoadCanvas);
    }

    drawEnergyChart(canvas) {
        const ctx = canvas.getContext('2d');
        const w = canvas.parentElement.clientWidth; const h = canvas.parentElement.clientHeight;
        canvas.width = w; canvas.height = h;
        ctx.clearRect(0, 0, w, h);
        const gradient = ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)'); gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');
        ctx.beginPath(); ctx.moveTo(0, h);
        for (let i = 0; i < w; i += 5) { const y = (h - 30) - (Math.sin(i / 40) * 40 + Math.random() * 15 + 20); ctx.lineTo(i, y); }
        ctx.lineTo(w, h); ctx.fillStyle = gradient; ctx.fill();
        ctx.beginPath();
        for (let i = 0; i < w; i += 5) { const y = (h - 30) - (Math.sin(i / 40) * 40 + Math.random() * 15 + 20); if (i === 0) ctx.moveTo(i, y); else ctx.lineTo(i, y); }
        ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 2; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, 40); ctx.lineTo(w, 40); ctx.strokeStyle = '#ef4444'; ctx.setLineDash([5, 5]); ctx.stroke();
        ctx.fillStyle = '#ef4444'; ctx.fillText('Grid Limit (1.5MW)', 10, 35);
    }

    updateStats() {
        const stats = this.store.getDashboardStats();
        // KPI Ribbon Updates would go here in a real reactive app
        const bellBadge = document.querySelector('.notification-icon .badge');
        if (bellBadge) {
            bellBadge.textContent = stats.activeAlerts > 0 ? stats.activeAlerts : '';
            bellBadge.style.display = stats.activeAlerts > 0 ? 'block' : 'none';
        }
    }

    getSoCColor(soc) {
        if (soc < 40) return '#ef4444';
        if (soc < 80) return '#f59e0b';
        return '#10b981';
    }
}
