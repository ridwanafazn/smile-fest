import { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode'; // PERBAIKAN: Menggunakan Core Engine, bukan Scanner
import { toast } from 'react-hot-toast';
import { api } from '../../services/api';
import type { ValidateTicketResponse, ScannerStats } from '../../types';
import { Keyboard, Camera, CheckCircle2, XCircle, Info, BarChart3, CameraOff, QrCode } from 'lucide-react';

type TabMode = 'dashboard' | 'camera' | 'manual';

export default function ScannerPage() {
  const [stats, setStats] = useState<ScannerStats | null>(null);
  const [lastResult, setLastResult] = useState<ValidateTicketResponse | null>(null);
  const [isError, setIsError] = useState(false);
  const [manualId, setManualId] = useState('');
  const [activeTab, setActiveTab] = useState<TabMode>('dashboard');
  const [cameraDenied, setCameraDenied] = useState(false);
  
  // Ref untuk mencegah pemindaian ganda yang terlalu cepat
  const isProcessingRef = useRef(false);

  const fetchStats = async () => {
    try {
      const res = await api.get<{message: string, data: ScannerStats}>('/api/scanner/stats');
      setStats(res.data.data); 
    } catch (e) {
      console.error('Gagal mengambil statistik scanner');
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  // PERBAIKAN: Inisialisasi Kamera Inti (Tanpa UI Jelek Bawaan)
  useEffect(() => {
    if (activeTab !== 'camera') return;

    let html5QrCode: Html5Qrcode;

    const startCamera = async () => {
      try {
        // Pancing perizinan kamera secara manual terlebih dahulu
        await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        setCameraDenied(false);

        // Inisialisasi mesin QR murni ke div #reader
        html5QrCode = new Html5Qrcode("reader");
        
        await html5QrCode.start(
          { facingMode: "environment" }, // Memaksa menggunakan kamera belakang
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText) => {
            if (isProcessingRef.current) return;
            isProcessingRef.current = true;
            
            await handleValidation(decodedText);
            
            // Beri jeda 3 detik sebelum bisa scan lagi agar tidak spam API
            setTimeout(() => {
              isProcessingRef.current = false;
            }, 3000);
          },
          undefined // Abaikan error frame (bayangan, blur, dll)
        );
      } catch (err) {
        console.error("Camera engine failed:", err);
        setCameraDenied(true);
      }
    };

    startCamera();

    // Cleanup function untuk mematikan kamera saat pindah tab
    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => html5QrCode.clear()).catch(console.error);
      }
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
      
      setTimeout(() => setLastResult(null), 3000);
    } catch (error: any) {
      setIsError(true);
      const msg = error.response?.data?.error || 'Tiket Tidak Valid';
      setLastResult({ ticket_id: id, customer_name: 'UNKNOWN', message: msg });
      toast.error(msg);
      
      setTimeout(() => {
        setLastResult(null);
        setIsError(false);
      }, 3000);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 space-y-4 max-w-2xl mx-auto w-full">
      
      {/* Navigasi Tab (Light Mode) */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-stone-200 shadow-sm">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-stone-100 text-stone-800 shadow-sm border border-stone-200/50' : 'text-stone-500 hover:text-stone-700'}`}
        >
          <BarChart3 className="w-4 h-4" /> Info
        </button>
        <button 
          onClick={() => setActiveTab('camera')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'camera' ? 'bg-stone-100 text-stone-800 shadow-sm border border-stone-200/50' : 'text-stone-500 hover:text-stone-700'}`}
        >
          <Camera className="w-4 h-4" /> Pindai
        </button>
        <button 
          onClick={() => setActiveTab('manual')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'manual' ? 'bg-stone-100 text-stone-800 shadow-sm border border-stone-200/50' : 'text-stone-500 hover:text-stone-700'}`}
        >
          <Keyboard className="w-4 h-4" /> Manual
        </button>
      </div>

      {/* Main Area (Light Mode) */}
      <div className="flex-1 flex flex-col relative rounded-3xl overflow-hidden bg-white border border-stone-200 shadow-soft min-h-[60vh]">
        
        {/* TAB 1: DASHBOARD STATISTIK */}
        {activeTab === 'dashboard' && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white animate-in fade-in zoom-in-95 duration-300">
             <div className="w-full max-w-sm space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-serif text-stone-800 mb-2">Gate Control</h2>
                  <p className="text-stone-500 text-sm">Pantau arus masuk peserta secara real-time.</p>
                </div>

                <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 text-center shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-1">Sudah Masuk (Scanned)</p>
                  <p className="text-5xl font-serif text-ringkai-olive">{stats?.scanned_tickets ?? 0}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-stone-50/50 p-4 rounded-2xl border border-stone-100 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Total Tiket Lunas</p>
                    <p className="text-2xl font-serif text-stone-700">{stats?.total_tickets ?? 0}</p>
                  </div>
                  <div className="bg-stone-50/50 p-4 rounded-2xl border border-stone-100 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Belum Datang</p>
                    <p className="text-2xl font-serif text-amber-600">{stats?.remaining ?? 0}</p>
                  </div>
                </div>

                <button 
                  onClick={() => setActiveTab('camera')}
                  className="w-full bg-ringkai-text text-white py-4 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-stone-700 transition-colors mt-4 shadow-soft"
                >
                  <Camera className="w-5 h-5" /> Mulai Pindai Peserta
                </button>
             </div>
          </div>
        )}

        {/* TAB 2: CAMERA SCANNER PURE ENGINE */}
        {activeTab === 'camera' && (
          <div className="w-full h-full flex flex-col bg-stone-900 animate-in fade-in duration-300 relative">
             {cameraDenied ? (
               <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-stone-50 z-10">
                 <CameraOff className="w-16 h-16 text-stone-300 mb-4" />
                 <h3 className="text-xl font-serif text-stone-800 mb-2">Akses Kamera Ditolak</h3>
                 <p className="text-stone-500 text-sm mb-6 max-w-xs">
                   Sistem tidak dapat mengaktifkan pemindai. Silakan izinkan akses kamera melalui pengaturan browser Anda, lalu muat ulang halaman.
                 </p>
                 <button onClick={() => window.location.reload()} className="px-6 py-3 bg-ringkai-text hover:bg-stone-700 text-white rounded-xl font-medium transition-colors shadow-soft">
                   Muat Ulang Halaman
                 </button>
               </div>
             ) : (
               <>
                 {/* Area Kamera Murni */}
                 <div id="reader" className="w-full flex-1 bg-black flex items-center justify-center overflow-hidden [&>video]:object-cover [&>video]:w-full [&>video]:h-full"></div>
                 
                 <div className="p-5 text-center bg-white border-t border-stone-200 flex items-center justify-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
                      <QrCode className="w-4 h-4" />
                    </div>
                    <p className="text-sm font-medium text-stone-600">Posisikan QR Code di dalam kotak</p>
                 </div>
               </>
             )}
          </div>
        )}

        {/* TAB 3: MANUAL INPUT */}
        {activeTab === 'manual' && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white animate-in fade-in zoom-in-95 duration-300">
            <div className="text-center w-full max-w-sm">
              <Info className="w-12 h-12 text-stone-300 mx-auto mb-4" />
              <h2 className="text-lg font-serif text-stone-800 mb-2">Input Manual</h2>
              <p className="text-stone-500 text-sm mb-8">Gunakan opsi ini jika layar HP peserta retak atau kamera gagal membaca QR Code.</p>
              
              <div className="space-y-4">
                <input 
                  type="text"
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                  placeholder="Ketik UUID Tiket (Contoh: 123e4567...)"
                  className="w-full bg-stone-50 border border-stone-200 p-4 text-center text-stone-800 tracking-widest rounded-xl focus:border-ringkai-olive transition-colors outline-none font-mono"
                />
                <button 
                  onClick={() => {
                    if(!manualId) return;
                    handleValidation(manualId);
                    setManualId('');
                  }}
                  disabled={!manualId}
                  className="w-full bg-ringkai-olive text-white py-4 rounded-xl font-medium disabled:opacity-50 hover:bg-opacity-90 transition-all shadow-soft"
                >
                  Validasi Sekarang
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Massive Feedback Overlay */}
        {lastResult && (
          <div className={`absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-50 animate-in fade-in zoom-in duration-300 ${isError ? 'bg-ringkai-danger' : 'bg-ringkai-success'}`}>
            {isError ? <XCircle className="w-24 h-24 mb-6 text-white" /> : <CheckCircle2 className="w-24 h-24 mb-6 text-white" />}
            <h3 className="text-3xl font-serif mb-2 text-white">{isError ? 'GAGAL' : 'VALID'}</h3>
            <p className="text-xl font-medium mb-4 text-white/90">{lastResult.customer_name}</p>
            <div className="bg-black/20 backdrop-blur-md px-6 py-3 rounded-full text-sm font-medium text-white shadow-soft">
              {lastResult.message}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}