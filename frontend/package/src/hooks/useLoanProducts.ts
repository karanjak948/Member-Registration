"use client";

import { useCallback, useEffect, useState } from "react";

import loanProductService from "@/services/loanProduct.service";

import { LoanProduct } from "@/interfaces/loanProduct";

export function useLoanProducts() {
  const [loanProducts, setLoanProducts] = useState<LoanProduct[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const loadLoanProducts = useCallback(async () => {
    try {
      setLoading(true);

      setError("");

      const data = await loanProductService.getAll();

      setLoanProducts(data);
    } catch (err) {
      console.error("Failed to load loan products:", err);

      setError("Unable to load loan products.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLoanProducts();
  }, [loadLoanProducts]);

  return {
    products: loanProducts,

    loading,

    error,

    refresh: loadLoanProducts,
  };
}

export default useLoanProducts;