"use client";

import { Box, Paper, Typography, Button } from "@mui/material";
import { IconShieldLock, IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";
import LoanProductTable from "@/components/loans/LoanProductTable";
import { useLoanProducts } from "@/hooks/useLoanProducts";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/constants/permissions";

export default function LoanProductsPage() {
  const { isAdmin, can, loading: authLoading } = usePermissions();
  const {
    products,
    loading,
    refresh,
  } = useLoanProducts();

  const canView = isAdmin || can(PERMISSIONS.VIEW_LOAN_PRODUCTS);

  if (!authLoading && !canView) {
    return (
      <Box sx={{ p: 4, display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <Paper
          elevation={0}
          sx={{
            p: 5,
            maxWidth: 540,
            textAlign: "center",
            borderRadius: 3.5,
            border: "1px solid #fee2e2",
            bgcolor: "#fff5f5",
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              bgcolor: "#fef2f2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 2.5,
              color: "#dc2626",
            }}
          >
            <IconShieldLock size={32} />
          </Box>
          <Typography variant="h5" fontWeight={800} color="#991b1b" gutterBottom>
            Administrative Access Required
          </Typography>
          <Typography variant="body2" color="#7f1d1d" sx={{ mb: 3.5, lineHeight: 1.6 }}>
            You do not have administrative permissions to view or manage SACCO loan products and credit tiers. Please contact your organization administrator.
          </Typography>
          <Button
            component={Link}
            href="/dashboard"
            variant="contained"
            startIcon={<IconArrowLeft size={18} />}
            sx={{
              bgcolor: "#064e3b",
              "&:hover": { bgcolor: "#047857" },
              fontWeight: 700,
              textTransform: "none",
              borderRadius: 2,
              px: 3,
            }}
          >
            Return to Dashboard
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <LoanProductTable
      products={products}
      loading={loading}
      onRefresh={refresh}
    />
  );
}