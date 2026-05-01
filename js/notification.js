// notification.js - Notifikasi browser
let notificationPermissionGranted = false;

async function requestNotificationPermission() {
    if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            notificationPermissionGranted = true;
            document.getElementById('notifPermission').style.display = 'none';
            showAlert('Notifikasi diaktifkan!', 'success');
        }
    }
}

function sendNotification(title, body, tag = 'alert') {
    if (Notification.permission === 'granted') {
        new Notification(title, {
            body: body,
            icon: 'https://cdn-icons-png.flaticon.com/512/744/744465.png',
            tag: tag,
            requireInteraction: true,
            vibrate: [200, 100, 200]
        });
    }
}