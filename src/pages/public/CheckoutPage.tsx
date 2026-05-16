import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { api, transactionService } from '../../services/api';
import { Loader2, Ticket as TicketIcon, Check, X, AlertCircle, Plus, Minus, Users, ClipboardList, Copy, UploadCloud, Clock, UserCheck } from 'lucide-react';
import type { CheckoutInput, CheckoutResponse } from '../../types';

// Skema Zod
const checkoutSchema = z.object({
  customer_name: z.string().min(2, 'Nama pemesan terlalu pendek'),
  customer_email: z.string().email('Format email tidak valid'),
  customer_phone: z.string().min(9, 'Nomor WA tidak valid').regex(/^[0-9]+$/, 'Hanya angka'),
  
  profile_age: z.string().min(1, 'Usia wajib diisi'),
  profile_city: z.string().min(2, 'Domisili wajib diisi'),
  profile_education: z.string().min(1, 'Pilih pendidikan'),
  profile_job: z.string().min(1, 'Pilih pekerjaan'),
  
  interest_reasons: z.array(z.string()).min(1, 'Pilih minimal 1 ketertarikan'),
  sustainability_steps: z.array(z.string()).min(1, 'Pilih minimal 1 langkah'),
  
  contribution_role: z.string().min(1, 'Silakan pilih salah satu komitmen kontribusi Anda'),

  ticket_type: z.string().min(1, 'Tiket tidak valid'),
  voucher_code: z.string().optional(),
  attendees: z.array(z.object({
    name: z.string().min(2, 'Nama pemegang tiket wajib diisi')
  })).min(1, 'Minimal 1 tiket')
});

type FormValues = z.infer<typeof checkoutSchema>;

const JOB_OPTIONS = ['Pelajar', 'Mahasiswa', 'Fresh graduate', 'Karyawan', 'Freelancer', 'Entrepreneur', 'Ibu rumah tangga', 'Lainnya'];

const INTEREST_OPTIONS = [
  'Sustainable living', 'Muslim lifestyle', 'Eco community movement', 
  'Self growth & mental health', 'Green entrepreneurship', 'Social impact movement'
];

const STEP_OPTIONS = [
  'Membawa tumbler & kurangi plastik', 'Memilih produk halal & ethical', 
  'Memilah & mengolah sampah', 'Ikut kegiatan sosial/lingkungan', 
  'Sedang belajar memulai konsisten'
];

