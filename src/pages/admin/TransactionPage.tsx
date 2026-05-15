import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import type { Transaction } from '../../types';
import { Search, Loader2, FileX, Tag, ChevronDown, ChevronUp, Users, ClipboardList, Download } from 'lucide-react';
import { formatRupiah, escapeCsv } from '../../utils/formatters';
import { toast } from 'react-hot-toast';

export default function TransactionPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // State untuk melacak baris mana yang sedang di-expand (dilebarkan)
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setTimeout(() => setDebouncedSearch(e.target.value), 500);
  };

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions', debouncedSearch],
    queryFn: async () => {
      const response = await api.get<{message: string, data: Transaction[]}>('/api/admin/transactions', {
        params: { search: debouncedSearch }
      });
      const payload = response.data;
      return Array.isArray(payload.data) ? payload.data : [];
    },
  });

  const toggleRow = (id: string) => {
    setExpandedRowId(prev => prev === id ? null : id);
  };

  // PR-05: Fungsi Ajaib Download CSV (Export ke Excel)
  const handleDownloadCsv = () => {
    if (!transactions || transactions.length === 0) {
      toast.error('Tidak ada data untuk diunduh');
      return;
    }

    // 1. Definisikan Header CSV
    const headers = [
      'Order ID', 'Waktu Transaksi', 'Status', 'Total Bayar', 'Kode Voucher', 'Jumlah Tiket',
      'Nama Pemesan', 'Email Pemesan', 'No WhatsApp',
      'Usia', 'Domisili', 'Pendidikan', 'Pekerjaan', 'Motivasi Mengikuti', 'Aksi Sustainable',
      'Daftar Pemegang Tiket'
    ];

    // 2. Petakan data ke dalam baris CSV
    const csvRows = [headers.join(',')]; // Baris pertama adalah header

    transactions.forEach(trx => {
      // Kita gabungkan nama pemegang tiket menjadi satu string terpisah koma
      const attendeeNames = trx.tickets?.map(t => t.attendee_name).join(' | ') || '-';
      
      const rowData = [
        trx.id,
        new Date(trx.created_at).toLocaleString('id-ID'),
        trx.status,
        trx.total_amount,
        trx.voucher?.code || '-',
        trx.tickets?.length || 0,
        trx.customer_name,
        trx.customer_email,
        `'${trx.customer_phone}`, // Kutip tunggal agar Excel tidak merusaknya menjadi rumus/angka ilmiah
        trx.survey_age || '-',
        trx.survey_city || '-',
        trx.survey_education || '-',
        trx.survey_job || '-',
        trx.survey_motivation || '-',
        trx.survey_action || '-',
        attendeeNames
      ];

      // Format setiap sel agar aman untuk CSV (membungkus yang ada komanya)
      const formattedRow = rowData.map(cell => escapeCsv(cell as string)).join(',');
      csvRows.push(formattedRow);
    });

    // 3. Gabungkan semua baris menjadi satu teks besar (Blob)
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // 4. Proses Trigger Download (Klik bayangan)
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SMILE_FEST_Transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Laporan berhasil diunduh!');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'settlement':
        return <span className="px-3 py-1 bg-ringkai-olive/10 text-ringkai-success text-xs font-semibold rounded-full uppercase tracking-wider border border-ringkai-success/20">Lunas</span>;
      case 'pending':
        return <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full uppercase tracking-wider border border-amber-200">Tertunda</span>;
      case 'expire':
      case 'cancel':
        return <span className="px-3 py-1 bg-red-100 text-ringkai-danger text-xs font-semibold rounded-full uppercase tracking-wider border border-red-200">Batal</span>;
      default:
        return <span className="px-3 py-1 bg-stone-100 text-stone-600 text-xs font-semibold rounded-full uppercase tracking-wider">{status}</span>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-serif mb-2">Riwayat Transaksi</h1>
          <p className="text-stone-500 text-sm tracking-wide">Lacak pesanan, lihat detail peserta, dan unduh laporan kuesioner.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
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
          
          <button 
            onClick={handleDownloadCsv}
            disabled={isLoading || !transactions || transactions.length === 0}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-ringkai-text text-white px-5 py-2.5 rounded-xl font-medium hover:bg-stone-700 transition-colors disabled:opacity-50 shadow-soft whitespace-nowrap"
          >
            <Download className="w-4 h-4" /> CSV Report
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-soft overflow-hidden">
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
                              <Tag className="w-3 h-3" /> {trx.voucher.code}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(trx.status)}</td>
                      <td className="px-6 py-4 text-sm text-stone-500">
                        {new Date(trx.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                    </tr>

                    {/* PR-04: Baris Detail yang Dilebarkan (Expandable Row) */}
                    {expandedRowId === trx.id && (
                      <tr className="bg-stone-50/50 border-b-2 border-stone-100">
                        <td colSpan={6} className="px-6 py-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-top-2 duration-200">
                            
                            {/* Panel Kiri: Data Kuesioner/Survei */}
                            <div className="space-y-4">
                              <div className="flex items-center gap-2 text-stone-800 font-serif font-medium border-b border-stone-200 pb-2">
                                <ClipboardList className="w-4 h-4 text-ringkai-olive" /> Data Survei & Demografi
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider mb-0.5">Usia</p>
                                  <p className="text-stone-700">{trx.survey_age || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider mb-0.5">Domisili</p>
                                  <p className="text-stone-700">{trx.survey_city || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider mb-0.5">Pendidikan</p>
                                  <p className="text-stone-700">{trx.survey_education || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider mb-0.5">Pekerjaan</p>
                                  <p className="text-stone-700">{trx.survey_job || '-'}</p>
                                </div>
                                <div className="col-span-2">
                                  <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider mb-0.5">Motivasi</p>
                                  <p className="text-stone-700">{trx.survey_motivation || '-'}</p>
                                </div>
                                <div className="col-span-2">
                                  <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider mb-0.5">Aksi Mindful</p>
                                  <p className="text-stone-700">{trx.survey_action || '-'}</p>
                                </div>
                              </div>
                            </div>

                            {/* Panel Kanan: Daftar Multi-Tiket & Kontak */}
                            <div className="space-y-4">
                              <div className="flex items-center gap-2 text-stone-800 font-serif font-medium border-b border-stone-200 pb-2">
                                <Users className="w-4 h-4 text-ringkai-olive" /> Rincian Tiket & Kontak
                              </div>
                              <div className="text-sm space-y-3">
                                <div>
                                  <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider mb-0.5">No. WhatsApp / Kontak</p>
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
      </div>
    </div>
  );
}