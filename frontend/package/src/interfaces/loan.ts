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
  | "approved"
  | "rejected"
  | "disbursed"
  | "active"
  | "completed"
  | "defaulted";

/**
 * Request body when applying for a loan.
 * POST /api/loans
 */
export interface LoanCreate {
  member_id: number;
  loan_product_id: number;

  guarantor_member_id?: number | null;

  principal_amount: number;

  application_date: string;

  disbursement_date?: string | null;

  num_periods: number;

  security_provided_value?: number | null;

  security_provided_notes?: string;

  deposit_paid_amount?: number | null;
}

/**
 * Loan returned by the backend.
 * GET /api/loans
 * GET /api/loans/{id}
 */
export interface Loan {
  id: number;

  loan_number: string;

  member_id: number;

  loan_product_id: number;

  guarantor_member_id: number | null;

  principal_amount: string;

  security_provided_value: string | null;

  security_provided_notes: string | null;

  deposit_paid_amount: string | null;

  application_date: string;

  disbursement_date: string | null;

  status: LoanStatus;

  outstanding_balance: string;

  created_at: string;
}

/**
 * Update request.
 * PUT /api/loans/{loan_id}
 */
export interface LoanUpdate {
  status?: LoanStatus;

  outstanding_balance?: number;

  guarantor_member_id?: number | null;

  security_provided_value?: number | null;

  security_provided_notes?: string;

  deposit_paid_amount?: number | null;
}

/**
 * Loan list response.
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