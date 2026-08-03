import api from "./api";

import {
  Loan,
  LoanCreate,
  LoanUpdate,
} from "@/interfaces/loan";

class LoanService {
  /**
   * List all loans.
   */
  async getAll(): Promise<Loan[]> {
    const response = await api.get("/loans");

    return response.data;
  }

  /**
   * Get a single loan.
   */
  async getById(
    loanId: number
  ): Promise<Loan> {
    const response = await api.get(
      `/loans/${loanId}`
    );

    return response.data;
  }

  /**
   * Apply for a loan.
   */
  async create(
    data: LoanCreate
  ): Promise<Loan> {
    const response = await api.post(
      "/loans",
      data
    );

    return response.data;
  }

  /**
   * Update a loan.
   */
  async update(
    loanId: number,
    data: LoanUpdate
  ): Promise<Loan> {
    const response = await api.put(
      `/loans/${loanId}`,
      data
    );

    return response.data;
  }

  /**
   * Delete a loan.
   */
  async delete(
    loanId: number
  ): Promise<void> {
    await api.delete(
      `/loans/${loanId}`
    );
  }
}

export default new LoanService();