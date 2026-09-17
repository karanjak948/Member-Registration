import api from "@/services/api";
import {
  SharePayment,
  CreateSharePaymentPayload,
  SharesSummary,
} from "@/types/shares";

class SharesService {
  async getPayments(params?: {
    search?: string;
    member?: number;
    share_type?: string;
    payment_mode?: string;
    year?: number;
    month?: number;
    ordering?: string;
  }): Promise<SharePayment[]> {
    const response = await api.get("/shares-payments/", { params });
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
  }

  async getSummary(): Promise<SharesSummary> {
    const response = await api.get<SharesSummary>("/shares-payments/summary/");
    return response.data;
  }

  async createPayment(payload: CreateSharePaymentPayload): Promise<SharePayment> {
    const response = await api.post<SharePayment>("/shares-payments/", payload);
    return response.data;
  }

  async deletePayment(id: number): Promise<void> {
    await api.delete(`/shares-payments/${id}/`);
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
    const response = await api.post("/shares-payments/bulk-upload/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  }

  async downloadTemplate(): Promise<Blob> {
    const response = await api.get("/shares-payments/download-template/", {
      responseType: "blob",
    });
    return response.data;
  }
}

const sharesService = new SharesService();
export default sharesService;
