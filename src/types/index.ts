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
  customer_gender: string;
  ticket_type: string;
  
  // Data Profil (Menggantikan Survei Lama)
  profile_age: string;
  profile_city: string;
  profile_education: string;
  profile_job: string;
  community_affiliation: string;
  information_source: string;
  
  // Kuesioner Multiple Choice (Disimpan sebagai Array di form)
  interest_reasons: string[];
  sustainability_steps: string[];
  
  // Undangan Kontribusi
  contribution_role: string;

  voucher_code?: string;
  attendees: Attendee[]; 
}

// Respons dari API Checkout Manual
export interface CheckoutResponse {
  message: string;
  order_id: string;
  total_amount: number;
  unique_code: number;
  session_batch: number;
  expires_at: string;
}

// Representasi individual tiket
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
  usage_count: number; 
  is_active: boolean;
}

// --- TRANSACTION ---
export interface Transaction {
  id: string; 
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_gender: string;
  
  // Data Profil Tambahan
  profile_age: string;
  profile_city: string;
  profile_education: string;
  profile_job: string;
  community_affiliation: string;
  information_source: string;

  // Hasil Kuesioner (String digabung koma dari Backend)
  interest_reasons: string;
  sustainability_steps: string;
  
  contribution_role: string;

  // Manual Payment System
  total_amount: number; 
  unique_code: number;
  session_batch: number;
  payment_proof_url?: string;
  expires_at: string;

  // Penambahan status 'waiting_verification'
  status: 'pending' | 'waiting_verification' | 'settlement' | 'cancel' | 'expire';
  created_at: string;
  
  tickets?: Ticket[]; 
  voucher?: Voucher;  
}

// --- SCANNER ---
export interface ValidateTicketInput {
  ticket_id: string;
}

export interface ValidateTicketResponse {
  ticket_id: string;
  customer_name: string; 
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
  waiting_verification: number; // Tambahan metrik beban kerja admin
}