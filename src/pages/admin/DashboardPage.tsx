import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import type { DashboardStats } from '../../types';
import { Banknote, Ticket, ScanLine, AlertCircle, Loader2, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const response = await api.get<{message: string, data: DashboardStats}>('/api/admin/dashboard');
      return response.data.data; 
    },
    // Interval dipercepat menjadi 5 detik karena Admin butuh memantau transfer masuk
    refetchInterval: 5000, 
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

  const totalTickets = stats?.total_tickets || 0;
  
  // Logika Kalkulasi Batch (1-300 = Batch 1, 301-600 = Batch 2)
  const batch1Count = Math.min(totalTickets, 300);
  const batch2Count = Math.max(0, totalTickets - 300);
  
  const batch1Percent = (batch1Count / 300) * 100;
  const batch2Percent = (batch2Count / 300) * 100;
  
  const waitingVerification = stats?.waiting_verification || 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-serif mb-2">Ringkasan Eksekutif</h1>
        <p className="text-stone-500 text-sm tracking-wide">Pemantauan metrik utama dan manajemen kuota SMILE FEST 2026.</p>
      </div>

      {/* Alert Banner untuk Verifikasi Pembayaran Manual */}
      {waitingVerification > 0 && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl animate-pulse">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-blue-900">Perlu Verifikasi Segera</h3>
              <p className="text-xs text-blue-700">Terdapat <strong>{waitingVerification} transaksi</strong> yang telah mengunggah bukti transfer dan menunggu persetujuan Anda.</p>
            </div>
          </div>
          <Link 
            to="/admin/transactions" 
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap"
          >
            Cek Transaksi <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Progress Kuota Sesi (Batch 1 & Batch 2) */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-stone-200 shadow-soft space-y-6">
        <h3 className="font-serif text-xl text-stone-800">Sebaran Kuota Sesi</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Batch 1 Progress */}
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-0.5">Sesi Pagi</p>
                <p className="font-medium text-stone-700">Batch 1</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-serif text-ringkai-olive font-bold">{batch1Count}</span>
                <span className="text-sm text-stone-400"> / 300</span>
              </div>
            </div>
            <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ease-out ${batch1Count >= 300 ? 'bg-stone-800' : 'bg-ringkai-olive'}`}
                style={{ width: `${batch1Percent}%` }}
              />
            </div>
            {batch1Count >= 300 && <p className="text-xs text-stone-500 font-medium">Sesi Pagi telah penuh.</p>}
          </div>

          {/* Batch 2 Progress */}
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-0.5">Sesi Siang</p>
                <p className="font-medium text-stone-700">Batch 2</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-serif text-ringkai-olive font-bold">{batch2Count}</span>
                <span className="text-sm text-stone-400"> / 300</span>
              </div>
            </div>
            <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-ringkai-olive transition-all duration-1000 ease-out`}
                style={{ width: `${batch2Percent}%` }}
              />
            </div>
            {batch1Count < 300 && <p className="text-xs text-stone-400">Terbuka otomatis setelah Batch 1 penuh.</p>}
          </div>
        </div>
      </div>

      {/* Grid Metrik Utama */}
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
          <h2 className="text-3xl font-serif text-ringkai-text">{totalTickets} <span className="text-base text-stone-400 font-sans">tiket</span></h2>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-soft relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <ScanLine className="w-24 h-24" />
          </div>
          <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center text-ringkai-text mb-4">
            <ScanLine className="w-6 h-6" />
          </div>
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-1">Peserta Hadir (Scanned)</p>
          <h2 className="text-3xl font-serif text-ringkai-text">{stats?.scanned_tickets || 0} <span className="text-base text-stone-400 font-sans">orang</span></h2>
        </div>
      </div>
    </div>
  );
}