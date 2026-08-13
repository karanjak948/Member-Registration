"use client";

import { Box, Typography } from "@mui/material";

import ApplyLoanForm from "@/components/loans/ApplyLoanForm";

export default function ApplyLoanPage() {
  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>
        Apply Loan
      </Typography>

      <ApplyLoanForm />
    </Box>
  );
}