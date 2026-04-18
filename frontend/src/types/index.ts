export enum Role {
  Admin = 'admin',
  Recruiter = 'recruiter',
  Vendor = 'vendor',
}

export enum JDStatus {
  Draft = 'draft',
  Active = 'active',
  OnHold = 'on_hold',
  Closed = 'closed',
}

export enum SubmissionStatus {
  Submitted = 'submitted',
  UnderReview = 'under_review',
  Shortlisted = 'shortlisted',
  Rejected = 'rejected',
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  is_active: boolean;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface Vendor {
  id: string;
  company_name: string;
  contact_email: string;
  is_approved: boolean;
  performance_score: number;
  user_id: string;
}

export interface JD {
  id: string;
  title: string;
  description: string;
  client_name: string;
  location: string;
  experience_min: number;
  experience_max: number;
  status: JDStatus;
  created_by: string;
  created_at: string;
}

export interface Candidate {
  id: string;
  name: string;
  email?: string;
  cv_url?: string;
  availability?: string;
  notice_period?: string;
  rate_expectation?: number;
}

export interface CVSubmission {
  id: string;
  jd_id: string;
  vendor_id: string;
  candidate_name: string;
  candidate_email: string;
  status: SubmissionStatus;
  submitted_at: string;
  candidate?: Candidate;
}

// ─── Sprint 2 additions ────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  success: boolean;
}

export interface DataResponse<T> {
  data: T;
  success: boolean;
}

export interface UserCreate {
  email: string;
  password: string;
  role: Role;
  company_name?: string;
  contact_name?: string;
  timezone?: string;
}

export interface UserUpdate {
  email?: string;
  password?: string;
  role?: Role;
  is_active?: boolean;
}

export interface JDCreate {
  client_id: number;
  title: string;
  description: string;
  timezone?: string;
  budget_min?: number;
  budget_max?: number;
  contract_duration?: string;
}

export interface JDUpdate {
  title?: string;
  description?: string;
  timezone?: string;
  budget_min?: number;
  budget_max?: number;
  contract_duration?: string;
}

export interface JDVendorAssignment {
  id: string;
  jd_id: string;
  vendor_id: string;
  floated_by: string;
  floated_at: string;
  deadline?: string;
  status: string;
  vendor_acknowledged: boolean;
  acknowledged_at?: string;
}

// ─── Sprint 3 additions ────────────────────────────────────────────────────

export interface CVSubmissionCreate {
  jd_id: number;
  candidate_name: string;
  candidate_email?: string;
  availability?: string;
  notice_period?: string;
  rate_expectation?: number;
  submitted_rate?: number;
  cv_file: File;
}
