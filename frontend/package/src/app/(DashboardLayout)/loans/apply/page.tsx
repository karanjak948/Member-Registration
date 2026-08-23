"use client";

import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { IconArrowLeft, IconCoins } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import ApplyLoanForm from "@/components/loans/ApplyLoanForm";

export default function ApplyLoanPage() {
  const router = useRouter();

  return (
    <Box>
      {/* Executive Hero Banner */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3.5 },
          mb: 3.5,
          borderRadius: 3.5,
          background: "linear-gradient(135deg, #064e3b 0%, #047857 50%, #059669 100%)",
          color: "#ffffff",
          boxShadow: "0 10px 28px rgba(6, 78, 59, 0.25)",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2.5}
          alignItems={{ xs: "flex-start", md: "center" }}
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={2.5} alignItems="center">
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: 2.5,
                bgcolor: "rgba(255, 255, 255, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              }}
            >
              <IconCoins size={30} stroke={2.5} />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={900} sx={{ color: "#ffffff", letterSpacing: "-0.5px" }}>
                Apply for Loan Facility
              </Typography>
              <Typography variant="body2" sx={{ color: "#a7f3d0", fontWeight: 500, mt: 0.3 }}>
                Originate new member credit application, configure amortization terms, and register collateral
              </Typography>
            </Box>
          </Stack>

          <Button
            startIcon={<IconArrowLeft size={18} />}
            onClick={() => router.push("/loans")}
            sx={{
              bgcolor: "rgba(255, 255, 255, 0.15)",
              color: "#ffffff",
              fontWeight: 800,
              borderRadius: 2.5,
              px: 2.5,
              py: 1,
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              "&:hover": {
                bgcolor: "rgba(255, 255, 255, 0.25)",
              },
            }}
          >
            Back to Loans
          </Button>
        </Stack>
      </Paper>

      <ApplyLoanForm />
    </Box>
  );
}