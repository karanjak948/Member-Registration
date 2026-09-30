import api from "@/services/api";
import {
  MonthlyDeduction,
  DeductionSummary,
  BulkUploadResult,
  CreateDeductionPayload,
} from "@/types/deductions";

class DeductionsService {
  async getDeductions(params?: {
    month?: number;
    year?: number;
    status?: string;
    search?: string;
    ordering?: string;
    page?: number;
    page_size?: number;
  }): Promise<{ results: MonthlyDeduction[]; count: number }> {
    const response = await api.get("/monthly-deductions/", { params });
    const data = response.data;
    if (Array.isArray(data)) {
      return { results: data, count: data.length };
    }
    if (Array.isArray(data?.results)) {
      return { results: data.results, count: data.count || data.results.length };
    }
    return { results: [], count: 0 };
  }

  async getSummary(params?: { month?: number; year?: number }): Promise<DeductionSummary> {
    const response = await api.get<DeductionSummary>("/monthly-deductions/summary/", { params });
    return response.data;
  }

  async generateDeductions(payload: {
    month: number;
    year: number;
    default_savings?: number | string;
    default_shares?: number | string;
  }): Promise<{ message: string; data: any }> {
    const response = await api.post("/monthly-deductions/generate/", payload);
    return response.data;
  }

  async regenerateDeductions(payload: {
    month: number;
    year: number;
    default_savings?: number | string;
    default_shares?: number | string;
  }): Promise<{ message: string; data: any }> {
    const response = await api.post("/monthly-deductions/regenerate/", payload);
    return response.data;
  }

  async createDeduction(payload: CreateDeductionPayload): Promise<MonthlyDeduction> {
    const response = await api.post<MonthlyDeduction>("/monthly-deductions/", payload);
    return response.data;
  }

  async updateDeduction(
    id: number,
    payload: Partial<CreateDeductionPayload>
  ): Promise<MonthlyDeduction> {
    const response = await api.patch<MonthlyDeduction>(`/monthly-deductions/${id}/`, payload);
    return response.data;
  }

  async deleteDeduction(id: number): Promise<void> {
    await api.delete(`/monthly-deductions/${id}/`);
  }

  async downloadTemplate(month?: number, year?: number): Promise<Blob> {
    const response = await api.get("/monthly-deductions/template/", {
      params: { month, year },
      responseType: "blob",
    });
    return response.data;
  }

  async bulkUpload(
    file: File,
    meta: {
      month: number;
      year: number;
      paid_thro?: string;
      date_paid?: string;
      remarks?: string;
    }
  ): Promise<BulkUploadResult> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("month", String(meta.month));
    formData.append("year", String(meta.year));
    if (meta.paid_thro) formData.append("paid_thro", meta.paid_thro);
    if (meta.date_paid) formData.append("date_paid", meta.date_paid);
    if (meta.remarks) formData.append("remarks", meta.remarks);

    const response = await api.post<BulkUploadResult>(
      "/monthly-deductions/bulk-upload/",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return response.data;
  }

  async exportCsv(month?: number, year?: number): Promise<Blob> {
    const response = await api.get("/monthly-deductions/export/", {
      params: { month, year },
      responseType: "blob",
    });
    return response.data;
  }
}

export const deductionsService = new DeductionsService();
export default deductionsService;
