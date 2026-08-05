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
  const [loans, setLoans] =
    useState<LoanList>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadLoans = useCallback(async () => {
    try {
      setLoading(true);

      setError("");

      const data =
        await loanService.getAll();

      setLoans(data);
    } catch (err) {
      console.error(
        "Failed to load loans:",
        err
      );

      setError(
        "Unable to load loans."
      );
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