const CONTRIBUTION_OPTIONS = [
  'Ya, tertarik menjadi donatur program',
  'Ya, tertarik menjadi relawan aksi',
  'Ingin mengikuti info perkembangannya dulu',
  'Hanya ingin menjadi peserta acara saja'
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  
  const [step, setStep] = useState<'form' | 'instruction'>('form');
  const [checkoutData, setCheckoutData] = useState<CheckoutResponse | null>(null);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [isVoucherValid, setIsVoucherValid] = useState<boolean | null>(null);
  const [isCheckingVoucher, setIsCheckingVoucher] = useState(false);
  const [voucherMessage, setVoucherMessage] = useState('');
  const [voucherDiscount, setVoucherDiscount] = useState(0); 
  const [quantity, setQuantity] = useState(1);

  const { data: tickets, isLoading: isTicketsLoading } = useQuery({
    queryKey: ['activeTickets'],
    queryFn: async () => {
      const res = await api.get('/api/tickets/info');
      const responseBody = res.data;
      return Array.isArray(responseBody.data) ? responseBody.data : [];
    }
  });

  const { register, handleSubmit, watch, setValue, control, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      attendees: [{ name: '' }],
      interest_reasons: [],
      sustainability_steps: [],
      contribution_role: ''
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: "attendees" });

  const watchVoucher = watch('voucher_code');
  const watchEmail = watch('customer_email');
  const activeTicket = tickets && tickets.length > 0 ? tickets[0] : null;

  if (activeTicket && !watch('ticket_type')) {
    setValue('ticket_type', activeTicket.id);
  }

  const handleQuantityChange = (newQty: number) => {
    if (newQty < 1 || newQty > 5) return;
    if (newQty > quantity) {
      for (let i = quantity; i < newQty; i++) append({ name: '' });
    } else {
      for (let i = quantity - 1; i >= newQty; i--) remove(i);
    }
    setQuantity(newQty);
  };

  const handleCheckVoucher = async () => {
    if (!watchVoucher) return;
    setIsCheckingVoucher(true);
    try {
      const res = await api.get(`/api/vouchers/validate`, { params: { code: watchVoucher.toUpperCase() } });
      const discount = res.data.data?.discount_amount || 20000;
      setVoucherDiscount(discount);
      setIsVoucherValid(true);
      setVoucherMessage('Voucher berhasil diaplikasikan!');
      toast.success('Voucher valid');
    } catch (error: any) {
      setIsVoucherValid(false);
      setVoucherDiscount(0);
      const msg = error.response?.data?.error || 'Voucher tidak valid atau kuota habis';
      setVoucherMessage(msg);
      toast.error(msg);
      setValue('voucher_code', ''); 
    } finally {
      setIsCheckingVoucher(false);
    }
  };

  const onSubmitForm = async (data: FormValues) => {
    try {
      // Injeksi variabel dummy ke Backend untuk form yang sudah dihapus dari UI
      const payload: CheckoutInput = {
        ...data,
        customer_gender: "-", 
        community_affiliation: "-",
        information_source: "-",
        voucher_code: data.voucher_code ? data.voucher_code.toUpperCase() : undefined,
        attendees: data.attendees.slice(0, quantity)
      };

      const response = await api.post<CheckoutResponse>('/api/checkout', payload);
      setCheckoutData(response.data);
      setStep('instruction');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.success('Tiket berhasil direservasi!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal membuat transaksi. Kuota mungkin habis.');
    }
  };

  const handleUploadProof = async () => {
    if (!paymentProof || !checkoutData) return;
    if (paymentProof.size > 6 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 6MB');
      return;
    }
    setIsUploading(true);
    try {
      await transactionService.uploadProof(checkoutData.order_id, paymentProof);
      toast.success('Bukti berhasil diunggah!');
      navigate(`/track-ticket?order_id=${checkoutData.order_id}&email=${watchEmail}`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal mengunggah bukti');
    } finally {
      setIsUploading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} berhasil disalin!`);
  };

  const formatRupiah = (angka: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(angka);

  const originalTotalPrice = activeTicket ? activeTicket.price * quantity : 0;
  const totalDiscount = voucherDiscount * quantity; 
  const finalPrice = Math.max(originalTotalPrice - totalDiscount, 0);

  // --- RENDER VIEW INSTRUKSI PEMBAYARAN ---
  if (step === 'instruction' && checkoutData) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-12 px-6 animate-in fade-in">
        <div className="w-full max-w-lg bg-white p-8 md:p-10 rounded-3xl shadow-soft border border-stone-100 space-y-8 text-center">
          <div className="space-y-2">
            <div className="w-16 h-16 bg-ringkai-olive/10 text-ringkai-olive rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-serif text-ringkai-text">Selesaikan Pembayaran</h2>
            <p className="text-stone-500 text-sm">Sistem telah mengamankan tiket Anda pada Batch {checkoutData.session_batch}. Segera lakukan transfer sebelum waktu reservasi habis.</p>
          </div>

          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6 text-left space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-2">Transfer ke Rekening BCA</p>
              <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-stone-200">
                <div>
                  <p className="text-lg font-bold text-stone-800 tracking-wider">278 233 3217</p>
                  <p className="text-xs text-stone-500">a.n Alima Fikri Shidiq</p>
                </div>
                <button onClick={() => copyToClipboard('2782333217', 'Rekening')} className="p-2 text-stone-400 hover:text-ringkai-olive transition-colors">
                  <Copy className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-2">Total Transfer (+Kode Unik)</p>
              <div className="flex items-center justify-between bg-ringkai-olive/5 p-4 rounded-xl border border-ringkai-olive/20">
                <p className="text-2xl font-serif font-bold text-ringkai-olive">
                  {formatRupiah(checkoutData.total_amount)}
                </p>
                <button onClick={() => copyToClipboard(checkoutData.total_amount.toString(), 'Nominal')} className="p-2 text-ringkai-olive hover:text-stone-700 transition-colors">
                  <Copy className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-stone-100">
            <div className="relative">
              <input 
                type="file" 
                id="payment_proof" 
                accept="image/png, image/jpeg, image/jpg"
                className="hidden"
                onChange={(e) => setPaymentProof(e.target.files?.[0] || null)}
              />
              <label 
                htmlFor="payment_proof"
                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer transition-colors ${paymentProof ? 'border-ringkai-olive bg-ringkai-olive/5' : 'border-stone-300 bg-stone-50 hover:bg-stone-100'}`}
              >
                <UploadCloud className={`w-8 h-8 mb-2 ${paymentProof ? 'text-ringkai-olive' : 'text-stone-400'}`} />
                <span className="text-sm font-medium text-stone-600">
                  {paymentProof ? paymentProof.name : 'Klik unggah Bukti Transfer'}
                </span>
                <span className="text-xs text-stone-400 mt-1">Format: JPG, PNG (Max 6MB)</span>
              </label>
            </div>

            <button
              onClick={handleUploadProof}
              disabled={isUploading || !paymentProof}
              className="w-full bg-ringkai-text text-white py-4 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-stone-700 transition-all disabled:opacity-50"
            >
              {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
              Kirim Bukti Pembayaran
            </button>
            
            <button 
              onClick={() => navigate(`/track-ticket?order_id=${checkoutData.order_id}&email=${watchEmail}`)}
              className="w-full py-3 text-stone-500 text-sm font-medium hover:text-stone-800 transition-colors"
            >
              Saya akan unggah nanti (Ke Pelacakan)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER VIEW FORM CHECKOUT UTAMA ---
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-12 px-6 animate-in fade-in">
      <div className="w-full max-w-2xl">
        <div className="mb-10 text-center">
          <h1 className="text-3xl md:text-4xl font-serif mb-3 text-stone-900">Amankan Ruangmu.</h1>
          <p className="text-stone-500">Lengkapi data diri untuk menerbitkan e-ticket.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmitForm)} className="bg-white p-6 md:p-12 rounded-[2rem] shadow-sm border border-stone-100 space-y-10 relative overflow-hidden">
          
          {/* Section: Pemilihan Tiket & Kuantitas */}
          <div className="space-y-4">
            <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 ml-1">Ketersediaan Tiket</label>
            {isTicketsLoading ? (
              <div className="flex items-center gap-2 text-stone-500 p-4 bg-stone-50 rounded-xl">
                <Loader2 className="w-4 h-4 animate-spin" /> Memuat ketersediaan...
              </div>
            ) : activeTicket ? (
              <div className="flex items-center justify-between p-5 rounded-2xl border-2 border-stone-900 bg-stone-50/50 shadow-sm transition-all">
                <div>
                  <span className="inline-block px-2.5 py-1 bg-ringkai-olive/10 text-ringkai-olive text-[10px] font-bold uppercase tracking-widest rounded-full mb-2">Tersedia</span>
                  <h3 className="font-medium text-stone-800 text-lg leading-none mb-1">{activeTicket.name}</h3>
                  <p className="font-serif text-stone-500">{formatRupiah(activeTicket.price)} <span className="text-xs font-sans">/ tiket</span></p>
                </div>
                
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
              <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-start gap-3 border border-red-100">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm font-medium">Mohon maaf, saat ini belum ada tiket yang dibuka.</p>
              </div>
            )}
            <input type="hidden" {...register('ticket_type')} />
          </div>

          {/* Section: Identitas Personal Terpadu (Vertikal Tersusun Ke Bawah) */}
          <div className="space-y-5 pt-8 border-t border-stone-100">
             <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center"><UserCheck className="w-4 h-4"/></div>
                <h3 className="font-serif text-xl text-stone-900">Data Personal</h3>
             </div>
            
             <div>
               <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-2 ml-1">Nama Lengkap</label>
               <input {...register('customer_name')} type="text" placeholder="Nama Lengkap" className={`w-full px-5 py-3.5 bg-stone-50 rounded-xl border transition-colors ${errors.customer_name ? 'border-red-400' : 'border-stone-200 focus:border-ringkai-olive'}`} />
               {errors.customer_name && <p className="mt-1 text-xs text-red-500 ml-1">{errors.customer_name.message}</p>}
             </div>
             
             <div>
               <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-2 ml-1">Email Aktif</label>
               <input {...register('customer_email')} type="email" placeholder="Alamat Email" className={`w-full px-5 py-3.5 bg-stone-50 rounded-xl border transition-colors ${errors.customer_email ? 'border-red-400' : 'border-stone-200 focus:border-ringkai-olive'}`} />
               {errors.customer_email && <p className="mt-1 text-xs text-red-500 ml-1">{errors.customer_email.message}</p>}
             </div>
             
             <div>
               <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-2 ml-1">No. WhatsApp</label>
               <input {...register('customer_phone')} type="text" placeholder="Nomor" className={`w-full px-5 py-3.5 bg-stone-50 rounded-xl border transition-colors ${errors.customer_phone ? 'border-red-400' : 'border-stone-200 focus:border-ringkai-olive'}`} />
               {errors.customer_phone && <p className="mt-1 text-xs text-red-500 ml-1">{errors.customer_phone.message}</p>}
             </div>
             
             <div>
               <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-2 ml-1">Usia</label>
               <input {...register('profile_age')} type="number" placeholder="20" className={`w-full px-5 py-3.5 bg-stone-50 rounded-xl border transition-colors ${errors.profile_age ? 'border-red-400' : 'border-stone-200 focus:border-ringkai-olive'}`} />
               {errors.profile_age && <p className="mt-1 text-xs text-red-500 ml-1">{errors.profile_age.message}</p>}
             </div>
             
             <div>
               <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-2 ml-1">Domisili Kota</label>
               <input {...register('profile_city')} type="text" placeholder="Domisili" className={`w-full px-5 py-3.5 bg-stone-50 rounded-xl border transition-colors ${errors.profile_city ? 'border-red-400' : 'border-stone-200 focus:border-ringkai-olive'}`} />
               {errors.profile_city && <p className="mt-1 text-xs text-red-500 ml-1">{errors.profile_city.message}</p>}
             </div>
             
             <div>
               <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-2 ml-1">Pendidikan</label>
               <select {...register('profile_education')} className={`w-full px-5 py-3.5 bg-stone-50 rounded-xl border transition-colors text-stone-700 ${errors.profile_education ? 'border-red-400' : 'border-stone-200 focus:border-ringkai-olive'}`}>
                 <option value="">Pilih...</option>
                 <option value="SMA/SMK">SMA/SMK</option>
                 <option value="D3">D3</option>
                 <option value="S1">S1</option>
                 <option value="S2/S3">S2/S3</option>
                 <option value="Lainnya">Lainnya</option>
               </select>
               {errors.profile_education && <p className="mt-1 text-xs text-red-500 ml-1">{errors.profile_education.message}</p>}
             </div>
             
             <div>
               <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-2 ml-1">Pekerjaan</label>
               <select {...register('profile_job')} className={`w-full px-5 py-3.5 bg-stone-50 rounded-xl border transition-colors text-stone-700 ${errors.profile_job ? 'border-red-400' : 'border-stone-200 focus:border-ringkai-olive'}`}>
                 <option value="">Pilih...</option>
                 {JOB_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
               </select>
               {errors.profile_job && <p className="mt-1 text-xs text-red-500 ml-1">{errors.profile_job.message}</p>}
             </div>
          </div>

          {/* Section: Kuesioner (Multiple Checkbox Klasik) */}
          <div className="space-y-8 pt-8 border-t border-stone-100 bg-stone-50/50 p-6 md:p-10 -mx-6 md:-mx-12">
             <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-ringkai-olive text-white flex items-center justify-center"><ClipboardList className="w-4 h-4"/></div>
                <div>
                  <h3 className="font-serif text-xl text-stone-900 leading-tight">Profil & Kontribusi</h3>
                  <p className="text-xs text-stone-500 mt-1">Membantu kami mewujudkan ekosistem acara yang lebih terarah.</p>
                </div>
             </div>

            {/* Kuesioner 1 */}
            <div>
              <p className="text-sm font-bold text-stone-800 mb-4">Hal apa yang paling membuat kamu tertarik mengikuti SMILE FEST?</p>
              <div className="grid grid-cols-1 gap-2">
                {INTEREST_OPTIONS.map((opt) => (
                  <label key={opt} className="flex items-start gap-3 p-3 bg-white border border-stone-200 rounded-xl cursor-pointer hover:bg-stone-50 transition-colors">
                    <input 
                      type="checkbox" 
                      value={opt} 
                      {...register('interest_reasons')} 
                      className="mt-1 w-4 h-4 text-ringkai-olive border-stone-300 rounded focus:ring-ringkai-olive" 
                    />
                    <span className="text-sm text-stone-600 leading-tight">{opt}</span>
                  </label>
                ))}
              </div>
              {errors.interest_reasons && <p className="mt-2 text-xs text-red-500">{errors.interest_reasons.message}</p>}
            </div>

            {/* Kuesioner 2 */}
            <div>
              <p className="text-sm font-bold text-stone-800 mb-4">Langkah kecil apa yang sedang kamu usahakan untuk hidup lebih mindful & sustainable? </p>
              <div className="grid grid-cols-1 gap-2">
                {STEP_OPTIONS.map((opt) => (
                  <label key={opt} className="flex items-start gap-3 p-3 bg-white border border-stone-200 rounded-xl cursor-pointer hover:bg-stone-50 transition-colors">
                    <input 
                      type="checkbox" 
                      value={opt} 
                      {...register('sustainability_steps')} 
                      className="mt-1 w-4 h-4 text-ringkai-olive border-stone-300 rounded focus:ring-ringkai-olive" 
                    />
                    <span className="text-sm text-stone-600 leading-tight">{opt}</span>
                  </label>
                ))}
              </div>
              {errors.sustainability_steps && <p className="mt-2 text-xs text-red-500">{errors.sustainability_steps.message}</p>}
            </div>

            {/* Kontribusi (Radio Button) */}
            <div className="pt-6 border-t border-stone-200/60">
              <p className="text-sm font-bold text-stone-800 mb-4">
                SMILE FEST adalah langkah awal. Bersediakah Anda terlibat lebih jauh dalam gerakan ini ke depannya?
              </p>
              <div className="grid grid-cols-1 gap-2">
                {CONTRIBUTION_OPTIONS.map((opt) => (
                  <label key={opt} className="flex items-start gap-3 p-3 bg-white border border-stone-200 rounded-xl cursor-pointer hover:bg-stone-50 transition-colors">
                    <input 
                      type="radio" 
                      value={opt} 
                      {...register('contribution_role')} 
                      className="mt-1 w-4 h-4 text-ringkai-olive border-stone-300 focus:ring-ringkai-olive" 
                    />
                    <span className="text-sm text-stone-600 leading-tight">{opt}</span>
                  </label>
                ))}
              </div>
              {errors.contribution_role && <p className="mt-2 text-xs text-red-500">{errors.contribution_role.message}</p>}
            </div>
          </div>

          {/* Section: Data Pemegang Tiket */}
          <div className="space-y-4 pt-8 border-t border-stone-100">
            <div className="flex items-center gap-2 mb-6">
               <Users className="w-5 h-5 text-stone-400" />
               <label className="block text-xs font-bold uppercase tracking-widest text-stone-500">Daftar Pemegang Tiket (Cetak E-Ticket)</label>
            </div>
            
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="relative">
                  <input
                    {...register(`attendees.${index}.name`)}
                    type="text"
                    placeholder="Nama Pemegang Tiket"
                    className={`w-full px-5 py-3.5 bg-stone-50 rounded-xl border transition-colors ${errors.attendees?.[index]?.name ? 'border-red-400' : 'border-stone-200 focus:border-ringkai-olive'}`}
                  />
                  {errors.attendees?.[index]?.name && <p className="mt-1 text-xs text-red-500 ml-1">{errors.attendees[index].name.message}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Section: Voucher & Submit */}
          <div className="pt-8 border-t border-stone-100">
             <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-3 ml-1">Kode Voucher / Partner (Opsional)</label>
             <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <input
                  {...register('voucher_code')}
                  type="text"
                  placeholder="KODE PROMO"
                  className="flex-1 px-5 py-3.5 bg-stone-50 border border-stone-200 rounded-xl focus:border-ringkai-olive transition-colors uppercase font-mono tracking-widest"
                  disabled={isVoucherValid === true}
                />
                <button
                  type="button"
                  onClick={handleCheckVoucher}
                  disabled={!watchVoucher || isCheckingVoucher || isVoucherValid === true}
                  className="w-full sm:w-36 py-3.5 bg-stone-900 text-white font-bold rounded-xl hover:bg-ringkai-olive transition-colors disabled:bg-stone-200 disabled:text-stone-400 flex justify-center items-center"
                >
                  {isCheckingVoucher ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Gunakan'}
                </button>
             </div>
             
             {isVoucherValid === true && (
               <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-xl flex items-center gap-2 border border-green-100 text-sm font-medium">
                 <Check className="w-5 h-5"/> {voucherMessage}
               </div>
             )}
             {isVoucherValid === false && (
               <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 border border-red-100 text-sm font-medium">
                 <X className="w-5 h-5"/> {voucherMessage}
               </div>
             )}

            <button
              type="submit"
              disabled={isSubmitting || !activeTicket}
              className="w-full bg-stone-900 text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-4 hover:bg-ringkai-olive transition-all duration-300 disabled:opacity-70 shadow-lg group active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <TicketIcon className="w-6 h-6 group-hover:-rotate-12 transition-transform" />}
                <span className="text-lg">Lanjut Pembayaran</span>
              </div>
              <div className="text-right">
                {isVoucherValid && voucherDiscount > 0 && (
                  <div className="text-stone-400 line-through text-xs font-normal">{formatRupiah(originalTotalPrice)}</div>
                )}
                <div className="text-2xl font-serif leading-none tracking-wide">{formatRupiah(finalPrice)}</div>
              </div>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}