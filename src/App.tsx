import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/useAuthStore';

// Layouts
import PublicLayout from './components/layouts/PublicLayout';
import AdminLayout from './components/layouts/AdminLayout';
import ScannerLayout from './components/layouts/ScannerLayout';

// Pages - Public
import LandingPage from './pages/public/LandingPage';
import CheckoutPage from './pages/public/CheckoutPage';
import TrackTicketPage from './pages/public/TrackTicketPage';

// Pages - Auth & Admin
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/admin/DashboardPage';
import TransactionPage from './pages/admin/TransactionPage';
import UserPage from './pages/admin/UserPage';
import VoucherPage from './pages/admin/VoucherPage';

// Pages - Scanner
import ScannerPage from './pages/scanner/ScannerPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Guard untuk memproteksi rute berdasarkan role
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: ('admin' | 'scanner')[] }) => {
  const { isAuthenticated, role } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  if (role && !allowedRoles.includes(role)) {
    if (role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (role === 'scanner') return <Navigate to="/scanner" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster 
          position="top-center"
          toastOptions={{
            style: {
              background: '#fafaf9',
              color: '#292524',
              borderRadius: '0.75rem',
              fontFamily: '"Inter", sans-serif',
            },
          }} 
        />

        <Routes>
          {/* 🟢 RUTE PUBLIK (Kini Terkoneksi Penuh) */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/track-ticket" element={<TrackTicketPage />} />
          </Route>

          {/* 🟠 RUTE OTENTIKASI */}
          <Route path="/auth/login" element={<LoginPage />} />

          {/* 🔵 RUTE ADMIN */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="transactions" element={<TransactionPage />} />
            <Route path="users" element={<UserPage />} />
            <Route path="vouchers" element={<VoucherPage />} />
          </Route>

          {/* 🔴 RUTE SCANNER */}
          <Route path="/scanner" element={
            <ProtectedRoute allowedRoles={['admin', 'scanner']}>
              <ScannerLayout />
            </ProtectedRoute>
          }>
            <Route index element={<ScannerPage />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;