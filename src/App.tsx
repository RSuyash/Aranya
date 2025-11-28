import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
// This now imports our new MainLayout automatically via index.ts
import { AppShell } from './layouts';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { MapPage } from './pages/MapPage';
import { SettingsPage } from './pages/SettingsPage';
import AranyaDashboard from './pages/AranyaDashboard';
import { VegetationModulePage } from './ui/modules/Vegetation/VegetationModulePage';
import { PlotVisualizerPage } from './ui/modules/Vegetation/PlotVisualizerPage';
import { ProjectSettingsPage } from './pages/ProjectSettingsPage';
import { AnalysisPage } from './pages/AnalysisPage';

function App() {
  // --- HARDWARE BACK BUTTON LOGIC ---
  useEffect(() => {
    let backButtonListener: any;

    const setupBackButton = async () => {
      backButtonListener = await CapacitorApp.addListener('backButton', () => {
        // We use window.location.hash because this closure is created once.
        // React Router's 'location' object would be stale here if we don't include it in deps,
        // but including it in deps would re-register the listener on every navigation (bad).
        const currentPath = window.location.hash;

        // Check if we are on the root or dashboard (HashRouter uses #/)
        if (currentPath === '#/' || currentPath === '#/dashboard' || currentPath === '') {
          CapacitorApp.exitApp();
        } else {
          // Go back in history
          window.history.back();
        }
      });
    };

    setupBackButton();

    // Cleanup listener on unmount
    return () => {
      if (backButtonListener) {
        backButtonListener.remove();
      }
    };
  }, []); // Empty dependency array: Run ONCE on mount

  // --- DATA PERSISTENCE REQUEST ---
  useEffect(() => {
    async function lockStorage() {
      if (navigator.storage && navigator.storage.persist) {
        const isPersisted = await navigator.storage.persist();
        console.log(`Persisted storage granted: ${isPersisted}`);
      }
    }
    lockStorage();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/:projectId" element={<AranyaDashboard />} />
        <Route path="projects/vegetation" element={<ProjectsPage />} /> {/* Placeholder route for now */}
        <Route path="project/:projectId/module/:moduleId" element={<VegetationModulePage />} />
        <Route path="project/:projectId/module/:moduleId/plot/:plotId" element={<PlotVisualizerPage />} />
        <Route path="projects/:projectId/settings" element={<ProjectSettingsPage />} />
        <Route path="projects/:projectId/analysis" element={<AnalysisPage />} />
        <Route path="map" element={<MapPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}

export default App;
