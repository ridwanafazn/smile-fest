import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { QRCodeCanvas } from 'qrcode.react';
import { toast } from 'react-hot-toast';
import { api } from '../../services/api';
import { Search, Loader2, AlertCircle, CalendarClock, User, Download, Share2, CreditCard, XCircle } from 'lucide-react';
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
  snap_token?: string; 
}

export default function TrackTicketPage() {
  const [ticketData, setTicketData] = useState<TrackResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [pollingMessage, setPollingMessage] = useState('');

  // Menggunakan 'reset' agar data dari URL terisi secara absolut ke dalam form
  const { register, handleSubmit, reset, formState: { errors } } = useForm<TrackForm>({
    resolver: zodResolver(trackSchema),
  });

  // Load Midtrans Snap Script
  useEffect(() => {
    const snapScript = 'https://app.sandbox.midtrans.com/snap/snap.js'; 
    const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY || 'SB-Mid-client-XXXXX'; 
    
    const script = document.createElement('script');
    script.src = snapScript;
    script.setAttribute('data-client-key', clientKey);
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Membaca URL secara Native untuk mencegah race condition (Blank Page)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlOrderId = params.get('order_id');
    const urlEmail = params.get('email');
    
    if (urlOrderId && urlEmail) {
      reset({ order_id: urlOrderId, email: urlEmail });
      fetchTicket(urlOrderId, urlEmail, 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const fetchTicket = async (order_id: string, email: string, attempt: number) => {
    setIsLoading(true);
    setErrorMsg('');
    
    try {
      const res = await api.get('/api/tickets/track', { params: { order_id, email } });
      const payload: TrackResponse = res.data.data; 
      
      const nativeParams = new URLSearchParams(window.location.search);
      const expectedStatus = nativeParams.get('transaction_status');

      // Logika Polling untuk menunggu Webhook Midtrans sampai ke Backend
      if (expectedStatus === 'settlement' && payload.status === 'pending' && attempt <= 3) {
        setPollingMessage(`Memverifikasi pembayaran... (Percobaan ${attempt}/3)`);
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

  const handleResumePayment = () => {
    if (window.snap && ticketData?.snap_token) {
      window.snap.pay(ticketData.snap_token, {
        onSuccess: function() {
          toast.success('Pembayaran berhasil!');
          const currentEmail = new URLSearchParams(window.location.search).get('email') || '';
          fetchTicket(ticketData.order_id, currentEmail, 1);
        },
        onPending: () => toast.success('Selesaikan instruksi pembayaran Anda.'),
        onError: () => toast.error('Pembayaran gagal. Silakan coba lagi.'),
        onClose: () => toast.error('Layar pembayaran ditutup.')
      });
    }
  };

  const downloadQR = (ticketId: string, attendeeName: string) => {
    const canvas = document.getElementById(`qr-${ticketId}`) as HTMLCanvasElement;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `SMILE-FEST-${attendeeName.replace(/\s+/g, '-').toUpperCase()}.png`;
    link.href = url;
    link.click();
    toast.success('QR Code berhasil diunduh');
  };

  const shareTicket = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Tiket SMILE FEST 2026', url: url });
      } catch (err) { /* ignore cancel */ }
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
          <p className="text-stone-500">Masukkan Order ID dan Email Anda.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 rounded-2xl shadow-soft border border-stone-100 space-y-4 mb-8 max-w-md mx-auto">
          <div>
            <input {...register('order_id')} type="text" placeholder="Order ID (SMILE-xxx)" className={`w-full px-4 py-3 bg-stone-50 rounded-xl border transition-colors ${errors.order_id ? 'border-red-500' : 'border-stone-200 focus:border-ringkai-olive'}`} />
            {errors.order_id && <p className="mt-1 text-xs text-red-500 ml-1">{errors.order_id.message}</p>}
          </div>
          <div>
            <input {...register('email')} type="email" placeholder="Alamat Email" className={`w-full px-4 py-3 bg-stone-50 rounded-xl border transition-colors ${errors.email ? 'border-red-500' : 'border-stone-200 focus:border-ringkai-olive'}`} />
            {errors.email && <p className="mt-1 text-xs text-red-500 ml-1">{errors.email.message}</p>}
          </div>
          <button type="submit" disabled={isLoading} className="w-full bg-stone-800 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-stone-700 transition-all">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            <span>{isLoading && pollingMessage ? 'Memproses...' : 'Cari Tiket'}</span>
          </button>
          {pollingMessage && <p className="text-xs text-center text-amber-600 animate-pulse mt-2">{pollingMessage}</p>}
        </form>

        {errorMsg && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-start gap-3 border border-red-100 max-w-md mx-auto mb-6">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{errorMsg}</p>
          </div>
        )}

        {ticketData && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-soft border border-stone-200">
              <div>
                <p className="text-sm text-stone-500">Status Pesanan: <span className="font-mono">{ticketData.order_id}</span></p>
                <h2 className="text-xl font-serif mt-1">{ticketData.customer_name}</h2>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-4 py-2 rounded-full text-xs font-bold uppercase 
                  ${ticketData.status === 'settlement' ? 'bg-green-100 text-green-700' : 
                    ticketData.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                  {ticketData.status === 'settlement' ? 'LUNAS' : ticketData.status === 'pending' ? 'PENDING' : 'BATAL'}
                </span>
                {ticketData.status === 'settlement' && (
                  <button onClick={shareTicket} className="p-2 bg-stone-100 text-stone-600 rounded-full hover:bg-stone-200"><Share2 className="w-5 h-5" /></button>
                )}
              </div>
            </div>

            {ticketData.status === 'pending' ? (
              <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8 text-center flex flex-col items-center">
                 <CalendarClock className="w-16 h-16 mb-4 text-amber-500 opacity-80" />
                 <h3 className="text-xl font-serif mb-2 text-amber-800">Menunggu Pembayaran</h3>
                 <p className="text-amber-700/80 mb-8 max-w-md">E-Ticket dan QR Code akan muncul otomatis setelah pembayaran lunas.</p>
                 {ticketData.snap_token && (
                   <button onClick={handleResumePayment} className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-4 rounded-xl font-medium flex items-center gap-2 shadow-soft transition-colors">
                     <CreditCard className="w-5 h-5" /> Lanjutkan Pembayaran
                   </button>
                 )}
              </div>
            ) : ticketData.status === 'expire' || ticketData.status === 'cancel' ? (
               <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center flex flex-col items-center">
                 <XCircle className="w-16 h-16 mb-4 text-red-500 opacity-80" />
                 <h3 className="text-xl font-serif mb-2 text-red-800">Dibatalkan / Kedaluwarsa</h3>
                 <p className="text-red-700/80">Silakan lakukan pemesanan ulang untuk mendapatkan tiket baru.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {ticketData.tickets?.map((ticket, index) => (
                  <div key={ticket.id} className="bg-white border border-stone-200 rounded-3xl p-8 text-center shadow-soft relative overflow-hidden flex flex-col items-center">
                    <div className="absolute top-0 inset-x-0 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white bg-green-600">TIKET {index + 1} - VALID</div>
                    <div className="mt-6 mb-6 p-4 bg-white border-2 border-stone-100 rounded-2xl">
                      <QRCodeCanvas id={`qr-${ticket.id}`} value={ticket.id} size={180} level="Q" />
                    </div>
                    <div className="w-full bg-stone-50 p-4 rounded-xl text-left flex items-center gap-4 mb-4">
                      <div className="w-10 h-10 bg-ringkai-olive/10 text-ringkai-olive rounded-full flex items-center justify-center shrink-0"><User className="w-5 h-5" /></div>
                      <div className="overflow-hidden">
                        <p className="text-xs text-stone-400 font-bold uppercase tracking-widest">Pemegang Tiket</p>
                        <p className="font-serif text-lg text-ringkai-text truncate">{ticket.attendee_name}</p>
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