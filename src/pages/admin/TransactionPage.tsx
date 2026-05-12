import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import type { Transaction } from '../../types';
import { Search, Loader2, FileX, Tag } from 'lucide-react';

export default function TransactionPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

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

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(angka);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'settlement':
        return <span className="px-3 py-1 bg-ringkai-olive/10 text-ringkai-success text-xs font-semibold rounded-full uppercase tracking-wider">Lunas</span>;
      case 'pending':
        return <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full uppercase tracking-wider">Tertunda</span>;
      case 'expire':
      case 'cancel':
        return <span className="px-3 py-1 bg-red-100 text-ringkai-danger text-xs font-semibold rounded-full uppercase tracking-wider">Batal</span>;
      default:
        return <span className="px-3 py-1 bg-stone-100 text-stone-600 text-xs font-semibold rounded-full uppercase tracking-wider">{status}</span>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-serif mb-2">Riwayat Transaksi</h1>
          <p className="text-stone-500 text-sm tracking-wide">Lacak pesanan dan lihat jumlah tiket peserta.</p>
        </div>
        
        <div className="relative w-full md:w-72">
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
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-xs uppercase tracking-widest text-stone-500">
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
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-stone-400 mx-auto" />
                  </td>
                </tr>
              ) : transactions && transactions.length > 0 ? (
                transactions.map((trx) => (
                  <tr key={trx.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-6 py-4">
                      {/* PERBAIKAN: Mapping ke trx.id karena Backend sudah tidak memakai trx.order_id */}
                      <span className="font-medium text-sm font-mono text-stone-600 block">{trx.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-ringkai-text">{trx.customer_name}</p>
                      <p className="text-xs text-stone-500">{trx.customer_email}</p>
                    </td>
                    <td className="px-6 py-4">
                      {/* PERBAIKAN: Mapping ke total_amount dan menampilkan jumlah array tiket */}
                      <p className="font-serif text-ringkai-text font-medium">{formatRupiah(trx.total_amount)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-stone-500 font-medium px-2 py-0.5 bg-stone-100 rounded">
                          {trx.tickets?.length || 0} Tiket
                        </span>
                        {trx.voucher && (
                          <span className="text-[10px] text-ringkai-olive bg-ringkai-olive/10 px-2 py-0.5 rounded flex items-center gap-1 font-semibold">
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
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-stone-400">
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