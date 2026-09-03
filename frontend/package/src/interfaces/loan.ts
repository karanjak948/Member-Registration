/**
 * Loan Module Interfaces
 * -----------------------------------------
 * Mirrors the Jiinue Loan Engine API schema.
 * Used throughout services, hooks and UI.
 */

/**
 * Loan Status
 * Returned by the backend.
 */
export type LoanStatus =
  | "pending_application"
  | "appraised"
  | "approved"
  | "active"
  | "watchful"
  | "non_performing"
  | "doubtful"
  | "closed"
  | "written_off"
  | "rejected";

/**
 * Request body when applying for a loan.
 * POST /api/loans
 */
export interface LoanCreate {
  member_id: number;
  loan_product_id: number;
  guarantor_member_id: number | null;
  principal_amount: number;
  application_date: string;
  disbursement_date?: string | null;
  num_periods?: number | null;
  security_provided_value?: number | null;
  security_provided_notes?: string | null;
  deposit_paid_amount?: number | null;
}

/**
 * Amortization Schedule Entry for a Loan
 */
export interface LoanScheduleEntry {
  id: number;
  period_number: number;
  due_date: string;
  expected_amount: string;
  expected_principal: string;
  expected_interest: string;
  expected_fees: string;
  expected_penalty: string;
  paid_principal: string;
  paid_interest: string;
  paid_fees: string;
  paid_penalty: string;
  opening_balance: string;
  closing_balance: string;
  is_paid: boolean;
  paid_date: string | null;
  total_paid: string;
  remaining_principal: string;
  remaining_interest: string;
  remaining_fees: string;
  remaining_penalty: string;
  total_due: string;
}

/**
 * Guarantor linked to a loan
 */
export interface LoanGuarantorItem {
  id: number;
  guarantor_member: number;
  guarantor_name?: string;
  guarantor_membership_no?: string;
  guarantor_phone?: string;
  guarantee_amount: string;
  status: string;
  notes?: string;
}

/**
 * Collateral security linked to a loan
 */
export interface LoanCollateralItem {
  id: number;
  asset_type: string;
  asset_name: string;
  serial_or_reg_number: string;
  estimated_value: string;
  document?: string | null;
  is_verified: boolean;
  notes?: string;
}

/**
 * Repayment record
 */
export interface LoanRepayment {
  id: number;
  repayment_number: string;
  loan: number;
  loan_number: string;
  member_name: string;
  membership_number: string;
  payment_date: string;
  amount_paid: string;
  payment_method: string;
  transaction_reference: string;
  allocated_principal: string;
  allocated_interest: string;
  allocated_fees: string;
  allocated_penalty: string;
  unallocated_amount: string;
  notes?: string;
  recorded_by?: any;
  created_at: string;
}

/**
 * Loan returned by the backend.
 * GET /api/loans
 * GET /api/loans/{loan_id}
 */
export interface Loan {
  id: number;
  loan_number: string;
  member?: number;
  member_id: number;
  member_name?: string;
  membership_number?: string;
  member_phone?: string;
  member_national_id?: string;
  loan_product?: number;
  loan_product_id: number;
  product_name?: string;
  product_code?: string;
  guarantor_member_id: number | null;
  guarantor_name?: string | null;
  guarantor_phone?: string | null;
  principal_amount: string;
  security_provided_value: string | null;
  security_provided_notes: string | null;
  deposit_paid_amount: string | null;
  application_date: string;
  disbursement_date: string | null;
  maturity_date?: string | null;
  num_periods?: number | null;
  interest_rate?: string | number;
  interest_method?: string;
  repayment_frequency?: string;
  status: LoanStatus;
  outstanding_balance: string;
  principal_balance?: string;
  interest_balance?: string;
  penalty_balance?: string;
  fees_balance?: string;
  total_principal_paid?: string;
  total_interest_paid?: string;
  total_fees_paid?: string;
  total_penalties_paid?: string;
  days_overdue?: number;
  last_payment_date?: string | null;
  appraisal_notes?: string;
  approval_notes?: string;
  rejection_reason?: string;
  schedule_entries?: LoanScheduleEntry[];
  guarantors?: LoanGuarantorItem[];
  collaterals?: LoanCollateralItem[];
  created_at: string;
}

/**
 * Update request.
 */
export interface LoanUpdate {
  status?: LoanStatus | null;
  outstanding_balance?: number | null;
  guarantor_member_id?: number | null;
  security_provided_value?: number | null;
  security_provided_notes?: string | null;
  deposit_paid_amount?: number | null;
}

/**
 * Collection of loans.
 */
export type LoanList = Loan[];

/**
 * Generic API validation error.
 */
export interface LoanValidationError {
  detail: {
    loc: (string | number)[];
    msg: string;
    type: string;
  }[];
}