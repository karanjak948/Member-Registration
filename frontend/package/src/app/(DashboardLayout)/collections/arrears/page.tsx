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
  TextField,
  Typography,
} from "@mui/material";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import { IconAlertTriangle, IconRefresh, IconSearch, IconPhoneCall, IconChartPie, IconActivity } from "@tabler/icons-react";

export default function ArrearsManagementPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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

  const filtered = loans.filter((l) =>
    l.loan_number?.toLowerCase().includes(search.toLowerCase()) ||
    String(l.member_id).includes(search)
  );

  return (
    <PageContainer title="Arrears Management - Royal SACCO" description="Track defaulted, overdue, and watchlist loan accounts">
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        {/* Header Banner */}
        <Box
          sx={{
            mb: 4,
            p: 3,
            borderRadius: 3,
            background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)",
            color: "#ffffff",
            boxShadow: "0 10px 25px -5px rgba(30, 27, 75, 0.25)",
          }}
        >
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }} spacing={2}>
            <Box>
              <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
                <Box sx={{ p: 1, bgcolor: "rgba(255,255,255,0.15)", borderRadius: 2, display: "flex" }}>
                  <IconAlertTriangle size={26} color="#fbbf24" />
                </Box>
                <Typography variant="h4" fontWeight={800} sx={{ color: "#ffffff", letterSpacing: "-0.5px" }}>
                  Arrears &amp; Delinquency Management
                </Typography>
              </Stack>
              <Typography variant="body1" sx={{ color: "#c7d2fe", maxWidth: 650 }}>
                Portfolio at Risk (PAR) classification, delinquency tracking, and recovery workflows.
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
              Refresh Data
            </Button>
          </Stack>
        </Box>

        {/* PAR Aging Stage Cards */}
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>CURRENT (0–30 DAYS)</Typography>
                <Typography variant="h5" fontWeight={800} color="success.main" mt={0.5}>
                  Performing
                </Typography>
                <Typography variant="caption" color="success.dark">Healthy Repayments</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>WATCHLIST (31–90 DAYS)</Typography>
                <Typography variant="h5" fontWeight={800} color="warning.main" mt={0.5}>
                  Early Warning
                </Typography>
                <Typography variant="caption" color="warning.dark">SMS Alerts Dispatched</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>NON-PERFORMING (91–180 D)</Typography>
                <Typography variant="h5" fontWeight={800} color="error.main" mt={0.5}>
                  Action Required
                </Typography>
                <Typography variant="caption" color="error.dark">Officer Assigned</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>DOUBTFUL / LOSS (&gt;180 D)</Typography>
                <Typography variant="h5" fontWeight={800} color="text.primary" mt={0.5}>
                  Recovery Stage
                </Typography>
                <Typography variant="caption" color="text.secondary">Guarantor Recovery</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Delinquency Register Table */}
        <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2} mb={2.5}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ p: 1, bgcolor: "error.light", borderRadius: 1.5, color: "error.main", display: "flex" }}>
                  <IconAlertTriangle size={22} />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    Delinquency &amp; Arrears Register
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Real-time loan status classification from Jiinue Loan Engine
                  </Typography>
                </Box>
              </Stack>
              <TextField
                size="small"
                placeholder="Search loan or member..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: <IconSearch size={16} style={{ marginRight: 8, color: "#94a3b8" }} />,
                  },
                }}
                sx={{ width: { xs: "100%", sm: 260 } }}
              />
            </Stack>

            <Divider sx={{ mb: 2 }} />

            {loading ? (
              <Box display="flex" justifyContent="center" py={8}>
                <CircularProgress />
              </Box>
            ) : filtered.length === 0 ? (
              <Box textAlign="center" py={6}>
                <Typography variant="body2" color="text.secondary">
                  No delinquency records found.
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
                      <TableCell sx={{ fontWeight: 700 }} align="center">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filtered.map((l) => (
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
                          <Button
                            size="small"
                            variant="outlined"
                            color="primary"
                            startIcon={<IconPhoneCall size={14} />}
                            sx={{ textTransform: "none", fontSize: "0.72rem", fontWeight: 700 }}
                          >
                            Follow Up
                          </Button>
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
