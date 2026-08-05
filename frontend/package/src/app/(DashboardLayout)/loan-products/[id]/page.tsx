"use client";

import { useEffect, useState } from "react";

import { useParams } from "next/navigation";

import { Alert, Box, CircularProgress } from "@mui/material";

import LoanProductDetails from "@/components/loans/LoanProductDetails";

import loanProductService from "@/services/loanProduct.service";

import { LoanProduct } from "@/interfaces/loanProduct";

export default function LoanProductDetailsPage() {
  const params = useParams();

  const productId = Number(params.id);

  const [product, setProduct] = useState<LoanProduct | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);

        setError("");

        const data = await loanProductService.getById(productId);

        setProduct(data);
      } catch (err) {
        console.error(err);

        setError("Failed to load loan product.");
      } finally {
        setLoading(false);
      }
    }

    if (!Number.isNaN(productId)) {
      void loadProduct();
    }
  }, [productId]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={6}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!product) {
    return <Alert severity="warning">Loan product not found.</Alert>;
  }

  return <LoanProductDetails product={product} />;
}
