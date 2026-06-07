import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, ReceiptText, Users, Ticket, LogOut, Menu, 
  ChevronLeft, ChevronRight, CheckSquare, Tag, QrCode 
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';

export default function AdminLayout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  const navItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: ' Dashboard' },
    { path: '/admin/approval', icon: CheckSquare, label: ' Approval' },
    { path: '/admin/transactions', icon: ReceiptText, label: ' Transaksi' },
    { path: '/admin/vouchers', icon: Ticket, label: ' Voucher' },
    { path: '/admin/tickets', icon: Tag, label: ' Tiket' },
    { path: '/admin/users', icon: Users, label: ' Panitia' },
    { path: '/scanner', icon: QrCode, label: ' Scanner' },
  ];

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex font-sans text-stone-900 overflow-hidden relative">
      
      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-50 bg-white border-r border-stone-200 shadow-sm 
          flex flex-col transform transition-all duration-300 ease-in-out 
          lg:translate-x-0 lg:static
          ${isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full w-72'}
          ${isCollapsed ? 'lg:w-20' : 'lg:w-72'}
        `}
      >
        {/* Sidebar Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-stone-200 shrink-0 relative">
          <span 
            className={`font-serif font-bold text-lg tracking-wide text-stone-800 transition-opacity duration-200 whitespace-nowrap
              ${isCollapsed ? 'lg:opacity-0 lg:w-0 overflow-hidden' : 'opacity-100'}
            `}
          >
            Control Panel
          </span>

          {/* Toggle Button Desktop (Floating Handle Style) */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex absolute -right-3 top-7 w-6 h-6 bg-white border border-stone-300 rounded-full items-center justify-center text-stone-500 hover:text-stone-800 hover:border-stone-400 shadow-sm z-50 transition-colors"
          >
            {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto overflow-x-hidden clean-scrollbar">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileOpen(false)}
              className={({ isActive }) => `
                flex items-center rounded-xl transition-all duration-200 font-medium group relative
                ${isCollapsed ? 'lg:justify-center lg:px-0 py-3' : 'px-4 py-3 gap-3'}
                ${isActive 
                  ? 'bg-ringkai-olive text-white shadow-sm' 
                  : 'text-stone-500 hover:bg-stone-50 hover:text-stone-900'
                }
              `}
            >
              <item.icon className={`w-5 h-5 shrink-0 ${isCollapsed ? 'lg:mx-auto' : ''}`} />
              
              <span 
                className={`transition-all duration-200 whitespace-nowrap
                  ${isCollapsed ? 'lg:opacity-0 lg:w-0 lg:overflow-hidden' : 'opacity-100'}
                `}
              >
                {item.label}
              </span>

              {/* Tooltip on Hover when Sidebar Collapsed */}
              {isCollapsed && (
                <div className="absolute left-full ml-4 px-3 py-1.5 bg-stone-900 text-white text-xs font-semibold rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap hidden lg:block">
                  {item.label}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-stone-200 shrink-0">
          <button 
            onClick={handleLogout}
            className={`
              flex items-center text-red-600 hover:bg-red-50 rounded-xl transition-all font-medium group relative w-full
              ${isCollapsed ? 'lg:justify-center lg:px-0 py-3' : 'px-4 py-3 gap-3'}
            `}
          >
            <LogOut className={`w-5 h-5 shrink-0 ${isCollapsed ? 'lg:mx-auto' : ''}`} />
            
            <span 
              className={`transition-all duration-200 whitespace-nowrap
                ${isCollapsed ? 'lg:opacity-0 lg:w-0 lg:overflow-hidden' : 'opacity-100'}
              `}
            >
              Keluar Sistem
            </span>

            {/* Tooltip Logout */}
            {isCollapsed && (
              <div className="absolute left-full ml-4 px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap hidden lg:block">
                Keluar Sistem
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Mobile Topbar */}
        <header className="lg:hidden h-20 bg-white border-b border-stone-200 flex items-center justify-between px-6 shrink-0 z-30 shadow-sm">
          <span className="font-serif font-bold text-lg text-stone-800 tracking-tight">SMILE FEST Admin</span>
          <button 
            type="button"
            onClick={() => setIsMobileOpen(true)}
            className="p-2.5 -mr-2 text-stone-500 hover:text-stone-800 bg-stone-50 border border-stone-200 rounded-xl transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>

        {/* Content Canvas */}
        <main className="flex-1 overflow-y-auto bg-stone-50/40 p-6 lg:p-10">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}