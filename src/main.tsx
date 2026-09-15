import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Auto-update Service Worker immediately on mobile PWA
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('[PWA] New version available, auto-updating...');
    updateSW(true);
  },
  onOfflineReady() {
    console.log('[PWA] App ready to work offline');
  },
  onRegisteredSW(_swUrl, registration) {
    if (registration) {
      // Check for updates every 3 minutes
      setInterval(() => {
        registration.update().catch(() => {});
      }, 3 * 60 * 1000);

      // Check for updates whenever user returns to the app
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          registration.update().catch(() => {});
        }
      });
    }
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
