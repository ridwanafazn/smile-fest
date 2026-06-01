import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '../../services/api';
import type { TicketVariant } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import { toast } from 'react-hot-toast';
import { 
  Ticket, Plus, Edit2, Trash2, Loader2, AlertCircle, 
  Power, PowerOff, Calendar, Users, X, CheckCircle
} from 'lucide-react';

// Skema Validasi Form Tiket
const ticketSchema = z.object({
  name: z.string().min(3, 'Nama tiket minimal 3 karakter'),
  price: z.number().min(0, 'Harga tidak boleh minus'),
  quota: z.number().min(1, 'Kuota minimal 1'),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

type TicketFormValues = z.infer<typeof ticketSchema>;

export default function TicketPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<TicketVariant | null>(null);

  // Ambil Data Tiket
  const { data: tickets, isLoading } = useQuery({
    queryKey: ['adminTickets'],
    queryFn: async () => {
      // FIX: Menggunakan endpoint admin murni, bukan endpoint publik.
      // Backend akan otomatis mengembalikan SEMUA tiket (termasuk yang tidak aktif) diurutkan berdasarkan ID.
      const response = await api.get<{ data: TicketVariant[] }>('/api/admin/ticket-variants');
      return Array.isArray(response.data.data) ? response.data.data : [];
    },
  });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<TicketFormValues>({
    resolver: zodResolver(ticketSchema)
  });

  // Reset form ketika modal dibuka/ditutup atau saat editingTicket berubah
  useEffect(() => {
    if (editingTicket) {
      setValue('name', editingTicket.name);
      setValue('price', editingTicket.price);
      setValue('quota', editingTicket.quota || 100); // Asumsi kuota jika belum ada
      // Format tanggal untuk input datetime-local (YYYY-MM-DDThh:mm)
      setValue('start_date', editingTicket.start_date ? new Date(editingTicket.start_date).toISOString().slice(0, 16) : '');
      setValue('end_date', editingTicket.end_date ? new Date(editingTicket.end_date).toISOString().slice(0, 16) : '');
    } else {
      reset({ name: '', price: 0, quota: 100, start_date: '', end_date: '' });
    }
  }, [editingTicket, isModalOpen, reset, setValue]);

  const handleOpenModal = (ticket?: TicketVariant) => {
    setEditingTicket(ticket || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTicket(null);
  };

  // --- Mutasi CRUD ---
  const saveMutation = useMutation({
    mutationFn: async (data: TicketFormValues) => {
      const payload = {
        ...data,
        // Format ISO String untuk Backend (Golang Time)
        // Kita tangani null value agar tidak dikirim string kosong ke Golang
        start_date: data.start_date ? new Date(data.start_date).toISOString() : null,
        end_date: data.end_date ? new Date(data.end_date).toISOString() : null,
      };

      if (editingTicket) {
        return api.put(`/api/admin/ticket-variants/${editingTicket.id}`, payload);
      } else {
        return api.post('/api/admin/ticket-variants', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminTickets'] });
      toast.success(editingTicket ? 'Tiket berhasil diperbarui!' : 'Gelombang tiket baru ditambahkan!');
      handleCloseModal();
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Gagal menyimpan tiket')
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.put(`/api/admin/ticket-variants/${id}/toggle`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminTickets'] });
      toast.success('Status penjualan tiket diperbarui!');
    },
    onError: () => toast.error('Gagal mengubah status tiket')
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/ticket-variants/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminTickets'] });
      toast.success('Tiket berhasil dihapus secara permanen!');
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Gagal menghapus tiket. Pastikan tidak ada transaksi yang terikat.')
  });

  const onSubmit = (data: TicketFormValues) => {
    saveMutation.mutate(data);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Hati-hati! Anda yakin ingin menghapus gelombang tiket "${name}" secara permanen? Aksi ini tidak dapat dibatalkan.`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header Halaman */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-serif mb-2 text-stone-900">Manajemen Tiket</h1>
          <p className="text-stone-500 text-sm tracking-wide">Kelola gelombang presale, atur harga, dan pantau kuota peserta.</p>
        </div>
        
        <button 
          onClick={() => handleOpenModal()}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-stone-900 text-white px-5 py-3 rounded-xl font-bold hover:bg-ringkai-olive transition-all shadow-sm active:scale-95 whitespace-nowrap"
        >
          <Plus className="w-5 h-5" /> Tambah Gelombang
        </button>
      </div>

      {/* Konten Utama (Grid Cards) */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-stone-400">
          <Loader2 className="w-8 h-8 animate-spin mb-3" />
          <p>Memuat ketersediaan tiket...</p>
        </div>
      ) : !tickets || tickets.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-stone-200 rounded-3xl p-16 flex flex-col items-center justify-center text-center">
          <Ticket className="w-16 h-16 text-stone-300 mb-4" />
          <h3 className="text-xl font-serif text-stone-800 mb-2">Belum Ada Tiket</h3>
          <p className="text-stone-500 text-sm max-w-sm mb-6">Anda belum membuat gelombang tiket apapun. Klik tombol di bawah untuk mulai membuka pendaftaran.</p>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 text-ringkai-olive font-bold hover:text-stone-900 transition-colors"
          >
            <Plus className="w-5 h-5" /> Buat Tiket Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {tickets.map((ticket) => (
            <div 
              key={ticket.id} 
              className={`relative bg-white rounded-3xl p-6 border transition-all duration-300 flex flex-col shadow-sm group
                ${ticket.is_active ? 'border-ringkai-olive/30 ring-1 ring-ringkai-olive/10' : 'border-stone-200 grayscale-[0.5] opacity-80'}
              `}
            >
              {/* Indikator Status & Aksi Kanan Atas */}
              <div className="flex items-start justify-between mb-4">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border
                  ${ticket.is_active ? 'bg-ringkai-olive/10 text-ringkai-olive border-ringkai-olive/20' : 'bg-stone-100 text-stone-500 border-stone-200'}
                `}>
                  {ticket.is_active ? <span className="w-1.5 h-1.5 rounded-full bg-ringkai-olive animate-pulse"></span> : <span className="w-1.5 h-1.5 rounded-full bg-stone-400"></span>}
                  {ticket.is_active ? 'Dijual' : 'Ditutup'}
                </span>

                <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenModal(ticket)} className="p-2 text-stone-400 hover:text-ringkai-olive hover:bg-stone-50 rounded-lg transition-colors" title="Edit">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(ticket.id, ticket.name)} disabled={deleteMutation.isPending} className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Informasi Tiket */}
              <div className="flex-1 space-y-1">
                <h3 className="text-xl font-serif font-bold text-stone-900 truncate">{ticket.name}</h3>
                <p className="text-2xl font-serif text-ringkai-olive tracking-wide">
                  {formatRupiah(ticket.price)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-stone-100">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1 flex items-center gap-1"><Users className="w-3 h-3"/> Kuota Sisa</p>
                  <p className="text-stone-800 font-semibold">{ticket.quota || '---'} <span className="font-normal text-xs text-stone-500">Tiket</span></p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3"/> Berakhir</p>
                  <p className="text-stone-800 font-semibold text-sm">
                    {ticket.end_date && ticket.end_date !== "0001-01-01T00:00:00Z" ? new Date(ticket.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : 'Selamanya'}
                  </p>
                </div>
              </div>

              {/* Tombol Toggle Bawah */}
              <button
                onClick={() => toggleMutation.mutate(ticket.id)}
                disabled={toggleMutation.isPending}
                className={`w-full mt-6 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all border
                  ${ticket.is_active 
                    ? 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100' 
                    : 'bg-stone-900 border-stone-900 text-white hover:bg-ringkai-olive hover:border-ringkai-olive'
                  }
                `}
              >
                {ticket.is_active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                {ticket.is_active ? 'Hentikan Penjualan' : 'Buka Penjualan'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* --- MODAL FORM CRUD --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={handleCloseModal}></div>
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            <div className="px-8 py-6 border-b border-stone-100 flex items-center justify-between shrink-0">
              <h2 className="text-2xl font-serif text-stone-900">{editingTicket ? 'Edit Tiket' : 'Buat Tiket Baru'}</h2>
              <button onClick={handleCloseModal} className="p-2 bg-stone-50 text-stone-500 rounded-full hover:bg-stone-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto p-8 space-y-6 flex-1 clean-scrollbar">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-2">Nama Gelombang / Tipe</label>
                <input 
                  {...register('name')} 
                  type="text" 
                  placeholder="Contoh: Presale 1 - Early Bird" 
                  className={`w-full px-5 py-3.5 bg-stone-50 rounded-xl border transition-colors outline-none focus:ring-2 focus:ring-ringkai-olive/20 ${errors.name ? 'border-red-400' : 'border-stone-200 focus:border-ringkai-olive'}`} 
                />
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-2">Harga (Rp)</label>
                  <input 
                    {...register('price', { valueAsNumber: true })} 
                    type="number" 
                    placeholder="150000" 
                    className={`w-full px-5 py-3.5 bg-stone-50 rounded-xl border transition-colors outline-none focus:ring-2 focus:ring-ringkai-olive/20 ${errors.price ? 'border-red-400' : 'border-stone-200 focus:border-ringkai-olive'}`} 
                  />
                  {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-2">Kuota Tersedia</label>
                  <input 
                    {...register('quota', { valueAsNumber: true })} 
                    type="number" 
                    placeholder="100" 
                    className={`w-full px-5 py-3.5 bg-stone-50 rounded-xl border transition-colors outline-none focus:ring-2 focus:ring-ringkai-olive/20 ${errors.quota ? 'border-red-400' : 'border-stone-200 focus:border-ringkai-olive'}`} 
                  />
                  {errors.quota && <p className="mt-1 text-xs text-red-500">{errors.quota.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-stone-100">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-2">Waktu Mulai (Opsional)</label>
                  <input 
                    {...register('start_date')} 
                    type="datetime-local" 
                    className="w-full px-5 py-3.5 bg-stone-50 rounded-xl border border-stone-200 text-stone-700 outline-none focus:border-ringkai-olive focus:ring-2 focus:ring-ringkai-olive/20" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-2">Waktu Berakhir (Opsional)</label>
                  <input 
                    {...register('end_date')} 
                    type="datetime-local" 
                    className="w-full px-5 py-3.5 bg-stone-50 rounded-xl border border-stone-200 text-stone-700 outline-none focus:border-ringkai-olive focus:ring-2 focus:ring-ringkai-olive/20" 
                  />
                </div>
              </div>

              {/* Peringatan Otomatis */}
              <div className="bg-amber-50 p-4 rounded-xl flex items-start gap-3 border border-amber-100 mt-2">
                <AlertCircle className="w-5 h-5 shrink-0 text-amber-500" />
                <p className="text-xs text-amber-700 font-medium leading-relaxed">
                  Tiket yang baru dibuat secara otomatis berstatus <strong className="font-bold">DITUTUP</strong>. Klik tombol "Buka Penjualan" di halaman utama setelah tiket berhasil dibuat.
                </p>
              </div>

              <div className="pt-6 shrink-0 pb-2">
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-ringkai-olive transition-all shadow-md active:scale-95 disabled:opacity-70"
                >
                  {saveMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5 hidden" />}
                  {editingTicket ? 'Simpan Perubahan' : 'Buat Tiket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}