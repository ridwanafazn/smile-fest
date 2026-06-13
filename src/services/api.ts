import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, 
});

// --- REQUEST INTERCEPTOR ---
api.interceptors.request.use(
  (config) => {
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

// --- RESPONSE INTERCEPTOR (AUTO-UNBOXING) ---
api.interceptors.response.use(
  (response) => {
    // Mengecek apakah respons berasal dari format 'utils.SuccessResponse' Backend
    // Format Backend kita selalu membungkus payload asli di dalam properti 'data'
    if (response.data && response.data.meta && response.data.meta.status === 'success') {
      
      // Jika ini adalah respon dengan pagination, kita unbox tapi sisipkan kembali objek pagination-nya
      if (response.data.pagination) {
         // Mengubah struktur response Axios secara on-the-fly
         response.data = {
            data: response.data.data,
            pagination: response.data.pagination,
            meta: response.data.meta // Tetap simpan meta jika sewaktu-waktu dibutuhkan toast
         };
         return response;
      }
      
      // Jika respons biasa, unbox murni layer datanya (seperti format sebelum refactor BE)
      // Contoh: respons asli adalah { meta: {...}, data: { token: '...' } }
      // Komponen FE akan langsung menerima { token: '...' } melalui response.data
      response.data = response.data.data;
    }
    
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      useAuthStore.getState().logout();
      
      if (window.location.pathname !== '/auth/login') {
        window.location.href = '/auth/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// --- MANUAL PAYMENT SERVICES ---
export const transactionService = {
  uploadProof: async (orderId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return api.post(`/api/transactions/${orderId}/upload-proof`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000, 
    });
  },
  
  verifyPayment: async (orderId: string, action: 'approve' | 'reject') => {
    return api.put(`/api/admin/transactions/${orderId}/verify`, { action });
  },

  cancelOrder: async (orderId: string) => {
    return api.put(`/api/transactions/${orderId}/cancel`);
  },

  getTransactionInsights: async (params: {
    page: number;
    limit: number;
    search?: string;
    voucher?: string;
    variant?: string;
  }) => {
    // Karena interceptor Anda mengembalikan objek utuh 'response' saat ada properti pagination,
    // Kita panggil .then(res => res.data) agar query function TanStack Query langsung menerima { data: [...], pagination: {...} }
    return api.get('/api/admin/transactions/insights', { params }).then(res => res.data);
  },

  blastEmail: async () => {
    return api.post('/api/admin/transactions/blast-email');
  }
};