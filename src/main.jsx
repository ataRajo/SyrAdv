import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import store from './RtkQuery/Store/store.jsx'
import { Provider } from 'react-redux'
import { ThemeProvider } from '@/Components/theme-provider.jsx'
import { AuthProvider } from './Context/AuthProvider.jsx'

// Register service worker with better error handling
const registerServiceWorker = () => {
// In main.jsx, replace your service worker code with:

// Register service worker on page load
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', function() {
    // Clear old service workers
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      for (let registration of registrations) {
        registration.unregister();
      }
      
      // Register new one
      navigator.serviceWorker.register('/firebase-messaging-sw.js')
        .then(function(registration) {
          console.log('✅ Service Worker registered:', registration.scope);
          
          // Check if it's controlling the page
          if (navigator.serviceWorker.controller) {
            console.log('✅ Service Worker is controlling the page');
          }
        })
        .catch(function(error) {
          console.error('❌ Service Worker registration failed:', error);
        });
    });
  });
}

// Optional: Add foreground messaging
const setupForegroundMessaging = async () => {
  try {
    const { messaging } = await import('./firebase.js');
    if (messaging) {
      const { onMessage } = await import('firebase/messaging');
      onMessage(messaging, (payload) => {
        console.log('📱 Foreground message:', payload);
        
        if (Notification.permission === 'granted') {
          new Notification(payload.notification?.title || 'New', {
            body: payload.notification?.body,
            icon: '/vite.svg'
          });
        }
      });
      console.log('✅ Foreground messaging setup');
    }
  } catch (error) {
    console.log('Foreground messaging not available:', error.message);
  }
};

// Call it after a delay
setTimeout(setupForegroundMessaging, 3000);
};

// Initialize foreground messaging
const setupForegroundMessaging = async () => {
  try {
    const { messaging, initializeMessaging } = await import('./firebase.js');
    
    // Wait for messaging to be ready
    setTimeout(async () => {
      const messagingInstance = messaging || await initializeMessaging();
      
      if (messagingInstance) {
        const { onMessage } = await import('firebase/messaging');
        
        onMessage(messagingInstance, (payload) => {
          console.log('📩 Foreground message received:', payload);
          
          // Show notification in foreground
          if (Notification.permission === 'granted') {
            new Notification(payload.notification?.title || 'إشعار جديد', {
              body: payload.notification?.body,
              icon: payload.notification?.icon || '/firebase-logo.png',
              badge: '/firebase-logo.png'
            });
          }
        });
        
        console.log('✅ Foreground messaging setup complete');
      }
    }, 2000); // Wait 2 seconds for service worker to activate
  } catch (error) {
    console.error('❌ Foreground messaging setup failed:', error);
  }
};

// Run setup functions
registerServiceWorker();
setupForegroundMessaging();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store} >
      <AuthProvider>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <App />
        </ThemeProvider>
      </AuthProvider>
    </Provider>
  </StrictMode>,
);