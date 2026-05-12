import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import type { DashboardStats } from '../../types';
import { Banknote, Ticket, ScanLine, AlertCircle, Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      // PERBAIKAN: Unboxing JSON
      const response = await api.get<{message: string, data: DashboardStats}>('/api/admin/dashboard');
      return response.data.data; 
    },
    refetchInterval: 10000, 
  });

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(angka);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-ringkai-olive" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-ringkai-danger min-h-[60vh]">
        <AlertCircle className="w-12 h-12 mb-4" />
        <h2 className="text-xl font-serif">Gagal Memuat Dasbor</h2>
        <p className="text-sm">Periksa koneksi internet atau server backend.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-serif mb-2">Ringkasan Eksekutif</h1>
        <p className="text-stone-500 text-sm tracking-wide">Pemantauan metrik utama SMILE FEST 2026 secara real-time.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-soft relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Banknote className="w-24 h-24" />
          </div>
          <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center text-ringkai-text mb-4">
            <Banknote className="w-6 h-6" />
          </div>
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-1">Total Pendapatan</p>
          <h2 className="text-3xl font-serif text-ringkai-text">{formatRupiah(stats?.total_revenue || 0)}</h2>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-soft relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Ticket className="w-24 h-24" />
          </div>
          <div className="w-12 h-12 bg-ringkai-olive/10 rounded-xl flex items-center justify-center text-ringkai-olive mb-4">
            <Ticket className="w-6 h-6" />
          </div>
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-1">Total Tiket Terjual</p>
          {/* PERBAIKAN TS: properti diubah jadi total_tickets */}
          <h2 className="text-3xl font-serif text-ringkai-text">{stats?.total_tickets || 0} <span className="text-base text-stone-400 font-sans">tiket</span></h2>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-soft relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <ScanLine className="w-24 h-24" />
          </div>
          <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center text-ringkai-text mb-4">
            <ScanLine className="w-6 h-6" />
          </div>
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-1">Peserta Hadir (Scanned)</p>
          {/* PERBAIKAN TS: properti diubah jadi scanned_tickets */}
          <h2 className="text-3xl font-serif text-ringkai-text">{stats?.scanned_tickets || 0} <span className="text-base text-stone-400 font-sans">orang</span></h2>
        </div>
      </div>
    </div>
  );
}