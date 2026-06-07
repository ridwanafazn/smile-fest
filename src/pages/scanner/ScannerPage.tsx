import { useEffect, useState, useRef, useMemo } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import type { ValidateTicketResponse, ScannerStats } from '../../types';
import { 
  Keyboard, Camera, CheckCircle2, XCircle, BarChart3, 
  CameraOff, QrCode, ArrowLeft, History, Search, AlertTriangle, ChevronLeft, ChevronRight, Info
} from 'lucide-react';

type TabMode = 'dashboard' | 'camera' | 'manual' | 'history';

interface ScanHistoryItem {
  id: string;
  name: string;
  time: string;
  source: 'global' | 'local';
}

interface ModalResult {
  status: 'success' | 'error' | 'duplicate';
  title: string;
  name: string;
  message: string;
}

export default function ScannerPage() {
  const navigate = useNavigate();
  const role = useAuthStore(state => state.role);
  
  const [stats, setStats] = useState<ScannerStats | null>(null);
  const [manualId, setManualId] = useState('');
  const [activeTab, setActiveTab] = useState<TabMode>('dashboard');
  const [cameraDenied, setCameraDenied] = useState(false);
  
  const [modalResult, setModalResult] = useState<ModalResult | null>(null);
  const [localScanHistory, setLocalScanHistory] = useState<ScanHistoryItem[]>([]);
  
  const [historySearch, setHistorySearch] = useState('');
  const [historyPage, setHistoryPage] = useState(1);
  const itemsPerPage = 5;

  const isProcessingRef = useRef(false);

  const fetchStats = async () => {
    try {
      const res = await api.get('/api/scanner/stats');
      setStats(res.data as ScannerStats); 
    } catch (e) {
      console.error('Gagal mengambil statistik scanner');
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const { data: globalHistory } = useQuery({
    queryKey: ['scannerHistory'],
    queryFn: async () => {
      try {
        const res = await api.get('/api/scanner/history');
        return res.data as ScanHistoryItem[];
      } catch (e) {
        return [];
      }
    },
    refetchInterval: 15000,
    enabled: activeTab === 'history'
  });

  useEffect(() => {
    if (activeTab !== 'camera') return;

    let html5QrCode: Html5Qrcode;

    const startCamera = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        setCameraDenied(false);

        html5QrCode = new Html5Qrcode("reader");
        
        await html5QrCode.start(
          { facingMode: "environment" }, 
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText) => {
            if (isProcessingRef.current) return;
            isProcessingRef.current = true;
            
            await handleValidation(decodedText);
          },
          undefined 
        );
      } catch (err) {
        console.error("Camera engine failed:", err);
        setCameraDenied(true);
      }
    };

    startCamera();

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => html5QrCode.clear()).catch(console.error);
      }
    };
  }, [activeTab]);

  const handleValidation = async (id: string) => {
    try {
      const res = await api.post('/api/scanner/validate-ticket', {
        ticket_id: id 
      });
      
      const responseData = res.data as ValidateTicketResponse;
      
      setModalResult({
        status: 'success',
        title: 'TIKET VALID',
        name: responseData.customer_name,
        message: 'Akses masuk diizinkan silakan berikan tanda pengenal.'
      });
      
      const newHistoryItem: ScanHistoryItem = {
        id: id,
        name: responseData.customer_name,
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        source: 'local'
      };
      
      setLocalScanHistory(prev => [newHistoryItem, ...prev]);
      fetchStats(); 
      
    } catch (error: any) {
      const msg = error.response?.data?.meta?.message || error.response?.data?.error || 'Tiket Tidak Ditemukan';
      const isDuplicate = msg.toLowerCase().includes('sudah') || msg.toLowerCase().includes('scanned');
      
      const errorData = error.response?.data?.data;
      const errorName = errorData?.customer_name || 'Identitas Tidak Ditemukan';
      
      setModalResult({
        status: isDuplicate ? 'duplicate' : 'error',
        title: isDuplicate ? 'TIKET KADALUARSA' : 'AKSES DITOLAK',
        name: isDuplicate ? errorName : 'Tidak Dikenali',
        message: msg
      });
    }
  };

  const closeModal = () => {
    setModalResult(null);
    setTimeout(() => {
      isProcessingRef.current = false;
    }, 1500);
  };

  const combinedHistory = useMemo(() => {
    const combined = [...localScanHistory, ...(globalHistory || [])];
    const uniqueHistory = Array.from(new Map(combined.map(item => [item.id, item])).values());
    return uniqueHistory;
  }, [localScanHistory, globalHistory]);

  const filteredHistory = useMemo(() => {
    return combinedHistory.filter(item => 
      item.name.toLowerCase().includes(historySearch.toLowerCase()) || 
      item.id.toLowerCase().includes(historySearch.toLowerCase())
    );
  }, [combinedHistory, historySearch]);

  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / itemsPerPage));
  const currentHistory = filteredHistory.slice((historyPage - 1) * itemsPerPage, historyPage * itemsPerPage);

  return (
    <div className="flex flex-col min-h-screen bg-stone-50">
      
      <div className="bg-stone-900 text-white px-4 sm:px-6 py-4 flex items-center justify-between shadow-md shrink-0 sticky top-0 z-40">
        {role === 'admin' ? (
          <button 
            onClick={() => navigate('/admin/dashboard')} 
            className="flex items-center gap-2 text-stone-300 hover:text-white transition-colors text-sm font-medium w-24"
          >
            <ArrowLeft className="w-5 h-5" /> Dasbor
          </button>
        ) : (
          <div className="w-24"></div>
        )}
        
        <h1 className="font-serif text-lg font-bold tracking-widest text-center flex-1">GATE SCANNER</h1>
        
        <div className="w-24 text-right">
          <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium text-stone-300 uppercase tracking-wider">
            {role}
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-4 sm:p-6 space-y-4 max-w-2xl mx-auto w-full">
        
        <div className="flex bg-white p-1.5 rounded-2xl border border-stone-200 shadow-sm overflow-x-auto clean-scrollbar shrink-0">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 min-w-[80px] flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-stone-100 text-stone-800 shadow-sm border border-stone-200/50' : 'text-stone-500 hover:text-stone-700'}`}
          >
            <BarChart3 className="w-4 h-4" /> Info
          </button>
          <button 
            onClick={() => setActiveTab('camera')}
            className={`flex-1 min-w-[80px] flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'camera' ? 'bg-stone-100 text-stone-800 shadow-sm border border-stone-200/50' : 'text-stone-500 hover:text-stone-700'}`}
          >
            <Camera className="w-4 h-4" /> Pindai
          </button>
          <button 
            onClick={() => setActiveTab('manual')}
            className={`flex-1 min-w-[80px] flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'manual' ? 'bg-stone-100 text-stone-800 shadow-sm border border-stone-200/50' : 'text-stone-500 hover:text-stone-700'}`}
          >
            <Keyboard className="w-4 h-4" /> Manual
          </button>
          <button 
            onClick={() => { setActiveTab('history'); setHistoryPage(1); }}
            className={`flex-1 min-w-[80px] flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'history' ? 'bg-stone-100 text-stone-800 shadow-sm border border-stone-200/50' : 'text-stone-500 hover:text-stone-700'}`}
          >
            <History className="w-4 h-4" /> Riwayat
          </button>
        </div>

        <div className="flex-1 flex flex-col relative rounded-3xl overflow-hidden bg-white border border-stone-200 shadow-soft min-h-[60vh]">
          
          {activeTab === 'dashboard' && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white animate-in fade-in zoom-in-95 duration-300">
               <div className="w-full max-w-sm space-y-6">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-serif text-stone-800 mb-2">Pantauan Gerbang</h2>
                    <p className="text-stone-500 text-sm">Lihat arus masuk peserta secara langsung.</p>
                  </div>

                  <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 text-center shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-1">Sudah Masuk Scanned</p>
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

          {activeTab === 'camera' && (
            <div className="w-full h-full flex flex-col bg-stone-900 animate-in fade-in duration-300 relative min-h-[60vh]">
               {cameraDenied ? (
                 <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-stone-50 z-10">
                   <CameraOff className="w-16 h-16 text-stone-300 mb-4" />
                   <h3 className="text-xl font-serif text-stone-800 mb-2">Akses Kamera Ditolak</h3>
                   <p className="text-stone-500 text-sm mb-6 max-w-xs">
                     Sistem tidak dapat mengaktifkan lensa pemindai. Izinkan akses kamera melalui pengaturan peramban web Anda lalu muat ulang halaman ini.
                   </p>
                   <button onClick={() => window.location.reload()} className="px-6 py-3 bg-ringkai-text hover:bg-stone-700 text-white rounded-xl font-medium transition-colors shadow-soft">
                     Muat Ulang Halaman
                   </button>
                 </div>
               ) : (
                 <>
                   <div id="reader" className="w-full flex-1 bg-black flex items-center justify-center overflow-hidden [&>video]:object-cover [&>video]:w-full [&>video]:h-full"></div>
                   
                   <div className="p-5 text-center bg-white border-t border-stone-200 flex items-center justify-center gap-3 shrink-0">
                      <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
                        <QrCode className="w-4 h-4" />
                      </div>
                      <p className="text-sm font-medium text-stone-600">Posisikan kode presisi di dalam kotak batas</p>
                   </div>
                 </>
               )}
            </div>
          )}

          {activeTab === 'manual' && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white animate-in fade-in zoom-in-95 duration-300">
              <div className="text-center w-full max-w-sm">
                <Info className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                <h2 className="text-lg font-serif text-stone-800 mb-2">Input Manual</h2>
                <p className="text-stone-500 text-sm mb-8">Gunakan menu ini jika kode visual gagal terbaca oleh lensa perangkat Anda akibat layar peserta yang retak atau buram.</p>
                
                <div className="space-y-4">
                  <input 
                    type="text"
                    value={manualId}
                    onChange={(e) => setManualId(e.target.value)}
                    placeholder="Ketik identitas tiket"
                    className="w-full bg-stone-50 border border-stone-200 p-4 text-center text-stone-800 tracking-widest rounded-xl focus:border-ringkai-olive transition-colors outline-none font-mono"
                  />
                  <button 
                    onClick={() => {
                      if(!manualId) return;
                      isProcessingRef.current = true;
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

          {activeTab === 'history' && (
            <div className="flex-1 flex flex-col bg-stone-50 animate-in fade-in duration-300">
              <div className="p-4 bg-white border-b border-stone-200">
                <div className="relative w-full">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari nama peserta..."
                    value={historySearch}
                    onChange={(e) => { setHistorySearch(e.target.value); setHistoryPage(1); }}
                    className="w-full pl-9 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-ringkai-olive text-sm transition-colors"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {currentHistory.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-stone-400">
                    <History className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-sm">Riwayat pemindaian kosong pada sesi ini.</p>
                  </div>
                ) : (
                  currentHistory.map((item, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex items-center justify-between">
                      <div>
                        <p className="font-bold text-stone-800">{item.name}</p>
                        <p className="text-xs text-stone-400 font-mono mt-0.5">{item.id.substring(0, 8)}...</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-2 py-1 bg-ringkai-olive/10 text-ringkai-olive text-[10px] font-bold rounded-md">
                          {item.time}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {totalPages > 1 && (
                <div className="p-4 bg-white border-t border-stone-200 flex items-center justify-between">
                  <span className="text-xs font-medium text-stone-500">Total {filteredHistory.length} data</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setHistoryPage(p => Math.max(p - 1, 1))} disabled={historyPage === 1} className="p-1.5 rounded-lg border border-stone-200 text-stone-600 disabled:opacity-30 bg-white"><ChevronLeft className="w-4 h-4"/></button>
                    <span className="text-xs font-bold text-stone-700 w-8 text-center">{historyPage} / {totalPages}</span>
                    <button onClick={() => setHistoryPage(p => Math.min(p + 1, totalPages))} disabled={historyPage === totalPages} className="p-1.5 rounded-lg border border-stone-200 text-stone-600 disabled:opacity-30 bg-white"><ChevronRight className="w-4 h-4"/></button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {modalResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
              
              <div className={`w-full py-8 flex flex-col items-center justify-center text-white ${
                modalResult.status === 'success' ? 'bg-ringkai-success' : 
                modalResult.status === 'duplicate' ? 'bg-amber-500' : 'bg-ringkai-danger'
              }`}>
                {modalResult.status === 'success' && <CheckCircle2 className="w-20 h-20 mb-4" />}
                {modalResult.status === 'duplicate' && <AlertTriangle className="w-20 h-20 mb-4" />}
                {modalResult.status === 'error' && <XCircle className="w-20 h-20 mb-4" />}
                
                <h3 className="text-2xl font-serif tracking-widest">{modalResult.title}</h3>
              </div>

              <div className="p-8 w-full flex flex-col items-center">
                <p className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-2">Identitas Peserta</p>
                <p className="text-xl font-bold text-stone-800 mb-6">{modalResult.name}</p>
                
                <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl w-full mb-8">
                  <p className="text-sm text-stone-600 leading-relaxed font-medium">
                    {modalResult.message}
                  </p>
                </div>

                <button 
                  onClick={closeModal}
                  className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold hover:bg-ringkai-text transition-colors shadow-soft"
                >
                  Pindai Peserta Berikutnya
                </button>
              </div>
              
            </div>
          </div>
        )}

      </div>
    </div>
  );
}