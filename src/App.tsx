
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './layouts/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailsPage } from './pages/ProjectDetailsPage';
import { MapPage } from './pages/MapPage';
import { SettingsPage } from './pages/SettingsPage';
import AranyaDashboard from './pages/AranyaDashboard';
import { VegetationModulePage } from './ui/modules/Vegetation/VegetationModulePage';
import { PlotVisualizerPage } from './ui/modules/Vegetation/PlotVisualizerPage';
import { ProjectSettingsPage } from './pages/ProjectSettingsPage';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:projectId" element={<AranyaDashboard />} />
          <Route path="project/:projectId/module/:moduleId" element={<VegetationModulePage />} />
          <Route path="project/:projectId/module/:moduleId/plot/:plotId" element={<PlotVisualizerPage />} />
          <Route path="projects/:projectId/settings" element={<ProjectSettingsPage />} />
          <Route path="map" element={<MapPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="/aranya" element={<AranyaDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
