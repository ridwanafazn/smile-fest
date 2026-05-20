import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://smile-fest-api-143705141615.asia-southeast2.run.app/';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://smile-fest-api.up.railway.app/';


export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Timeout 10 detik, mencegah UI hanging jika koneksi lapangan buruk
  timeout: 10000, 
});

// --- REQUEST INTERCEPTOR ---
api.interceptors.request.use(
  (config) => {
    // Tarik token langsung dari store Zustand
    const token = useAuthStore.getState().token;
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- RESPONSE INTERCEPTOR ---
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Global Error Handler untuk token kadaluarsa atau tidak valid
    if (error.response && error.response.status === 401) {
      // Bersihkan state aplikasi
      useAuthStore.getState().logout();
      
      // Jika bukan di halaman login, arahkan paksa ke halaman login
      if (window.location.pathname !== '/auth/login') {
        window.location.href = '/auth/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// --- MANUAL PAYMENT SERVICES ---
// Memisahkan fungsi khusus yang membutuhkan konfigurasi header berbeda
export const transactionService = {
  // Upload bukti bayar dengan multipart/form-data
  uploadProof: async (orderId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return api.post(`/api/transactions/${orderId}/upload-proof`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      // Timeout diperpanjang khusus untuk upload file besar
      timeout: 30000, 
    });
  },
  
  // Verifikasi manual oleh Admin
  verifyPayment: async (orderId: string, action: 'approve' | 'reject') => {
    return api.put(`/api/admin/transactions/${orderId}/verify`, { action });
  }
};