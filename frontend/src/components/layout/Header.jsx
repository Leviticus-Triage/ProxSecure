import { useState, useContext } from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import { Menu, X, LayoutDashboard, Server, CheckCircle2 } from 'lucide-react';
import { AppContext } from '../../context/AppContext';

const routeTitles = {
  '/': 'Dashboard',
  '/nodes': 'Nodes',
};

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/nodes', label: 'Nodes', icon: Server },
];

function getPageTitle(pathname) {
  if (pathname === '/') return routeTitles['/'] ?? 'Dashboard';
  if (pathname.startsWith('/nodes/')) return 'Node Detail';
  return routeTitles[pathname] ?? 'ProxSecure Audit';
}

export default function Header() {
  const location = useLocation();
  const { lastUpdated } = useContext(AppContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const title = getPageTitle(location.pathname);
  const lastUpdatedDisplay =
    lastUpdated != null ? lastUpdated.toLocaleString() : '—';

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white px-4 py-3 shadow-sm md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              Last updated: {lastUpdatedDisplay}
            </span>
          </div>
        </div>
      </header>

      {/* Mobile drawer: same links as Sidebar, visible only on small screens */}
      <div
        className={`fixed inset-0 z-50 md:hidden ${mobileMenuOpen ? '' : 'pointer-events-none invisible'}`}
        aria-hidden={!mobileMenuOpen}
      >
        <div
          className="absolute inset-0 bg-black/50 transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
        <div
          className={`absolute left-0 top-0 h-full w-64 max-w-[85vw] transform bg-white shadow-xl transition-transform duration-200 ease-out ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex h-14 items-center justify-between border-b border-gray-200 px-4">
            <span className="text-lg font-semibold text-primary-600">
              ProxSecure Audit
            </span>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 p-4">
            {navItems.map(({ to, label, icon: Icon }) => {
              const isActive =
                to === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(to);
              return (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMobileMenuOpen(false)}
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
        </div>
      </div>
    </>
  );
}
