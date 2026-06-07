import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'react-hot-toast';
import { api } from '../../services/api';
import type { User } from '../../types';
import { 
  UserPlus, Shield, Loader2, Search, Filter, 
  ChevronLeft, ChevronRight, Lock, UserX, Trash2, RefreshCcw, AlertTriangle, Edit2, X 
} from 'lucide-react';

const userSchema = z.object({
  username: z.string().min(3, 'Username minimal 3 karakter').regex(/^[a-zA-Z0-9_]+$/, 'Hanya huruf, angka, dan underscore'),
  password: z.string().refine(val => !val || val.length >= 6, 'Password minimal 6 karakter jika diisi').optional(),
  role: z.enum(['admin', 'scanner']),
});

type UserForm = z.infer<typeof userSchema>;

export default function UserPage() {
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'active' | 'trash'>('active');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const limit = 5; 

  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/api/admin/users');
      return (res.data || []) as User[];
    }
  });

  const { data: trashedUsers, isLoading: isLoadingTrash } = useQuery({
    queryKey: ['trashedUsers'],
    queryFn: async () => {
      const res = await api.get('/api/admin/users/trash');
      return (res.data || []) as User[];
    },
    enabled: activeTab === 'trash'
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<UserForm>({
    resolver: zodResolver(userSchema),
    defaultValues: { role: 'scanner' }
  });

  const createMutation = useMutation({
    mutationFn: (data: UserForm) => api.post('/api/admin/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Akun personil berhasil dibuat');
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.meta?.message || 'Gagal membuat akun. Username mungkin sudah terpakai.');
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string, payload: UserForm }) => api.put(`/api/admin/users/${data.id}`, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Data personil berhasil diperbarui');
      cancelEdit();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.meta?.message || 'Gagal memperbarui data personil');
    }
  });

  const suspendMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['trashedUsers'] });
      toast.success('Akses personil dicabut. Akun dipindahkan ke Kotak Sampah.');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.meta?.message || 'Gagal mencabut akses user');
    }
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => api.put(`/api/admin/users/${id}/restore`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['trashedUsers'] });
      toast.success('Akun personil berhasil dipulihkan.');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.meta?.message || 'Gagal memulihkan akun');
    }
  });

  const hardDeleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/users/${id}/hard-delete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trashedUsers'] });
      toast.success('Akun berhasil dimusnahkan secara permanen.');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.meta?.message || 'Gagal menghapus permanen');
    }
  });

  const onSubmit = (data: UserForm) => {
    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, payload: data });
    } else {
      if (!data.password || data.password.length < 6) {
        toast.error('Ketik sandi minimal 6 karakter untuk akun baru');
        return;
      }
      createMutation.mutate(data);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    reset({ username: user.username, role: user.role as 'admin' | 'scanner', password: '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingUser(null);
    reset({ username: '', password: '', role: 'scanner' });
  };

  const handleSuspend = (id: string, username: string) => {
    if (window.confirm(`Cabut akses untuk personil "${username}"? Akun ini tidak akan bisa login lagi dan dipindahkan ke Kotak Sampah.`)) {
      suspendMutation.mutate(id);
    }
  };

  const handleRestore = (id: string, username: string) => {
    if (window.confirm(`Pulihkan akses untuk personil "${username}"?`)) {
      restoreMutation.mutate(id);
    }
  };

  const handleHardDelete = (id: string, username: string) => {
    if (window.confirm(`PERINGATAN! Anda yakin memusnahkan "${username}" secara fisik? Data tidak dapat dikembalikan.`)) {
      hardDeleteMutation.mutate(id);
    }
  };

  const sourceData = activeTab === 'active' ? users : trashedUsers;
  
  const filteredUsers = useMemo(() => {
    if (!sourceData) return [];
    return sourceData.filter(user => {
      const matchSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRole = roleFilter === 'all' || user.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [sourceData, searchTerm, roleFilter, activeTab]);

  const totalPages = Math.ceil(filteredUsers.length / limit);
  const currentUsers = filteredUsers.slice((currentPage - 1) * limit, currentPage * limit);

  const generatePaginationNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  };

  const handleTabChange = (tab: 'active' | 'trash') => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSearchTerm('');
    cancelEdit();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-serif mb-2">Manajemen Personil</h1>
          <p className="text-stone-500 text-sm tracking-wide">Kelola akses Admin dan Scanner lapangan.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        <div className="w-full lg:w-[35%] shrink-0 sticky top-6">
          <form onSubmit={handleSubmit(onSubmit)} className={`p-6 rounded-2xl border shadow-soft transition-colors ${editingUser ? 'bg-amber-50 border-amber-200' : 'bg-white border-stone-200'}`}>
            <h2 className="font-serif text-lg mb-6 flex items-center gap-2">
              {editingUser ? <Edit2 className="w-5 h-5 text-amber-600" /> : <UserPlus className="w-5 h-5 text-ringkai-olive" />}
              {editingUser ? 'Ubah Data Personil' : 'Tambah Personil'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-stone-400 mb-2 ml-1">Username Tanpa Spasi</label>
                <input {...register('username')} placeholder="misal: john_doe" className="w-full px-4 py-3 bg-white border-b-2 border-stone-200 focus:border-ringkai-olive outline-none transition-colors" />
                {errors.username && <p className="text-xs text-ringkai-danger mt-1 ml-1">{errors.username.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-stone-400 mb-2 ml-1">Password</label>
                <input type="password" {...register('password')} placeholder={editingUser ? "Kosongkan jika sandi tetap" : "Minimal 6 karakter"} className="w-full px-4 py-3 bg-white border-b-2 border-stone-200 focus:border-ringkai-olive outline-none transition-colors" />
                {errors.password && <p className="text-xs text-ringkai-danger mt-1 ml-1">{errors.password.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-stone-400 mb-2 ml-1">Role atau Peran</label>
                <select {...register('role')} className="w-full px-4 py-3 bg-white border-b-2 border-stone-200 focus:border-ringkai-olive outline-none transition-colors cursor-pointer">
                  <option value="scanner">Scanner</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              
              <div className="flex gap-2 pt-2">
                <button disabled={createMutation.isPending || updateMutation.isPending} className={`flex-1 text-white py-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-70 ${editingUser ? 'bg-amber-600 hover:bg-amber-700' : 'bg-ringkai-text hover:bg-stone-700'}`}>
                  {createMutation.isPending || updateMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingUser ? <Edit2 className="w-5 h-5" /> : <Shield className="w-5 h-5" />)}
                  {editingUser ? 'Simpan Data' : 'Daftarkan Personil'}
                </button>
                {editingUser && (
                  <button type="button" onClick={cancelEdit} className="px-5 py-4 bg-stone-200 text-stone-600 rounded-xl hover:bg-stone-300 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        <div className="w-full lg:w-[65%] flex-1 space-y-4">
          
          <div className="flex items-center gap-4 border-b border-stone-200">
            <button 
              onClick={() => handleTabChange('active')}
              className={`pb-3 text-sm font-semibold transition-colors relative ${activeTab === 'active' ? 'text-ringkai-olive' : 'text-stone-400 hover:text-stone-600'}`}
            >
              <span className="flex items-center gap-2"><Shield className="w-4 h-4" /> Personil Aktif</span>
              {activeTab === 'active' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-ringkai-olive rounded-t-full"></div>}
            </button>
            <button 
              onClick={() => handleTabChange('trash')}
              className={`pb-3 text-sm font-semibold transition-colors relative ${activeTab === 'trash' ? 'text-ringkai-danger' : 'text-stone-400 hover:text-stone-600'}`}
            >
              <span className="flex items-center gap-2"><Trash2 className="w-4 h-4" /> Kotak Sampah</span>
              {activeTab === 'trash' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-ringkai-danger rounded-t-full"></div>}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari username..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-9 pr-4 py-2 border border-stone-200 rounded-xl outline-none focus:border-ringkai-olive text-sm"
              />
            </div>
            <div className="relative w-full sm:w-48">
              <Filter className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
                className="w-full pl-9 pr-4 py-2 border border-stone-200 rounded-xl outline-none focus:border-ringkai-olive text-sm appearance-none cursor-pointer"
              >
                <option value="all">Semua Peran</option>
                <option value="admin">Admin</option>
                <option value="scanner">Scanner</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 shadow-soft overflow-hidden">
            
            {activeTab === 'trash' && (
              <div className="bg-red-50 px-6 py-3 border-b border-red-100 flex items-center gap-2 text-xs text-red-600 font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Data di bawah ini tidak dapat melakukan login. Menghapus secara permanen akan memutus riwayat aktivitas personil tersebut.
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-xs uppercase tracking-widest text-stone-500">
                    <th className="px-6 py-4">Username</th>
                    <th className="px-6 py-4">Role atau Peran</th>
                    <th className="px-6 py-4 text-center">Tindakan Khusus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {isLoadingUsers || isLoadingTrash ? (
                    <tr><td colSpan={3} className="px-6 py-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-stone-300" /></td></tr>
                  ) : currentUsers.length > 0 ? (
                    currentUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-stone-50/50 transition-colors group">
                        <td className={`px-6 py-4 font-medium ${activeTab === 'trash' ? 'text-stone-400 line-through' : 'text-ringkai-text'}`}>{user.username}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${user.role === 'admin' ? 'bg-ringkai-olive/10 text-ringkai-olive border border-ringkai-olive/20' : 'bg-stone-100 text-stone-500 border border-stone-200'}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          
                          {activeTab === 'active' && (
                            <div className="flex items-center justify-center gap-2">
                              <button 
                                onClick={() => handleEdit(user)}
                                className="p-2 rounded-lg text-stone-400 bg-stone-50 hover:bg-amber-50 hover:text-amber-600 border border-transparent hover:border-amber-200 transition-all"
                                title="Ubah Data Personil"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleSuspend(user.id, user.username)}
                                disabled={suspendMutation.isPending}
                                className="px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-xs font-semibold text-stone-400 bg-stone-50 hover:bg-red-50 hover:text-ringkai-danger border border-transparent hover:border-red-200 transition-all"
                                title="Cabut Akses Personil"
                              >
                                {suspendMutation.isPending && suspendMutation.variables === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Lock className="w-4 h-4" /> Cabut</>}
                              </button>
                            </div>
                          )}

                          {activeTab === 'trash' && (
                            <div className="flex items-center justify-center gap-2">
                              <button 
                                onClick={() => handleRestore(user.id, user.username)}
                                disabled={restoreMutation.isPending}
                                className="px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-xs font-semibold text-stone-500 bg-stone-50 hover:bg-green-50 hover:text-ringkai-success border border-transparent hover:border-green-200 transition-all"
                                title="Pulihkan Personil"
                              >
                                {restoreMutation.isPending && restoreMutation.variables === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><RefreshCcw className="w-3.5 h-3.5" /> Restore</>}
                              </button>
                              
                              <button 
                                onClick={() => handleHardDelete(user.id, user.username)}
                                disabled={hardDeleteMutation.isPending}
                                className="p-1.5 rounded-lg flex items-center justify-center text-stone-400 bg-stone-50 hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-200 transition-all"
                                title="Hapus Permanen"
                              >
                                {hardDeleteMutation.isPending && hardDeleteMutation.variables === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                              </button>
                            </div>
                          )}

                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-stone-400 italic text-sm">
                        {activeTab === 'active' ? (
                          <><UserX className="w-8 h-8 mx-auto mb-2 opacity-20" /> Tidak ada personil aktif ditemukan.</>
                        ) : (
                          <><Trash2 className="w-8 h-8 mx-auto mb-2 opacity-20" /> Kotak sampah kosong saat ini.</>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-stone-200 bg-stone-50">
                <span className="text-xs text-stone-500">Total {filteredUsers.length} Personil</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="p-1 rounded hover:bg-stone-200 disabled:opacity-30"><ChevronLeft className="w-4 h-4"/></button>
                  {generatePaginationNumbers().map(num => (
                    <button key={num} onClick={() => setCurrentPage(num)} className={`w-6 h-6 rounded flex items-center justify-center text-xs font-medium ${currentPage === num ? 'bg-ringkai-text text-white' : 'hover:bg-stone-200 text-stone-600'}`}>{num}</button>
                  ))}
                  <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="p-1 rounded hover:bg-stone-200 disabled:opacity-30"><ChevronRight className="w-4 h-4"/></button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}