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
  | "fixed_amount"
  | "percentage";

/**
 * When the fee is charged.
 *
 * NOTE:
 * The Royal API does NOT currently return this field
 * in GET /loan-products/{id}, although it may be used
 * when creating a product.
 */
export type FeeChargeStage =
  | "application"
  | "approval"
  | "disbursement"
  | "repayment";

/**
 * Fee basis.
 */
export type FeeBasis =
  | "loan_amount"
  | "principal"
  | "interest";

/**
 * Payload used for Create/Update.
 */
export interface LoanProductFeeCreate {
  fee_name: string;

  fee_type: FeeType;

  fee_value: number;

  fee_basis: FeeBasis;

  /**
   * Optional because the API does not return it.
   * The UI should default this to "application"
   * when creating a new fee.
   */
  charge_stage?: FeeChargeStage;

  affects_principal: boolean;

  show_in_statement: boolean;

  ledger_account_name: string;
}

/**
 * Fee returned by Royal API.
 */
export interface LoanProductFee {
  id: number;

  loan_product_id: number;

  fee_name: string;

  fee_type: FeeType;

  fee_value: string;

  fee_basis: FeeBasis;

  /**
   * Optional because GET responses currently omit it.
   */
  charge_stage?: FeeChargeStage;

  affects_principal: boolean;

  show_in_statement: boolean;

  ledger_account_name: string;

  /**
   * Optional because current API responses omit them.
   */
  created_at?: string;

  updated_at?: string;
}

/**
 * Fee collection.
 */
export type LoanFeeList = LoanProductFee[];