import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import type { Transaction } from '../../types';
import { Search, Loader2, FileX, Tag, ChevronDown, ChevronUp, Users, ClipboardList, Download, Image as ImageIcon, ChevronLeft, ChevronRight, Filter, FileSpreadsheet, FileText } from 'lucide-react';
import { formatRupiah } from '../../utils/formatters';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';

export default function TransactionPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  
  // STATE PREVIEW FOTO
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  // STATE EXPORT MENU & LOADING
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // STATE SERVER-SIDE PAGINATION & FILTER
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const limit = 10;

  // Tutup export menu saat klik di luar area
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
    setTimeout(() => setDebouncedSearch(e.target.value), 500);
  };

  const handleStatusFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const { data: queryData, isLoading, isFetching } = useQuery({
    queryKey: ['transactions', debouncedSearch, statusFilter, currentPage],
    queryFn: async () => {
      const response = await api.get('/api/admin/transactions', {
        params: { 
          search: debouncedSearch,
          status: statusFilter,
          page: currentPage,
          limit: limit
        }
      });
      return response.data as unknown as { data: Transaction[], pagination: any };
    },
    placeholderData: (previousData) => previousData, 
  });

  const transactions = queryData?.data || [];
  const pagination = queryData?.pagination;

  const toggleRow = (id: string) => {
    setExpandedRowId(prev => prev === id ? null : id);
  };

  // --- FUNGSI EXPORT DATA MENYELURUH (ALL PAGES) ---
  const handleExport = async (format: 'csv' | 'xlsx') => {
    setIsExporting(true);
    setIsExportMenuOpen(false);
    const toastId = toast.loading('Menarik seluruh data dari server...');

    try {
      // 1. Tarik semua data menggunakan loop (bypass limit backend secara aman)
      let allData: Transaction[] = [];
      let fetchPage = 1;
      let totalPages = 1;

      do {
        // Update pesan toast agar admin tahu prosesnya sedang berjalan
        toast.loading(`Menarik data halaman ${fetchPage} dari ${totalPages === 1 ? '...' : totalPages}...`, { id: toastId });
        
        const response = await api.get('/api/admin/transactions', {
          params: { 
            search: debouncedSearch,
            status: statusFilter,
            page: fetchPage,
            limit: 100 // Gunakan batas maksimal 100 yang masih diizinkan Backend
          }
        });
        
        // Ekstrak data dan metadata paginasi dari response (berkat interceptor auto-unboxing)
        const pageData = response.data?.data || [];
        const paginationMeta = response.data?.pagination;
        
        // Gabungkan data halaman ini ke array penampung utama
        allData = [...allData, ...pageData];
        
        // Perbarui target total halaman
        totalPages = paginationMeta?.total_pages || 1;
        fetchPage++;
        
      } while (fetchPage <= totalPages); // Terus looping sampai halaman terakhir tercapai

      if (allData.length === 0) {
        toast.error('Tidak ada data untuk diekspor', { id: toastId });
        return;
      }

      toast.loading('Memformat dokumen...', { id: toastId });

      // 2. Pemetaan dan pembersihan data agar rapi di Excel/CSV
      const exportData = allData.map(trx => {
        const attendeeNames = trx.tickets?.map(t => t.attendee_name).join(', ') || '-';
        const ticketVariants = trx.tickets?.map(t => t.ticket_variant_id).join(', ') || '-';

        return {
          'Order ID': trx.id,
          'Waktu Transaksi': new Date(trx.created_at).toLocaleString('id-ID'),
          'Status': trx.status.toUpperCase(),
          'Sesi / Batch': trx.session_batch || 1,
          'Total Bayar (Rp)': trx.total_amount,
          'Kode Unik': trx.unique_code || 0,
          'Voucher Digunakan': trx.voucher?.code || '-',
          'Jumlah Tiket': trx.tickets?.length || 0,
          'Nama Pembeli': trx.customer_name,
          'Email Pembeli': trx.customer_email,
          'No. WhatsApp': trx.customer_phone ? `'${trx.customer_phone}` : '-', // Kutip agar tidak jadi rumus/angka desimal
          'Gender': trx.customer_gender || '-',
          'Usia': trx.profile_age || '-',
          'Domisili': trx.profile_city || '-',
          'Pendidikan': trx.profile_education || '-',
          'Pekerjaan': trx.profile_job || '-',
          'Asal Komunitas': trx.community_affiliation || '-',
          'Sumber Info': trx.information_source || '-',
          'Alasan Ketertarikan': trx.interest_reasons || '-',
          'Langkah Keberlanjutan': trx.sustainability_steps || '-',
          'Kesediaan Kontribusi': trx.contribution_role || '-',
          'Nama Pemegang Tiket': attendeeNames,
          'Varian Tiket': ticketVariants
        };
      });

      // 3. Konversi ke Worksheet SheetJS
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // 4. Pengaturan Lebar Kolom Otomatis untuk Kerapian XLSX
      const columnWidths = Object.keys(exportData[0]).map(key => ({
        wch: Math.max(key.length, 15) // Minimal lebar 15 karakter
      }));
      worksheet['!cols'] = columnWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Riwayat Transaksi');

      // 5. Simpan file berdasarkan format
      const fileName = `SMILE_FEST_Laporan_Transaksi_${new Date().toISOString().split('T')[0]}`;
      
      if (format === 'xlsx') {
        XLSX.writeFile(workbook, `${fileName}.xlsx`);
      } else {
        XLSX.writeFile(workbook, `${fileName}.csv`, { bookType: 'csv' });
      }

      toast.success('Laporan berhasil diunduh!', { id: toastId });
    } catch (error) {
      toast.error('Gagal mengunduh laporan data', { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'settlement':
        return <span className="px-3 py-1 bg-ringkai-olive/10 text-ringkai-success text-xs font-semibold rounded-full uppercase tracking-wider border border-ringkai-success/20">Lunas</span>;
      case 'waiting_verification':
        return <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full uppercase tracking-wider border border-blue-200 animate-pulse">Perlu Cek</span>;
      case 'pending':
        return <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full uppercase tracking-wider border border-amber-200">Menunggu</span>;
      case 'expire':
      case 'cancel':
        return <span className="px-3 py-1 bg-red-100 text-ringkai-danger text-xs font-semibold rounded-full uppercase tracking-wider border border-red-200">Batal</span>;
      default:
        return <span className="px-3 py-1 bg-stone-100 text-stone-600 text-xs font-semibold rounded-full uppercase tracking-wider">{status}</span>;
    }
  };

  const generatePaginationNumbers = () => {
    if (!pagination) return [];
    
    const current = pagination.current_page;
    const total = pagination.total_pages;
    const maxVisible = 5;

    if (total <= maxVisible) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    if (current <= 3) {
      return [1, 2, 3, 4, '...', total];
    }

    if (current >= total - 2) {
      return [1, '...', total - 3, total - 2, total - 1, total];
    }

    return [1, '...', current - 1, current, current + 1, '...', total];
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col xl:flex-row justify-between xl:items-end gap-4">
        <div>
          <h1 className="text-3xl font-serif mb-2">Riwayat Transaksi</h1>
          <p className="text-stone-500 text-sm tracking-wide">Lacak pesanan dan filter data peserta.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
          {/* SEARCH BAR */}
          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-stone-400" />
            </div>
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-xl bg-white focus:border-ringkai-olive focus:ring-1 focus:ring-ringkai-olive outline-none transition-all shadow-soft"
              placeholder="Cari nama atau email..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>

          {/* STATUS FILTER */}
          <div className="relative w-full sm:w-48">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 text-stone-400" />
            </div>
            <select
              value={statusFilter}
              onChange={handleStatusFilter}
              className="w-full pl-9 pr-4 py-2 appearance-none border border-stone-200 rounded-xl bg-white focus:border-ringkai-olive focus:ring-1 focus:ring-ringkai-olive outline-none transition-all shadow-soft text-sm text-stone-600 font-medium cursor-pointer"
            >
              <option value="all">Semua Status</option>
              <option value="waiting_verification">Perlu Cek (BPO)</option>
              <option value="settlement">Lunas (Settlement)</option>
              <option value="pending">Menunggu Bayar</option>
              <option value="cancel">Batal / Expire</option>
            </select>
          </div>
          
          {/* EXPORT DROPDOWN MENU */}
          <div className="relative w-full sm:w-auto" ref={exportMenuRef}>
            <button 
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              disabled={isLoading || isExporting || !transactions || transactions.length === 0}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-ringkai-text text-white px-5 py-2.5 rounded-xl font-medium hover:bg-stone-700 transition-colors disabled:opacity-50 shadow-soft whitespace-nowrap"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {isExporting ? 'Mengekspor...' : 'Download'}
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExportMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isExportMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                <button 
                  onClick={() => handleExport('xlsx')}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-stone-700 hover:bg-stone-50 transition-colors text-left font-medium"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> (.xlsx)
                </button>
                <div className="border-t border-stone-100"></div>
                <button 
                  onClick={() => handleExport('csv')}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-stone-700 hover:bg-stone-50 transition-colors text-left font-medium"
                >
                  <FileText className="w-4 h-4 text-stone-500" /> (.csv)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-soft overflow-hidden relative">
        {/* Indikator Fetching */}
        {isFetching && !isLoading && (
           <div className="absolute top-0 left-0 right-0 h-1 bg-stone-100 overflow-hidden z-10">
              <div className="h-full bg-ringkai-olive w-1/3 animate-pulse"></div>
           </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-xs uppercase tracking-widest text-stone-500">
                <th className="px-6 py-4 font-semibold w-10"></th>
                <th className="px-6 py-4 font-semibold">Order ID</th>
                <th className="px-6 py-4 font-semibold">Peserta</th>
                <th className="px-6 py-4 font-semibold">Detail Pesanan</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Waktu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-stone-400 mx-auto" />
                  </td>
                </tr>
              ) : transactions && transactions.length > 0 ? (
                transactions.map((trx) => (
                  <React.Fragment key={trx.id}>
                    {/* Baris Utama */}
                    <tr 
                      onClick={() => toggleRow(trx.id)}
                      className={`hover:bg-stone-50/50 transition-colors cursor-pointer ${expandedRowId === trx.id ? 'bg-stone-50/30' : ''}`}
                    >
                      <td className="px-6 py-4 text-stone-400">
                        {expandedRowId === trx.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-sm font-mono text-stone-600 block">{trx.id}</span>
                        {trx.session_batch && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-stone-100 text-stone-500 text-[10px] rounded-sm font-semibold uppercase tracking-wider">
                            Sesi {trx.session_batch}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-ringkai-text">{trx.customer_name}</p>
                        <p className="text-xs text-stone-500">{trx.customer_email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-serif text-ringkai-text font-medium">{formatRupiah(trx.total_amount)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-stone-500 font-medium px-2 py-0.5 bg-stone-100 rounded">
                            {trx.tickets?.length || 0} Tiket
                          </span>
                          {trx.voucher && (
                            <span className="text-[10px] text-ringkai-olive bg-ringkai-olive/10 px-2 py-0.5 rounded flex items-center gap-1 font-semibold border border-ringkai-olive/20">
                              <Tag className="w-3 h-3" />
                              {trx.voucher.code}
                              (-{formatRupiah(trx.voucher.discount_amount)})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(trx.status)}</td>
                      <td className="px-6 py-4 text-sm text-stone-500">
                        {new Date(trx.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                    </tr>

                    {/* Baris Expandable */}
                    {expandedRowId === trx.id && (
                      <tr className="bg-stone-50/50 border-b-2 border-stone-100">
                        <td colSpan={6} className="px-6 py-6">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-top-2 duration-200">
                            
                            {/* Panel Kiri */}
                            <div className="space-y-4 lg:col-span-2">
                              <div className="flex items-center gap-2 text-stone-800 font-serif font-medium border-b border-stone-200 pb-2">
                                <ClipboardList className="w-4 h-4 text-ringkai-olive" /> Profil Pemesan & Kontribusi
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider mb-0.5">Usia</p>
                                  <p className="text-stone-700">{trx.profile_age || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider mb-0.5">Domisili</p>
                                  <p className="text-stone-700">{trx.profile_city || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider mb-0.5">Pendidikan</p>
                                  <p className="text-stone-700">{trx.profile_education || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider mb-0.5">Pekerjaan</p>
                                  <p className="text-stone-700">{trx.profile_job || '-'}</p>
                                </div>

                                <div className="col-span-2 md:col-span-4">
                                  <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider mb-1">Ketertarikan Utama</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {trx.interest_reasons && trx.interest_reasons !== '-' ? trx.interest_reasons.split(',').map((reason, i) => (
                                      <span key={i} className="px-2.5 py-1 bg-white border border-stone-200 rounded-md text-[11px] text-stone-600 font-medium">
                                        {reason.trim()}
                                      </span>
                                    )) : <span className="text-stone-500 text-xs">-</span>}
                                  </div>
                                </div>

                                <div className="col-span-2 md:col-span-4">
                                  <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider mb-1">Langkah Keberlanjutan Saat Ini</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {trx.sustainability_steps && trx.sustainability_steps !== '-' ? trx.sustainability_steps.split(',').map((step, i) => (
                                      <span key={i} className="px-2.5 py-1 bg-ringkai-olive/10 border border-ringkai-olive/20 rounded-md text-[11px] text-ringkai-olive font-medium">
                                        {step.trim()}
                                      </span>
                                    )) : <span className="text-stone-500 text-xs">-</span>}
                                  </div>
                                </div>

                                <div className="col-span-2 md:col-span-4 pt-2">
                                  <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider mb-1">Kesediaan Kontribusi</p>
                                  <span className="inline-block px-3 py-1 bg-stone-800 rounded-full text-xs text-white font-medium shadow-sm">
                                    {trx.contribution_role || '-'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Panel Kanan */}
                            <div className="space-y-6">
                              <div className="space-y-4">
                                <div className="flex items-center gap-2 text-stone-800 font-serif font-medium border-b border-stone-200 pb-2">
                                  <Users className="w-4 h-4 text-ringkai-olive" /> Rincian Tiket & Kontak
                                </div>
                                <div className="text-sm space-y-3">
                                  <div>
                                    <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider mb-0.5">No. WhatsApp</p>
                                    <p className="text-stone-700">{trx.customer_phone}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider mb-1.5">Daftar Pemegang Tiket ({trx.tickets?.length || 0})</p>
                                    <ul className="space-y-1.5">
                                      {trx.tickets?.map((t, idx) => (
                                        <li key={t.id} className="flex items-center justify-between bg-white px-3 py-2 border border-stone-200 rounded-lg shadow-sm">
                                          <span className="font-medium text-stone-700 text-xs">{idx + 1}. {t.attendee_name}</span>
                                          <span className={`text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full ${t.is_scanned ? 'bg-ringkai-olive/10 text-ringkai-olive' : 'bg-stone-100 text-stone-400'}`}>
                                            {t.is_scanned ? 'Masuk' : 'Belum'}
                                          </span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-3">
                                <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Bukti Pembayaran</p>
                                {trx.payment_proof_url ? (
                                  <button 
                                    type="button"
                                    onClick={() => setPreviewImage(trx.payment_proof_url || null)}
                                    className="flex items-center justify-center gap-2 w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-lg transition-colors text-sm font-medium cursor-pointer"
                                  >
                                    <ImageIcon className="w-4 h-4" /> Lihat Foto Bukti
                                  </button>
                                ) : (
                                  <p className="text-sm text-stone-500 italic text-center py-2 bg-stone-50 rounded-lg">Belum ada bukti diunggah</p>
                                )}
                              </div>

                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-stone-400">
                    <FileX className="w-8 h-8 mx-auto mb-3 text-stone-300" />
                    <p>Tidak ada transaksi ditemukan.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* PAGINATION CONTROL COMPONENT WITH NUMBERS */}
        {pagination && pagination.total_pages > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-stone-200 bg-stone-50 gap-4">
            <div className="text-sm text-stone-500 whitespace-nowrap">
              Total <span className="font-semibold text-stone-700">{pagination.total_records}</span> Data
            </div>
            
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto justify-center sm:justify-end">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={pagination.current_page === 1 || isFetching}
                className="p-1.5 sm:p-2 bg-white border border-stone-200 rounded-lg hover:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-stone-600" />
              </button>

              {generatePaginationNumbers().map((num, idx) => (
                <button
                  key={idx}
                  onClick={() => typeof num === 'number' ? setCurrentPage(num) : null}
                  disabled={typeof num !== 'number' || isFetching}
                  className={`min-w-[32px] h-8 sm:h-9 px-2 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                    num === pagination.current_page 
                      ? 'bg-ringkai-text text-white shadow-soft' 
                      : typeof num === 'number' 
                        ? 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100' 
                        : 'bg-transparent text-stone-400 cursor-default'
                  }`}
                >
                  {num}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.total_pages))}
                disabled={pagination.current_page === pagination.total_pages || isFetching}
                className="p-1.5 sm:p-2 bg-white border border-stone-200 rounded-lg hover:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-stone-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL IMAGE PREVIEW (BACKGROUND BLUR) */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)} 
        >
          <div 
            className="relative max-w-4xl w-full max-h-[90vh] bg-stone-900 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-stone-700/50 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()} 
          >
            <img 
              src={previewImage} 
              alt="Bukti Transfer" 
              className="w-full h-full object-contain max-h-[85vh] p-2"
            />
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
              <button 
                onClick={() => setPreviewImage(null)}
                className="bg-black/50 text-white hover:bg-ringkai-danger w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-sans font-bold transition-colors shadow-lg"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}