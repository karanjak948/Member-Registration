import api from "@/services/api";

export interface ReversalLog {
  id: number;
  payment_type: "savings" | "shares" | "loan_repayment";
  payment_type_display: string;
  original_payment_id: string;
  document_or_receipt_no: string;
  member: number | null;
  member_name: string;
  membership_number: string;
  amount_reversed: string | number;
  reversal_reason: string;
  reversed_by: number | null;
  reversed_by_username: string;
  reversed_at: string;
  snapshot_data: Record<string, any>;
  created_at: string;
}

class ReversalService {
  async getReversals(params?: {
    payment_type?: string;
    member?: number;
    start_date?: string;
    end_date?: string;
    search?: string;
  }): Promise<ReversalLog[]> {
    const response = await api.get("/reversals/", { params });
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
  }

  async reverseSavings(id: number, reason: string): Promise<any> {
    const response = await api.post(`/savings-payments/${id}/reverse/`, { reason });
    return response.data;
  }

  async reverseShares(id: number, reason: string): Promise<any> {
    const response = await api.post(`/shares-payments/${id}/reverse/`, { reason });
    return response.data;
  }

  async reverseLoanRepayment(id: number, reason: string): Promise<any> {
    const response = await api.post(`/repayments/${id}/reverse/`, { reason });
    return response.data;
  }
}

const reversalService = new ReversalService();
export default reversalService;
