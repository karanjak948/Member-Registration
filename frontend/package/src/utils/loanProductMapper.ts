import {
  LoanProduct,
  LoanProductCreate,
} from "@/interfaces/loanProduct";

export function mapLoanProductToForm(
  product: LoanProduct
): LoanProductCreate {
  return {
    product_code: product.product_code,

    product_name: product.product_name,

    effective_date: product.effective_date,

    interest_method: product.interest_method,

    interest_rate: Number(
      product.interest_rate ?? 0
    ),

    interest_period: product.interest_period,

    repayment_frequency:
      product.repayment_frequency,

    max_repayment_period:
      product.max_repayment_period ?? 1,

    requires_guarantor:
      product.requires_guarantor,

    is_multiple_of_savings:
      product.is_multiple_of_savings,

    savings_multiplier: Number(
      product.savings_multiplier ?? 0
    ),

    requires_security:
      product.requires_security,

    security_type:
      product.security_type ??
      "percentage",

    security_value: Number(
      product.security_value ?? 0
    ),

    security_notes:
      product.security_notes ?? "",

    requires_deposit:
      product.requires_deposit,

    deposit_type:
      product.deposit_type ??
      "percentage",

    deposit_value: Number(
      product.deposit_value ?? 0
    ),

    late_payment_penalty_type:
      product.late_payment_penalty_type ??
      "percentage",

    late_payment_penalty_value: Number(
      product.late_payment_penalty_value ?? 0
    ),

    requires_appraisal:
      product.requires_appraisal,

    requires_board_approval:
      product.requires_board_approval,

    watchful_after_days:
      product.watchful_after_days ?? 30,

    non_performing_after_days:
      product.non_performing_after_days ??
      90,

    doubtful_after_days:
      product.doubtful_after_days ?? 180,

    allows_rescheduling:
      product.allows_rescheduling,

    reschedule_fee_type:
      product.reschedule_fee_type ??
      "percentage",

    reschedule_fee_value: Number(
      product.reschedule_fee_value ?? 0
    ),

    allows_offset:
      product.allows_offset,

    offset_covers:
      product.offset_covers ??
      "savings",

    offset_fee_type:
      product.offset_fee_type ??
      "percentage",

    offset_fee_value: Number(
      product.offset_fee_value ?? 0
    ),

    allocation_order:
      product.allocation_order,

    fees: product.fees.map((fee) => ({
      fee_name: fee.fee_name,
      fee_type: fee.fee_type,
      fee_value: Number(fee.fee_value),

      fee_basis: fee.fee_basis,

      charge_stage: fee.charge_stage,

      affects_principal:
        fee.affects_principal,

      show_in_statement:
        fee.show_in_statement,

      ledger_account_name:
        fee.ledger_account_name,
    })),

    penalties: product.penalties.map(
      (penalty) => ({
        penalty_name:
          penalty.penalty_name,

        trigger:
          penalty.trigger,

        basis:
          penalty.basis,

        value: Number(
          penalty.value
        ),

        is_active:
          penalty.is_active,

        ledger_account_name:
          penalty.ledger_account_name,
      })
    ),
  };
}