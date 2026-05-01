// device.js - Manajemen perangkat (CRUD)
let devicesData = [];
let currentDevice = null;
let positionsHistory = {};

function loadDevices() {
    const storageKey = getUserStorageKey('custom_devices');
    const saved = localStorage.getItem(storageKey);
    devicesData = (saved && saved !== 'undefined') ? JSON.parse(saved) : [];
    renderDeviceList();
}

function saveDevices() {
    const storageKey = getUserStorageKey('custom_devices');
    localStorage.setItem(storageKey, JSON.stringify(devicesData));
}

function addESP32Device() {
    const deviceName = document.getElementById('newDeviceName').value.trim();
    const deviceId = document.getElementById('newDeviceId').value.trim();
    
    if (!deviceName || !deviceId) {
        showAlert('Nama perangkat dan Unique ID harus diisi!', 'warning');
        return;
    }
    
    if (devicesData.some(d => d.id === deviceId)) {
        showAlert('Perangkat dengan ID tersebut sudah ada!', 'warning');
        return;
    }
    
    devicesData.push({ id: deviceId, name: deviceName, isCustom: true });
    saveDevices();
    
    document.getElementById('newDeviceName').value = '';
    document.getElementById('newDeviceId').value = '';
    
    renderDeviceList();
    showAlert(`Perangkat "${deviceName}" berhasil ditambahkan!`, 'success');
}

function deleteDevice(deviceId, deviceName) {
    if (confirm(`Hapus perangkat "${deviceName}"?`)) {
        devicesData = devicesData.filter(d => d.id !== deviceId);
        saveDevices();
        
        if (currentDevice && currentDevice.id === deviceId) {
            if (currentMarker) map.removeLayer(currentMarker);
            currentMarker = null;
            currentDevice = null;
            closeTelemetry();
        }
        
        renderDeviceList();
        showAlert(`Perangkat "${deviceName}" dihapus!`, 'success');
    }
}

function selectDevice(deviceId) {
    currentDevice = devicesData.find(d => d.id == deviceId);
    showTelemetry(deviceId);
    
    const pos = positionsHistory[deviceId]?.[positionsHistory[deviceId].length - 1];
    if (pos) {
        updateMarker(deviceId, pos.lat, pos.lng, pos.speed, currentDevice.name);
        checkZoneStatus(pos.lat, pos.lng, deviceId);
    }
    renderDeviceList();
}

function trackDevice(deviceId, deviceName) {
    selectDevice(deviceId);
    showAlert(`Melacak: ${deviceName}`, 'success');
}

function renderDeviceList() {
    const container = document.getElementById('deviceList');
    const searchTerm = document.getElementById('searchDevice')?.value.toLowerCase() || '';
    const filtered = devicesData.filter(d => (d.name || d.id).toLowerCase().includes(searchTerm));
    
    if (filtered.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:20px;">Tidak ada perangkat</div>';
        return;
    }
    
    let html = '';
    filtered.forEach(device => {
        const telemetry = deviceTelemetry[device.id];
        const isOnline = telemetry && (Date.now() - (telemetry.lastUpdate || 0) < 30000);
        const solenoidActive = window.deviceSolenoidStatus?.get(device.id) || false;
        const currentModeVal = window.deviceMode?.get(device.id) || 'auto';
        const speed = telemetry?.speed || 0;
        const odometer = telemetry?.odometer || 0;
        const isCustom = '<span style="background:#4ade80; color:#1a1a2e; padding:2px 5px; border-radius:4px; font-size:0.6rem;">ESP32</span>';
        
        html += `
            <div class="device-item ${currentDevice?.id === device.id ? 'active' : ''}" onclick="selectDevice('${device.id}')">
                <div class="device-actions">
                    <button class="device-action-btn track-btn" onclick="event.stopPropagation(); trackDevice('${device.id}', '${device.name.replace(/'/g, "\\'")}')" title="Lacak Perangkat">
                        <i class="fas fa-location-dot"></i>
                    </button>
                    <button class="device-action-btn delete-btn" onclick="event.stopPropagation(); deleteDevice('${device.id}', '${device.name.replace(/'/g, "\\'")}')" title="Hapus Perangkat">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
                <div class="device-name">
                    <span><i class="fas fa-car"></i> ${device.name} ${isCustom}</span>
                    <span class="status-badge">
                        <i class="fas fa-circle ${isOnline ? 'status-online' : 'status-offline'}"></i>
                        ${isOnline ? 'Online' : 'Offline'}
                        <span class="solenoid-status-badge ${solenoidActive ? 'active' : 'inactive'}">
                            <i class="fas fa-bolt"></i> ${solenoidActive ? 'ON' : 'OFF'}
                        </span>
                        <span class="mode-badge">
                            <i class="fas ${currentModeVal === 'auto' ? 'fa-robot' : 'fa-hand-pointer'}"></i>
                            ${currentModeVal === 'auto' ? 'AUTO' : 'MANUAL'}
                        </span>
                    </span>
                </div>
                <div class="battery-bar"><div class="battery-fill" style="width:75%"></div></div>
                <div class="device-info">
                    <span><i class="fas fa-tachometer-alt"></i> ${speed.toFixed(1)} km/h</span>
                    <span><i class="fas fa-road"></i> ${odometer.toFixed(1)} km</span>
                </div>
                <div class="mode-switch">
                    <span class="mode-label"><i class="fas fa-microchip"></i> Mode:</span>
                    <div class="mode-toggle">
                        <span class="mode-option ${currentModeVal === 'auto' ? 'active' : ''}" onclick="event.stopPropagation(); setDeviceMode('${device.id}', 'auto')">AUTO</span>
                        <span class="mode-option ${currentModeVal === 'manual' ? 'active' : ''}" onclick="event.stopPropagation(); setDeviceMode('${device.id}', 'manual')">MANUAL</span>
                    </div>
                </div>
                <div>
                    <button class="solenoid-manual-btn on ${currentModeVal !== 'manual' ? 'disabled' : ''}" onclick="event.stopPropagation(); if('${currentModeVal}' === 'manual') sendManualSolenoidCommand('${device.id}', true)" ${currentModeVal !== 'manual' ? 'disabled' : ''}><i class="fas fa-power-off"></i> ON</button>
                    <button class="solenoid-manual-btn off ${currentModeVal !== 'manual' ? 'disabled' : ''}" onclick="event.stopPropagation(); if('${currentModeVal}' === 'manual') sendManualSolenoidCommand('${device.id}', false)" ${currentModeVal !== 'manual' ? 'disabled' : ''}><i class="fas fa-stop-circle"></i> OFF</button>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}