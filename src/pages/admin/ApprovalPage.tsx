import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, transactionService } from '../../services/api';
import type { Transaction } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import { toast } from 'react-hot-toast';
import { 
  CheckCircle, XCircle, Clock, Image as ImageIcon, 
  ChevronRight, Inbox, X, ZoomIn, Receipt, Loader2
} from 'lucide-react';

export default function ApprovalPage() {
  const queryClient = useQueryClient();
  const [selectedTrxId, setSelectedTrxId] = useState<string | null>(null);

    const { data: queryData, isLoading } = useQuery({
        queryKey: ['transactions', 'approval'],
        queryFn: async () => {
          const response = await api.get('/api/admin/transactions');
          return response.data as unknown as { data: Transaction[], pagination: any };
        },
        refetchInterval: 30000, 
      });

    const transactions = queryData?.data || [];

  // Filter khusus untuk status 'waiting_verification' (hanya dieksekusi ulang jika transactions berubah)
  const pendingApprovals = useMemo(() => {
    return transactions?.filter(t => t.status === 'waiting_verification') || [];
  }, [transactions]);

  // Cari detail transaksi yang sedang diklik
  const selectedTrx = useMemo(() => {
    return pendingApprovals.find(t => t.id === selectedTrxId) || null;
  }, [pendingApprovals, selectedTrxId]);

  // Mutasi untuk aksi Approve / Reject
  const verifyMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' }) => 
      transactionService.verifyPayment(id, action),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      
      if (variables.action === 'approve') {
        toast.success('Pembayaran disetujui. Tiket terbit!');
      } else {
        toast.error('Pembayaran ditolak.');
      }
      
      // Kosongkan seleksi setelah diproses
      setSelectedTrxId(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.meta?.message || 'Gagal memverifikasi pembayaran');
    }
  });

  // Fungsi untuk merender detail panel (Bisa dipakai di desktop maupun mobile drawer)
  const renderDetailPanel = () => {
    if (!selectedTrx) return null;

    return (
      <div className="flex flex-col h-full bg-white">
        {/* Header Panel Kanan */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between shrink-0 bg-stone-50/50">
          <div>
            <h3 className="font-serif text-xl text-stone-900">{selectedTrx.customer_name}</h3>
            <p className="text-xs text-stone-500 font-mono mt-0.5">{selectedTrx.id}</p>
          </div>
          <div className="text-right">
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-widest rounded-full">
              Menunggu Cek
            </span>
          </div>
        </div>

        {/* Area Scrollable: Gambar Pratinjau & Nominal */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          <div className="flex items-center justify-center p-6 bg-stone-100/50 rounded-2xl border-2 border-dashed border-stone-200 relative group min-h-[300px]">
            {selectedTrx.payment_proof_url ? (
              <>
                <img 
                  src={selectedTrx.payment_proof_url} 
                  alt="Bukti Transfer" 
                  className="max-w-full max-h-[60vh] object-contain rounded-xl shadow-sm"
                />
                <a 
                  href={selectedTrx.payment_proof_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur text-stone-700 rounded-lg shadow-sm hover:bg-white hover:text-ringkai-olive transition-colors opacity-0 group-hover:opacity-100"
                  title="Buka gambar di tab baru"
                >
                  <ZoomIn className="w-5 h-5" />
                </a>
              </>
            ) : (
              <div className="text-center text-stone-400">
                <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Gambar tidak tersedia</p>
              </div>
            )}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-700/70 mb-2 flex items-center justify-center gap-1">
              <Receipt className="w-4 h-4" /> Nominal yang harus ditransfer
            </p>
            <p className="text-4xl font-serif font-bold text-amber-700">
              {formatRupiah(selectedTrx.total_amount)}
            </p>
            <p className="text-sm text-amber-600/80 mt-2">Pastikan 3 digit terakhir sesuai dengan mutasi rekening.</p>
          </div>
        </div>

        {/* Footer Aksi */}
        <div className="p-6 border-t border-stone-100 shrink-0 bg-white">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => verifyMutation.mutate({ id: selectedTrx.id, action: 'reject' })}
              disabled={verifyMutation.isPending}
              className="py-4 bg-white border-2 border-red-100 hover:border-red-200 hover:bg-red-50 text-ringkai-danger rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-sm"
            >
              <XCircle className="w-5 h-5" /> Tolak
            </button>
            <button
              onClick={() => verifyMutation.mutate({ id: selectedTrx.id, action: 'approve' })}
              disabled={verifyMutation.isPending}
              className="py-4 bg-ringkai-olive hover:bg-stone-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-md"
            >
              <CheckCircle className="w-5 h-5" /> Setujui
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500">
      
      {/* Header Halaman */}
      <div className="mb-6 shrink-0">
        <h1 className="text-3xl font-serif mb-2 text-stone-900">Antrean Approval</h1>
        <p className="text-stone-500 text-sm tracking-wide">
          Verifikasi bukti transfer manual. Terdapat <strong className="text-stone-800">{pendingApprovals.length}</strong> antrean menunggu.
        </p>
      </div>

      {/* Main Layout Split Screen (Desktop) & List (Mobile) */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-[600px] pb-10 lg:pb-0">
        
        {/* Kolom Kiri: Daftar Antrean */}
        <div className="w-full lg:w-1/3 bg-white border border-stone-200 rounded-2xl shadow-sm flex flex-col overflow-hidden shrink-0">
          <div className="p-5 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between shrink-0">
            <span className="font-bold text-sm text-stone-800 uppercase tracking-widest">Daftar Tunggu</span>
            {isLoading && <Loader2 className="w-4 h-4 animate-spin text-stone-400" />}
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-2 clean-scrollbar">
            {!isLoading && pendingApprovals.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-stone-400 p-8 text-center">
                <Inbox className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm font-medium">Yeay! Semua antrean sudah bersih.</p>
              </div>
            ) : (
              pendingApprovals.map((trx) => (
                <button
                  key={trx.id}
                  onClick={() => setSelectedTrxId(trx.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center justify-between group
                    ${selectedTrxId === trx.id 
                      ? 'bg-ringkai-olive/10 border-ringkai-olive/30 ring-1 ring-ringkai-olive/20' 
                      : 'bg-white border-stone-200 hover:border-stone-300 hover:shadow-sm'
                    }
                  `}
                >
                  <div className="overflow-hidden pr-3">
                    <p className={`font-semibold truncate mb-1 ${selectedTrxId === trx.id ? 'text-ringkai-olive' : 'text-stone-800'}`}>
                      {trx.customer_name}
                    </p>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="font-serif font-bold text-stone-600">{formatRupiah(trx.total_amount)}</span>
                      <span className="flex items-center gap-1 text-stone-400">
                        <Clock className="w-3 h-3" />
                        {new Date(trx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 shrink-0 transition-transform ${selectedTrxId === trx.id ? 'text-ringkai-olive translate-x-1' : 'text-stone-300 group-hover:text-stone-500'}`} />
                </button>
              ))
            )}
          </div>
        </div>

        {/* Kolom Kanan: Pratinjau (Hanya terlihat di Desktop) */}
        <div className="hidden lg:flex w-full lg:w-2/3 bg-white border border-stone-200 rounded-2xl shadow-sm flex-col overflow-hidden">
          {selectedTrx ? (
            renderDetailPanel()
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-stone-400 p-12 text-center bg-stone-50/50">
              <ImageIcon className="w-16 h-16 mb-4 opacity-20" />
              <h3 className="text-xl font-serif text-stone-600 mb-2">Belum ada transaksi dipilih</h3>
              <p className="text-sm">Klik salah satu antrean di sebelah kiri untuk melihat bukti transfer berukuran besar.</p>
            </div>
          )}
        </div>

      </div>

      {/* Drawer Mobile (Hanya terlihat di layar kecil saat ada yang dipilih) */}
      {selectedTrx && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end animate-in fade-in">
          {/* Overlay Gelap */}
          <div 
            className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
            onClick={() => setSelectedTrxId(null)}
          ></div>
          
          {/* Konten Bottom Sheet */}
          <div className="relative bg-white w-full h-[90vh] rounded-t-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-full duration-300">
            {/* Handle Drag Indikator */}
            <div className="w-full flex justify-center py-3 shrink-0" onClick={() => setSelectedTrxId(null)}>
              <div className="w-12 h-1.5 bg-stone-200 rounded-full"></div>
            </div>
            
            {/* Tombol Tutup Floating */}
            <button 
              onClick={() => setSelectedTrxId(null)}
              className="absolute top-4 right-4 p-2 bg-stone-100 text-stone-500 rounded-full hover:bg-stone-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Render ulang panel detail untuk mobile */}
            <div className="flex-1 overflow-hidden">
              {renderDetailPanel()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}