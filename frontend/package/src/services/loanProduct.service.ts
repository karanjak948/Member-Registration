import api from "./api";

import {
  LoanProduct,
  LoanProductCreate,
  LoanProductUpdate,
} from "@/interfaces/loanProduct";

class LoanProductService {
  /**
   * List all loan products.
   */
  async getAll(): Promise<LoanProduct[]> {
    const response = await api.get("/loan-products");

    return response.data;
  }

  /**
   * Get a single loan product.
   */
  async getById(
    productId: number
  ): Promise<LoanProduct> {
    const response = await api.get(
      `/loan-products/${productId}`
    );

    return response.data;
  }

  /**
   * Create a new loan product.
   */
  async create(
    data: LoanProductCreate
  ): Promise<LoanProduct> {
    const response = await api.post(
      "/loan-products",
      data
    );

    return response.data;
  }

  /**
   * Update an existing loan product.
   *
   * Backend expects the product code
   * instead of the numeric id.
   */
  async update(
    productCode: string,
    data: LoanProductUpdate
  ): Promise<LoanProduct> {
    const response = await api.put(
      `/loan-products/${productCode}`,
      data
    );

    return response.data;
  }

  /**
   * Delete a loan product.
   *
   * NOTE:
   * The current API documentation does
   * not expose a DELETE endpoint.
   *
   * If one is added later this method
   * can simply be updated.
   */
  async delete(
    productId: number
  ): Promise<void> {
    await api.delete(
      `/loan-products/${productId}`
    );
  }
}

export default new LoanProductService();