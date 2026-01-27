// Service Worker for Firebase Messaging (compat)
console.log('🔥 Service Worker Loading...');

self.addEventListener('install', function(event) {
  console.log('✅ Service Worker: Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  console.log('✅ Service Worker: Activated and controlling page');
  event.waitUntil(self.clients.claim());
});

importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyB6wiVkcZXDO07I1816EDdIT0_QZmnl4lI",
  authDomain: "syrian-ads.firebaseapp.com",
  projectId: "syrian-ads",
  storageBucket: "syrian-ads.firebasestorage.app",
  messagingSenderId: "586654311770",
  appId: "1:586654311770:web:d0825a21c6b7b557c9bf63",
  measurementId: "G-3S5PDZEJV3"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('📩 [SW] Received message:', payload);

  const notificationTitle = payload.notification?.title || payload.data?.title || 'إشعار جديد';
  const notificationBody = payload.notification?.body || payload.data?.body || 'لديك إشعار جديد';

  // Build customers list dynamically
  const customers = Object.keys(payload.data || {})
    .filter(key => key.startsWith('customer_'))
    .map(key => payload.data[key]);

  const customersList = customers.length
    ? '\nالعملاء:\n- ' + customers.join('\n- ')
    : '';

  // If you prefer raw JSON of the whole data object, use:
  // const dataString = payload.data ? `\n${JSON.stringify(payload.data, null, 2)}` : '';

  const notificationOptions = {
    body: notificationBody + customersList, // or notificationBody + dataString
    icon: '/adv_syrian.png',
     badge: '/adv_syrian.png',
    tag: 'notification-' + Date.now(),
    requireInteraction: true,
    data: payload.data || {}
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click and pass data to the page
self.addEventListener('notificationclick', function(event) {
  console.log("Clicked payload:", event.notification.data);
  event.notification.close();

  const url = '/?payload=' + encodeURIComponent(JSON.stringify(event.notification.data || {}));
  event.waitUntil(clients.openWindow(url));
});
