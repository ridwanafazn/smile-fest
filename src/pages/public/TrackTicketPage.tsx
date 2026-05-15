import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { QRCodeCanvas } from 'qrcode.react';
import { toast } from 'react-hot-toast';
import { api, transactionService } from '../../services/api';
import { Search, Loader2, AlertCircle, User, Download, Share2, XCircle, UploadCloud, Copy, Clock, Receipt, CheckCircle2 } from 'lucide-react';
import type { Ticket } from '../../types';

const trackSchema = z.object({
  order_id: z.string().min(1, 'Order ID wajib diisi'),
  email: z.string().email('Format email tidak valid'),
});

type TrackForm = z.infer<typeof trackSchema>;

interface TrackResponse {
  order_id: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  session_batch: number;
  tickets?: Ticket[]; 
  status: string;
}

export default function TrackTicketPage() {
  const [ticketData, setTicketData] = useState<TrackResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TrackForm>({
    resolver: zodResolver(trackSchema),
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlOrderId = params.get('order_id');
    const urlEmail = params.get('email');
    
    if (urlOrderId && urlEmail) {
      reset({ order_id: urlOrderId, email: urlEmail });
      fetchTicket(urlOrderId, urlEmail);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const fetchTicket = async (order_id: string, email: string) => {
    setIsLoading(true);
    setErrorMsg('');
    setPaymentProof(null); 
    
    try {
      const res = await api.get('/api/tickets/track', { params: { order_id, email } });
      const payload: TrackResponse = {
        order_id: res.data.data.id,
        customer_name: res.data.data.customer_name,
        customer_email: res.data.data.customer_email,
        total_amount: res.data.data.total_amount,
        session_batch: res.data.data.session_batch,
        tickets: res.data.data.tickets, // Perbaikan casing JSON
        status: res.data.data.status,
      }; 
      
      setTicketData(payload);
    } catch (error: any) {
      setErrorMsg(error.response?.data?.error || 'Tiket tidak ditemukan. Periksa kembali Order ID dan Email.');
      setTicketData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = (data: TrackForm) => {
    setTicketData(null);
    fetchTicket(data.order_id, data.email);
  };

  const handleUploadProof = async () => {
    if (!paymentProof || !ticketData) {
      toast.error('Pilih file bukti transfer terlebih dahulu');
      return;
    }

    if (paymentProof.size > 2 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 2MB');
      return;
    }

    setIsUploading(true);
    try {
      await transactionService.uploadProof(ticketData.order_id, paymentProof);
      toast.success('Bukti berhasil diunggah! Menunggu verifikasi admin.');
      fetchTicket(ticketData.order_id, ticketData.customer_email);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal mengunggah bukti pembayaran');
    } finally {
      setIsUploading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} berhasil disalin!`);
  };

  const formatRupiah = (angka: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(angka);

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
      toast.success('Tautan berhasil disalin!');
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-16 px-6 w-full">
      <div className="w-full max-w-3xl">
        
        {/* HEADER */}
        {!ticketData && (
          <div className="mb-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-4xl md:text-5xl font-serif text-stone-900 mb-4">Lacak Tiket</h1>
            <p className="text-stone-500 max-w-md mx-auto">
              Silakan masukkan Order ID dan Email yang Anda gunakan saat melakukan reservasi tiket.
            </p>
          </div>
        )}

        {/* SEARCH FORM */}
        <form onSubmit={handleSubmit(onSubmit)} className={`bg-white p-8 rounded-[2rem] shadow-sm border border-stone-100 space-y-5 mx-auto transition-all duration-500 ${ticketData ? 'max-w-3xl mb-8' : 'max-w-md'}`}>
          <div className={`flex flex-col ${ticketData ? 'md:flex-row' : ''} gap-5`}>
            <div className="flex-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2 ml-1">Order ID</label>
              <input 
                {...register('order_id')} 
                type="text" 
                placeholder="SMILE-xxx" 
                className={`w-full px-5 py-3.5 bg-stone-50 rounded-xl border transition-colors focus:ring-2 focus:ring-ringkai-olive/20 outline-none ${errors.order_id ? 'border-red-400 focus:border-red-500' : 'border-stone-200 focus:border-ringkai-olive'}`} 
              />
              {errors.order_id && <p className="mt-1.5 text-xs text-red-500 ml-1">{errors.order_id.message}</p>}
            </div>
            
            <div className="flex-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2 ml-1">Alamat Email</label>
              <input 
                {...register('email')} 
                type="email" 
                placeholder="your-mail@example.com" 
                className={`w-full px-5 py-3.5 bg-stone-50 rounded-xl border transition-colors focus:ring-2 focus:ring-ringkai-olive/20 outline-none ${errors.email ? 'border-red-400 focus:border-red-500' : 'border-stone-200 focus:border-ringkai-olive'}`} 
              />
              {errors.email && <p className="mt-1.5 text-xs text-red-500 ml-1">{errors.email.message}</p>}
            </div>

            <div className={`flex items-end ${ticketData ? 'md:pb-0' : 'pt-2'}`}>
              <button 
                type="submit" 
                disabled={isLoading} 
                className="w-full md:w-auto h-[52px] px-8 bg-stone-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-ringkai-olive transition-all shadow-md active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                <span className={ticketData ? "hidden md:inline" : ""}>Lacak</span>
              </button>
            </div>
          </div>
        </form>

        {/* ERROR MESSAGE */}
        {errorMsg && (
          <div className="bg-red-50 text-red-700 p-5 rounded-2xl flex items-start gap-4 border border-red-100 max-w-md mx-auto mb-8 animate-in fade-in zoom-in-95">
            <AlertCircle className="w-6 h-6 shrink-0 mt-0.5 text-red-500" />
            <p className="text-sm font-medium leading-relaxed">{errorMsg}</p>
          </div>
        )}

        {/* RESULT SECTION */}
        {ticketData && (
          <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700">
            
            {/* STATUS HEADER CARD */}
            <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-stone-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-1">Status Reservasi</p>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-serif text-stone-900">{ticketData.customer_name}</h2>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest
                    ${ticketData.status === 'settlement' ? 'bg-green-100 text-green-700' : 
                      ticketData.status === 'waiting_verification' ? 'bg-blue-100 text-blue-700' :
                      ticketData.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                    {ticketData.status === 'settlement' ? 'LUNAS' : 
                     ticketData.status === 'waiting_verification' ? 'DIPROSES' :
                     ticketData.status === 'pending' ? 'PENDING' : 'BATAL'}
                  </span>
                </div>
                <p className="text-sm text-stone-500 mt-2 font-mono">{ticketData.order_id}</p>
              </div>
              
              {ticketData.status === 'settlement' && (
                <button onClick={shareTicket} className="flex items-center gap-2 px-4 py-2 bg-stone-100 text-stone-700 rounded-xl font-medium hover:bg-stone-200 transition-colors">
                  <Share2 className="w-4 h-4" /> Bagikan Tautan
                </button>
              )}
            </div>

            {/* STATE 1: PENDING (INSTRUCTION & UPLOAD) */}
            {ticketData.status === 'pending' && (
              <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-lg border border-stone-100">
                <div className="text-center mb-10">
                  <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-amber-100">
                    <Receipt className="w-8 h-8 text-amber-500" />
                  </div>
                  <h3 className="text-2xl font-serif text-stone-900 mb-2">Selesaikan Pembayaran</h3>
                  <p className="text-stone-500 text-sm max-w-sm mx-auto leading-relaxed">
                    Tiket <strong className="text-stone-700">Sesi {ticketData.session_batch}</strong> Anda telah diamankan. Segera transfer sesuai nominal sebelum waktu reservasi habis.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                  {/* Account Box */}
                  <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6 relative group hover:border-stone-300 transition-colors">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-4">Transfer ke BCA</p>
                    <p className="text-2xl font-bold text-stone-900 tracking-wider mb-1">278 233 3217</p>
                    <p className="text-sm text-stone-500">a.n Alima Fikri Shidiq</p>
                    <button 
                      onClick={() => copyToClipboard('2782333217', 'Nomor Rekening')} 
                      className="absolute top-6 right-6 p-2 bg-white rounded-lg border border-stone-200 text-stone-400 hover:text-stone-900 shadow-sm transition-colors"
                      title="Salin Rekening"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Amount Box */}
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 relative group hover:border-amber-300 transition-colors">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600/70 mb-4">Total + Kode Unik</p>
                    <p className="text-3xl font-serif font-bold text-amber-700 mb-1">
                      {formatRupiah(ticketData.total_amount)}
                    </p>
                    <p className="text-sm text-amber-600/80">Wajib transfer presisi hingga 3 digit terakhir.</p>
                    <button 
                      onClick={() => copyToClipboard(ticketData.total_amount.toString(), 'Nominal Transfer')} 
                      className="absolute top-6 right-6 p-2 bg-white rounded-lg border border-amber-200 text-amber-500 hover:text-amber-700 shadow-sm transition-colors"
                      title="Salin Nominal"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Upload Section */}
                <div className="border-t border-stone-100 pt-8">
                  <h4 className="text-sm font-bold text-stone-900 mb-4 text-center">Konfirmasi Pembayaran</h4>
                  
                  <div className="max-w-md mx-auto space-y-4">
                    <div className="relative">
                      <input 
                        type="file" 
                        id="payment_proof_track" 
                        accept="image/png, image/jpeg, image/jpg"
                        className="hidden"
                        onChange={(e) => setPaymentProof(e.target.files?.[0] || null)}
                      />
                      <label 
                        htmlFor="payment_proof_track"
                        className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300
                          ${paymentProof 
                            ? 'border-ringkai-olive bg-ringkai-olive/5 shadow-inner' 
                            : 'border-stone-300 bg-stone-50 hover:bg-stone-100 hover:border-stone-400'
                          }`}
                      >
                        {paymentProof ? (
                          <>
                            <CheckCircle2 className="w-8 h-8 text-ringkai-olive mb-3" />
                            <span className="text-sm font-bold text-ringkai-olive text-center px-4 truncate w-full">{paymentProof.name}</span>
                            <span className="text-xs text-stone-500 mt-1">Klik untuk mengubah file</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-8 h-8 text-stone-400 mb-3" />
                            <span className="text-sm font-bold text-stone-700 mb-1">Unggah Bukti Transfer</span>
                            <span className="text-xs text-stone-500">Maksimal 2MB (JPG/PNG)</span>
                          </>
                        )}
                      </label>
                    </div>

                    <button
                      onClick={handleUploadProof}
                      disabled={isUploading || !paymentProof}
                      className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 shadow-md
                        ${paymentProof && !isUploading
                          ? 'bg-stone-900 text-white hover:bg-ringkai-olive active:scale-95'
                          : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                        }`}
                    >
                      {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
                      Kirim Bukti Pembayaran
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STATE 2: WAITING VERIFICATION */}
            {ticketData.status === 'waiting_verification' && (
              <div className="bg-white border border-stone-200 rounded-[2.5rem] p-10 md:p-16 text-center flex flex-col items-center max-w-2xl mx-auto shadow-sm">
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-blue-100 rounded-full blur-xl opacity-50 animate-pulse"></div>
                  <div className="w-20 h-20 bg-blue-50 border-2 border-blue-100 rounded-full flex items-center justify-center relative z-10">
                    <Clock className="w-10 h-10 text-blue-500" />
                  </div>
                </div>
                <h3 className="text-2xl font-serif text-stone-900 mb-3">Dokumen Diterima</h3>
                <p className="text-stone-500 leading-relaxed mb-6">
                  Terima kasih! Bukti transfer Anda sedang kami tinjau.
                </p>
                <div className="inline-flex items-center gap-2 bg-stone-50 border border-stone-200 px-5 py-2.5 rounded-full">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-stone-700">E-Ticket akan dikirim ke Email.</span>
                </div>
              </div>
            )}

            {/* STATE 3: EXPIRE / CANCEL */}
            {(ticketData.status === 'expire' || ticketData.status === 'cancel') && (
              <div className="bg-white border border-red-100 rounded-[2.5rem] p-10 text-center flex flex-col items-center max-w-2xl mx-auto shadow-sm">
                 <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
                   <XCircle className="w-10 h-10 text-red-500" />
                 </div>
                 <h3 className="text-2xl font-serif text-stone-900 mb-3">Reservasi Dibatalkan</h3>
                 <p className="text-stone-500">Waktu reservasi Anda telah habis atau pembayaran ditolak oleh Admin. Silakan lakukan pemesanan ulang.</p>
              </div>
            )}

            {/* STATE 4: SETTLEMENT (LUNAS - TAMPILKAN QR TIKET) */}
            {ticketData.status === 'settlement' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {ticketData.tickets?.map((ticket, index) => (
                  <div key={ticket.id} className="bg-white border border-stone-200 rounded-[2.5rem] p-8 text-center shadow-lg relative overflow-hidden flex flex-col items-center group">
                    <div className="absolute top-0 inset-x-0 h-2 bg-ringkai-olive"></div>
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-ringkai-olive bg-ringkai-olive/10 rounded-full border border-ringkai-olive/20">
                      TIKET VALID • Sesi {ticketData.session_batch}
                    </div>
                    
                    <div className="mt-16 mb-8 p-5 bg-white border border-stone-200 rounded-3xl shadow-[0_0_40px_-10px_rgba(0,0,0,0.1)] transition-transform duration-500 group-hover:scale-105">
                      <QRCodeCanvas id={`qr-${ticket.id}`} value={ticket.id} size={200} level="Q" />
                    </div>
                    
                    <div className="w-full bg-stone-50 border border-stone-100 p-5 rounded-2xl text-left flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-white border border-stone-200 text-stone-400 rounded-full flex items-center justify-center shrink-0 shadow-sm"><User className="w-6 h-6" /></div>
                      <div className="overflow-hidden">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Pemegang Tiket {index + 1}</p>
                        <p className="font-serif text-xl font-bold text-stone-900 truncate">{ticket.attendee_name}</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => downloadQR(ticket.id, ticket.attendee_name)} 
                      className="w-full py-4 bg-stone-900 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-ringkai-olive transition-all shadow-md group-hover:translate-y-0"
                    >
                      <Download className="w-4 h-4" /> Simpan E-Ticket
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