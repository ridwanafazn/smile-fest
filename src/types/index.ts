// --- AUTH & USER ---
export interface User {
  id: string;
  username: string;
  role: 'admin' | 'scanner';
}

export interface LoginResponse {
  token: string;
  role: 'admin' | 'scanner';
}

// --- TICKET & CHECKOUT ---
export interface TicketVariant {
  id: string;
  name: string;
  price: number;
  quota: number;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
}

export interface Attendee {
  name: string;
}

export interface CheckoutInput {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  ticket_type: string;
  voucher_code?: string;
  attendees: Attendee[]; // Menampung daftar nama pemegang tiket
}

export interface CheckoutResponse {
  order_id: string;
  snap_token: string;
}

// Representasi individual tiket (sekarang 1 transaksi bisa punya banyak tiket ini)
export interface Ticket {
  id: string;
  transaction_id: string;
  ticket_variant_id: string;
  attendee_name: string;
  is_scanned: boolean;
  scanned_at: string | null;
  created_at: string;
}

// --- VOUCHER ---
export interface Voucher {
  id: number;
  code: string;
  discount_amount: number;
  quota: number;
  usage_count: number; // Disinkronkan dengan backend
  is_active: boolean;
}

// --- TRANSACTION ---
export interface Transaction {
  id: string; // Order ID (SMILE-xxx)
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  total_amount: number; // PERBAIKAN: Menggantikan gross_amount
  status: 'pending' | 'settlement' | 'cancel' | 'expire';
  created_at: string;
  tickets?: Ticket[]; // Preload relasi tiket
  voucher?: Voucher;  // Preload data diskon (opsional)
}

// --- SCANNER ---
export interface ValidateTicketInput {
  ticket_id: string;
}

export interface ValidateTicketResponse {
  ticket_id: string;
  customer_name: string; // Diambil dari attendee_name
  message: string;
}

export interface ScannerStats {
  total_tickets: number;
  scanned_tickets: number;
  remaining: number;
}

// --- DASHBOARD (ADMIN) ---
export interface DashboardStats {
  total_revenue: number;
  total_tickets: number;
  scanned_tickets: number;
}