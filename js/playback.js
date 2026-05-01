// playback.js - Playback riwayat perjalanan
let playbackInterval = null;
let currentPlaybackIndex = 0;
let playbackHistory = [];

function initPlayback(deviceId) {
    const history = positionsHistory[deviceId];
    if (!history || history.length < 2) {
        showAlert('Riwayat tidak tersedia!', 'warning');
        return;
    }
    
    playbackHistory = history;
    currentPlaybackIndex = 0;
    document.getElementById('playbackPanel').style.display = 'block';
    const slider = document.getElementById('timelineSlider');
    slider.max = playbackHistory.length - 1;
    
    document.getElementById('playBtn').onclick = () => {
        if(playbackInterval) clearInterval(playbackInterval);
        playbackInterval = setInterval(() => {
            if(currentPlaybackIndex < playbackHistory.length-1){
                currentPlaybackIndex++;
                updatePlaybackPosition(currentPlaybackIndex);
                slider.value = currentPlaybackIndex;
            } else {
                clearInterval(playbackInterval);
                showAlert('Playback selesai!', 'info');
            }
        }, 1000);
    };
    
    document.getElementById('pauseBtn').onclick = () => {
        if(playbackInterval) clearInterval(playbackInterval);
        playbackInterval = null;
    };
    
    document.getElementById('stopBtn').onclick = () => {
        if(playbackInterval) clearInterval(playbackInterval);
        playbackInterval = null;
        currentPlaybackIndex = 0;
        updatePlaybackPosition(0);
        slider.value = 0;
        document.getElementById('playbackPanel').style.display = 'none';
    };
    
    slider.oninput = (e) => {
        if(playbackInterval) clearInterval(playbackInterval);
        currentPlaybackIndex = parseInt(e.target.value);
        updatePlaybackPosition(currentPlaybackIndex);
    };
}

function updatePlaybackPosition(idx) {
    const pos = playbackHistory[idx];
    if(!pos) return;
    if(currentMarker) currentMarker.setLatLng([pos.lat, pos.lng]);
    else currentMarker = L.marker([pos.lat, pos.lng], { icon: vehicleIcon }).addTo(map);
    map.setView([pos.lat, pos.lng], 14);
    document.getElementById('playbackTime').innerHTML = new Date(pos.time).toLocaleTimeString();
    document.getElementById('speedValue').innerHTML = `${pos.speed?.toFixed(1) || 0} km/h`;
    checkZoneStatus(pos.lat, pos.lng, currentDevice?.id);
}