import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { QRCodeCanvas } from 'qrcode.react';
import { toast } from 'react-hot-toast';
import { api } from '../../services/api';
import { Search, Loader2, AlertCircle, CalendarClock, User, Download, Share2, CreditCard } from 'lucide-react';
import type { Ticket } from '../../types';

declare global {
  interface Window {
    snap: any;
  }
}

const trackSchema = z.object({
  order_id: z.string().min(1, 'Order ID wajib diisi'),
  email: z.string().email('Format email tidak valid'),
});

type TrackForm = z.infer<typeof trackSchema>;

interface TrackResponse {
  order_id: string;
  customer_name: string;
  tickets?: Ticket[]; 
  status: string;
  snap_token?: string; // TAHAP 2: Menangkap Snap Token untuk fitur Resume Payment
}

export default function TrackTicketPage() {
  const [searchParams] = useSearchParams();
  const [ticketData, setTicketData] = useState<TrackResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [pollingMessage, setPollingMessage] = useState('');

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<TrackForm>({
    resolver: zodResolver(trackSchema),
  });

  // TAHAP 2: Inisialisasi Script Midtrans Snap di halaman pelacakan
  useEffect(() => {
    const snapScript = 'https://app.sandbox.midtrans.com/snap/snap.js'; 
    const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY || 'SB-Mid-client-XXXXX'; 
    const script = document.createElement('script');
    script.src = snapScript;
    script.setAttribute('data-client-key', clientKey);
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    const urlOrderId = searchParams.get('order_id');
    const urlEmail = searchParams.get('email');
    if (urlOrderId && urlEmail) {
      setValue('order_id', urlOrderId);
      setValue('email', urlEmail);
      fetchTicket(urlOrderId, urlEmail, 1);
    }
  }, [searchParams]);

  const fetchTicket = async (order_id: string, email: string, attempt: number) => {
    setIsLoading(true);
    setErrorMsg('');
    
    try {
      const res = await api.get('/api/tickets/track', { params: { order_id, email } });
      const payload: TrackResponse = res.data.data; 
      const expectedStatus = searchParams.get('transaction_status');

      if (expectedStatus === 'settlement' && payload.status === 'pending' && attempt <= 3) {
        setPollingMessage(`Memverifikasi pembayaran dengan bank... (Percobaan ${attempt}/3)`);
        setTimeout(() => fetchTicket(order_id, email, attempt + 1), 3000); 
        return;
      }

      setTicketData(payload);
      setPollingMessage('');
      setIsLoading(false);
    } catch (error: any) {
      setErrorMsg(error.response?.data?.error || 'Tiket tidak ditemukan. Periksa kembali Order ID dan Email.');
      setIsLoading(false);
      setPollingMessage('');
    }
  };

  const onSubmit = (data: TrackForm) => {
    setTicketData(null);
    fetchTicket(data.order_id, data.email, 1);
  };

  // TAHAP 2: Fungsi Memanggil Ulang Popup Pembayaran Midtrans (Resume Payment)
  const handleResumePayment = () => {
    if (window.snap && ticketData?.snap_token) {
      window.snap.pay(ticketData.snap_token, {
        onSuccess: function() {
          toast.success('Pembayaran berhasil!');
          fetchTicket(ticketData.order_id, searchParams.get('email') || '', 1);
        },
        onPending: function() {
          toast.success('Silakan selesaikan instruksi pembayaran.');
        },
        onError: function() {
          toast.error('Terjadi kesalahan pada sistem pembayaran.');
        },
        onClose: function() {
          toast.error('Layar pembayaran ditutup sebelum selesai.');
        }
      });
    } else {
      toast.error('Sistem pembayaran belum siap, muat ulang halaman.');
    }
  };

  const downloadQR = (ticketId: string, attendeeName: string) => {
    const canvas = document.getElementById(`qr-${ticketId}`) as HTMLCanvasElement;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `SMILE-FEST-${attendeeName.replace(/\s+/g, '-').toUpperCase()}-${ticketId.substring(0,8)}.png`;
    link.href = url;
    link.click();
    toast.success('QR Code berhasil diunduh');
  };

  const shareTicket = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Tiket SMILE FEST 2026', text: 'Ini e-ticket SMILE FEST 2026 milik saya!', url: url });
      } catch (err) {
        console.log('Share dibatalkan');
      }
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link tiket disalin ke clipboard!');
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center py-12 px-6">
      <div className="w-full max-w-2xl">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-serif mb-2">Lacak Tiket</h1>
          <p className="text-stone-500">Masukkan Order ID (SMILE-XXX) dan Email Anda.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 rounded-2xl shadow-soft border border-stone-100 space-y-4 mb-8 max-w-md mx-auto">
          <div>
            <input {...register('order_id')} type="text" placeholder="Order ID" className={`w-full px-4 py-3 bg-stone-50 rounded-xl border transition-colors ${errors.order_id ? 'border-ringkai-danger' : 'border-stone-200 focus:border-ringkai-olive'}`} />
            {errors.order_id && <p className="mt-1 text-xs text-ringkai-danger ml-1">{errors.order_id.message}</p>}
          </div>
          <div>
            <input {...register('email')} type="email" placeholder="Alamat Email" className={`w-full px-4 py-3 bg-stone-50 rounded-xl border transition-colors ${errors.email ? 'border-ringkai-danger' : 'border-stone-200 focus:border-ringkai-olive'}`} />
            {errors.email && <p className="mt-1 text-xs text-ringkai-danger ml-1">{errors.email.message}</p>}
          </div>
          <button type="submit" disabled={isLoading} className="w-full bg-stone-800 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-stone-700 transition-all disabled:opacity-70">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            <span>{isLoading && pollingMessage ? 'Memproses...' : 'Cari Tiket'}</span>
          </button>
          {pollingMessage && <p className="text-xs text-center text-amber-600 animate-pulse mt-2">{pollingMessage}</p>}
        </form>

        {errorMsg && (
          <div className="bg-red-50 text-ringkai-danger p-4 rounded-xl flex items-start gap-3 border border-red-100 animate-in fade-in max-w-md mx-auto">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{errorMsg}</p>
          </div>
        )}

        {ticketData && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
            <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-soft border border-stone-200">
              <div>
                <p className="text-sm text-stone-500 font-medium">Status Pesanan: <span className="font-mono text-stone-700">{ticketData.order_id}</span></p>
                <h2 className="text-xl font-serif mt-1">Atas Nama: {ticketData.customer_name}</h2>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase ${ticketData.status === 'settlement' ? 'bg-ringkai-success/10 text-ringkai-success' : 'bg-amber-100 text-amber-700'}`}>
                  {ticketData.status === 'settlement' ? 'LUNAS' : 'PENDING'}
                </span>
                {ticketData.status === 'settlement' && (
                  <button onClick={shareTicket} className="p-2 bg-stone-100 text-stone-600 rounded-full hover:bg-stone-200 transition-colors" title="Bagikan Tautan">
                    <Share2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* TAHAP 2: Penanganan Jika Status Masih Pending (Resume Payment) */}
            {ticketData.status !== 'settlement' ? (
              <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8 text-center shadow-soft flex flex-col items-center justify-center">
                 <CalendarClock className="w-16 h-16 mb-4 text-amber-500 opacity-80" />
                 <h3 className="text-xl font-serif mb-2 text-amber-800">Menunggu Pembayaran</h3>
                 <p className="text-amber-700/80 mb-8 max-w-md">E-Ticket dan QR Code akan muncul otomatis setelah Anda menyelesaikan pembayaran.</p>
                 
                 {ticketData.snap_token && (
                   <button 
                     onClick={handleResumePayment}
                     className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-4 rounded-xl font-medium transition-colors w-full sm:w-auto flex items-center justify-center gap-2 shadow-soft"
                   >
                     <CreditCard className="w-5 h-5" /> Lanjutkan Pembayaran
                   </button>
                 )}
              </div>
            ) : (
              // Tampilan Multi-Tiket Lunas
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {ticketData.tickets?.map((ticket, index) => (
                  <div key={ticket.id} className="bg-white border border-stone-200 rounded-3xl p-8 text-center shadow-soft relative overflow-hidden flex flex-col items-center">
                    <div className="absolute top-0 inset-x-0 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white bg-ringkai-success">
                      TIKET {index + 1} - VALID
                    </div>
                    <div className="mt-6 mb-6 p-4 bg-white border-2 border-stone-100 rounded-2xl shadow-sm">
                      <QRCodeCanvas id={`qr-${ticket.id}`} value={ticket.id} size={180} bgColor="#ffffff" fgColor="#292524" level="Q" />
                    </div>
                    <div className="w-full bg-stone-50 p-4 rounded-xl text-left flex items-center gap-4 mb-4">
                      <div className="w-10 h-10 bg-ringkai-olive/10 text-ringkai-olive rounded-full flex items-center justify-center shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs text-stone-400 font-semibold uppercase tracking-widest">Pemegang Tiket</p>
                        <p className="font-serif text-lg text-ringkai-text truncate" title={ticket.attendee_name}>{ticket.attendee_name}</p>
                      </div>
                    </div>
                    <button onClick={() => downloadQR(ticket.id, ticket.attendee_name)} className="w-full py-3 bg-stone-100 text-stone-700 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-stone-200 transition-colors">
                      <Download className="w-4 h-4" /> Simpan QR Code
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}