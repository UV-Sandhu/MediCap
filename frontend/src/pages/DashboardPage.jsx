import { useAuth } from '../context/AuthContext.jsx';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  return (
    <div style={{ padding: '28px' }}>
      <h1>Dashboard</h1>
      <p className="mc-muted">Logged in as {user?.fullName} ({user?.role})</p>
      <button onClick={logout} style={{ marginTop: '16px' }}>Log out</button>
    </div>
  );
}
