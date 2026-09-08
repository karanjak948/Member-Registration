export type SavingsType = "normal" | "welfare";
export type TransactionType = "money_in" | "money_out";
export type PaymentMode = "mpesa" | "cash" | "bank" | "cheque";

export interface SavingsPayment {
  id: number;
  organization?: number;
  member: number;
  member_name: string;
  membership_number: string;
  member_phone?: string;
  document_no: string;
  savings_type: SavingsType;
  savings_type_display: string;
  transaction_type: TransactionType;
  amount: string;
  money_in: string;
  money_out: string;
  currency: string;
  payment_mode: PaymentMode;
  payment_mode_display: string;
  bank_name?: string;
  transaction_no?: string;
  paid_on: string;
  paid_by?: string;
  week?: number;
  month?: number;
  year?: number;
  remarks?: string;
  recorded_by?: number;
  recorded_by_username?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSavingsPaymentPayload {
  member: number;
  document_no?: string;
  savings_type: SavingsType;
  transaction_type?: TransactionType;
  amount: number | string;
  currency: string;
  payment_mode: PaymentMode;
  bank_name?: string;
  transaction_no?: string;
  paid_on: string;
  paid_by?: string;
  week?: number;
  month?: number;
  year?: number;
  remarks?: string;
}

export interface SavingsSummary {
  transactions_count: number;
  total_savings: string;
  net_savings: string;
  total_money_in: string;
  total_money_out: string;
  normal_savings: string;
  welfare_savings: string;
}
