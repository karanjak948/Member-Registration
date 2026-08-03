/**
 * Loan Module Constants
 * -------------------------------------------------------
 * Centralized option lists used throughout the Loans module.
 * Mirrors the Royal Loan Engine API.
 */

export const INTEREST_METHODS = [
  {
    value: "flat",
    label: "Flat Rate",
  },
  {
    value: "reducing_balance",
    label: "Reducing Balance",
  },
] as const;

export const INTEREST_PERIODS = [
  {
    value: "daily",
    label: "Daily",
  },
  {
    value: "weekly",
    label: "Weekly",
  },
  {
    value: "monthly",
    label: "Monthly",
  },
  {
    value: "yearly",
    label: "Yearly",
  },
] as const;

export const REPAYMENT_FREQUENCIES = [
  {
    value: "daily",
    label: "Daily",
  },
  {
    value: "weekly",
    label: "Weekly",
  },
  {
    value: "monthly",
    label: "Monthly",
  },
  {
    value: "quarterly",
    label: "Quarterly",
  },
  {
    value: "yearly",
    label: "Yearly",
  },
] as const;

/**
 * API expects percentage/fixed for security.
 */
export const SECURITY_TYPES = [
  {
    value: "percentage",
    label: "Percentage",
  },
  {
    value: "fixed",
    label: "Fixed Amount",
  },
] as const;

/**
 * Product Fees
 */
export const FEE_TYPES = [
  {
    value: "fixed",
    label: "Fixed Amount",
  },
  {
    value: "percentage",
    label: "Percentage",
  },
] as const;

export const FEE_BASES = [
  {
    value: "loan_amount",
    label: "Loan Amount",
  },
  {
    value: "principal",
    label: "Principal",
  },
  {
    value: "interest",
    label: "Interest",
  },
] as const;

/**
 * Product Penalties
 */
export const PENALTY_TYPES = [
  {
    value: "percentage",
    label: "Percentage",
  },
  {
    value: "fixed",
    label: "Fixed Amount",
  },
] as const;

export const PENALTY_TRIGGERS = [
  {
    value: "late_payment",
    label: "Late Payment",
  },
  {
    value: "missed_payment",
    label: "Missed Payment",
  },
  {
    value: "default",
    label: "Default",
  },
  {
    value: "manual",
    label: "Manual",
  },
] as const;

export const PENALTY_BASES = [
  {
    value: "principal",
    label: "Principal",
  },
  {
    value: "outstanding_balance",
    label: "Outstanding Balance",
  },
  {
    value: "interest",
    label: "Interest",
  },
  {
    value: "installment",
    label: "Installment",
  },
] as const;

/**
 * Deposit Configuration
 */
export const DEPOSIT_TYPES = [
  {
    value: "fixed",
    label: "Fixed Amount",
  },
  {
    value: "percentage",
    label: "Percentage",
  },
] as const;

/**
 * Offset Source
 */
export const OFFSET_COVER_TYPES = [
  {
    value: "savings",
    label: "Savings",
  },
  {
    value: "shares",
    label: "Shares",
  },
  {
    value: "deposit",
    label: "Deposit",
  },
] as const;

/**
 * Allocation Priority
 */
export const ALLOCATION_ORDERS = [
  {
    value: "penalty,interest,principal",
    label: "Penalty → Interest → Principal",
  },
  {
    value: "interest,penalty,principal",
    label: "Interest → Penalty → Principal",
  },
  {
    value: "interest,principal,penalty",
    label: "Interest → Principal → Penalty",
  },
  {
    value: "principal,interest,penalty",
    label: "Principal → Interest → Penalty",
  },
] as const;

/**
 * Loan Status
 */
export const LOAN_STATUSES = [
  {
    value: "PENDING",
    label: "Pending",
  },
  {
    value: "APPROVED",
    label: "Approved",
  },
  {
    value: "REJECTED",
    label: "Rejected",
  },
  {
    value: "DISBURSED",
    label: "Disbursed",
  },
  {
    value: "ACTIVE",
    label: "Active",
  },
  {
    value: "CLOSED",
    label: "Closed",
  },
] as const;