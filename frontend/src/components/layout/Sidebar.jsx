import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAlertCount } from '../../context/AlertCountContext.jsx';
import { roleLabel } from '../../utils/labels.js';
import Icon from '../ui/Icon.jsx';
import './Sidebar.css';

export default function Sidebar({ onClose }) {
  const { user, logout } = useAuth();
  const { openAlerts } = useAlertCount();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: 'stop' },
    { to: '/inventory', label: 'Inventory', icon: 'check' },
    { to: '/transfers', label: 'Transfers', icon: 'arrowRight' },
    { to: '/alerts', label: 'Alerts', icon: 'alert', badge: openAlerts },
    { to: '/simulation', label: 'Simulation', icon: 'play' },
    { to: '/reports', label: 'Reports', icon: 'download' },
  ];

  if (user?.role === 'Admin') {
    navItems.push({ to: '/users', label: 'User Management', icon: 'edit' });
  }

  const initial = user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U';

  return (
    <aside className="mc-sidebar">
      <div className="mc-sidebar-top">
        <div className="mc-sidebar-brand">
          <div className="mc-logo-tile" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
          <span className="mc-sidebar-title">MediCap</span>
          {onClose && (
            <button className="mc-sidebar-close-btn" onClick={onClose} aria-label="Close menu">
              <Icon name="close" size={18} />
            </button>
          )}
        </div>

        <nav className="mc-sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `mc-sidebar-link ${isActive ? 'mc-sidebar-link-active' : ''}`
              }
            >
              <span className="mc-sidebar-link-icon">
                <Icon name={item.icon} size={16} />
              </span>
              <span className="mc-sidebar-link-text">{item.label}</span>
              {Boolean(item.badge && item.badge > 0) && (
                <span className="mc-sidebar-badge">{item.badge}</span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mc-sidebar-user-card">
        <div className="mc-sidebar-avatar" aria-hidden="true">
          {initial}
        </div>
        <div className="mc-sidebar-user-info">
          <div className="mc-sidebar-user-name" title={user?.fullName}>
            {user?.fullName || 'User'}
          </div>
          <div className="mc-sidebar-user-role">
            {roleLabel(user)}
          </div>
        </div>
        <button
          className="mc-sidebar-logout-btn"
          onClick={handleLogout}
          title="Sign out"
          aria-label="Sign out"
        >
          <Icon name="logout" size={16} />
        </button>
      </div>
    </aside>
  );
}
