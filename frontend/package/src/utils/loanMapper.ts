import {
  Loan,
  LoanCreate,
} from "@/interfaces/loan";

export function mapLoanToForm(
  loan: Loan,
): LoanCreate {
  return {
    member_id: loan.member_id,

    loan_product_id: loan.loan_product_id,

    guarantor_member_id:
      loan.guarantor_member_id ?? null,

    principal_amount: Number(
      loan.principal_amount ?? 0,
    ),

    application_date:
      loan.application_date,

    disbursement_date:
      loan.disbursement_date ?? null,

    num_periods: null,

    security_provided_value:
      loan.security_provided_value !== null
        ? Number(loan.security_provided_value)
        : null,

    security_provided_notes:
      loan.security_provided_notes ?? null,

    deposit_paid_amount:
      loan.deposit_paid_amount !== null
        ? Number(loan.deposit_paid_amount)
        : null,
  };
}