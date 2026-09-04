/**
 * Loan Product Interfaces
 * --------------------------------------------------------
 * Mirrors the Royal Loan Engine API exactly.
 */

import {
  LoanProductFee,
  LoanProductFeeCreate,
} from "./loanFee";

import {
  LoanProductPenalty,
  LoanProductPenaltyCreate,
} from "./loanPenalty";

/* ===========================
   ENUM TYPES
=========================== */

export type InterestMethod =
  | "flat"
  | "reducing_balance";

export type InterestPeriod =
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly";

export type RepaymentFrequency =
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "yearly";

export type PercentageOrFixed =
  | "percentage"
  | "fixed"
  | "fixed_amount";

export type OffsetCovers =
  | "savings"
  | "shares"
  | "deposit"
  | "security"
  | "both";

export type AllocationOrder =
  | "penalty,fees,interest,principal"
  | "penalty,interest,principal"
  | "interest,fees,penalty,principal"
  | "interest,penalty,principal"
  | "interest,principal,penalty"
  | "principal,interest,penalty"
  | string;

/* ===========================
   CREATE
=========================== */

export interface LoanProductCreate {
  product_code: string;

  product_name: string;

  effective_date: string;

  interest_method: InterestMethod;

  interest_rate: number;

  interest_period: InterestPeriod;

  repayment_frequency: RepaymentFrequency;

  max_repayment_period: number;

  requires_guarantor: boolean;

  is_multiple_of_savings: boolean;

  savings_multiplier: number;

  requires_security: boolean;

  security_type: PercentageOrFixed;

  security_value: number;

  security_notes: string;

  requires_deposit: boolean;

  deposit_type: PercentageOrFixed;

  deposit_value: number;

  late_payment_penalty_type: PercentageOrFixed;

  late_payment_penalty_value: number;

  requires_appraisal: boolean;

  requires_board_approval: boolean;

  watchful_after_days: number;

  non_performing_after_days: number;

  doubtful_after_days: number;

  allows_rescheduling: boolean;

  reschedule_fee_type: PercentageOrFixed;

  reschedule_fee_value: number;

  allows_offset: boolean;

  offset_covers: OffsetCovers;

  offset_fee_type: PercentageOrFixed;

  offset_fee_value: number;

  allocation_order: AllocationOrder;

  fees: LoanProductFeeCreate[];

  penalties: LoanProductPenaltyCreate[];
}

/* ===========================
   RESPONSE
=========================== */

export interface LoanProduct {
  id: number;

  product_code: string;

  version_number: number;

  product_name: string;

  is_active: boolean;

  effective_date: string;

  interest_method: InterestMethod;

  interest_rate: string;

  interest_period: InterestPeriod;

  repayment_frequency: RepaymentFrequency;

  min_repayment_period?: number;

  max_repayment_period: number | null;

  min_amount?: string | number;

  max_amount?: string | number | null;

  requires_guarantor: boolean;

  is_multiple_of_savings: boolean;

  savings_multiplier: string | null;

  requires_security: boolean;

  security_type: PercentageOrFixed | null;

  security_value: string | null;

  security_notes: string | null;

  requires_deposit: boolean;

  deposit_type: PercentageOrFixed | null;

  deposit_value: string | null;

  late_payment_penalty_type: PercentageOrFixed | null;

  late_payment_penalty_value: string | null;

  requires_appraisal: boolean;

  requires_board_approval: boolean;

  watchful_after_days: number | null;

  non_performing_after_days: number | null;

  doubtful_after_days: number | null;

  allows_rescheduling: boolean;

  reschedule_fee_type: PercentageOrFixed | null;

  reschedule_fee_value: string | null;

  allows_offset: boolean;

  offset_covers: OffsetCovers | null;

  offset_fee_type: PercentageOrFixed | null;

  offset_fee_value: string | null;

  allocation_order: AllocationOrder;

  created_at: string;

  updated_at: string;

  fees: LoanProductFee[];

  penalties: LoanProductPenalty[];
}

/* ===========================
   UPDATE
=========================== */

export interface LoanProductUpdate
  extends Partial<LoanProductCreate> {}

/* ===========================
   LIST
=========================== */

export type LoanProductList =
  LoanProduct[];