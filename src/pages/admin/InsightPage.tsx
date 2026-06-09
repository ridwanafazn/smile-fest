import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { transactionService } from '../../services/api';
import type { Transaction, Ticket } from '../../types';
import { Search, Filter, Tag, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

export default function TransactionInsightPage() {
  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>('');
  const [variant, setVariant] = useState<string>('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const toggleGroup = (groupCode: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupCode]: prev[groupCode] === false ? true : false
    }));
  };

  // 1. Ambil data dari backend dengan limit yang cukup agar grouping per halamannya optimal
  const { data: queryData, isLoading } = useQuery({
    queryKey: ['transactionInsights', page, search],
    queryFn: () => transactionService.getTransactionInsights({ page, limit: 50, search }),
    placeholderData: (previousData) => previousData,
  });

  const pagination = queryData?.pagination;
  const allTransactions: Transaction[] = queryData?.data || [];

  // 2. Proses Filter Lokal (Hanya Lunas & Filter Varian Tiket)
  const filteredTransactions = useMemo(() => {
    // Pastikan hanya status 'settlement'
    let filtered = allTransactions.filter((trx: Transaction) => trx.status === 'settlement');

    // Filter berdasarkan varian tiket jika dipilih
    if (variant) {
      const targetFilter = variant.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      filtered = filtered.filter((trx: Transaction) => 
        trx.tickets?.some((t: Ticket) => {
          // Ambil ID atau Nama Varian dari database, ubah ke lowercase
          const idFromDb = (t.ticket_variant_id || '').toLowerCase();
          const nameFromDb = t.ticket_variant?.name ? t.ticket_variant.name.toLowerCase() : '';
          
          // Ambil ID objek varian jika ada
          const objIdFromDb = t.ticket_variant?.id ? t.ticket_variant.id.toLowerCase() : '';

          // Periksa apakah string mengandung kata kunci filter (misal: "presale1" atau "presale 1")
          return idFromDb.includes(variant) || 
                idFromDb.replace(/[^a-z0-9]/g, '').includes(targetFilter) ||
                objIdFromDb.includes(variant) ||
                nameFromDb.includes(variant.replace('-', ' '));
        })
      );
    }

    return filtered;
  }, [allTransactions, variant]);

  // 3. Proses Grouping Berdasarkan Voucher & Hitung Total Tiket
  const groupedVouchers = useMemo(() => {
    const groups: Record<string, { voucherCode: string; transactions: Transaction[]; totalTickets: number }> = {};

    filteredTransactions.forEach((trx: Transaction) => {
      const code = trx.voucher?.code || 'TANPA_VOUCHER';

      if (!groups[code]) {
        groups[code] = {
          voucherCode: code === 'TANPA_VOUCHER' ? 'NO VOUCHER' : code,
          transactions: [],
          totalTickets: 0,
        };
      }

      groups[code].transactions.push(trx);
      groups[code].totalTickets += trx.tickets?.length || 0;
    });

    // Urutkan berdasarkan total tiket terbanyak
    return Object.values(groups).sort((a, b) => b.totalTickets - a.totalTickets);
  }, [filteredTransactions]);

  // 4. Logika Paginasi Dinamis dengan Elipsis (...)
  const getPageNumbers = () => {
    if (!pagination) return [];
    const totalPages = pagination.total_pages;
    const currentPage = page;
    const pages = [];

    if (totalPages <= 7) {
      // Jika halaman sedikit, tampilkan semua
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      // Jika halaman banyak, gunakan elipsis
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Insight Komunitas</h1>
        <p className="mt-2 text-sm text-gray-500">
          Laporan rekapitulasi pengunjung yang telah lunas, dikelompokkan berdasarkan penggunaan kode voucher promo.
        </p>
      </div>

      {/* --- PANEL FILTER & SEARCH --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari Order ID atau Email..."
            className="pl-9 pr-4 py-2 w-full border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <select
            className="pl-9 pr-4 py-2 w-full border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={variant}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setVariant(e.target.value); setPage(1); }}
          >
            <option value="">Semua Varian Tiket</option>
            <option value="presale-1">Presale 1</option>
            <option value="presale-2">Presale 2</option>
            <option value="ots">On The Spot (OTS)</option>
          </select>
        </div>
      </div>

      {/* --- AREA DATA (GROUPED BY VOUCHER) --- */}
      {isLoading ? (
        <div className="bg-white p-12 rounded-xl border border-gray-100 flex justify-center items-center gap-2 text-gray-500 text-sm">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-600" /> Memuat insight data...
        </div>
      ) : (
        <div className="space-y-6">
          {groupedVouchers.length === 0 ? (
            <div className="bg-white p-12 text-center text-gray-400 rounded-xl border border-gray-100">
              Tidak ada data transaksi lunas yang ditemukan.
            </div>
          ) : (
            groupedVouchers.map((group) => (
              <div key={group.voucherCode} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                
                {/* Header Group */}
                <div 
                  onClick={() => toggleGroup(group.voucherCode)}
                  className="bg-stone-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center cursor-pointer hover:bg-stone-100/70 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Tag className="h-4 w-4 text-emerald-600 shrink-0" />
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                      <span className="font-serif font-bold text-stone-800 text-base">{group.voucherCode}</span>

                      {/* Menampilkan potongan harga jika ada data voucher di transaksi pertama grup ini */}
                      {group.transactions[0]?.voucher && (
                        <span className="inline-flex text-xs text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded border border-purple-100 w-fit">
                          - Rp {((group.transactions[0].voucher.discount_amount || 0)).toLocaleString('id-ID')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">
                      Total: {group.totalTickets} Tiket
                    </div>
                    <span className="text-stone-400 text-xs font-medium hidden sm:inline">
                      {expandedGroups[group.voucherCode] === false ? 'V' : '--'}
                    </span>
                  </div>
                </div>

                {/* Table Data per Group */}
                {expandedGroups[group.voucherCode] !== false && (
                  <div className="overflow-x-auto transition-all duration-300">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100 font-semibold text-gray-500 text-xs tracking-wider uppercase">
                          <th className="p-4 w-[15%]">Order ID</th>
                          <th className="p-4 w-[25%]">Email Pembeli</th>
                          <th className="p-4 w-[30%]">Nama Pengunjung</th> {/* Kolom Nama Terpisah */}
                          <th className="p-4 w-[30%]">Varian Tiket</th>    {/* Kolom Varian Terpisah */}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {group.transactions.map((trx: Transaction) => (
                          <tr key={trx.id} className="hover:bg-stone-50/60 transition-colors align-top">
                            <td className="p-4 font-mono text-xs font-semibold text-gray-600">{trx.id}</td>
                            <td className="p-4 text-gray-800 font-medium break-all">{trx.customer_email}</td>

                            {/* Kolom Nama Pengunjung */}
                            <td className="p-4 space-y-2">
                              {trx.tickets?.map((t: Ticket, idx: number) => (
                                <div key={t.id || idx} className="text-xs flex items-center gap-1.5 text-stone-700 h-5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                                  <span className="font-medium truncate">{t.attendee_name}</span>
                                </div>
                              ))}
                            </td>

                            {/* Kolom Varian Tiket Terpisah */}
                            <td className="p-4 space-y-2">
                              {trx.tickets?.map((t: Ticket, idx: number) => (
                                <div key={t.id || idx} className="text-xs flex items-center h-5">
                                  <span className="px-2 py-0.5 bg-stone-100 text-stone-600 font-mono text-[11px] rounded border border-stone-200/60 uppercase font-semibold">
                                    {t.ticket_variant?.name || t.ticket_variant_id}
                                  </span>
                                </div>
                              ))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

              </div>
            ))
          )}
        </div>
      )}

      {/* --- PANEL PAGINASI DINAMIS --- */}
      {!isLoading && pagination && pagination.total_pages > 1 && (
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between text-sm text-gray-600">
          <div>
            Total <span className="font-semibold text-gray-900">{pagination.total_records}</span> transaksi berjalan
          </div>
          <div className="flex items-center gap-1.5">
            {/* Tombol Sebelumnya */}
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              className="p-1.5 border border-gray-200 rounded-md bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Deretan Angka Paginasi */}
            {getPageNumbers().map((pageNum, idx) => (
              <React.Fragment key={idx}>
                {pageNum === '...' ? (
                  <span className="px-2 text-gray-400">...</span>
                ) : (
                  <button
                    onClick={() => setPage(pageNum as number)}
                    className={`min-w-[32px] h-8 flex items-center justify-center rounded-md border text-sm font-medium transition-colors
                      ${page === pageNum 
                        ? 'bg-emerald-600 text-white border-emerald-600' 
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                  >
                    {pageNum}
                  </button>
                )}
              </React.Fragment>
            ))}

            {/* Tombol Selanjutnya */}
            <button
              disabled={page === pagination.total_pages}
              onClick={() => setPage((p) => Math.min(p + 1, pagination.total_pages))}
              className="p-1.5 border border-gray-200 rounded-md bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}