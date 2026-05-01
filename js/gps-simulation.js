// gps-simulation.js - Simulasi pergerakan GPS (untuk demo tanpa hardware)
let simulationInterval = null;
let devicePositions = new Map();
let deviceAngles = new Map();

function startGPSSimulation() {
    if (simulationInterval) clearInterval(simulationInterval);
    
    simulationInterval = setInterval(() => {
        if (devicesData.length === 0) return;
        
        const now = Date.now();
        
        devicesData.forEach(device => {
            let pos = devicePositions.get(device.id);
            let angle = deviceAngles.get(device.id) || 0;
            
            if (!pos) {
                pos = { lat: CONFIG.DEFAULT_LAT + (Math.random() - 0.5) * 0.05, lng: CONFIG.DEFAULT_LNG + (Math.random() - 0.5) * 0.05 };
                devicePositions.set(device.id, pos);
            }
            
            const speedKmh = 20 + Math.random() * 60;
            const speedMs = speedKmh / 3.6;
            const deltaTime = 5;
            const distance = speedMs * deltaTime;
            
            angle += (Math.random() - 0.5) * 20;
            deviceAngles.set(device.id, angle);
            
            const deltaLat = (distance * Math.cos(angle * Math.PI / 180)) / 111000;
            const deltaLng = (distance * Math.sin(angle * Math.PI / 180)) / (111000 * Math.cos(pos.lat * Math.PI / 180));
            
            pos.lat += deltaLat;
            pos.lng += deltaLng;
            
            // Batasi pergerakan sekitar area Jakarta
            pos.lat = Math.min(-6.1, Math.max(-6.3, pos.lat));
            pos.lng = Math.min(106.95, Math.max(106.7, pos.lng));
            
            devicePositions.set(device.id, pos);
            
            // Update telemetry
            updateTelemetryFromGPS(device.id, pos.lat, pos.lng, now, {
                acc: true,
                fuelLevel: Math.max(0, (deviceTelemetry[device.id]?.fuelLevel || 100) - 0.05),
                flowRate: speedKmh / 20,
                fuelUsed: (deviceGPSTracking.get(device.id)?.odometer || 0) * 0.12,
                estimatedRange: Math.max(0, (100 - (deviceTelemetry[device.id]?.fuelLevel || 0)) * 5)
            });
            
            // Update history
            if (!positionsHistory[device.id]) positionsHistory[device.id] = [];
            positionsHistory[device.id].push({
                lat: pos.lat, lng: pos.lng, time: new Date(now).toISOString(), speed: deviceTelemetry[device.id]?.speed || 0
            });
            if (positionsHistory[device.id].length > 500) positionsHistory[device.id].shift();
        });
    }, CONFIG.GPS_UPDATE_INTERVAL);
}

function stopGPSSimulation() {
    if (simulationInterval) {
        clearInterval(simulationInterval);
        simulationInterval = null;
    }
}