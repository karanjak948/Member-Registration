"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import { IconAlertCircle, IconClock, IconPercentage, IconRefresh, IconAlertTriangle } from "@tabler/icons-react";

export default function PenaltiesPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLoans();
  }, []);

  function fetchLoans() {
    setLoading(true);
    fetch("/api/loans")
      .then((res) => res.json())
      .then((data) => setLoans(Array.isArray(data) ? data : []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }

  const overdueLoans = loans.filter((l) =>
    ["watchful", "non_performing", "doubtful", "overdue"].includes(l.status?.toLowerCase())
  );

  return (
    <PageContainer title="Penalties & Late Fees - Royal SACCO" description="Manage overdue loan penalties and daily/monthly late fees">
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        {/* Header Banner */}
        <Box
          sx={{
            mb: 4,
            p: 3,
            borderRadius: 3,
            background: "linear-gradient(135deg, #7f1d1d 0%, #991b1b 50%, #450a0a 100%)",
            color: "#ffffff",
            boxShadow: "0 10px 25px -5px rgba(127, 29, 29, 0.25)",
          }}
        >
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }} spacing={2}>
            <Box>
              <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
                <Box sx={{ p: 1, bgcolor: "rgba(255,255,255,0.15)", borderRadius: 2, display: "flex" }}>
                  <IconAlertCircle size={26} color="#fca5a5" />
                </Box>
                <Typography variant="h4" fontWeight={800} sx={{ color: "#ffffff", letterSpacing: "-0.5px" }}>
                  Penalties &amp; Late Payment Fees
                </Typography>
              </Stack>
              <Typography variant="body1" sx={{ color: "#fecaca", maxWidth: 650 }}>
                Automated penalty computation engine for missed repayment dates, grace period expiry, and loan aging.
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={<IconRefresh size={18} />}
              onClick={fetchLoans}
              disabled={loading}
              sx={{
                bgcolor: "rgba(255, 255, 255, 0.2)",
                color: "#ffffff",
                backdropFilter: "blur(10px)",
                fontWeight: 700,
                textTransform: "none",
                "&:hover": { bgcolor: "rgba(255, 255, 255, 0.3)" },
              }}
            >
              Refresh Penalties
            </Button>
          </Stack>
        </Box>

        {/* Metric Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>DEFAULT PENALTY RATE</Typography>
                    <Typography variant="h4" fontWeight={800} color="error.main" mt={0.5}>
                      5.0% Monthly
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.5, bgcolor: "error.light", color: "error.main", borderRadius: 2 }}>
                    <IconPercentage size={28} />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>ACCOUNTS FLAGGED FOR PENALTY</Typography>
                    <Typography variant="h4" fontWeight={800} color="warning.main" mt={0.5}>
                      {overdueLoans.length} Loans
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.5, bgcolor: "warning.light", color: "warning.main", borderRadius: 2 }}>
                    <IconAlertTriangle size={28} />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>AGING ASSESSMENT CRON</Typography>
                    <Typography variant="h4" fontWeight={800} color="success.main" mt={0.5}>
                      Active (Daily 00:00)
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.5, bgcolor: "success.light", color: "success.main", borderRadius: 2 }}>
                    <IconClock size={28} />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Penalty Schedule Table */}
        <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
              <Box sx={{ p: 1, bgcolor: "error.light", borderRadius: 1.5, color: "error.main", display: "flex" }}>
                <IconAlertCircle size={22} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Penalty Assessment &amp; Aging Status
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Active portfolio penalty eligibility and loan health status
                </Typography>
              </Box>
            </Stack>

            <Divider sx={{ mb: 2 }} />

            {loading ? (
              <Box display="flex" justifyContent="center" py={8}>
                <CircularProgress />
              </Box>
            ) : loans.length === 0 ? (
              <Box textAlign="center" py={6}>
                <Typography variant="body2" color="text.secondary">
                  No penalty or arrears accounts currently flagged.
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: "grey.100" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Loan #</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Member ID</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Principal Disbursed</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Outstanding Balance</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Classification</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Penalty Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loans.map((l) => (
                      <TableRow key={l.id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{l.loan_number}</TableCell>
                        <TableCell>Member #{l.member_id}</TableCell>
                        <TableCell align="right">KES {Number(l.principal_amount || 0).toLocaleString()}</TableCell>
                        <TableCell align="right" sx={{ color: "error.main", fontWeight: 700 }}>
                          KES {Number(l.outstanding_balance || 0).toLocaleString()}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={l.status?.replace("_", " ") || "Performing"}
                            size="small"
                            color={l.status === "active" ? "success" : "warning"}
                            sx={{ textTransform: "capitalize", fontSize: "0.72rem", fontWeight: 700 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label="Standard (Current)"
                            size="small"
                            variant="outlined"
                            color="success"
                            sx={{ fontSize: "0.72rem" }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Box>
    </PageContainer>
  );
}
