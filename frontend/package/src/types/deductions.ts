export interface MonthlyDeduction {
  id: number;
  organization: number;
  member: number;
  member_name: string;
  membership_number: string;
  national_id: string;
  phone_number: string;
  category_name?: string;
  month: number;
  year: number;
  charges: string;
  loan_principal: string;
  loan_interest: string;
  registration_fee: string;
  savings: string;
  shares: string;
  others: string;
  total_expected: string;
  amount_paid: string;
  balance: string;
  status: "pending" | "partial" | "paid" | "overpaid";
  paid_thro?: string;
  date_paid?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DeductionSummary {
  total_expected: string;
  total_paid: string;
  total_balance: string;
  total_charges: string;
  total_principal: string;
  total_interest: string;
  total_savings: string;
  total_shares: string;
  total_others: string;
  total_members: number;
  pending_count: number;
  partial_count: number;
  paid_count: number;
  overpaid_count: number;
}

export interface BulkUploadResult {
  success: boolean;
  batch_no?: string;
  total_rows: number;
  success_count: number;
  error_count: number;
  total_remitted: string;
  total_savings_allocated: string;
  total_shares_allocated: string;
  total_loans_allocated: string;
  items: Array<{
    member_id: number;
    membership_number: string;
    member_name: string;
    remitted_amount: string;
    savings_allocated: string;
    shares_allocated: string;
    loan_allocated: string;
    new_balance: string;
    status: string;
  }>;
  errors: string[];
  error?: string;
}

export interface CreateDeductionPayload {
  member: number;
  month: number;
  year: number;
  charges?: number | string;
  loan_principal?: number | string;
  loan_interest?: number | string;
  registration_fee?: number | string;
  savings?: number | string;
  shares?: number | string;
  others?: number | string;
  amount_paid?: number | string;
  paid_thro?: string;
  date_paid?: string;
  notes?: string;
}
