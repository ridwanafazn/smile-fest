// --- CORE WRAPPERS (CLEAN ARCHITECTURE BACKEND FORMAT) ---
export interface Meta {
  code: number;
  status: string;
  message: string;
}

export interface PaginationMeta {
  current_page: number;
  total_pages: number;
  total_records: number;
  limit: number;
}

// Digunakan jika tidak menggunakan fitur auto-unboxing interceptor
export interface BaseResponse<T> {
  meta: Meta;
  data: T;
}

// Digunakan khusus untuk Data Table (CRM) yang butuh meta pagination
export interface PaginatedResponse<T> {
  meta: Meta;
  data: T;
  pagination: PaginationMeta;
}

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
  
  profile_age: string;
  profile_city: string;
  profile_education: string;
  profile_job: string;
  community_affiliation: string;
  information_source: string;
  
  interest_reasons: string[];
  sustainability_steps: string[];
  
  contribution_role: string;

  voucher_code?: string;
  attendees: Attendee[]; 
}

export interface CheckoutResponse {
  message: string;
  order_id: string;
  total_amount: number;
  unique_code: number;
  session_batch: number;
  expires_at: string;
}

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
  
  profile_age: string;
  profile_city: string;
  profile_education: string;
  profile_job: string;
  community_affiliation: string;
  information_source: string;

  interest_reasons: string;
  sustainability_steps: string;
  
  contribution_role: string;

  total_amount: number; 
  unique_code: number;
  session_batch: number;
  payment_proof_url?: string;
  expires_at: string;

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
  waiting_verification: number; 
}