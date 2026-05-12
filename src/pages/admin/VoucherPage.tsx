import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'react-hot-toast';
import { api } from '../../services/api';
import type { Voucher } from '../../types';
import { Tag, Loader2, Plus, Power, Edit2, Trash2, X } from 'lucide-react';

const voucherSchema = z.object({
  code: z.string().min(3, 'Kode minimal 3 karakter').toUpperCase(),
  discount_amount: z.coerce.number().min(1000, 'Minimal diskon Rp 1.000'),
  quota: z.coerce.number().min(1, 'Minimal kuota 1'),
});

type VoucherForm = z.infer<typeof voucherSchema>;

export default function VoucherPage() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: vouchers, isLoading } = useQuery({
    queryKey: ['vouchers'],
    queryFn: async () => {
      const response = await api.get<{message: string, data: Voucher[]}>('/api/admin/vouchers');
      const payload = response.data;
      return Array.isArray(payload.data) ? payload.data : [];
    },
  });

  // PERBAIKAN TS ERROR: Menggunakan 'as any' untuk membypass konflik tipe zodResolver vs useForm
  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<VoucherForm>({
    resolver: zodResolver(voucherSchema) as any, 
  });

  const createMutation = useMutation({
    mutationFn: (data: VoucherForm) => api.post('/api/admin/vouchers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      toast.success('Voucher berhasil dibuat');
      resetForm();
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Gagal membuat voucher'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: number, payload: VoucherForm }) => api.put(`/api/admin/vouchers/${data.id}`, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      toast.success('Voucher berhasil diperbarui');
      resetForm();
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Gagal mengupdate voucher'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/admin/vouchers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      toast.success('Voucher berhasil dihapus');
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Gagal menghapus voucher'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => api.put(`/api/admin/vouchers/${id}/toggle`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      toast.success('Status voucher diperbarui');
    },
    onError: () => toast.error('Gagal memperbarui status voucher'),
  });

  const onSubmit = (data: VoucherForm) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, payload: data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (voucher: Voucher) => {
    setEditingId(voucher.id);
    setValue('code', voucher.code);
    setValue('discount_amount', voucher.discount_amount);
    setValue('quota', voucher.quota);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    reset({ code: '', discount_amount: 0, quota: 0 });
  };

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(angka);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-serif mb-2">Manajemen Voucher</h1>
        <p className="text-stone-500 text-sm tracking-wide">Kendali diskon dan kuota promosi.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Panel Form CRUD Voucher */}
        <div className="lg:col-span-1">
          <form onSubmit={handleSubmit(onSubmit)} className={`p-6 rounded-2xl border shadow-soft sticky top-6 transition-colors ${editingId ? 'bg-amber-50 border-amber-200' : 'bg-white border-stone-200'}`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-lg flex items-center gap-2">
                {editingId ? <Edit2 className="w-5 h-5 text-amber-600" /> : <Tag className="w-5 h-5 text-ringkai-olive" />}
                {editingId ? 'Edit Voucher' : 'Buat Voucher'}
              </h2>
              {editingId && (
                <button type="button" onClick={resetForm} className="p-1 hover:bg-amber-100 rounded-md text-amber-700 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-stone-400 mb-2 ml-1">Kode Promo</label>
                <input
                  {...register('code')}
                  type="text"
                  placeholder="MISAL: SMILE20"
                  disabled={editingId !== null} // Kode tidak boleh diubah saat edit
                  className="w-full px-4 py-3 bg-white border-b-2 border-stone-200 focus:border-ringkai-olive uppercase transition-colors disabled:bg-stone-100 disabled:text-stone-400"
                />
                {errors.code && <p className="mt-1 text-xs text-ringkai-danger ml-1">{errors.code.message as string}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-stone-400 mb-2 ml-1">Potongan (Rp)</label>
                <input
                  {...register('discount_amount')}
                  type="number"
                  placeholder="20000"
                  className="w-full px-4 py-3 bg-white border-b-2 border-stone-200 focus:border-ringkai-olive transition-colors"
                />
                {errors.discount_amount && <p className="mt-1 text-xs text-ringkai-danger ml-1">{errors.discount_amount.message as string}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-stone-400 mb-2 ml-1">Total Kuota Tersedia</label>
                <input
                  {...register('quota')}
                  type="number"
                  placeholder="100"
                  className="w-full px-4 py-3 bg-white border-b-2 border-stone-200 focus:border-ringkai-olive transition-colors"
                />
                {errors.quota && <p className="mt-1 text-xs text-ringkai-danger ml-1">{errors.quota.message as string}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
                className={`w-full mt-4 py-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-70 text-white ${editingId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-ringkai-text hover:bg-stone-700'}`}
              >
                {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingId ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />)}
                <span>{editingId ? 'Simpan Perubahan' : 'Buat Voucher'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Panel Tabel Voucher */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-xs uppercase tracking-widest text-stone-500">
                    <th className="px-6 py-4 font-semibold">Kode</th>
                    <th className="px-6 py-4 font-semibold">Potongan</th>
                    <th className="px-6 py-4 font-semibold">Sisa Kuota</th>
                    <th className="px-6 py-4 font-semibold text-center">Status & Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <Loader2 className="w-6 h-6 animate-spin text-stone-400 mx-auto" />
                      </td>
                    </tr>
                  ) : vouchers && vouchers.length > 0 ? (
                    vouchers.map((v) => {
                      const sisaKuota = v.quota - v.usage_count;
                      return (
                        <tr key={v.id} className="hover:bg-stone-50/50 transition-colors">
                          <td className="px-6 py-4 font-medium text-ringkai-text font-mono">{v.code}</td>
                          <td className="px-6 py-4 font-serif">{formatRupiah(v.discount_amount)}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${sisaKuota > 0 ? 'bg-stone-100 text-stone-600' : 'bg-red-100 text-ringkai-danger'}`}>
                              {sisaKuota} / {v.quota} Tersisa
                            </span>
                          </td>
                          <td className="px-6 py-4 flex items-center justify-center gap-2">
                            {/* Toggle Button */}
                            <button
                              onClick={() => toggleMutation.mutate(v.id)}
                              disabled={toggleMutation.isPending}
                              className={`p-2 rounded-full transition-colors ${
                                v.is_active 
                                  ? 'bg-green-50 text-ringkai-success hover:bg-green-100' 
                                  : 'bg-red-50 text-ringkai-danger hover:bg-red-100'
                              }`}
                              title={v.is_active ? "Voucher Aktif. Klik untuk matikan" : "Voucher Mati. Klik untuk nyalakan"}
                            >
                              {toggleMutation.isPending && toggleMutation.variables === v.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
                            </button>

                            {/* Edit Button */}
                            <button
                              onClick={() => handleEdit(v)}
                              className="p-2 rounded-full bg-stone-50 text-stone-600 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                              title="Edit Voucher"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => {
                                if(window.confirm(`Hapus permanen voucher ${v.code}?`)) deleteMutation.mutate(v.id);
                              }}
                              disabled={deleteMutation.isPending}
                              className="p-2 rounded-full bg-stone-50 text-stone-600 hover:bg-red-50 hover:text-ringkai-danger transition-colors"
                              title="Hapus Voucher"
                            >
                              {deleteMutation.isPending && deleteMutation.variables === v.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-stone-400">
                        Belum ada voucher yang dibuat.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}