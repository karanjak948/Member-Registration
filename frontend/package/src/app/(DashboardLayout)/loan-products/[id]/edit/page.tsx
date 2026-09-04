"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Alert, Box, Button, CircularProgress, Typography } from "@mui/material";
import { IconArrowLeft } from "@tabler/icons-react";

import LoanProductForm from "@/components/loans/LoanProductForm";
import loanProductService from "@/services/loanProduct.service";

import { LoanProduct } from "@/interfaces/loanProduct";
import { mapLoanProductToForm } from "@/utils/loanProductMapper";

export default function EditLoanProductPage() {
  const params = useParams();
  const router = useRouter();
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
        console.error("Failed to load loan product:", err);
        setError("Unable to load loan product configuration.");
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
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="55vh"
        gap={2}
      >
        <CircularProgress sx={{ color: "#047857" }} size={42} thickness={4} />
        <Typography variant="body2" color="text.secondary" fontWeight={600}>
          Loading loan product configuration for editing...
        </Typography>
      </Box>
    );
  }

  if (error || !product) {
    return (
      <Box sx={{ maxWidth: 600, mx: "auto", py: 6, px: 2 }}>
        <Alert
          severity={error ? "error" : "warning"}
          sx={{ borderRadius: 3, mb: 3 }}
        >
          {error || "Loan product not found."}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<IconArrowLeft size={18} />}
          onClick={() => router.push("/loan-products")}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            borderColor: "#cbd5e1",
            color: "#334155",
          }}
        >
          Return to Loan Products Catalog
        </Button>
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
