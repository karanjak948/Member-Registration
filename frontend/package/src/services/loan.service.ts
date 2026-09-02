import api from "./api";
import {
  Loan,
  LoanCreate,
  LoanList,
  LoanUpdate,
} from "@/interfaces/loan";

export interface LoanCalculatorPreviewParams {
  principal: number | string;
  loan_product_id?: number | string;
  interest_rate?: number | string;
  interest_method?: "flat" | "reducing_balance" | "compound";
  interest_period?: "monthly" | "yearly";
  repayment_frequency?: "daily" | "weekly" | "monthly" | "yearly";
  num_periods: number;
  start_date?: string;
}

export interface LoanCalculatorPreviewResponse {
  principal: string;
  interest_rate: string;
  interest_method: string;
  interest_period: string;
  repayment_frequency: string;
  num_periods: number;
  total_interest: string;
  total_payable: string;
  regular_installment: string;
  fees: Array<{ fee_name: string; amount: string; affects_principal: boolean }>;
  schedule: Array<{
    period_number: number;
    due_date: string;
    expected_amount: string;
    expected_principal: string;
    expected_interest: string;
    opening_balance: string;
    closing_balance: string;
  }>;
}

export interface RepaymentCreatePayload {
  loan: number;
  payment_date?: string;
  amount_paid: number | string;
  payment_method: string;
  transaction_reference: string;
  notes?: string;
}

class LoanService {
  /**
   * GET /api/loans/
   */
  async getAll(params?: { status?: string; member_id?: number; search?: string }): Promise<LoanList> {
    try {
      const response = await api.get("/loans/", { params });
      const data = response.data;
      return Array.isArray(data) ? data : (data?.results || []);
    } catch (error: any) {
      console.error("Failed to fetch loans:", error);
      throw error;
    }
  }

  /**
   * GET /api/loans/{loan_id}/
   */
  async getById(loanId: number): Promise<Loan> {
    try {
      const response = await api.get(`/loans/${loanId}/`);
      return response.data;
    } catch (error: any) {
      console.error(`Failed to fetch loan ${loanId}:`, error);
      throw error;
    }
  }

  /**
   * POST /api/loans/
   */
  async applyLoan(data: LoanCreate): Promise<Loan> {
    try {
      const response = await api.post("/loans/", data);
      return response.data;
    } catch (error: any) {
      console.error("Failed to apply loan:", error);
      throw error;
    }
  }

  /**
   * POST /api/loans/calculate_preview/
   */
  async calculatePreview(params: LoanCalculatorPreviewParams): Promise<LoanCalculatorPreviewResponse> {
    try {
      const response = await api.post("/loans/calculate_preview/", params);
      return response.data;
    } catch (error: any) {
      console.error("Failed to calculate preview:", error);
      throw error;
    }
  }

  /**
   * POST /api/loans/{id}/appraise/
   */
  async appraise(loanId: number, notes?: string): Promise<Loan> {
    const response = await api.post(`/loans/${loanId}/appraise/`, { notes });
    return response.data;
  }

  /**
   * POST /api/loans/{id}/approve/
   */
  async approve(loanId: number, notes?: string): Promise<Loan> {
    const response = await api.post(`/loans/${loanId}/approve/`, { notes });
    return response.data;
  }

  /**
   * POST /api/loans/{id}/reject/
   */
  async reject(loanId: number, reason: string): Promise<Loan> {
    const response = await api.post(`/loans/${loanId}/reject/`, { reason });
    return response.data;
  }

  /**
   * POST /api/loans/{id}/disburse/
   */
  async disburse(loanId: number, disbursementDate?: string): Promise<Loan> {
    const response = await api.post(`/loans/${loanId}/disburse/`, {
      disbursement_date: disbursementDate,
    });
    return response.data;
  }

  /**
   * GET /api/loans/aging_report/
   */
  async getAgingReport(): Promise<any> {
    const response = await api.get("/loans/aging_report/");
    return response.data;
  }

  /**
   * Repayments API: POST /api/repayments/
   */
  async recordRepayment(data: RepaymentCreatePayload): Promise<any> {
    const response = await api.post("/repayments/", data);
    return response.data;
  }

  /**
   * GET /api/repayments/
   */
  async getRepayments(loanId?: number): Promise<any[]> {
    const response = await api.get("/repayments/", {
      params: loanId ? { loan_id: loanId } : {},
    });
    const data = response.data;
    return Array.isArray(data) ? data : (data?.results || []);
  }

  /**
   * PUT /api/loans/{loan_id}/
   */
  async update(loanId: number, data: LoanUpdate): Promise<Loan> {
    const response = await api.put(`/loans/${loanId}/`, data);
    return response.data;
  }

  /**
   * DELETE /api/loans/{loan_id}/
   */
  async delete(loanId: number): Promise<void> {
    await api.delete(`/loans/${loanId}/`);
  }
}

export default new LoanService();