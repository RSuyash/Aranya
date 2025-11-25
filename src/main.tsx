import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { seedDemoProjectIfEmpty } from './core/data-model/seed'
import { seedAnalysisTestProject } from './core/data-model/seedAnalysisTest'

// Seed the database
seedDemoProjectIfEmpty().catch(console.error);

// OPTIONAL: Uncomment to seed Analysis Test Project
// You can call this from browser console: seedAnalysisTestProject()
(window as any).seedAnalysisTestProject = seedAnalysisTestProject;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
