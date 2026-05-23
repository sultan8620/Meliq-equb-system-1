import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress ResizeObserver errors from triggering the Vite error overlay
window.addEventListener('error', (e) => {
  if (e.message.includes('ResizeObserver') || e.message === 'Script error.') {
    e.stopImmediatePropagation();
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
