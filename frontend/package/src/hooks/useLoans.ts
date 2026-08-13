"use client";

import { useCallback, useEffect, useState } from "react";

import loanService from "@/services/loan.service";

import { LoanList } from "@/interfaces/loan";

/**
 * Loan Hook
 * -----------------------------------------
 * Loads loan applications from the backend
 * and exposes loading/error states together
 * with a refresh function.
 */
export function useLoans() {
  const [loans, setLoans] = useState<LoanList>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLoans = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      console.log("Loading loans...");

      const data = await loanService.getAll();

      // Ensure we always have an array
      const loanList = Array.isArray(data) ? data : [];
      
      // Log the full data to see what IDs are actually returned
      console.log("Full loan data:", JSON.stringify(loanList, null, 2));
      console.log("Loan IDs:", loanList.map(l => ({ 
        id: l.id, 
        loan_number: l.loan_number,
        type: typeof l.id
      })));

      setLoans(loanList);
      
      console.log(`Loaded ${loanList.length} loans`);
    } catch (err: any) {
      console.error("Failed to load loans:", err);

      if (err.response?.status === 405) {
        setError("Loans API is not available. Please check the backend configuration.");
      } else if (err.response?.status === 404) {
        setError("Loans endpoint not found. Please check the API URL.");
      } else if (err.response?.status === 500) {
        setError("The loan service is currently unavailable. Please try again later.");
      } else {
        setError("Unable to load loans. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLoans();
  }, [loadLoans]);

  return {
    loans,
    loading,
    error,
    refresh: loadLoans,
  };
}

export default useLoans;