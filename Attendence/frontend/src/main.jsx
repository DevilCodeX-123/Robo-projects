import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Immediately apply saved theme on initial render
try {
  const savedTheme = localStorage.getItem('rcteams_theme');
  const theme = savedTheme ? JSON.parse(savedTheme) : 'light';
  document.documentElement.setAttribute('data-theme', theme);
} catch {
  document.documentElement.setAttribute('data-theme', 'light');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
