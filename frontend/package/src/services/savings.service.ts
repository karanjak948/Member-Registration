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
}

const savingsService = new SavingsService();
export default savingsService;
