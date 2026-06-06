import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AnalyticsPage from './pages/AnalyticsPage';

function useHash() {
  const [hash, setHash] = useState(window.location.hash.slice(1) || '/login');

  useEffect(() => {
    const handler = () => setHash(window.location.hash.slice(1) || '/login');
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  return hash;
}

function Router() {
  const { user, loading } = useAuth();
  const hash = useHash();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">
        Loading...
      </div>
    );
  }

  if (!user) {
    if (hash === '/register') return <RegisterPage />;
    return <LoginPage />;
  }

  if (hash === '/analytics') return <AnalyticsPage />;
  return <DashboardPage />;
}

function Redirector() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    const hash = window.location.hash.slice(1);
    if (user && (hash === '' || hash === '/login' || hash === '/register')) {
      window.location.hash = '#/dashboard';
    }
    if (!user && hash !== '/register') {
      window.location.hash = '#/login';
    }
  }, [user, loading]);

  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <Redirector />
      <Router />
    </AuthProvider>
  );
}
