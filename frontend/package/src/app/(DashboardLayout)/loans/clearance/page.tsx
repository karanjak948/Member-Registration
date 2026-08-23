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
  IconCertificate,
  IconRefresh,
  IconArrowLeft,
  IconPrinter,
  IconCheck,
} from "@tabler/icons-react";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";

export default function LoanClearancePage() {
  const router = useRouter();
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClearance = () => {
    setLoading(true);
    fetch("/api/loans")
      .then((res) => res.json())
      .then((data) => setLoans(Array.isArray(data) ? data : []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchClearance();
  }, []);

  return (
    <PageContainer title="Loan Clearance Certificates - Royal SACCO" description="Generate and issue loan clearance certificates upon full repayment">
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
                  <IconCertificate size={30} stroke={2.5} />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight={900} sx={{ color: "#ffffff", letterSpacing: "-0.5px" }}>
                    Loan Clearance Certificates
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#a7f3d0", fontWeight: 500, mt: 0.3 }}>
                    Official SACCO certificates confirming zero outstanding liabilities and collateral release
                  </Typography>
                </Box>
              </Stack>

              <Stack direction="row" spacing={1.5}>
                <Button
                  variant="outlined"
                  startIcon={<IconRefresh size={18} />}
                  onClick={fetchClearance}
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

          {/* Clearance Registry Table */}
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
                <IconCertificate size={44} color="#94a3b8" />
                <Typography variant="h6" fontWeight={700} sx={{ color: "#475569", mt: 1.5 }}>
                  No loan accounts currently found
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748b", mt: 0.5 }}>
                  Cleared loans will appear here ready for certificate issuance.
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table sx={{ minWidth: 800 }}>
                  <TableHead sx={{ bgcolor: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800, color: "#1e293b", py: 2 }}>Loan #</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: "#1e293b", py: 2 }}>Member Account</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: "#1e293b", py: 2 }} align="right">Principal Repaid</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: "#1e293b", py: 2 }} align="right">Outstanding</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: "#1e293b", py: 2 }} align="center">Clearance Status</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: "#1e293b", py: 2 }} align="center">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loans.map((l) => {
                      const isCleared = Number(l.outstanding_balance || 0) <= 0 || l.status === "closed";

                      return (
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
                          <TableCell align="right" sx={{ fontWeight: 800, fontFamily: "monospace" }}>
                            KES {Number(l.principal_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell align="right" sx={{ color: isCleared ? "#059669" : "#dc2626", fontWeight: 900, fontFamily: "monospace" }}>
                            KES {Number(l.outstanding_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={isCleared ? "Cleared & Verified" : "Active In-Progress"}
                              size="small"
                              sx={{
                                fontSize: "0.72rem",
                                fontWeight: 800,
                                bgcolor: isCleared ? "#ecfdf5" : "#fffbeb",
                                color: isCleared ? "#059669" : "#d97706",
                                border: `1px solid ${isCleared ? "#a7f3d0" : "#fde68a"}`,
                              }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Button
                              size="small"
                              variant={isCleared ? "contained" : "outlined"}
                              disabled={!isCleared}
                              startIcon={<IconPrinter size={16} />}
                              onClick={() => window.print()}
                              sx={{
                                fontWeight: 800,
                                borderRadius: 2,
                                fontSize: "0.75rem",
                                ...(isCleared && {
                                  bgcolor: "#059669",
                                  color: "#ffffff",
                                  "&:hover": { bgcolor: "#047857" },
                                }),
                              }}
                            >
                              Issue Certificate
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
