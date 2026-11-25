import { useState } from 'react';
import { api, getToken, clearToken } from './api/client.js';

export default function App() {
  const [token, setTokenState] = useState(getToken());
  const [stations, setStations] = useState([]);
  const [error, setError] = useState(null);
  const [health, setHealth] = useState(null);

  const handleLogin = async () => {
    try {
      setError(null);
      const res = await api.post('/auth/login', {
        identifier: 'admin@medicap.local',
        password: 'Password@123',
      });
      setTokenState(res.token);
    } catch (err) {
      setError(err.code || err.message);
    }
  };

  const handleWrongPassword = async () => {
    try {
      setError(null);
      await api.post('/auth/login', {
        identifier: 'admin@medicap.local',
        password: 'wrong',
      });
    } catch (err) {
      setError(err.code || err.message);
    }
  };

  const handleGetStations = async () => {
    try {
      setError(null);
      const data = await api.get('/stations');
      console.log('GET /stations:', data);
      setStations(data);
    } catch (err) {
      setError(err.code || err.message);
    }
  };

  const handleHealth = async () => {
    try {
      setError(null);
      const data = await api.get('/health');
      setHealth(data);
    } catch (err) {
      setError(err.code || err.message);
    }
  };

  return (
    <div style={{ padding: '28px' }}>
      <h1>MediCap</h1>
      <p className="mc-muted">Phase FA3 Verification</p>

      <div className="mc-row" style={{ marginTop: '20px' }}>
        <button id="btn-login" onClick={handleLogin}>Log in as admin</button>
        <button id="btn-wrong" onClick={handleWrongPassword}>Log in with wrong password</button>
        <button id="btn-stations" onClick={handleGetStations}>GET /stations</button>
        <button id="btn-health" onClick={handleHealth}>GET /health</button>
        <button id="btn-clear" onClick={() => { clearToken(); setTokenState(null); }}>Clear token</button>
      </div>

      <div style={{ marginTop: '20px' }}>
        <p><strong>Stored Token:</strong> <span id="token-val">{token || 'none'}</span></p>
        <p><strong>Error Code:</strong> <span id="error-val">{error || 'none'}</span></p>
        <p><strong>Stations Count:</strong> <span id="stations-count">{stations.length}</span></p>
        {health && <p><strong>Health DB:</strong> <span id="health-db">{health.db}</span></p>}
      </div>
    </div>
  );
}
