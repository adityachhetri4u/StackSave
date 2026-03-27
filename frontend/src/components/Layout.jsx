import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import SideRail from './SideRail';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Layout() {
  const location = useLocation();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/cards') return 'Vault';
    if (path === '/history') return 'History';
    if (path === '/recommend') return 'StackMode';
    return 'Terminal';
  };

  const activeTab = getActiveTab();

  return (
    <div className="min-h-screen bg-machine text-slate-100" id="app-layout">
      <Navbar activeTab={activeTab} />
      <div className="mx-auto flex w-full max-w-[1300px] gap-4 px-3 pb-6 pt-4 sm:px-5">
        <SideRail activeTab={activeTab} onSignOut={handleSignOut} />
        <main className="machine-shell min-h-[calc(100vh-116px)] flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
