"use client";

import { Card, CardContent, Stack, Typography } from "@mui/material";

export default function ApplyLoanForm() {
  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h5" fontWeight={700}>
            Apply Loan
          </Typography>

          <Typography color="text.secondary">
            This form will be implemented after the Loan Product module is
            completed.
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
