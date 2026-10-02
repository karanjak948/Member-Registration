import api from "@/services/api";
import {
  SavingsPayment,
  CreateSavingsPaymentPayload,
  SavingsSummary,
} from "@/types/savings";

class SavingsService {
  async getPayments(params?: {
    search?: string;
    member?: number;
    savings_type?: string;
    payment_mode?: string;
    year?: number;
    month?: number;
    week?: number;
    ordering?: string;
  }): Promise<SavingsPayment[]> {
    const response = await api.get("/savings-payments/", { params });
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
  }

  async getSummary(): Promise<SavingsSummary> {
    const response = await api.get<SavingsSummary>("/savings-payments/summary/");
    return response.data;
  }

  async createPayment(payload: CreateSavingsPaymentPayload): Promise<SavingsPayment> {
    const response = await api.post<SavingsPayment>("/savings-payments/", payload);
    return response.data;
  }

  async deletePayment(id: number): Promise<void> {
    await api.delete(`/savings-payments/${id}/`);
  }

  async bulkUpload(file: File): Promise<{
    success: boolean;
    imported_count: number;
    total_amount: string;
    errors: string[];
    message?: string;
  }> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/savings-payments/bulk-upload/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  }

  async downloadTemplate(): Promise<Blob> {
    const response = await api.get("/savings-payments/download-template/", {
      responseType: "blob",
    });
    return response.data;
  }

  async reversePayment(id: number, reason: string): Promise<any> {
    const response = await api.post(`/savings-payments/${id}/reverse/`, { reason });
    return response.data;
  }

  async getWithdrawals(params?: {
    start_date?: string;
    end_date?: string;
    withdrawal_type?: string;
    member?: number;
    search?: string;
  }): Promise<any[]> {
    const response = await api.get("/savings-withdrawals/", { params });
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
  }

  async createWithdrawal(payload: {
    member: number;
    withdrawal_type: string;
    amount: number | string;
    date_withdrawn: string;
    savings_drawn_from: string;
    bank: string;
    document_code?: string;
    reason?: string;
  }): Promise<any> {
    const response = await api.post("/savings-withdrawals/", payload);
    return response.data;
  }

  async deleteWithdrawal(id: number): Promise<void> {
    await api.delete(`/savings-withdrawals/${id}/`);
  }
}


const savingsService = new SavingsService();
export default savingsService;
