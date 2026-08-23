"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import Link from "next/link";
import {
  IconCash,
  IconRefresh,
  IconCoin,
  IconBuildingBank,
  IconAlertCircle,
  IconWallet,
  IconArrowRight,
  IconReceipt,
} from "@tabler/icons-react";

export default function CollectionsOverviewPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLoans = () => {
    setLoading(true);
    fetch("/api/loans")
      .then((res) => res.json())
      .then((data) => setLoans(Array.isArray(data) ? data : []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const totalOutstanding = loans.reduce(
    (acc, l) => acc + Number(l.outstanding_balance || 0),
    0
  );

  const collectionModules = [
    {
      title: "Receive Payment",
      description: "Record daily/weekly repayments, cash inflows, and M-Pesa collections",
      href: "/collections/receive",
      icon: IconCash,
      color: "#059669",
    },
    {
      title: "M-Pesa Reconciliation",
      description: "Audit ledger transactions, confirm payment codes, and sync statements",
      href: "/collections/reconciliation",
      icon: IconRefresh,
      color: "#0284c7",
    },
    {
      title: "Repayment Allocation",
      description: "Waterfall split across penalties, interest, and principal credit lines",
      href: "/collections/allocation",
      icon: IconCoin,
      color: "#6366f1",
    },
    {
      title: "Security Deposits",
      description: "Manage member collateral savings, lock-ins, and loan multiplier limits",
      href: "/collections/deposits",
      icon: IconBuildingBank,
      color: "#0f766e",
    },
    {
      title: "Penalties & Late Fees",
      description: "Track late payment fee triggers, default accruals, and aging accounts",
      href: "/collections/penalties",
      icon: IconAlertCircle,
      color: "#ea580c",
    },
    {
      title: "Arrears Management",
      description: "Portfolio at Risk (PAR) classification, recovery stages, and follow-ups",
      href: "/collections/arrears",
      icon: IconAlertCircle,
      color: "#dc2626",
    },
    {
      title: "Refund Security Deposit",
      description: "Clear and release security deposits for fully repaid and closed loans",
      href: "/collections/refunds",
      icon: IconWallet,
      color: "#7c3aed",
    },
  ];

  return (
    <PageContainer title="Collections Central - Royal SACCO" description="Member Collections & Repayment Management">
      <Container maxWidth={false} sx={{ px: { xs: 1.5, md: 3 }, py: 2 }}>
        <Stack spacing={3}>
          {/* Executive Hero Banner */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, sm: 3.5 },
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
                  <IconReceipt size={30} stroke={2.5} />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight={900} sx={{ color: "#ffffff", letterSpacing: "-0.5px" }}>
                    Collections &amp; Inflows
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#a7f3d0", fontWeight: 500, mt: 0.3 }}>
                    Central management for loan repayments, reconciliation, penalties, and security deposits
                  </Typography>
                </Box>
              </Stack>

              <Button
                variant="outlined"
                startIcon={<IconRefresh size={18} />}
                onClick={fetchLoans}
                sx={{
                  bgcolor: "rgba(255, 255, 255, 0.12)",
                  color: "#ffffff",
                  fontWeight: 800,
                  borderRadius: 2.5,
                  px: 2.25,
                  py: 1,
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255, 255, 255, 0.25)",
                  "&:hover": { bgcolor: "rgba(255, 255, 255, 0.22)" },
                }}
              >
                Refresh
              </Button>
            </Stack>
          </Paper>

          {/* Quick Metrics Bar */}
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  border: "1px solid #e2e8f0",
                  borderLeft: "5px solid #059669",
                  bgcolor: "#ffffff",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                }}
              >
                <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                  Active Credit Facilities
                </Typography>
                <Typography variant="h5" fontWeight={900} sx={{ color: "#0f172a", mt: 0.5 }}>
                  {loading ? "..." : `${loans.length} Accounts`}
                </Typography>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  border: "1px solid #e2e8f0",
                  borderLeft: "5px solid #2563eb",
                  bgcolor: "#ffffff",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                }}
              >
                <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                  Total Collectible Outstanding
                </Typography>
                <Typography variant="h5" fontWeight={900} sx={{ color: "#1e3a8a", mt: 0.5, fontFamily: "monospace" }}>
                  {loading ? "..." : `KES ${totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                </Typography>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  border: "1px solid #e2e8f0",
                  borderLeft: "5px solid #0d9488",
                  bgcolor: "#ffffff",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                }}
              >
                <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                  Operational Settlement Channels
                </Typography>
                <Typography variant="h5" fontWeight={900} sx={{ color: "#0f766e", mt: 0.5 }}>
                  M-Pesa, Cash &amp; Bank
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Module Cards Grid */}
          <Grid container spacing={2.5}>
            {collectionModules.map((module) => {
              const ModuleIcon = module.icon;

              return (
                <Grid key={module.title} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Paper
                    component={Link}
                    href={module.href}
                    elevation={0}
                    sx={{
                      p: 3,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      height: "100%",
                      borderRadius: 3.5,
                      border: "1px solid #e2e8f0",
                      borderLeft: `5px solid ${module.color}`,
                      bgcolor: "#ffffff",
                      textDecoration: "none",
                      color: "inherit",
                      transition: "all 0.25s ease",
                      boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: "0 12px 24px -4px rgba(0,0,0,0.1)",
                        borderColor: module.color,
                      },
                    }}
                  >
                    <Box>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2.5,
                          bgcolor: `${module.color}15`,
                          color: module.color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          mb: 2,
                        }}
                      >
                        <ModuleIcon size={26} stroke={2} />
                      </Box>
                      <Typography variant="h6" fontWeight={800} sx={{ color: "#0f172a", mb: 0.8 }}>
                        {module.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#64748b", lineHeight: 1.5 }}>
                        {module.description}
                      </Typography>
                    </Box>

                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 3, color: module.color, fontWeight: 800, fontSize: "0.85rem" }}>
                      <span>Open Workspace</span>
                      <IconArrowRight size={16} />
                    </Stack>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </Stack>
      </Container>
    </PageContainer>
  );
}
