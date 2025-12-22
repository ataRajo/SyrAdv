// src/firebase.js
import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

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
const app = initializeApp(firebaseConfig);

// Initialize messaging only in browser
const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

// Add foreground message handler for testing
if (messaging && typeof window !== 'undefined') {
  import('firebase/messaging').then(({ onMessage }) => {
    onMessage(messaging, (payload) => {
      console.log('📩 Foreground message received:', payload);
      
      // Show notification in foreground
      if (Notification.permission === 'granted') {
        new Notification(payload.notification?.title || 'إشعار جديد', {
          body: payload.notification?.body,
          icon: '/vite.svg'
        });
      }
    });
  });
}

export { messaging };