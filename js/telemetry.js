// telemetry.js - Perhitungan speed, odometer, dan telemetri
let deviceTelemetry = {};
let deviceGPSTracking = new Map();

// Haversine formula - menghitung jarak antar dua titik GPS (meter)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Radius bumi dalam meter
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Menghitung kecepatan dari jarak dan waktu (m/s -> km/h)
function calculateSpeed(distanceMeters, timeSeconds) {
    if (timeSeconds <= 0) return 0;
    const speedMs = distanceMeters / timeSeconds;
    return speedMs * 3.6;
}

// Update odometer dan speed berdasarkan pergerakan GPS
function updateGPSTracking(deviceId, lat, lng, timestamp) {
    const tracking = deviceGPSTracking.get(deviceId) || {
        lastLat: null, lastLng: null, lastTimestamp: null,
        odometer: 0, lastSpeed: 0
    };
    
    let newSpeed = 0;
    let newOdometer = tracking.odometer;
    
    if (tracking.lastLat !== null && tracking.lastLng !== null && tracking.lastTimestamp !== null) {
        const distance = calculateDistance(tracking.lastLat, tracking.lastLng, lat, lng);
        const timeDiff = (timestamp - tracking.lastTimestamp) / 1000;
        
        if (timeDiff > 0 && timeDiff < 30) { // valid jika interval < 30 detik
            newSpeed = calculateSpeed(distance, timeDiff);
            newOdometer += distance / 1000; // konversi ke km
        }
    }
    
    deviceGPSTracking.set(deviceId, {
        lastLat: lat, lastLng: lng, lastTimestamp: timestamp,
        odometer: newOdometer, lastSpeed: newSpeed
    });
    
    return { speed: newSpeed, odometer: newOdometer };
}

// Update telemetri dari data GPS
function updateTelemetryFromGPS(deviceId, lat, lng, timestamp, extraData = {}) {
    const gpsData = updateGPSTracking(deviceId, lat, lng, timestamp);
    
    deviceTelemetry[deviceId] = {
        speed: gpsData.speed,
        odometer: gpsData.odometer,
        acc: extraData.acc || true,
        fuelLevel: extraData.fuelLevel || Math.floor(Math.random() * 100),
        flowRate: extraData.flowRate || (Math.random() * 10).toFixed(2),
        fuelUsed: extraData.fuelUsed || (gpsData.odometer * 0.12).toFixed(1),
        estimatedRange: extraData.estimatedRange || Math.floor((100 - (extraData.fuelLevel || 0)) * 5),
        inZone: extraData.inZone || false,
        zonesInside: extraData.zonesInside || '',
        lastUpdate: timestamp
    };
    
    // Update display jika device sedang aktif
    if (window.currentDevice && window.currentDevice.id == deviceId) {
        updateTelemetryDisplay(deviceTelemetry[deviceId]);
    }
    
    return deviceTelemetry[deviceId];
}

// Update tampilan telemetri di panel
function updateTelemetryDisplay(telemetry) {
    if (!telemetry) return;
    
    document.getElementById('speedValue').innerHTML = `${telemetry.speed?.toFixed(1) || 0} km/h`;
    document.getElementById('odometerValue').innerHTML = `${telemetry.odometer?.toFixed(1) || 0} km`;
    
    const accStatus = telemetry.acc || false;
    document.getElementById('accStatus').innerHTML = accStatus ? '<span style="color:#4ade80;">ON</span>' : '<span style="color:#f87171;">OFF</span>';
    
    const fuelLevel = telemetry.fuelLevel || 0;
    document.getElementById('fuelLevel').innerHTML = `${fuelLevel}%`;
    document.getElementById('flowRate').innerHTML = `${telemetry.flowRate || 0} L/min`;
    document.getElementById('fuelUsed').innerHTML = `${telemetry.fuelUsed || 0} L`;
    document.getElementById('estimatedRange').innerHTML = `${telemetry.estimatedRange || 0} km`;
    
    const progressFill = document.getElementById('fuelProgressFill');
    if (progressFill) {
        progressFill.style.width = `${fuelLevel}%`;
        if (fuelLevel < 20) progressFill.className = 'fuel-progress-fill low';
        else if (fuelLevel < 50) progressFill.className = 'fuel-progress-fill medium';
        else progressFill.className = 'fuel-progress-fill high';
    }
    
    const zoneStatusDiv = document.getElementById('zoneStatus');
    const zoneStatusText = document.getElementById('zoneStatusText');
    const zoneNameInfo = document.getElementById('zoneNameInfo');
    
    if (geofencePolygons?.length === 0) {
        zoneStatusDiv.className = 'zone-status no-zone';
        zoneStatusText.innerHTML = 'TIDAK ADA ZONA';
        zoneNameInfo.innerHTML = '';
    } else if (telemetry.inZone) {
        zoneStatusDiv.className = 'zone-status in-zone';
        zoneStatusText.innerHTML = 'DI DALAM ZONA';
        zoneNameInfo.innerHTML = `<i class="fas fa-check-circle"></i> ${telemetry.zonesInside || 'Zona'}`;
    } else {
        zoneStatusDiv.className = 'zone-status out-zone';
        zoneStatusText.innerHTML = 'KELUAR ZONA!';
        zoneNameInfo.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Luar zona`;
    }
}

function showTelemetry(deviceId) {
    const panel = document.getElementById('telemetryPanel');
    panel.classList.add('show');
    if (deviceTelemetry[deviceId]) {
        updateTelemetryDisplay(deviceTelemetry[deviceId]);
    }
}

function closeTelemetry() {
    document.getElementById('telemetryPanel').classList.remove('show');
}