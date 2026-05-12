import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { LogIn, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import type { LoginResponse } from '../../types';

const loginSchema = z.object({
  username: z.string().min(1, 'Username wajib diisi'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      const response = await api.post<LoginResponse>('/api/login', data);
      const { token, role } = response.data;

      // Simpan ke Zustand & LocalStorage
      login(token, role);
      
      toast.success(`Selamat datang kembali, ${role}`);
      
      // Redirect berdasarkan role
      if (role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/scanner');
      }
    } catch (error: any) {
      const message = error.response?.data?.error || 'Login gagal, silakan cek kembali kredensial Anda';
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ringkai-bg px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-3xl mb-2">Masuk Sistem</h1>
          <p className="text-stone-500 font-sans text-sm tracking-wide">SMILE FEST 2026 Admin & Scanner Portal</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-8 rounded-2xl shadow-soft border border-stone-100">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-stone-400 mb-2 ml-1">Username</label>
            <input
              {...register('username')}
              type="text"
              className={`w-full px-4 py-3 bg-stone-50 border-b-2 transition-colors ${errors.username ? 'border-ringkai-danger' : 'border-stone-200 focus:border-ringkai-olive'}`}
              placeholder="Masukkan username"
            />
            {errors.username && <p className="mt-1 text-xs text-ringkai-danger ml-1">{errors.username.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-stone-400 mb-2 ml-1">Password</label>
            <input
              {...register('password')}
              type="password"
              className={`w-full px-4 py-3 bg-stone-50 border-b-2 transition-colors ${errors.password ? 'border-ringkai-danger' : 'border-stone-200 focus:border-ringkai-olive'}`}
              placeholder="••••••••"
            />
            {errors.password && <p className="mt-1 text-xs text-ringkai-danger ml-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-ringkai-text text-white py-4 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-stone-700 transition-all disabled:opacity-70 shadow-soft"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
            <span>Masuk Sekarang</span>
          </button>
        </form>
        
        <p className="text-center mt-8 text-stone-400 text-xs">
          Hanya untuk personil berwenang Ringkai Binar.
        </p>
      </div>
    </div>
  );
}