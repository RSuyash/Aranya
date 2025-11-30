import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { seedDemoProjectIfEmpty } from './core/data-model/seed'
import { seedAnalysisTestProject } from './core/data-model/seedAnalysisTest'
import { ThemeProvider } from './context/ThemeContext'

// [THORNE] Critical for Web/PC Camera Support
import { defineCustomElements } from '@ionic/pwa-elements/loader';

// Initialize the PWA Elements (Camera, Toast, etc.) for the browser
defineCustomElements(window);

// Seed the database
seedDemoProjectIfEmpty().catch(console.error);

// OPTIONAL: Uncomment to seed Analysis Test Project
(window as any).seedAnalysisTestProject = seedAnalysisTestProject;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <HashRouter>
        <App />
      </HashRouter>
    </ThemeProvider>
  </StrictMode>,
)