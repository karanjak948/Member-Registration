"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
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
import {
  IconCalendarEvent,
  IconRefresh,
  IconArrowLeft,
  IconCoins,
} from "@tabler/icons-react";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";

export default function RepaymentSchedulePage() {
  const router = useRouter();
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedule = () => {
    setLoading(true);
    fetch("/api/loans")
      .then((res) => res.json())
      .then((data) => setLoans(Array.isArray(data) ? data : []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  return (
    <PageContainer title="Weekly Repayment Schedule - Royal SACCO" description="View upcoming loan repayment due dates and installments">
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
                  <IconCalendarEvent size={30} stroke={2.5} />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight={900} sx={{ color: "#ffffff", letterSpacing: "-0.5px" }}>
                    Weekly Repayment Schedule
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#a7f3d0", fontWeight: 500, mt: 0.3 }}>
                    Calendar of scheduled member loan repayments, installment due dates, and collection targets
                  </Typography>
                </Box>
              </Stack>

              <Stack direction="row" spacing={1.5}>
                <Button
                  variant="outlined"
                  startIcon={<IconRefresh size={18} />}
                  onClick={fetchSchedule}
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

                <Button
                  variant="contained"
                  startIcon={<IconArrowLeft size={18} />}
                  onClick={() => router.push("/loans")}
                  sx={{
                    bgcolor: "#ffffff",
                    color: "#065f46",
                    fontWeight: 900,
                    borderRadius: 2.5,
                    px: 3,
                    py: 1,
                    boxShadow: "0 4px 14px rgba(0,0,0,0.18)",
                    "&:hover": { bgcolor: "#f0fdf4" },
                  }}
                >
                  Back to Loans
                </Button>
              </Stack>
            </Stack>
          </Paper>

          {/* Schedule Table */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3.5,
              overflow: "hidden",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
            }}
          >
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" py={10}>
                <CircularProgress color="success" size={42} />
              </Box>
            ) : loans.length === 0 ? (
              <Box textAlign="center" py={8}>
                <IconCoins size={44} color="#94a3b8" />
                <Typography variant="h6" fontWeight={700} sx={{ color: "#475569", mt: 1.5 }}>
                  No active loan schedules found
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748b", mt: 0.5 }}>
                  Active loans will appear here with calculated installment dates.
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table sx={{ minWidth: 800 }}>
                  <TableHead sx={{ bgcolor: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800, color: "#1e293b", py: 2 }}>Loan #</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: "#1e293b", py: 2 }}>Member Account</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: "#1e293b", py: 2 }}>Disbursement Date</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: "#1e293b", py: 2 }} align="right">Principal</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: "#1e293b", py: 2 }} align="right">Outstanding Balance</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: "#1e293b", py: 2 }} align="center">Frequency</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: "#1e293b", py: 2 }} align="center">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loans.map((l) => (
                      <TableRow
                        key={l.id}
                        hover
                        sx={{ transition: "all 0.2s ease", "&:hover": { bgcolor: "#f8fafc" } }}
                      >
                        <TableCell sx={{ fontWeight: 800, fontFamily: "monospace", color: "#065f46" }}>
                          {l.loan_number}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={`Member #${l.member_id}`}
                            sx={{ fontWeight: 700, fontSize: "0.75rem", bgcolor: "#f1f5f9", color: "#334155" }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: "#475569", fontWeight: 600 }}>
                          {l.disbursement_date ? new Date(l.disbursement_date).toLocaleDateString("en-KE") : "Pending"}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, fontFamily: "monospace" }}>
                          KES {Number(l.principal_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell align="right" sx={{ color: Number(l.outstanding_balance) > 0 ? "#2563eb" : "#059669", fontWeight: 900, fontFamily: "monospace" }}>
                          KES {Number(l.outstanding_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label="Weekly"
                            size="small"
                            sx={{ fontSize: "0.72rem", fontWeight: 800, bgcolor: "#ecfdf5", color: "#059669", border: "1px solid #a7f3d0" }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={l.status === "active" ? "Active" : l.status}
                            size="small"
                            sx={{
                              fontSize: "0.72rem",
                              fontWeight: 800,
                              bgcolor: l.status === "active" ? "#ecfdf5" : "#f1f5f9",
                              color: l.status === "active" ? "#059669" : "#475569",
                              border: `1px solid ${l.status === "active" ? "#a7f3d0" : "#cbd5e1"}`,
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Stack>
      </Container>
    </PageContainer>
  );
}
