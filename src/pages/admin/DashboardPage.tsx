import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api, transactionService } from '../../services/api';
import type { DashboardStats } from '../../types';
import { Banknote, Ticket, ScanLine, AlertCircle, Loader2, Clock, ArrowRight, Send, MailWarning, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  // State untuk mengontrol Modal Konfirmasi Blast
  const [isBlastModalOpen, setIsBlastModalOpen] = useState(false);
  // State untuk mengunci tombol setelah blast sukses
  const [isBlastSent, setIsBlastSent] = useState(false);

  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const response = await api.get('/api/admin/dashboard');
      return response.data as unknown as DashboardStats; 
    },
    refetchInterval: 5000, 
  });

  // Mutasi untuk eksekusi Blast Email
  const blastMutation = useMutation({
    mutationFn: transactionService.blastEmail,
    onSuccess: () => {
      setIsBlastModalOpen(false);
      setIsBlastSent(true); // Kunci tombol
      alert('Sistem sedang mengirim email di latar belakang. Proses ini memakan waktu sekitar 1-2 menit. Jangan tutup server.');
    },
    onError: (error: any) => {
      setIsBlastModalOpen(false);
      alert(error?.response?.data?.message || 'Terjadi kesalahan saat memicu blast email.');
    }
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
  const batch1Count = Math.min(totalTickets, 300);
  const batch2Count = Math.max(0, totalTickets - 300);
  
  const batch1Percent = (batch1Count / 300) * 100;
  const batch2Percent = (batch2Count / 300) * 100;
  const waitingVerification = stats?.waiting_verification || 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      <div>
        <h1 className="text-3xl font-serif mb-2">Ringkasan Eksekutif</h1>
        <p className="text-stone-500 text-sm tracking-wide">Pemantauan metrik utama dan manajemen kuota SMILE FEST 2026.</p>
      </div>

      {waitingVerification > 0 && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in slide-in-from-top-2">
          {/* ... kode alert waiting verification lama tetap ... */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl animate-pulse">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-blue-900">Perlu Verifikasi Segera</h3>
              <p className="text-xs text-blue-700">Terdapat <strong>{waitingVerification} transaksi</strong> yang telah mengunggah bukti transfer.</p>
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

      {/* Grid Utama (Sebaran Kuota & Aksi Operasional) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Progress Kuota Sesi - Memakan 2 kolom */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-stone-200 shadow-soft space-y-6 lg:col-span-2">
          <h3 className="font-serif text-xl text-stone-800">Sebaran Kuota Sesi</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Batch 1 */}
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
            </div>

            {/* Batch 2 */}
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
            </div>
          </div>
        </div>

        {/* KARTU AKSI OPERASIONAL HARI-H (BLAST EMAIL) */}
        <div className="bg-[#fdfaf5] p-6 md:p-8 rounded-3xl border border-[#f3e8d6] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Send className="w-5 h-5 text-amber-600" />
              <h3 className="font-serif text-xl text-stone-800">Aksi Hari-H</h3>
            </div>
            <p className="text-sm text-stone-600 mb-6 leading-relaxed">
              Kirimkan surel panduan acara, link Grup WA, dan pendaftaran Kids Corner secara massal ke seluruh peserta yang telah lunas.
            </p>
          </div>
          
          <button
            onClick={() => setIsBlastModalOpen(true)}
            disabled={isBlastSent || blastMutation.isPending || totalTickets === 0}
            className={`w-full py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              isBlastSent 
                ? 'bg-stone-200 text-stone-500 cursor-not-allowed'
                : 'bg-amber-600 hover:bg-amber-700 text-white shadow-md hover:shadow-lg'
            }`}
          >
            {blastMutation.isPending ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Mempersiapkan...</>
            ) : isBlastSent ? (
              <><CheckCircle2 className="w-5 h-5" /> Blast Sedang Berjalan</>
            ) : (
              <><MailWarning className="w-5 h-5" /> Kirim Blast Panduan</>
            )}
          </button>
        </div>
      </div>

      {/* Grid Metrik Utama */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ... (Kode Grid Metrik Utama tetap sama seperti sebelumnya) ... */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-soft relative overflow-hidden group">
          <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center text-ringkai-text mb-4">
            <Banknote className="w-6 h-6" />
          </div>
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-1">Total Pendapatan</p>
          <h2 className="text-3xl font-serif text-ringkai-text">{formatRupiah(stats?.total_revenue || 0)}</h2>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-soft relative overflow-hidden group">
          <div className="w-12 h-12 bg-ringkai-olive/10 rounded-xl flex items-center justify-center text-ringkai-olive mb-4">
            <Ticket className="w-6 h-6" />
          </div>
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-1">Total Tiket Terjual</p>
          <h2 className="text-3xl font-serif text-ringkai-text">{totalTickets} <span className="text-base text-stone-400 font-sans">tiket</span></h2>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-soft relative overflow-hidden group">
          <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center text-ringkai-text mb-4">
            <ScanLine className="w-6 h-6" />
          </div>
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-1">Peserta Hadir (Scanned)</p>
          <h2 className="text-3xl font-serif text-ringkai-text">{stats?.scanned_tickets || 0} <span className="text-base text-stone-400 font-sans">orang</span></h2>
        </div>
      </div>

      {/* MODAL KONFIRMASI BLAST EMAIL */}
      {isBlastModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
              <MailWarning className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-serif text-stone-800 mb-2">Konfirmasi Pengiriman Massal</h2>
            <p className="text-stone-600 text-sm mb-6 leading-relaxed">
              Anda akan mengirimkan email Panduan Hari-H ke seluruh email unik yang berstatus <strong>LUNAS</strong>. Aksi ini tidak dapat dibatalkan. Pastikan draf di Google Apps Script sudah final.
            </p>
            
            <div className="flex items-center justify-end gap-3">
              <button 
                onClick={() => setIsBlastModalOpen(false)}
                disabled={blastMutation.isPending}
                className="px-5 py-2.5 text-sm font-bold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={() => blastMutation.mutate()}
                disabled={blastMutation.isPending}
                className="px-5 py-2.5 text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-colors flex items-center gap-2"
              >
                {blastMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ya, Kirim Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}