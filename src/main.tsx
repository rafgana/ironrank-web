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
