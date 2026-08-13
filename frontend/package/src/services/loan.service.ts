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
    try {
      console.log("Fetching all loans...");
      const response = await loanApi.get("/loans");
      
      // Log the raw response
      console.log("Raw API response:", response.data);
      
      // Handle both array and paginated responses
      const data = response.data;
      const loanList = Array.isArray(data) ? data : (data?.results || []);
      
      console.log("Processed loan list:", loanList);
      console.log("First loan ID:", loanList[0]?.id);
      console.log("Second loan ID:", loanList[1]?.id);
      
      return loanList;
    } catch (error: any) {
      console.error("Failed to fetch loans:", error);
      
      if (error.response?.status === 405) {
        console.warn("Loans API endpoint not available (405)");
        return [];
      }
      
      throw error;
    }
  }

  /**
   * GET /api/loans/{loan_id}
   */
  async getById(loanId: number): Promise<Loan> {
    try {
      console.log(`Fetching loan ${loanId}...`);
      console.log(`Type of loanId: ${typeof loanId}`);
      
      const response = await loanApi.get(`/loans/${loanId}`);
      console.log(`Loan ${loanId} response:`, response.data);
      
      return response.data;
    } catch (error: any) {
      console.error(`Failed to fetch loan ${loanId}:`, error);
      
      if (error.response?.status === 404) {
        error.message = `Loan ${loanId} not found`;
      }
      
      throw error;
    }
  }

  /**
   * POST /api/loans
   */
  async applyLoan(data: LoanCreate): Promise<Loan> {
    console.log("Applying Loan");
    console.log("Payload:", JSON.stringify(data, null, 2));

    try {
      const response = await loanApi.post("/loans", data);
      console.log("Loan applied successfully:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("Failed to apply loan:", error);
      
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
      }
      
      throw error;
    }
  }

  /**
   * PUT /api/loans/{loan_id}
   */
  async update(loanId: number, data: LoanUpdate): Promise<Loan> {
    console.log("Updating Loan:", loanId);
    console.log("Payload:", JSON.stringify(data, null, 2));

    try {
      const response = await loanApi.put(`/loans/${loanId}`, data);
      return response.data;
    } catch (error: any) {
      console.error(`Failed to update loan ${loanId}:`, error);
      throw error;
    }
  }

  /**
   * DELETE /api/loans/{loan_id}
   */
  async delete(loanId: number): Promise<void> {
    try {
      console.log(`Deleting loan ${loanId}...`);
      await loanApi.delete(`/loans/${loanId}`);
    } catch (error: any) {
      console.error(`Failed to delete loan ${loanId}:`, error);
      throw error;
    }
  }
}

export default new LoanService();