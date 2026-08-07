import loanApi from "./loanApi";

import {
  Loan,
  LoanCreate,
  LoanList,
  LoanUpdate,
} from "@/interfaces/loan";

class LoanService {
  /**
   * GET /api/loans
   */
  async getAll(): Promise<LoanList> {
    const response = await loanApi.get("/loans");

    return response.data;
  }

  /**
   * GET /api/loans/{loan_id}
   */
  async getById(
    loanId: number,
  ): Promise<Loan> {
    const response = await loanApi.get(
      `/loans/${loanId}`,
    );

    return response.data;
  }

  /**
   * POST /api/loans
   */
  async applyLoan(
    data: LoanCreate,
  ): Promise<Loan> {
    console.log("Applying Loan");
    console.log("Payload:", data);

    const response = await loanApi.post(
      "/loans",
      data,
    );

    return response.data;
  }

  /**
   * PUT /api/loans/{loan_id}
   */
  async update(
    loanId: number,
    data: LoanUpdate,
  ): Promise<Loan> {
    console.log("Updating Loan:", loanId);
    console.log("Payload:", data);

    const response = await loanApi.put(
      `/loans/${loanId}`,
      data,
    );

    return response.data;
  }

  /**
   * DELETE /api/loans/{loan_id}
   */
  async delete(
    loanId: number,
  ): Promise<void> {
    await loanApi.delete(
      `/loans/${loanId}`,
    );
  }
}

export default new LoanService();