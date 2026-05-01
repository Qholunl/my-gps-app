// main.js - Inisialisasi utama dashboard
function showAlert(msg, type = 'warning') {
    const toast = document.getElementById('alertToast');
    const span = document.getElementById('alertMessage');
    if (!toast || !span) return;
    
    span.innerHTML = msg;
    toast.style.display = 'flex';
    toast.className = `alert-toast ${type}`;
    setTimeout(() => toast.style.display = 'none', 4000);
}

function initResponsive() {
    if(window.innerWidth <= 768){
        const sidebar = document.getElementById('sidebar');
        const toggle = document.createElement('div');
        toggle.innerHTML = '<i class="fas fa-bars"></i>';
        toggle.style.cssText = 'position:absolute;top:20px;left:20px;z-index:1000;background:rgba(0,0,0,0.8);color:white;width:40px;height:40px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer';
        toggle.onclick = () => sidebar.classList.toggle('open');
        document.querySelector('.main-content').appendChild(toggle);
    }
}

function checkAuth() {
    const userData = localStorage.getItem(CONFIG.STORAGE_CURRENT_USER);
    if (!userData) {
        window.location.href = 'index.html';
    } else {
        const user = JSON.parse(userData);
        document.getElementById('userName').innerHTML = user.name || user.username;
    }
}

function logout() {
    localStorage.removeItem(CONFIG.STORAGE_CURRENT_USER);
    window.location.href = 'index.html';
}

function showESP32Code() {
    const deviceId = document.getElementById('newDeviceId').value || 'esp32_001';
    const code = `/*
 * ESP32 GPS Tracker for Fleet Dashboard
 */

#include <WiFi.h>
#include <TinyGPS++.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* deviceId = "${deviceId}";
const int SOLENOID_PIN = 13;

TinyGPSPlus gps;
HardwareSerial gpsSerial(2);
WebSocketsClient webSocket;
unsigned long lastSendTime = 0;
float lastLat = 0, lastLng = 0;
unsigned long lastTime = 0;
float odometer = 0;

float calculateDistance(float lat1, float lon1, float lat2, float lon2) {
    const float R = 6371000;
    float φ1 = lat1 * 3.14159 / 180;
    float φ2 = lat2 * 3.14159 / 180;
    float Δφ = (lat2 - lat1) * 3.14159 / 180;
    float Δλ = (lon2 - lon1) * 3.14159 / 180;
    float a = sin(Δφ/2) * sin(Δφ/2) + cos(φ1) * cos(φ2) * sin(Δλ/2) * sin(Δλ/2);
    return R * 2 * atan2(sqrt(a), sqrt(1-a));
}

void setup() {
    Serial.begin(115200);
    pinMode(SOLENOID_PIN, OUTPUT);
    gpsSerial.begin(9600, SERIAL_8N1, 16, 17);
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
    Serial.println("\\nWiFi connected!");
    webSocket.begin(CONFIG.WS_URL, 3000, "/");
}

void loop() {
    while (gpsSerial.available() > 0) gps.encode(gpsSerial.read());
    
    if (gps.location.isValid() && millis() - lastSendTime >= 5000) {
        float currentLat = gps.location.lat();
        float currentLng = gps.location.lng();
        unsigned long currentTime = millis();
        
        if (lastLat != 0 && lastLng != 0) {
            float distance = calculateDistance(lastLat, lastLng, currentLat, currentLng);
            float timeDiff = (currentTime - lastTime) / 1000.0;
            if (timeDiff > 0 && timeDiff < 30) {
                odometer += distance / 1000;
            }
        }
        
        lastLat = currentLat; lastLng = currentLng; lastTime = currentTime;
        
        StaticJsonDocument<300> doc;
        doc["deviceId"] = deviceId;
        doc["latitude"] = currentLat;
        doc["longitude"] = currentLng;
        doc["speed"] = gps.speed.kmph();
        doc["odometer"] = odometer;
        doc["acc"] = true;
        
        String output; serializeJson(doc, output);
        webSocket.sendTXT(output);
        lastSendTime = millis();
    }
    webSocket.loop();
    delay(10);
}`;
    
    document.getElementById('esp32CodeBlock').innerHTML = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    document.getElementById('esp32Modal').style.display = 'flex';
}

function closeESP32Modal() {
    document.getElementById('esp32Modal').style.display = 'none';
}

function copyESP32Code() {
    const codeBlock = document.getElementById('esp32CodeBlock');
    navigator.clipboard.writeText(codeBlock.innerText);
    showAlert('Kode disalin!', 'success');
}

// ==================== INISIALISASI ====================
function init() {
    console.log("Initializing dashboard...");
    checkAuth();
    initMap();
    initGeofenceTools();
    loadDevices();
    loadGeofencesFromStorage();
    initResponsive();
    startGPSSimulation();
    
    const searchInput = document.getElementById('searchDevice');
    if (searchInput) searchInput.addEventListener('input', () => renderDeviceList());
    
    setTimeout(() => {
        if(currentMarker) currentMarker.on('popupopen', () => {
            if(!document.querySelector('.playback-btn')){
                const btn = document.createElement('button');
                btn.innerHTML = '<i class="fas fa-history"></i> Playback Riwayat';
                btn.className = 'playback-btn';
                btn.style.cssText = 'margin-top:10px;padding:5px;background:#667eea;color:white;border:none;border-radius:5px;cursor:pointer;width:100%';
                btn.onclick = () => initPlayback(currentDevice?.id);
                document.querySelector('.leaflet-popup-content')?.appendChild(btn);
            }
        });
    }, 1000);
    
    console.log("Dashboard initialized!");
    showAlert('Dashboard siap digunakan! Klik perangkat untuk melihat telemetri', 'success');
}

// Jalankan inisialisasi saat halaman dimuat
document.addEventListener('DOMContentLoaded', init);