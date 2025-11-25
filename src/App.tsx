
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:projectId" element={<AranyaDashboard />} />
          <Route path="projects/vegetation" element={<ProjectsPage />} /> {/* Placeholder route for now */}
          <Route path="project/:projectId/module/:moduleId" element={<VegetationModulePage />} />
          <Route path="project/:projectId/module/:moduleId/plot/:plotId" element={<PlotVisualizerPage />} />
          <Route path="projects/:projectId/settings" element={<ProjectSettingsPage />} />
          <Route path="map" element={<MapPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="analysis" element={<AnalysisPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
