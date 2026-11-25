import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import { AlertCountProvider } from '../../context/AlertCountContext.jsx';
import Icon from '../ui/Icon.jsx';
import './AppLayout.css';

export default function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <AlertCountProvider>
      <div className="mc-app-layout">
        {/* Desktop Sidebar */}
        <div className="mc-sidebar-desktop">
          <Sidebar />
        </div>

        {/* Mobile Top Bar */}
        <header className="mc-mobile-topbar">
          <div className="mc-mobile-brand">
            <div className="mc-logo-tile" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <span className="mc-mobile-brand-title">MediCap</span>
          </div>
          <button
            className="mc-mobile-menu-btn"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
          >
            <Icon name="menu" size={22} />
          </button>
        </header>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="mc-mobile-drawer-backdrop" onClick={() => setMobileMenuOpen(false)}>
            <div className="mc-mobile-drawer" onClick={(e) => e.stopPropagation()}>
              <Sidebar onClose={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="mc-app-main">
          <Outlet />
        </main>
      </div>
    </AlertCountProvider>
  );
}
