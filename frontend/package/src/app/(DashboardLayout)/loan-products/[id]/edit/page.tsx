"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Alert, Box, CircularProgress } from "@mui/material";

import LoanProductForm from "@/components/loans/LoanProductForm";
import loanProductService from "@/services/loanProduct.service";

import { LoanProduct } from "@/interfaces/loanProduct";
import { mapLoanProductToForm } from "@/utils/loanProductMapper";

export default function EditLoanProductPage() {
  const params = useParams();

  const productId = Number(params.id);

  const [product, setProduct] = useState<LoanProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProduct() {
      try {
        console.log("Loading Loan Product ID:", productId);

        const data = await loanProductService.getById(productId);

        console.log("Loan Product Loaded:", data);

        setProduct(data);
      } catch (err) {
        console.error("Failed to load loan product:", err);
        setError("Unable to load loan product.");
      } finally {
        setLoading(false);
      }
    }

    if (!Number.isNaN(productId)) {
      void loadProduct();
    } else {
      setError("Invalid product ID.");
      setLoading(false);
    }
  }, [productId]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!product) {
    return (
      <Box p={3}>
        <Alert severity="warning">Loan product not found.</Alert>
      </Box>
    );
  }

  return (
    <LoanProductForm
      mode="edit"
      initialValues={mapLoanProductToForm(product)}
      productId={product.id}
      productCode={product.product_code}
    />
  );
}
