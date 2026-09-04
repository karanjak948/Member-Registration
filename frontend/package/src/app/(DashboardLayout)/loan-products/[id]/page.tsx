"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Alert, Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { IconArrowLeft } from "@tabler/icons-react";
import LoanProductDetails from "@/components/loans/LoanProductDetails";
import loanProductService from "@/services/loanProduct.service";
import { LoanProduct } from "@/interfaces/loanProduct";

export default function LoanProductDetailsPage() {
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
        console.error(err);
        setError("Failed to load loan product specification.");
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
          Loading product specification...
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
          {error || "Loan product not found or unavailable."}
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

  return <LoanProductDetails product={product} />;
}
