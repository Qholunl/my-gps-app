// config.js - Konfigurasi global
const CONFIG = {
    // Storage keys
    STORAGE_CURRENT_USER: 'fleet_current_user',
    STORAGE_PREFIX: 'fleet_user_',
    
    // Default map center (Jakarta)
    DEFAULT_LAT: -6.2088,
    DEFAULT_LNG: 106.8456,
    DEFAULT_ZOOM: 13,
    
    // Update intervals (ms)
    GPS_UPDATE_INTERVAL: 5000,
    TELEMETRY_UPDATE_INTERVAL: 2000,
    FUEL_UPDATE_INTERVAL: 5000,
    
    // Vehicle icon URL
    VEHICLE_ICON_URL: 'https://cdn-icons-png.flaticon.com/512/744/744465.png',
    
    // API endpoints (untuk ESP32)
    WS_URL: 'wss://your-server.com', // Ganti dengan server Anda
    API_URL: 'https://your-vercel-url.vercel.app/api/position'
};

// Helper functions
function getUserStorageKey(baseKey) {
    const currentUser = JSON.parse(localStorage.getItem(CONFIG.STORAGE_CURRENT_USER) || '{}');
    if (!currentUser.id) return baseKey;
    return `${CONFIG.STORAGE_PREFIX}${currentUser.id}_${baseKey}`;
}