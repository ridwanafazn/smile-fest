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
    <div className="min-h-screen bg-stone-50 text-stone-800 flex flex-col font-sans selection:bg-ringkai-olive">
      {/* Topbar Light Mode */}
      <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-stone-200 bg-white z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-ringkai-olive/10 flex items-center justify-center text-ringkai-olive border border-ringkai-olive/20">
            <ScanLine className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-stone-400 font-bold tracking-widest uppercase">Gate Scanner</span>
            <span className="text-sm font-semibold leading-none capitalize text-stone-700">{role || 'Relawan'}</span>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="p-2 rounded-xl text-stone-400 hover:text-ringkai-danger hover:bg-red-50 transition-colors"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Field Content */}
      <main className="flex-1 relative flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}