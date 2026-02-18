export interface User {
  id: string;
  email: string;
  name: string | null;
  password_hash: string | null;
  created_at: string;
  updated_at: string;
}

export interface Agency {
  id: string;
  user_id: string;
  agency_name: string;
  logo_url: string | null;
  primary_color: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  agency_id: string;
  client_name: string;
  google_ads_connected: boolean;
  meta_ads_connected: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiToken {
  id: string;
  client_id: string;
  platform: 'google_ads' | 'meta_ads';
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
  account_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Report {
  id: string;
  client_id: string;
  report_date_start: string;
  report_date_end: string;
  pdf_url: string | null;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}
