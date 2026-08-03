/**
 * Loan Product Fee Interfaces
 * ------------------------------------
 * Mirrors the Jiinue Loan Engine API.
 */

/**
 * Fee charging method.
 */
export type FeeType =
  | "fixed"
  | "percentage";

/**
 * When the fee is charged.
 */
export type FeeChargeStage =
  | "application"
  | "approval"
  | "disbursement"
  | "repayment";

/**
 * Fee basis for calculation.
 */
export type FeeBasis =
  | "loan_amount"
  | "principal"
  | "interest";

/**
 * Payload sent when creating a loan product fee.
 */
export interface LoanProductFeeCreate {
  fee_name: string;

  fee_type: FeeType;

  fee_value: number;

  fee_basis: FeeBasis;

  charge_stage: FeeChargeStage;

  affects_principal: boolean;

  show_in_statement: boolean;

  ledger_account_name: string;
}

/**
 * Fee returned by the backend.
 */
export interface LoanProductFee {
  id: number;

  loan_product_id: number;

  fee_name: string;

  fee_type: FeeType;

  fee_value: string;

  fee_basis: FeeBasis;

  charge_stage: FeeChargeStage;

  affects_principal: boolean;

  show_in_statement: boolean;

  ledger_account_name: string;

  created_at: string;

  updated_at: string;
}

/**
 * Collection of fees.
 */
export type LoanFeeList = LoanProductFee[];