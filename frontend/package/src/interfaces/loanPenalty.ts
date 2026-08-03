/**
 * Loan Product Penalty Interfaces
 * --------------------------------
 * Mirrors the Jiinue Loan Engine API schema.
 */

/**
 * When should a penalty be triggered.
 */
export type PenaltyTrigger =
  | "late_payment"
  | "missed_payment"
  | "default"
  | "manual";

/**
 * What is the penalty calculated on.
 */
export type PenaltyBasis =
  | "principal"
  | "outstanding_balance"
  | "interest"
  | "installment";

/**
 * Payload used when creating a loan product penalty.
 */
export interface LoanProductPenaltyCreate {
  penalty_name: string;

  trigger: PenaltyTrigger;

  basis: PenaltyBasis;

  value: number;

  is_active: boolean;

  ledger_account_name: string;
}

/**
 * Penalty returned from the backend.
 */
export interface LoanProductPenalty {
  id: number;

  loan_product_id: number;

  penalty_name: string;

  trigger: PenaltyTrigger;

  basis: PenaltyBasis;

  value: string;

  is_active: boolean;

  ledger_account_name: string;
}

/**
 * Collection of penalties.
 */
export type LoanPenaltyList = LoanProductPenalty[];