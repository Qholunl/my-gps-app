// map.js - Inisialisasi Leaflet map
let map, vehicleIcon, currentMarker = null;

function initMap() {
    console.log("Initializing map...");
    try {
        const mapDiv = document.getElementById('map');
        if (!mapDiv) {
            console.error("Map div not found!");
            return;
        }
        
        map = L.map('map').setView([CONFIG.DEFAULT_LAT, CONFIG.DEFAULT_LNG], CONFIG.DEFAULT_ZOOM);
        
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        
        vehicleIcon = L.icon({
            iconUrl: CONFIG.VEHICLE_ICON_URL,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
            popupAnchor: [0, -20]
        });
        
        console.log("Map initialized successfully!");
    } catch(e) {
        console.error("Error initializing map:", e);
        showAlert("Error loading map: " + e.message, 'error');
    }
}

function updateMarker(deviceId, lat, lng, speed, deviceName) {
    const coords = [lat, lng];
    if (currentMarker) {
        currentMarker.setLatLng(coords);
    } else {
        currentMarker = L.marker(coords, { icon: vehicleIcon }).addTo(map);
    }
    currentMarker.bindPopup(`
        <b>${deviceName}</b><br>
        📍 ${lat.toFixed(6)}, ${lng.toFixed(6)}<br>
        ⚡ ${speed?.toFixed(1) || 0} km/h
    `).openPopup();
    map.setView(coords, 14);
}

function centerMap(lat, lng, zoom = 14) {
    map.setView([lat, lng], zoom);
}