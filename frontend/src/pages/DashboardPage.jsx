import { useAuth } from '../context/AuthContext.jsx';
import PageHeader from '../components/layout/PageHeader.jsx';

export default function DashboardPage() {
  const { user } = useAuth();
  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`Master control view · ${user?.role === 'Admin' ? 'All stations' : user?.stationName || ''}`}
      />
      <p className="mc-muted">Welcome, {user?.fullName}</p>
    </div>
  );
}
