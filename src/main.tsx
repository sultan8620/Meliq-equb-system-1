import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress ResizeObserver and benign WebSocket errors from triggering error overlays
window.addEventListener('error', (e) => {
  const msg = e.message || '';
  if (
    msg.includes('ResizeObserver') || 
    msg === 'Script error.' ||
    msg.toLowerCase().includes('websocket') ||
    msg.includes('Cannot set property fetch')
  ) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
});

window.addEventListener('unhandledrejection', (e) => {
  const reasonStr = e.reason ? String(e.reason.message || e.reason) : '';
  if (
    reasonStr.toLowerCase().includes('websocket') ||
    reasonStr.includes('Cannot set property fetch')
  ) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Remove initial loader after React takes over
const loader = document.getElementById('initial-loader');
if (loader) {
  setTimeout(() => {
    loader.style.opacity = '0';
    loader.style.transition = 'opacity 0.5s ease';
    setTimeout(() => loader.remove(), 500);
  }, 300);
}
