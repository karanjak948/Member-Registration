import api from "./api";
import {
  Loan,
  LoanCreate,
  LoanList,
  LoanUpdate,
  LoanApprovePayload,
  LoanDisbursePayload,
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
      if (error.response?.status === 400) {
        console.warn("[Loan Application Policy Validation]:", error.response?.data);
      } else {
        console.error("Failed to apply loan:", error);
      }
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
  async approve(loanId: number, payload?: string | LoanApprovePayload): Promise<Loan> {
    const body = typeof payload === "string" ? { notes: payload } : (payload || {});
    const response = await api.post(`/loans/${loanId}/approve/`, body);
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
  async disburse(loanId: number, payload?: string | LoanDisbursePayload): Promise<Loan> {
    const body = typeof payload === "string" ? { disbursement_date: payload } : (payload || {});
    const response = await api.post(`/loans/${loanId}/disburse/`, body);
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

  /**
   * POST /api/loans/send_overdue_alerts/
   */
  async sendOverdueAlerts(): Promise<any> {
    const response = await api.post("/loans/send_overdue_alerts/");
    return response.data;
  }

  /**
   * POST /api/loans/send_due_reminders/
   */
  async sendDueDateReminders(days: number = 3): Promise<any> {
    const response = await api.post("/loans/send_due_reminders/", { days });
    return response.data;
  }

  /**
   * GET /api/sms/logs/
   */
  async getSMSLogs(params?: { status?: string; event_type?: string; search?: string }): Promise<any> {
    const response = await api.get("/sms/logs/", { params });
    const data = response.data;
    return Array.isArray(data) ? data : (data?.results || []);
  }

  /**
   * POST /api/sms/send/
   */
  async sendSMS(payload: {
    contacts?: string[];
    phone_number?: string;
    message: string;
    recipient_type?: string;
  }): Promise<any> {
    const response = await api.post("/sms/send/", payload);
    return response.data;
  }

  /**
   * DELETE /api/sms/logs/{id}/
   */
  async deleteSMSLog(id: number): Promise<void> {
    await api.delete(`/sms/logs/${id}/`);
  }

  /**
   * DELETE /api/sms/logs/clear-all/
   */
  async clearAllSMSLogs(): Promise<any> {
    const response = await api.delete("/sms/logs/clear-all/");
    return response.data;
  }

  /**
   * DELETE /api/ledger-transactions/{id}/
   */
  async deleteLedgerTransaction(id: number): Promise<void> {
    await api.delete(`/ledger-transactions/${id}/`);
  }

  /**
   * DELETE /api/ledger-accounts/{id}/
   */
  async deleteLedgerAccount(id: number): Promise<void> {
    await api.delete(`/ledger-accounts/${id}/`);
  }

  /**
   * PATCH /api/ledger-accounts/{id}/
   */
  async updateLedgerAccount(id: number, data: { is_active?: boolean; account_name?: string; description?: string }): Promise<any> {
    const response = await api.patch(`/ledger-accounts/${id}/`, data);
    return response.data;
  }

  /**
   * GET /api/ledger-transactions/income-report/
   */
  async getIncomeReport(params?: {
    start_date?: string;
    end_date?: string;
    account_code?: string;
  }): Promise<{
    start_date?: string;
    end_date?: string;
    account_code?: string;
    summary: {
      total_form_fees: number;
      total_processing_fees: number;
      total_security_deposits: number;
      total_interest_income: number;
      total_penalties: number;
      grand_total: number;
    };
    count: number;
    entries: Array<{
      entry_id: number;
      transaction_id: number;
      transaction_number: string;
      transaction_date: string;
      account_code: string;
      account_name: string;
      account_type: string;
      entry_type: "debit" | "credit";
      amount: number;
      narration: string;
      loan_id?: number;
      loan_number?: string;
      reference_type: string;
      reference_id: string;
    }>;
  }> {
    const response = await api.get("/ledger-transactions/income-report/", { params });
    return response.data;
  }
}

export default new LoanService();