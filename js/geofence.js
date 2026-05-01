// geofence.js - Fungsi geofence (draw, save, load)
let geofencePolygons = [];
let drawControl = null;

function initGeofenceTools() {
    const drawBtn = document.getElementById('drawPolygonBtnRight');
    const clearBtn = document.getElementById('clearGeofenceBtnRight');
    
    drawBtn.onclick = () => {
        if (drawControl) {
            map.removeControl(drawControl);
            drawControl = null;
            drawBtn.classList.remove('active');
        } else {
            drawControl = new L.Control.Draw({
                draw: {
                    polygon: { allowIntersection: false, shapeOptions: { color: '#f5576c', weight: 3 } },
                    polyline: false, marker: false, circle: false, rectangle: false, circlemarker: false
                },
                edit: false
            });
            map.addControl(drawControl);
            drawBtn.classList.add('active');
            
            map.on('draw:created', (e) => {
                const layer = e.layer;
                const coords = layer.getLatLngs()[0];
                const points = coords.map(p => [p.lat, p.lng]);
                const zoneName = prompt('Nama zona:', 'Zona ' + (geofencePolygons.length + 1));
                const geoId = Date.now() + Math.random();
                
                const poly = L.polygon(points, {
                    color: '#f5576c', weight: 3, fillColor: '#f5576c', fillOpacity: 0.2,
                    zoneName: zoneName || 'Zona', geoId: geoId
                }).addTo(map);
                
                poly.bindPopup(`<b>${zoneName || 'Zona'}</b><br>Klik kanan untuk hapus`);
                poly.on('contextmenu', () => {
                    map.removeLayer(poly);
                    geofencePolygons = geofencePolygons.filter(p => p !== poly);
                    loadSavedGeofenceList();
                    showAlert('Geofence dihapus dari peta!', 'info');
                });
                
                geofencePolygons.push(poly);
                loadSavedGeofenceList();
                showAlert(`Geofence "${zoneName || 'Zona'}" dibuat!`, 'success');
                
                map.removeControl(drawControl);
                drawControl = null;
                drawBtn.classList.remove('active');
            });
        }
    };
    
    clearBtn.onclick = () => {
        if (confirm('Hapus semua geofence dari peta?')) {
            geofencePolygons.forEach(p => map.removeLayer(p));
            geofencePolygons = [];
            loadSavedGeofenceList();
            showAlert('Semua geofence dihapus dari peta!', 'info');
        }
    };
}

function saveAllGeofencesToStorage() {
    if (geofencePolygons.length === 0) {
        showAlert('Tidak ada geofence untuk disimpan!', 'warning');
        return;
    }
    
    const geofencesData = geofencePolygons.map(polygon => {
        const latlngs = polygon.getLatLngs()[0];
        return {
            id: polygon.options.geoId,
            name: polygon.options.zoneName,
            coordinates: latlngs.map(p => ({ lat: p.lat, lng: p.lng })),
            createdAt: new Date().toISOString()
        };
    });
    
    const storageKey = getUserStorageKey('geofences');
    localStorage.setItem(storageKey, JSON.stringify(geofencesData));
    loadSavedGeofenceList();
    showAlert(`${geofencePolygons.length} geofence berhasil disimpan!`, 'success');
}

function loadGeofencesFromStorage() {
    const storageKey = getUserStorageKey('geofences');
    const saved = localStorage.getItem(storageKey);
    if (saved && saved !== 'undefined') {
        try {
            const geofencesData = JSON.parse(saved);
            geofencePolygons.forEach(p => map.removeLayer(p));
            geofencePolygons = [];
            
            geofencesData.forEach(geo => {
                const points = geo.coordinates.map(p => [p.lat, p.lng]);
                const polygon = L.polygon(points, {
                    color: '#f5576c', weight: 3, fillColor: '#f5576c', fillOpacity: 0.2,
                    zoneName: geo.name, geoId: geo.id
                }).addTo(map);
                geofencePolygons.push(polygon);
            });
            loadSavedGeofenceList();
        } catch(e) { console.error("Error loading geofences:", e); }
    }
}

function loadSavedGeofenceList() {
    const storageKey = getUserStorageKey('geofences');
    const saved = localStorage.getItem(storageKey);
    const container = document.getElementById('savedGeofenceList');
    
    if (!saved || saved === 'undefined' || JSON.parse(saved).length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 10px; color: rgba(255,255,255,0.5);">Belum ada geofence tersimpan</div>';
        return;
    }
    
    const geofences = JSON.parse(saved);
    let html = '';
    geofences.forEach((geo, idx) => {
        html += `
            <div class="saved-geofence-item" onclick="zoomToGeofence(${idx})">
                <span><i class="fas fa-draw-polygon"></i> ${geo.name}</span>
                <button class="delete-geo-btn" onclick="event.stopPropagation(); deleteGeofence(${idx})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    });
    container.innerHTML = html;
}

function deleteGeofence(index) {
    if (confirm(`Hapus geofence "${geofencePolygons[index].options.zoneName}"?`)) {
        map.removeLayer(geofencePolygons[index]);
        geofencePolygons.splice(index, 1);
        
        // Update storage
        const storageKey = getUserStorageKey('geofences');
        const geofencesData = geofencePolygons.map(polygon => {
            const latlngs = polygon.getLatLngs()[0];
            return { id: polygon.options.geoId, name: polygon.options.zoneName, coordinates: latlngs.map(p => ({ lat: p.lat, lng: p.lng })), createdAt: new Date().toISOString() };
        });
        localStorage.setItem(storageKey, JSON.stringify(geofencesData));
        loadSavedGeofenceList();
        showAlert('Geofence dihapus!', 'success');
    }
}

function zoomToGeofence(index) {
    const polygon = geofencePolygons[index];
    if (polygon) {
        const center = polygon.getBounds().getCenter();
        map.setView(center, 14);
        showAlert(`Zoom ke: ${polygon.options.zoneName}`, 'info');
    }
}

function isPointInPolygon(lat, lng, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].lat, yi = polygon[i].lng;
        const xj = polygon[j].lat, yj = polygon[j].lng;
        const intersect = ((yi > lng) != (yj > lng)) && (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

function checkZoneStatus(lat, lng, deviceId) {
    if (geofencePolygons.length === 0) return;
    
    let insideZones = [];
    for (const poly of geofencePolygons) {
        const latlngs = poly.getLatLngs()[0];
        const zoneName = poly.options.zoneName || 'Zona';
        if (isPointInPolygon(lat, lng, latlngs)) insideZones.push(zoneName);
    }
    
    const inZone = insideZones.length > 0;
    
    if (window.deviceTelemetry && window.deviceTelemetry[deviceId]) {
        window.deviceTelemetry[deviceId].inZone = inZone;
        window.deviceTelemetry[deviceId].zonesInside = insideZones.join(', ');
        if (window.currentDevice && window.currentDevice.id == deviceId) {
            updateTelemetryDisplay(window.deviceTelemetry[deviceId]);
        }
    }
    
    return inZone;
}