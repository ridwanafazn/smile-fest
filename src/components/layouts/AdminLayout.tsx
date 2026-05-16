import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ReceiptText, Users, Ticket, LogOut, Menu } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  const navItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/transactions', icon: ReceiptText, label: 'Transaksi' },
    { path: '/admin/vouchers', icon: Ticket, label: 'Voucher' },
    { path: '/admin/users', icon: Users, label: 'Manajemen Panitia' },
  ];

  return (
    <div className="min-h-screen bg-stone-100 flex font-sans">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-ringkai-bg border-r border-stone-200 shadow-soft transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex lg:flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-20 flex items-center px-8 border-b border-stone-200">
          <span className="font-serif font-semibold text-xl tracking-wide text-ringkai-text">Control Panel</span>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium
                ${isActive 
                  ? 'bg-ringkai-olive text-white shadow-soft' 
                  : 'text-stone-500 hover:bg-stone-100 hover:text-ringkai-text'
                }
              `}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-stone-200">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-ringkai-danger hover:bg-red-50 transition-colors font-medium"
          >
            <LogOut className="w-5 h-5" />
            <span>Keluar Sistem</span>
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Topbar */}
        <header className="lg:hidden h-20 bg-ringkai-bg border-b border-stone-200 flex items-center justify-between px-6 z-30">
          <span className="font-serif font-medium text-lg">SMILE FEST Admin</span>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -mr-2 text-stone-500 hover:text-ringkai-text rounded-xl"
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* Content Canvas */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}