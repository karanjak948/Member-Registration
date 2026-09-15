"use client";

import React from "react";
import { Box, Stack, Typography, Button } from "@mui/material";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import MpesaReportsView from "@/components/reports/MpesaReportsView";
import { IconReceipt, IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";

export default function MpesaReportsPage() {
  return (
    <PageContainer
      title="M-Pesa Transaction Reports - Royal SACCO"
      description="Real-time M-Pesa payment logs, member notification tracking, and reconciliation audits"
    >
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        {/* Banner */}
        <Box
          className="no-print"
          sx={{
            mb: 3,
            p: 3,
            borderRadius: 3,
            background: "linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)",
            color: "#ffffff",
            boxShadow: "0 10px 25px -5px rgba(6, 78, 59, 0.25)",
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={2}
          >
            <Box>
              <Stack direction="row" spacing={1.5} alignItems="center" mb={0.5}>
                <Box sx={{ p: 1, bgcolor: "rgba(255,255,255,0.15)", borderRadius: 2, display: "flex" }}>
                  <IconReceipt size={28} color="#a7f3d0" />
                </Box>
                <Typography variant="h4" fontWeight={800} sx={{ color: "#ffffff", letterSpacing: "-0.5px" }}>
                  M-Pesa Transaction Logs &amp; Audit
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ color: "#d1fae5" }}>
                Real-time tracking of Safaricom Daraja C2B receipts, member mobile notifications, and reconciliation audits
              </Typography>
            </Box>

            <Button
              component={Link}
              href="/reports"
              variant="contained"
              startIcon={<IconArrowLeft size={18} />}
              sx={{
                bgcolor: "rgba(255, 255, 255, 0.2)",
                color: "#ffffff",
                backdropFilter: "blur(10px)",
                fontWeight: 700,
                textTransform: "none",
                "&:hover": { bgcolor: "rgba(255, 255, 255, 0.3)" },
              }}
            >
              Performance Overview
            </Button>
          </Stack>
        </Box>

        {/* View Component */}
        <MpesaReportsView />
      </Box>
    </PageContainer>
  );
}
