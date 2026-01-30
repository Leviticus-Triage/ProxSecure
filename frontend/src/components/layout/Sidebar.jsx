import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Server, CheckCircle2 } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/nodes', label: 'Nodes', icon: Server },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-30 hidden h-full w-64 flex-col border-r border-gray-200 bg-white shadow-sm md:flex lg:flex">
      <div className="flex h-14 items-center border-b border-gray-200 px-4">
        <span className="text-lg font-semibold text-primary-600">ProxSecure Audit</span>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map(({ to, label, icon: Icon }) => {
          const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </NavLink>
          );
        })}
      </nav>
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-2 rounded-lg bg-emerald-100 px-3 py-2 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>CheckMK Agent: Connected</span>
        </div>
      </div>
    </aside>
  );
}
