import api from "./api";
import {
  LoanProduct,
  LoanProductCreate,
  LoanProductUpdate,
} from "@/interfaces/loanProduct";

class LoanProductService {
  /**
   * GET /api/loan-products/
   */
  async getAll(activeOnly: boolean = false): Promise<LoanProduct[]> {
    try {
      const response = await api.get("/loan-products/", {
        params: activeOnly ? { active_only: "true" } : { include_archived: "true" },
      });
      const data = response.data;
      return Array.isArray(data) ? data : (data?.results || []);
    } catch (error: any) {
      console.error("Failed to fetch loan products:", error);
      throw error;
    }
  }

  /**
   * GET /api/loan-products/{id}/
   */
  async getById(productId: number | string): Promise<LoanProduct> {
    try {
      const response = await api.get(`/loan-products/${productId}/`, {
        params: { include_archived: "true" },
      });
      return response.data;
    } catch (error: any) {
      console.error(`Failed to fetch loan product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * POST /api/loan-products/
   */
  async create(data: LoanProductCreate): Promise<LoanProduct> {
    try {
      const response = await api.post("/loan-products/", data);
      return response.data;
    } catch (error: any) {
      console.error("Failed to create loan product:", error);
      throw error;
    }
  }

  /**
   * PUT /api/loan-products/{id}/
   */
  async update(productId: number | string, data: LoanProductUpdate): Promise<LoanProduct> {
    try {
      const response = await api.put(`/loan-products/${productId}/`, data, {
        params: { include_archived: "true" },
      });
      return response.data;
    } catch (error: any) {
      console.error(`Failed to update loan product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * DELETE /api/loan-products/{id}/
   */
  async delete(productId: number | string): Promise<void> {
    try {
      await api.delete(`/loan-products/${productId}/`);
    } catch (error: any) {
      console.error(`Failed to delete loan product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * POST /api/loan-products/{id}/toggle-status/
   * Enable or hide/archive a loan product.
   */
  async toggleStatus(productId: number | string, isActive?: boolean): Promise<{ success: boolean; is_active: boolean; message: string; product: LoanProduct }> {
    try {
      const response = await api.post(
        `/loan-products/${productId}/toggle-status/`,
        isActive !== undefined ? { is_active: isActive } : {},
        { params: { include_archived: "true" } }
      );
      return response.data;
    } catch (error: any) {
      console.error(`Failed to toggle loan product ${productId} status:`, error);
      throw error;
    }
  }
}

export default new LoanProductService();