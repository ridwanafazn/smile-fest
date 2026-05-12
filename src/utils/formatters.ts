/**
 * Mengubah angka menjadi format Rupiah yang standar
 * Contoh: 50000 -> Rp 50.000
 */
export const formatRupiah = (number: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(number);
};

/**
 * Mengubah string ISO Date menjadi format tanggal lokal yang elegan
 * Contoh: 2026-06-07T... -> 7 Juni 2026, 14:00
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

/**
 * Menyingkat teks yang terlalu panjang (misal untuk Order ID atau Nama)
 */
export const truncateText = (text: string, length: number): string => {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};