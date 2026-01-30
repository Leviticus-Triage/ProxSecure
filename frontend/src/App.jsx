import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import DashboardOverview from './pages/DashboardOverview';
import NodeDetail from './pages/NodeDetail';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<DashboardOverview />} />
          <Route path="nodes" element={<Dashboard />} />
          <Route path="nodes/:nodeId" element={<NodeDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
