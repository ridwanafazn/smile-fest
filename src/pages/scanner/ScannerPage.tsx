import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { toast } from 'react-hot-toast';
import { api } from '../../services/api';
import type { ValidateTicketResponse, ScannerStats } from '../../types';
import { Keyboard, Camera, CheckCircle2, XCircle, Info, BarChart3 } from 'lucide-react';

type TabMode = 'dashboard' | 'camera' | 'manual';

export default function ScannerPage() {
  const [stats, setStats] = useState<ScannerStats | null>(null);
  const [lastResult, setLastResult] = useState<ValidateTicketResponse | null>(null);
  const [isError, setIsError] = useState(false);
  const [manualId, setManualId] = useState('');
  const [activeTab, setActiveTab] = useState<TabMode>('dashboard');

  const fetchStats = async () => {
    try {
      const res = await api.get<{message: string, data: ScannerStats}>('/api/scanner/stats');
      setStats(res.data.data); // Unboxing JSON
    } catch (e) {
      console.error('Gagal mengambil statistik scanner');
    }
  };

  useEffect(() => {
    fetchStats();
    // Auto-refresh stats tiap 10 detik di background
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  // Inisialisasi scanner HANYA ketika tab kamera aktif
  useEffect(() => {
    if (activeTab !== 'camera') return;

    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scanner.render(onScanSuccess, (_err) => {
      // Diamkan error scan berkelanjutan agar tidak spam konsol
    });

    async function onScanSuccess(decodedText: string) {
      handleValidation(decodedText);
    }

    return () => {
      scanner.clear().catch(error => console.error("Failed to clear scanner", error));
    };
  }, [activeTab]);

  const handleValidation = async (id: string) => {
    try {
      setIsError(false);
      const res = await api.post<ValidateTicketResponse>('/api/scanner/validate-ticket', {
        ticket_id: id 
      });
      
      setLastResult(res.data);
      toast.success(`Berhasil: ${res.data.customer_name}`);
      fetchStats(); 
      
      setTimeout(() => setLastResult(null), 4000);
    } catch (error: any) {
      setIsError(true);
      const msg = error.response?.data?.error || 'Tiket Tidak Valid';
      setLastResult({ ticket_id: id, customer_name: 'UNKNOWN', message: msg });
      toast.error(msg);
      
      setTimeout(() => {
        setLastResult(null);
        setIsError(false);
      }, 4000);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 space-y-4 max-w-2xl mx-auto w-full">
      
      {/* Navigasi Tab */}
      <div className="flex bg-stone-800 p-1.5 rounded-2xl border border-stone-700">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-stone-700 text-white shadow-soft' : 'text-stone-400 hover:text-stone-200'}`}
        >
          <BarChart3 className="w-4 h-4" /> Info
        </button>
        <button 
          onClick={() => setActiveTab('camera')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'camera' ? 'bg-stone-700 text-white shadow-soft' : 'text-stone-400 hover:text-stone-200'}`}
        >
          <Camera className="w-4 h-4" /> Pindai
        </button>
        <button 
          onClick={() => setActiveTab('manual')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'manual' ? 'bg-stone-700 text-white shadow-soft' : 'text-stone-400 hover:text-stone-200'}`}
        >
          <Keyboard className="w-4 h-4" /> Manual
        </button>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col relative rounded-3xl overflow-hidden bg-black border border-stone-800 min-h-[60vh]">
        
        {/* TAB 1: DASHBOARD STATISTIK */}
        {activeTab === 'dashboard' && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-stone-900 animate-in fade-in zoom-in-95 duration-300">
             <div className="w-full max-w-sm space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-serif text-white mb-2">Gate Control</h2>
                  <p className="text-stone-400 text-sm">Pantau arus masuk peserta secara real-time.</p>
                </div>

                <div className="bg-stone-800 p-6 rounded-2xl border border-stone-700 text-center">
                  <p className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-1">Sudah Masuk (Scanned)</p>
                  <p className="text-5xl font-serif text-ringkai-olive">{stats?.scanned_tickets ?? 0}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-stone-800/50 p-4 rounded-2xl border border-stone-700 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1">Total Tiket Lunas</p>
                    <p className="text-2xl font-serif text-white">{stats?.total_tickets ?? 0}</p>
                  </div>
                  <div className="bg-stone-800/50 p-4 rounded-2xl border border-stone-700 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1">Belum Datang</p>
                    <p className="text-2xl font-serif text-amber-500">{stats?.remaining ?? 0}</p>
                  </div>
                </div>

                <button 
                  onClick={() => setActiveTab('camera')}
                  className="w-full bg-ringkai-text text-white py-4 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-stone-700 transition-colors mt-4"
                >
                  <Camera className="w-5 h-5" /> Mulai Pindai Peserta
                </button>
             </div>
          </div>
        )}

        {/* TAB 2: CAMERA SCANNER */}
        {activeTab === 'camera' && (
          <div className="w-full h-full flex flex-col bg-black animate-in fade-in duration-300">
             <div id="reader" className="w-full flex-1"></div>
             <div className="p-4 text-center bg-stone-900 border-t border-stone-800">
                <p className="text-xs text-stone-400 italic tracking-wide">Posisikan QR Code di dalam kotak untuk memindai otomatis</p>
             </div>
          </div>
        )}

        {/* TAB 3: MANUAL INPUT */}
        {activeTab === 'manual' && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-stone-900 animate-in fade-in zoom-in-95 duration-300">
            <div className="text-center w-full max-w-sm">
              <Info className="w-12 h-12 text-stone-600 mx-auto mb-4" />
              <h2 className="text-lg font-serif text-white mb-2">Input Manual</h2>
              <p className="text-stone-400 text-sm mb-8">Gunakan opsi ini jika layar HP peserta retak atau kamera gagal membaca QR Code.</p>
              
              <div className="space-y-4">
                <input 
                  type="text"
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                  placeholder="Ketik UUID Tiket (Contoh: 123e4567...)"
                  className="w-full bg-stone-950 border border-stone-700 p-4 text-center text-white tracking-widest rounded-xl focus:border-ringkai-olive transition-colors outline-none"
                />
                <button 
                  onClick={() => {
                    if(!manualId) return;
                    handleValidation(manualId);
                    setManualId('');
                  }}
                  disabled={!manualId}
                  className="w-full bg-ringkai-olive text-white py-4 rounded-xl font-medium disabled:opacity-50 hover:bg-opacity-90 transition-all"
                >
                  Validasi Sekarang
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Massive Feedback Overlay (Z-Index tertinggi menutupi semua tab) */}
        {lastResult && (
          <div className={`absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-50 animate-in fade-in zoom-in duration-300 ${isError ? 'bg-ringkai-danger' : 'bg-ringkai-success'}`}>
            {isError ? <XCircle className="w-24 h-24 mb-6 text-white" /> : <CheckCircle2 className="w-24 h-24 mb-6 text-white" />}
            <h3 className="text-3xl font-serif mb-2 text-white">{isError ? 'GAGAL' : 'VALID'}</h3>
            <p className="text-xl font-medium mb-4 text-white/90">{lastResult.customer_name}</p>
            <div className="bg-black/30 backdrop-blur-md px-6 py-3 rounded-full text-sm font-medium text-white shadow-soft">
              {lastResult.message}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}