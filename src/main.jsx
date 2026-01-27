import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import store from './RtkQuery/Store/store.jsx'
import { Provider } from 'react-redux'
import { ThemeProvider } from '@/Components/theme-provider.jsx'
import { AuthProvider } from './Context/AuthProvider.jsx'

// Register service worker
const registerServiceWorker = () => {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
      // Unregister old service workers then register the new one
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(reg => reg.unregister());
        navigator.serviceWorker.register('/firebase-messaging-sw.js')
          .then(reg => {
            console.log('✅ Service Worker registered:', reg.scope);
            if (navigator.serviceWorker.controller) {
              console.log('✅ Service Worker is controlling the page');
            }
          })
          .catch(err => console.error('❌ Service Worker registration failed:', err));
      });
    });
  }
};

// Single foreground messaging handler (reads payload.data and shows it)
const setupForegroundMessaging = async () => {
  try {
    const { initializeMessaging } = await import('./firebase.js');
    const messaging = await initializeMessaging();
    if (!messaging) return;

    const { onMessage } = await import('firebase/messaging');

    onMessage(messaging, (payload) => {
      console.log('📩 Foreground message received:', payload);

      const title = payload.notification?.title || payload.data?.title || 'إشعار جديد';
      const bodyBase = payload.notification?.body || payload.data?.body || '';

      // Build readable customers list if customer_* keys exist
      const customers = Object.keys(payload.data || {})
        .filter(k => k.startsWith('customer_'))
        .map(k => payload.data[k]);

      const customersList = customers.length
        ? '\nالعملاء:\n- ' + customers.join('\n- ')
        : '';

      // If you prefer raw JSON of the whole data object, uncomment the next line and use dataString instead:
      // const dataString = payload.data ? `\n${JSON.stringify(payload.data, null, 2)}` : '';

      const body = bodyBase + customersList; // or bodyBase + dataString

      const show = () => {
        new Notification(title, {
          body,
        icon: '/adv_syrian.png',
         badge: '/adv_syrian.png'
        });
      };

      if (Notification.permission === 'granted') {
        show();
      } else {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') show();
        });
      }
    });

    console.log('✅ Foreground messaging setup complete');
  } catch (err) {
    console.error('❌ Foreground messaging setup failed:', err);
  }
};

// Run setup
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
