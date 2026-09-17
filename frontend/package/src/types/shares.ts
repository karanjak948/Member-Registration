export type ShareType = "ordinary" | "preference" | "capital";
export type PaymentMode = "mpesa" | "cash" | "bank" | "cheque";

export interface SharePayment {
  id: number;
  organization?: number;
  member: number;
  member_name: string;
  membership_number: string;
  member_phone?: string;
  document_no: string;
  share_type: ShareType;
  share_type_display: string;
  number_of_shares: string | number;
  share_price: string | number;
  total_amount: string | number;
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

export interface CreateSharePaymentPayload {
  member: number;
  document_no?: string;
  share_type: ShareType;
  number_of_shares: number | string;
  share_price: number | string;
  total_amount?: number | string;
  currency?: string;
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

export interface SharesSummary {
  transactions_count: number;
  total_share_capital: string;
  total_shares_issued: string;
  shareholders_count: number;
  ordinary_shares_amount: string;
  preference_shares_amount: string;
  capital_shares_amount: string;
}
