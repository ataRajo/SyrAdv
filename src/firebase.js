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

const app = initializeApp(firebaseConfig);

// Lazily initialize messaging only in the browser
let messaging = null;

export async function initializeMessaging() {
  if (typeof window === "undefined") return null;
  if (!messaging) {
    messaging = getMessaging(app);
  }
  return messaging;
}

// Export current messaging reference (may be null on server)
export { messaging };
