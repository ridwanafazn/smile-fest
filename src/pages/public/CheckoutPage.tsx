import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { api } from '../../services/api';
import { Loader2, Ticket as TicketIcon, Check, X, AlertCircle, Plus, Minus, Users } from 'lucide-react';
import type { CheckoutInput, CheckoutResponse } from '../../types';

declare global {
  interface Window {
    snap: any;
  }
}

const checkoutSchema = z.object({
  customer_name: z.string().min(2, 'Nama pemesan terlalu pendek'),
  customer_email: z.string().email('Format email tidak valid'),
  customer_phone: z.string().min(9, 'Nomor WA tidak valid').regex(/^[0-9]+$/, 'Hanya angka yang diperbolehkan'),
  ticket_type: z.string().min(1, 'Tiket tidak valid'),
  voucher_code: z.string().optional(),
  attendees: z.array(z.object({
    name: z.string().min(2, 'Nama pemegang tiket wajib diisi')
  })).min(1, 'Minimal 1 tiket')
});

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [isVoucherValid, setIsVoucherValid] = useState<boolean | null>(null);
  const [isCheckingVoucher, setIsCheckingVoucher] = useState(false);
  const [voucherMessage, setVoucherMessage] = useState('');
  
  // State kuantitas tiket (Maksimal 5 per transaksi untuk grup)
  const [quantity, setQuantity] = useState(1);

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

  const { data: tickets, isLoading: isTicketsLoading } = useQuery({
    queryKey: ['activeTickets'],
    queryFn: async () => {
      const res = await api.get('/api/tickets/info');
      const responseBody = res.data;
      const ticketList = Array.isArray(responseBody.data) ? responseBody.data : [];
      return ticketList;
    }
  });

  const { register, handleSubmit, watch, setValue, control, formState: { errors, isSubmitting } } = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      attendees: [{ name: '' }] // Default 1 array
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "attendees",
  });

  const watchVoucher = watch('voucher_code');
  const activeTicket = tickets && tickets.length > 0 ? tickets[0] : null;

  // Auto-fill ticket_type ketika data tiket berhasil dimuat
  useEffect(() => {
    if (activeTicket) {
      setValue('ticket_type', activeTicket.id);
    }
  }, [activeTicket, setValue]);

  // Sinkronisasi tombol +/- dengan jumlah form Attendees
  const handleQuantityChange = (newQty: number) => {
    if (newQty < 1 || newQty > 5) return;
    
    if (newQty > quantity) {
      // Tambah kolom input
      for (let i = quantity; i < newQty; i++) append({ name: '' });
    } else {
      // Hapus kolom input dari belakang
      for (let i = quantity - 1; i >= newQty; i--) remove(i);
    }
    setQuantity(newQty);
  };

  const handleCheckVoucher = async () => {
    if (!watchVoucher) return;
    setIsCheckingVoucher(true);
    try {
      await api.get(`/api/vouchers/validate`, { params: { code: watchVoucher.toUpperCase() } });
      setIsVoucherValid(true);
      setVoucherMessage('Voucher berhasil diaplikasikan!');
      toast.success('Voucher valid');
    } catch (error: any) {
      setIsVoucherValid(false);
      const msg = error.response?.data?.error || 'Voucher tidak valid atau kuota habis';
      setVoucherMessage(msg);
      toast.error(msg);
      setValue('voucher_code', ''); 
    } finally {
      setIsCheckingVoucher(false);
    }
  };

  const onSubmit = async (data: CheckoutInput) => {
    try {
      if (data.voucher_code) data.voucher_code = data.voucher_code.toUpperCase();
      // Pastikan array dikirim sesuai quantity
      data.attendees = data.attendees.slice(0, quantity);

      const response = await api.post<CheckoutResponse>('/api/checkout', data);
      const { snap_token, order_id } = response.data;

      window.snap.pay(snap_token, {
        onSuccess: function() {
          toast.success('Pembayaran berhasil!');
          navigate(`/track-ticket?order_id=${order_id}&email=${data.customer_email}&transaction_status=settlement`);
        },
        onPending: function() {
          toast.success('Menunggu pembayaran diselesaikan.');
          navigate(`/track-ticket?order_id=${order_id}&email=${data.customer_email}&transaction_status=pending`);
        },
        onError: function() {
          toast.error('Pembayaran gagal. Silakan coba lagi.');
        },
        onClose: function() {
          toast.error('Anda menutup layar pembayaran sebelum selesai.');
          navigate(`/track-ticket?order_id=${order_id}&email=${data.customer_email}`);
        }
      });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal membuat transaksi');
    }
  };

  const formatRupiah = (angka: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(angka);

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-12 px-6 animate-in fade-in">
      <div className="w-full max-w-xl">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-serif mb-2">Amankan Ruangmu.</h1>
          <p className="text-stone-500">Lengkapi data diri untuk menerbitkan e-ticket.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-8 md:p-12 rounded-3xl shadow-soft border border-stone-100 space-y-8 relative overflow-hidden">
          
          {/* Section: Pemilihan Tiket & Kuantitas */}
          <div className="space-y-4">
            <label className="block text-xs font-semibold uppercase tracking-widest text-stone-400 ml-1">Gelombang & Jumlah</label>
            {isTicketsLoading ? (
              <div className="flex items-center gap-2 text-stone-500 p-4 bg-stone-50 rounded-xl">
                <Loader2 className="w-4 h-4 animate-spin" /> Memuat ketersediaan...
              </div>
            ) : activeTicket ? (
              <div className="flex items-center justify-between p-5 rounded-2xl border-2 border-ringkai-text bg-stone-50/50 shadow-sm transition-all">
                <div>
                  <span className="inline-block px-2.5 py-1 bg-ringkai-olive/10 text-ringkai-olive text-[10px] font-bold uppercase tracking-widest rounded-full mb-2">Tersedia</span>
                  <h3 className="font-medium text-stone-800 text-lg leading-none mb-1">{activeTicket.name}</h3>
                  <p className="font-serif text-stone-500">{formatRupiah(activeTicket.price)} <span className="text-xs font-sans">/ tiket</span></p>
                </div>
                
                {/* Kontrol Kuantitas */}
                <div className="flex items-center gap-3 bg-white p-1 rounded-xl border border-stone-200 shadow-sm">
                  <button type="button" onClick={() => handleQuantityChange(quantity - 1)} disabled={quantity <= 1} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-100 disabled:opacity-30 transition-colors">
                    <Minus className="w-4 h-4 text-stone-700" />
                  </button>
                  <span className="font-medium w-4 text-center select-none">{quantity}</span>
                  <button type="button" onClick={() => handleQuantityChange(quantity + 1)} disabled={quantity >= 5} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-100 disabled:opacity-30 transition-colors">
                    <Plus className="w-4 h-4 text-stone-700" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 text-ringkai-danger p-4 rounded-xl flex items-start gap-3 border border-red-100">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm font-medium">Mohon maaf, saat ini belum ada gelombang tiket yang dibuka.</p>
              </div>
            )}
            {/* Input hidden untuk menahan nilai ticket_type */}
            <input type="hidden" {...register('ticket_type')} />
          </div>

          {/* Section: Data Pemesan (Induk) */}
          <div className="space-y-6 pt-6 border-t border-stone-100">
             <label className="block text-xs font-semibold uppercase tracking-widest text-stone-400 ml-1">Data Pemesan Utama</label>
            <div>
              <input
                {...register('customer_name')}
                type="text"
                placeholder="Nama Lengkap Pemesan"
                className={`w-full px-4 py-3 bg-stone-50 rounded-xl border transition-colors ${errors.customer_name ? 'border-ringkai-danger' : 'border-stone-200 focus:border-ringkai-olive'}`}
              />
              {errors.customer_name && <p className="mt-1 text-xs text-ringkai-danger ml-1">{errors.customer_name.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <input
                  {...register('customer_email')}
                  type="email"
                  placeholder="Alamat Email aktif"
                  className={`w-full px-4 py-3 bg-stone-50 rounded-xl border transition-colors ${errors.customer_email ? 'border-ringkai-danger' : 'border-stone-200 focus:border-ringkai-olive'}`}
                />
                {errors.customer_email && <p className="mt-1 text-xs text-ringkai-danger ml-1">{errors.customer_email.message}</p>}
              </div>
              <div>
                <input
                  {...register('customer_phone')}
                  type="text"
                  placeholder="Nomor WhatsApp"
                  className={`w-full px-4 py-3 bg-stone-50 rounded-xl border transition-colors ${errors.customer_phone ? 'border-ringkai-danger' : 'border-stone-200 focus:border-ringkai-olive'}`}
                />
                {errors.customer_phone && <p className="mt-1 text-xs text-ringkai-danger ml-1">{errors.customer_phone.message}</p>}
              </div>
            </div>
          </div>

          {/* Section: Data Pemegang Tiket (Dinamis) */}
          <div className="space-y-4 pt-6 border-t border-stone-100 bg-stone-50/50 p-6 -mx-8 md:-mx-12">
            <div className="flex items-center gap-2 mb-4">
               <Users className="w-5 h-5 text-stone-400" />
               <label className="block text-xs font-semibold uppercase tracking-widest text-stone-500">Daftar Pemegang Tiket</label>
            </div>
            
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="relative">
                  <div className="absolute inset-y-0 left-0 w-10 flex items-center justify-center text-xs font-bold text-stone-400 bg-stone-100 rounded-l-xl border border-r-0 border-stone-200">
                    {index + 1}
                  </div>
                  <input
                    {...register(`attendees.${index}.name`)}
                    type="text"
                    placeholder={`Nama di Tiket ke-${index + 1}`}
                    className={`w-full pl-13 pr-4 py-3 bg-white rounded-xl border transition-colors ${errors.attendees?.[index]?.name ? 'border-ringkai-danger' : 'border-stone-200 focus:border-ringkai-olive'}`}
                  />
                  {errors.attendees?.[index]?.name && <p className="mt-1 text-xs text-ringkai-danger ml-11">{errors.attendees[index].name.message}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Voucher */}
          <div className="pt-6 border-t border-stone-100">
             <label className="block text-xs font-semibold uppercase tracking-widest text-stone-400 mb-3 ml-1">Kode Voucher (Opsional)</label>
             <div className="flex gap-2">
                <input
                  {...register('voucher_code')}
                  type="text"
                  placeholder="KODE"
                  className="flex-1 px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:border-ringkai-olive transition-colors uppercase"
                  disabled={isVoucherValid === true}
                />
                <button
                  type="button"
                  onClick={handleCheckVoucher}
                  disabled={!watchVoucher || isCheckingVoucher || isVoucherValid === true}
                  className="px-6 bg-stone-200 text-stone-700 font-medium rounded-xl hover:bg-stone-300 transition-colors disabled:opacity-50"
                >
                  {isCheckingVoucher ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cek'}
                </button>
             </div>
             {isVoucherValid === true && (
               <p className="mt-2 text-xs text-ringkai-success flex items-center gap-1 ml-1"><Check className="w-3 h-3"/> {voucherMessage}</p>
             )}
             {isVoucherValid === false && (
               <p className="mt-2 text-xs text-ringkai-danger flex items-center gap-1 ml-1"><X className="w-3 h-3"/> {voucherMessage}</p>
             )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !activeTicket}
            className="w-full bg-ringkai-text text-white py-4 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-stone-700 transition-all disabled:opacity-70 shadow-soft"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <TicketIcon className="w-5 h-5" />}
            <span>Bayar {activeTicket ? formatRupiah(activeTicket.price * quantity) : ''}</span>
          </button>
        </form>
      </div>
    </div>
  );
}