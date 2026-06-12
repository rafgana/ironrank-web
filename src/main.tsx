import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { seedExercises } from './db/database'
import './index.css'
import App from './App'

seedExercises()
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Service Worker registration (production only)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/ironrank/sw.js', { scope: '/ironrank/' })
      .catch(() => null);
  });
}
