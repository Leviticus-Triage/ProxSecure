import { Outlet } from 'react-router-dom';
import { AppContextProvider } from '../../context/AppContext';
import Sidebar from './Sidebar';
import Header from './Header';

/**
 * Main layout: sidebar (left), header + outlet (right).
 * Responsive: sidebar collapses on mobile (< 768px).
 */
export default function DashboardLayout() {
  return (
    <AppContextProvider>
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar />
        <div className="flex flex-1 flex-col md:ml-64">
          <Header />
          <main className="flex-1 p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </AppContextProvider>
  );
}
