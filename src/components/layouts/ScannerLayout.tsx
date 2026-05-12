import { Outlet, useNavigate } from 'react-router-dom';
import { LogOut, ScanLine } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export default function ScannerLayout() {
  const { logout, role } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  return (
    <div className="min-h-screen bg-stone-900 text-ringkai-bg flex flex-col font-sans selection:bg-ringkai-olive">
      {/* Minimal Topbar Field Mode */}
      <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-stone-800 bg-stone-950 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-ringkai-olive/20 flex items-center justify-center text-ringkai-olive">
            <ScanLine className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-stone-400 font-medium tracking-wider uppercase">Gate Scanner</span>
            <span className="text-sm font-medium leading-none capitalize">{role || 'Relawan'}</span>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Field Content - Full height */}
      <main className="flex-1 relative flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}