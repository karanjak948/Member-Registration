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

  disbursement_date: string | null;

  num_periods: number | null;

  security_provided_value: number | null;

  security_provided_notes: string | null;

  deposit_paid_amount: number | null;
}

/**
 * Loan returned by the backend.
 * GET /api/loans
 * GET /api/loans/{loan_id}
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
 *
 * The current API documentation does not expose
 * a dedicated update payload, so this interface
 * can be expanded as the backend evolves.
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