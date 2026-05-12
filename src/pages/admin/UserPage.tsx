import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'react-hot-toast';
import { api } from '../../services/api';
import { UserPlus, Shield, Trash2, Loader2, FileX } from 'lucide-react';

const userSchema = z.object({
  username: z.string().min(3, 'Username minimal 3 karakter'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  role: z.enum(['admin', 'scanner']),
});

type UserForm = z.infer<typeof userSchema>;

export default function UserPage() {
  const queryClient = useQueryClient();

  // 1. Ambil Data (Dengan proteksi tipe data)
  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/api/admin/users');
      // Proteksi jika backend membungkus array dalam field .data
      const rawData = res.data;
      if (Array.isArray(rawData)) return rawData;
      if (rawData && Array.isArray(rawData.data)) return rawData.data;
      return [];
    }
  });

  // 2. Setup Form
  const { register, handleSubmit, reset, formState: { errors } } = useForm<UserForm>({
    resolver: zodResolver(userSchema),
    defaultValues: { role: 'scanner' }
  });

  // 3. Mutasi: Tambah User
  const createMutation = useMutation({
    mutationFn: (data: UserForm) => api.post('/api/admin/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Akun personil berhasil dibuat');
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Gagal membuat akun');
    }
  });

  // 4. Mutasi: Hapus User (Penyebab error sebelumnya)
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Akses dicabut');
    },
    onError: () => {
      toast.error('Gagal menghapus user');
    }
  });

  const onSubmit = (data: UserForm) => {
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-serif mb-2">Manajemen Personil</h1>
        <p className="text-stone-500 text-sm tracking-wide">Kelola akses Admin dan Scanner lapangan.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Panel Form */}
        <div className="lg:col-span-1">
          <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-soft sticky top-6">
            <h2 className="font-serif text-lg mb-6 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-ringkai-olive" /> Tambah Personil
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-stone-400 mb-2 ml-1">Username</label>
                <input {...register('username')} className="w-full px-4 py-3 bg-stone-50 border-b-2 border-stone-200 focus:border-ringkai-olive outline-none" />
                {errors.username && <p className="text-xs text-ringkai-danger mt-1">{errors.username.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-stone-400 mb-2 ml-1">Password</label>
                <input type="password" {...register('password')} className="w-full px-4 py-3 bg-stone-50 border-b-2 border-stone-200 focus:border-ringkai-olive outline-none" />
                {errors.password && <p className="text-xs text-ringkai-danger mt-1">{errors.password.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-stone-400 mb-2 ml-1">Role</label>
                <select {...register('role')} className="w-full px-4 py-3 bg-stone-50 border-b-2 border-stone-200 focus:border-ringkai-olive outline-none">
                  <option value="scanner">Scanner</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button disabled={createMutation.isPending} className="w-full bg-ringkai-text text-white py-4 rounded-xl font-medium hover:bg-stone-700 transition-all flex items-center justify-center gap-2">
                {createMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
                Daftarkan
              </button>
            </div>
          </form>
        </div>

        {/* Panel Tabel */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-soft overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-xs uppercase tracking-widest text-stone-500">
                  <th className="px-6 py-4">Username</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {isLoading ? (
                  <tr><td colSpan={3} className="px-6 py-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-stone-300" /></td></tr>
                ) : Array.isArray(users) && users.length > 0 ? (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-ringkai-text">{user.username}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${user.role === 'admin' ? 'bg-ringkai-olive/10 text-ringkai-olive' : 'bg-stone-100 text-stone-500'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => deleteMutation.mutate(user.id)}
                          disabled={deleteMutation.isPending}
                          className="p-2 text-stone-300 hover:text-ringkai-danger transition-colors"
                        >
                          {deleteMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-stone-400 italic text-sm">
                      <FileX className="w-8 h-8 mx-auto mb-2 opacity-20" />
                      Belum ada personil terdaftar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}