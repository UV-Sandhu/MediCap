import { useState, useRef, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './LoginPage.css';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [loading, setLoading] = useState(false);

  const identifierRef = useRef(null);

  useEffect(() => {
    if (!user && identifierRef.current) {
      identifierRef.current.focus();
    }
  }, [user]);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);

    const errors = {};
    if (!identifier.trim()) {
      errors.identifier = 'Enter your username or email';
    }
    if (!password) {
      errors.password = 'Enter your password';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      await login(identifier.trim(), password);
      navigate('/dashboard');
    } catch (err) {
      if (err.code === 'INVALID_CREDENTIALS') {
        setApiError('Invalid username or password');
      } else if (err.code === 'NETWORK_ERROR') {
        setApiError('Cannot reach the server');
      } else {
        setApiError(err.message || 'Cannot reach the server');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mc-login-page">
      {/* Left Hero Panel */}
      <div className="mc-login-left">
        <div className="mc-login-brand">
          <div className="mc-logo-tile" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
          <span className="mc-logo-text">MediCap</span>
        </div>

        <div className="mc-login-middle">
          <h1 className="mc-login-headline">Cold-chain logistics, under control.</h1>
          <p className="mc-login-desc">
            Track inventory, transfers and live temperature telemetry across your stations.
          </p>
        </div>

        <div className="mc-login-bottom">
          <div className="mc-login-chips">
            <span className="mc-login-chip">Ambient</span>
            <span className="mc-login-chip">Refrigerated</span>
            <span className="mc-login-chip">Ultra-Cold</span>
          </div>
          <p className="mc-login-notice">Internal system · Authorized personnel only</p>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="mc-login-right">
        {/* Mobile Header Logo */}
        <div className="mc-login-mobile-header">
          <div className="mc-logo-tile" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
          <span className="mc-logo-text">MediCap</span>
        </div>

        <div className="mc-login-card">
          <h2 className="mc-login-card-title">Sign in</h2>
          <p className="mc-login-card-subtitle">Use your assigned credentials to access the system.</p>

          <form onSubmit={handleSubmit} className="mc-login-form" noValidate>
            <div className="mc-login-field">
              <label htmlFor="login-identifier" className="mc-login-label">Username or Email</label>
              <input
                ref={identifierRef}
                id="login-identifier"
                type="text"
                autoComplete="username"
                className={`mc-login-input ${fieldErrors.identifier ? 'mc-input-error' : ''}`}
                placeholder="name@medicap.local"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  if (fieldErrors.identifier) {
                    setFieldErrors((prev) => ({ ...prev, identifier: null }));
                  }
                }}
              />
              {fieldErrors.identifier && (
                <p className="mc-login-field-error">{fieldErrors.identifier}</p>
              )}
            </div>

            <div className="mc-login-field">
              <label htmlFor="login-password" className="mc-login-label">Password</label>
              <div className="mc-login-input-wrapper">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={`mc-login-input ${fieldErrors.password ? 'mc-input-error' : ''}`}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors((prev) => ({ ...prev, password: null }));
                    }
                  }}
                />
                <button
                  type="button"
                  className="mc-login-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mc-login-field-error">{fieldErrors.password}</p>
              )}
            </div>

            {apiError && <div className="mc-login-api-error">{apiError}</div>}

            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="mc-login-submit-btn"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

            <div className="mc-login-card-footer">
              <span>Need an account?</span>
              <a href="mailto:admin@medicap.local" className="mc-login-contact-link">
                Contact Administrator for Access
              </a>
            </div>
          </form>
        </div>

        <p className="mc-login-footer-text">
          After sign-in: Admins go to the Master Control view · Operators go to their assigned station dashboard.
        </p>
      </div>
    </div>
  );
}
