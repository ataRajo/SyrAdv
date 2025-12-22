// public/firebase-messaging-sw.js

// Add this at the VERY TOP
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

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// ✅ ADD THIS - Handle ALL messages
messaging.onBackgroundMessage(function(payload) {
  console.log('📩 [SW] Received message:', payload);
  
  // 🚨 CRITICAL: Use payload.data if payload.notification is empty
  const notificationTitle = payload.notification?.title || payload.data?.title || 'إشعار جديد';
  const notificationBody = payload.notification?.body || payload.data?.body || 'لديك إشعار جديد';
  
  console.log('Creating notification:', notificationTitle, notificationBody);
  
  const notificationOptions = {
    body: notificationBody,
    icon: '/vite.svg', // MUST exist in public folder
    badge: '/vite.svg',
    tag: 'notification-' + Date.now(),
    requireInteraction: true, // Makes notification stay until clicked
    data: payload.data || {}
  };

  // Show notification
  return self.registration.showNotification(notificationTitle, notificationOptions)
    .then(() => console.log('✅ Notification shown successfully'))
    .catch(err => console.error('❌ Failed to show notification:', err));
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event.notification.title);
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});