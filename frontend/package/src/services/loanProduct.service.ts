import loanApi from "./loanApi";

import {
  LoanProduct,
  LoanProductCreate,
  LoanProductUpdate,
} from "@/interfaces/loanProduct";

class LoanProductService {
  /**
   * GET /api/loan-products
   */
  async getAll(): Promise<LoanProduct[]> {
    const response = await loanApi.get("/loan-products");

    return response.data;
  }

  /**
   * GET /api/loan-products/{product_code}
   */
  async getById(
    productId: number
  ): Promise<LoanProduct> {
    const response = await loanApi.get(
      `/loan-products/${productId}`
    );

    return response.data;
  }

  /**
   * POST /api/loan-products
   */
  async create(
    data: LoanProductCreate
  ): Promise<LoanProduct> {
    const response = await loanApi.post(
      "/loan-products",
      data
    );

    return response.data;
  }

  /**
   * PUT /api/loan-products/{product_code}
   */
  async update(
    productCode: string,
    data: LoanProductUpdate
  ): Promise<LoanProduct> {
    console.log("Updating Product Code:", productCode);
    console.log("Payload:", data);

    const response = await loanApi.put(
      `/loan-products/${productCode}`,
      data
    );

    return response.data;
  }

  /**
   * DELETE /api/loan-products/{product_code}
   */
  async delete(
    productCode: string
  ): Promise<void> {
    await loanApi.delete(
      `/loan-products/${productCode}`
    );
  }
}

export default new LoanProductService();