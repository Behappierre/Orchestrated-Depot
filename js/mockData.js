const MOCK_DATA = {
    // London King's Cross / St Pancras Area
    depotLocation: [51.5320, -0.1240],

    // Simulate routes with simple waypoints (Lat, Lon)
    routes: {
        'Route 5A': [
            [51.5320, -0.1240], [51.5300, -0.1230], [51.5280, -0.1200], [51.5260, -0.1180], [51.5240, -0.1160]
        ],
        'Route 10B': [
            [51.5320, -0.1240], [51.5340, -0.1260], [51.5360, -0.1300], [51.5380, -0.1350]
        ]
    },

    // Expanded Vehicle Schema
    vehicles: [
        {
            id: 'BUS-101', model: 'eCitaro', soc: 35, requiredSoC: 90, status: 'Charging',
            chargerId: 'CH-01', location: 'Depot Lane 1', assignedDuty: 'BLOCK-001',
            lat: 51.5321, lng: -0.1241,
            // New "10x" Data Points
            soh: 98, odometer: 45020, efficiency: 1.2, driverScore: 92,
            cycles: 320, batteryTemp: 28, nextService: '2d',
            lastSync: '20ms', connectionType: 'CCS2'
        },
        {
            id: 'BUS-102', model: 'eCitaro', soc: 95, requiredSoC: 90, status: 'Idle',
            chargerId: null, location: 'Depot Lane 2', assignedDuty: 'BLOCK-002',
            lat: 51.5322, lng: -0.1242,
            soh: 99, odometer: 12050, efficiency: 1.1, driverScore: 98,
            cycles: 90, batteryTemp: 22, nextService: '14d',
            lastSync: '15ms', connectionType: 'CCS2'
        },
        {
            id: 'BUS-103', model: '7900e', soc: 88, requiredSoC: 85, status: 'Charging',
            chargerId: 'CH-02', location: 'Depot Lane 1', assignedDuty: 'BLOCK-003',
            lat: 51.5321, lng: -0.1243,
            soh: 97, odometer: 67800, efficiency: 1.4, driverScore: 85,
            cycles: 540, batteryTemp: 34, nextService: '5d',
            lastSync: '40ms', connectionType: 'OppCharge'
        },
        {
            id: 'BUS-104', model: '7900e', soc: 92, requiredSoC: 90, status: 'Idle',
            chargerId: null, location: 'Depot Lane 2', assignedDuty: 'BLOCK-004',
            lat: 51.5322, lng: -0.1244,
            soh: 88, odometer: 125000, efficiency: 1.6, driverScore: 78,
            cycles: 1100, batteryTemp: 23, nextService: 'Urgent',
            lastSync: '110ms', connectionType: 'OppCharge'
        },
        {
            id: 'BUS-105', model: 'eCitaro', soc: 98, requiredSoC: 90, status: 'Idle',
            chargerId: null, location: 'Depot Lane 3', assignedDuty: null,
            lat: 51.5323, lng: -0.1241,
            soh: 99, odometer: 2100, efficiency: 1.0, driverScore: 99,
            cycles: 15, batteryTemp: 21, nextService: '30d',
            lastSync: '10ms', connectionType: 'CCS2'
        },
        {
            id: 'BUS-106', model: 'eCitaro', soc: 40, requiredSoC: 45, status: 'Charging',
            chargerId: 'CH-03', location: 'Depot Lane 1', assignedDuty: 'BLOCK-005',
            lat: 51.5321, lng: -0.1245,
            soh: 96, odometer: 52300, efficiency: 1.2, driverScore: 88,
            cycles: 410, batteryTemp: 41, nextService: '10d',
            lastSync: '25ms', connectionType: 'CCS2'
        },
        // Active vehicles
        {
            id: 'BUS-109', model: 'eCitaro', soc: 82, requiredSoC: 50, status: 'Driving',
            chargerId: null, location: 'Route 5A', assignedDuty: 'BLOCK-007',
            lat: 51.5280, lng: -0.1200, route: 'Route 5A', progress: 0.5,
            soh: 99, odometer: 33000, efficiency: 1.3, driverScore: 94,
            cycles: 240, batteryTemp: 30, nextService: '12d',
            lastSync: '200ms', connectionType: 'CCS2'
        },
        {
            id: 'BUS-110', model: 'eCitaro', soc: 60, requiredSoC: 50, status: 'Driving',
            chargerId: null, location: 'Route 10B', assignedDuty: 'BLOCK-008',
            lat: 51.5360, lng: -0.1300, route: 'Route 10B', progress: 0.7,
            soh: 98, odometer: 41000, efficiency: 1.25, driverScore: 91,
            cycles: 290, batteryTemp: 29, nextService: '18d',
            lastSync: '150ms', connectionType: 'CCS2'
        },
    ],

    // Expanded Charger Schema
    chargers: [
        { id: 'CH-01', power: 50, status: 'Faulted', connectedVehicle: 'BUS-101', voltage: 0, current: 0, totalSessionEnergy: 12.5 },
        { id: 'CH-02', power: 150, status: 'Active', connectedVehicle: 'BUS-103', voltage: 750, current: 180, totalSessionEnergy: 45.2 },
        { id: 'CH-03', power: 150, status: 'Active', connectedVehicle: 'BUS-106', voltage: 745, current: 175, totalSessionEnergy: 38.0 },
        { id: 'CH-04', power: 50, status: 'Active', connectedVehicle: 'BUS-107', voltage: 400, current: 110, totalSessionEnergy: 15.0 },
        { id: 'CH-05', power: 150, status: 'Active', connectedVehicle: 'BUS-108', voltage: 760, current: 190, totalSessionEnergy: 55.4 },
        { id: 'CH-06', power: 150, status: 'Available', connectedVehicle: null, voltage: 0, current: 0, totalSessionEnergy: 0 },
        { id: 'CH-07', power: 150, status: 'Available', connectedVehicle: null, voltage: 0, current: 0, totalSessionEnergy: 0 },
        { id: 'CH-08', power: 150, status: 'Available', connectedVehicle: null, voltage: 0, current: 0, totalSessionEnergy: 0 },
    ],

    schedule: [
        { id: 'BLOCK-001', departureTime: '06:15', driver: 'J. Smith', vehicleId: 'BUS-101' },
        { id: 'BLOCK-002', departureTime: '06:20', driver: 'M. Doe', vehicleId: 'BUS-102' },
        { id: 'BLOCK-003', departureTime: '06:30', driver: 'A. Khan', vehicleId: 'BUS-103' },
        { id: 'BLOCK-004', departureTime: '06:35', driver: 'S. Lee', vehicleId: 'BUS-104' },
        { id: 'BLOCK-005', departureTime: '06:45', driver: 'K. Patel', vehicleId: 'BUS-106' },
        { id: 'BLOCK-006', departureTime: '07:00', driver: 'T. Wilson', vehicleId: 'BUS-108' },
    ],

    // Initial Alerts are now Empty and will be generated by logic
    alerts: []
};
