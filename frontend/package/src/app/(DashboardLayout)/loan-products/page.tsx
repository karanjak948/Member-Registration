"use client";

import LoanProductTable from "@/components/loans/LoanProductTable";
import { useLoanProducts } from "@/hooks/useLoanProducts";

export default function LoanProductsPage() {
  const {
    products,
    loading,
  } = useLoanProducts();

  return (
    <LoanProductTable
      products={products}
      loading={loading}
    />
  );
}