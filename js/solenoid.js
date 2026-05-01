// solenoid.js - Kontrol solenoid per perangkat
let deviceSolenoidStatus = new Map();
let deviceMode = new Map();

function setDeviceMode(deviceId, mode) {
    deviceMode.set(deviceId, mode);
    renderDeviceList();
    showAlert(`Mode ${mode === 'auto' ? 'AUTOMATIS' : 'MANUAL'} untuk ${deviceId}`, 'success');
}

function sendManualSolenoidCommand(deviceId, activate) {
    deviceSolenoidStatus.set(deviceId, activate);
    renderDeviceList();
    showAlert(`Solenoid ${activate ? 'AKTIF' : 'NONAKTIF'} untuk ${deviceId}`, 'success');
    
    // Kirim ke ESP32 via WebSocket jika diperlukan
    if (window.ws && window.ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'solenoid_command',
            deviceId: deviceId,
            action: activate ? 'activate' : 'deactivate'
        }));
    }
}