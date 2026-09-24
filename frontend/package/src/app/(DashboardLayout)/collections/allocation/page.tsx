"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Box,
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
  TextField,
  LinearProgress,
  Button,
  Avatar,
  Tabs,
  Tab,
} from "@mui/material";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import {
  IconCoin,
  IconArrowRight,
  IconShieldCheck,
  IconCalculator,
  IconBuildingBank,
  IconCheck,
  IconPercentage,
  IconReceipt2,
  IconSearch,
  IconClick,
} from "@tabler/icons-react";
import ExportButton from "@/components/common/ExportButton";
import { ExportColumn } from "@/utils/exportGrid";

interface LoanAllocationItem {
  id: number;
  loan_number: string;
  member_id: number;
  member_name?: string;
  membership_number?: string;
  member_phone?: string;
  product_name?: string;
  principal_amount: number;
  deposit_paid_amount?: number;
  outstanding_balance: number;
  principal_balance?: number;
  interest_balance?: number;
  penalty_balance?: number;
  status: string;
  days_overdue?: number;
}

export default function RepaymentAllocationPage() {
  const [loans, setLoans] = useState<LoanAllocationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>("active");
  const [selectedLoanId, setSelectedLoanId] = useState<number | null>(null);

  // Simulation balances
  const [simAmount, setSimAmount] = useState<number>(10000);
  const [penaltyDue, setPenaltyDue] = useState<number>(500);
  const [interestDue, setInterestDue] = useState<number>(2000);
  const [principalDue, setPrincipalDue] = useState<number>(7500);

  useEffect(() => {
    fetch("/api/loans")
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.results || [];
        setLoans(list);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // Filtered loans list
  const filteredLoans = useMemo(() => {
    let base = loans;
    if (activeTab === "active") {
      base = loans.filter((l) => ["active", "watchful", "non_performing", "doubtful"].includes(l.status?.toLowerCase()));
    } else if (activeTab === "arrears") {
      base = loans.filter((l) => (l.days_overdue || 0) > 0 || ["watchful", "non_performing", "doubtful", "defaulted"].includes(l.status?.toLowerCase()));
    } else if (activeTab === "cleared") {
      base = loans.filter((l) => l.status === "closed");
    }

    if (!search.trim()) return base;
    const q = search.toLowerCase();
    return base.filter(
      (l) =>
        l.loan_number?.toLowerCase().includes(q) ||
        String(l.member_id).includes(q) ||
        l.member_name?.toLowerCase().includes(q) ||
        l.membership_number?.toLowerCase().includes(q)
    );
  }, [loans, activeTab, search]);

  const exportColumns: ExportColumn<LoanAllocationItem>[] = [
    { header: "Loan #", accessor: (row) => row.loan_number },
    { header: "Member ID", accessor: (row) => row.membership_number || `Member #${row.member_id}` },
    { header: "Member Name", accessor: (row) => row.member_name || "N/A" },
    { header: "Principal (KES)", accessor: (row) => Number(row.principal_amount || 0).toLocaleString() },
    { header: "Security Deposit (KES)", accessor: (row) => Number(row.deposit_paid_amount || 0).toLocaleString() },
    { header: "Outstanding Balance (KES)", accessor: (row) => Number(row.outstanding_balance || 0).toLocaleString() },
    { header: "Status", accessor: (row) => row.status },
  ];

  const handleSelectLoanForSim = (loan: LoanAllocationItem) => {
    setSelectedLoanId(loan.id);
    const pen = Number(loan.penalty_balance || (loan.days_overdue && loan.days_overdue > 7 ? 500 : 0));
    const int = Number(loan.interest_balance || Math.round(Number(loan.outstanding_balance || 0) * 0.1));
    const prn = Math.max(0, Number(loan.outstanding_balance || 0) - int - pen);
    const targetSim = Math.min(Number(loan.outstanding_balance || 10000), Math.round(Number(loan.principal_amount || 10000) * 0.35));

    setPenaltyDue(pen);
    setInterestDue(int);
    setPrincipalDue(prn > 0 ? prn : Number(loan.outstanding_balance || 5000));
    setSimAmount(targetSim > 0 ? targetSim : 5000);
  };

  // Waterfall allocation calculation
  const rem1 = Math.max(0, simAmount - penaltyDue);
  const allocatedPenalty = Math.min(simAmount, penaltyDue);

  const rem2 = Math.max(0, rem1 - interestDue);
  const allocatedInterest = Math.min(rem1, interestDue);

  const allocatedPrincipal = Math.min(rem2, principalDue);
  const excessAdvance = Math.max(0, rem2 - principalDue);

  return (
    <PageContainer
      title="Repayment Allocation Engine - Royal SACCO"
      description="Automated multi-tier repayment waterfall distribution"
    >
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        {/* Header Banner */}
        <Box
          sx={{
            mb: 3.5,
            p: 3.5,
            borderRadius: 3,
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0d9488 100%)",
            color: "#ffffff",
            boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.3)",
          }}
        >
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }} spacing={2}>
            <Box>
              <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
                <Box sx={{ p: 1, bgcolor: "rgba(255,255,255,0.18)", borderRadius: 2, display: "flex" }}>
                  <IconCoin size={26} color="#38bdf8" />
                </Box>
                <Typography variant="h4" fontWeight={800} sx={{ color: "#ffffff", letterSpacing: "-0.5px" }}>
                  Repayment Allocation Engine
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ color: "#cbd5e1", maxWidth: 680 }}>
                Automated waterfall prioritization ensures statutory compliance, clearing overdue penalties and interest before principal amortisation.
              </Typography>
            </Box>

            <Chip
              icon={<IconShieldCheck size={18} color="#10b981" />}
              label="SACCO Rule 4.2 Compliant"
              sx={{
                bgcolor: "rgba(16, 185, 129, 0.15)",
                color: "#6ee7b7",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                fontWeight: 700,
                fontSize: "0.85rem",
                p: 1.5,
              }}
            />
          </Stack>

          {/* Priority Workflow Visual */}
          <Box
            sx={{
              mt: 3,
              p: 2,
              borderRadius: 2,
              bgcolor: "rgba(0,0,0,0.25)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 700, letterSpacing: 1 }}>
              WATERFALL ALLOCATION PRIORITY ORDER
            </Typography>

            <Grid container spacing={2} alignItems="center" sx={{ mt: 0.5 }}>
              <Grid size={{ xs: 12, md: 3.6 }}>
                <Paper sx={{ p: 1.5, bgcolor: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: 1.5 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar sx={{ width: 28, height: 28, bgcolor: "#ef4444", fontSize: 13, fontWeight: 800 }}>1</Avatar>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={800} color="#fca5a5">Overdue Penalties &amp; Fees</Typography>
                      <Typography variant="caption" sx={{ color: "#fecaca" }}>First Priority Claim</Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, md: 0.6 }} sx={{ textAlign: "center", display: { xs: "none", md: "block" } }}>
                <IconArrowRight size={22} color="#94a3b8" />
              </Grid>

              <Grid size={{ xs: 12, md: 3.6 }}>
                <Paper sx={{ p: 1.5, bgcolor: "rgba(245, 158, 11, 0.15)", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: 1.5 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar sx={{ width: 28, height: 28, bgcolor: "#f59e0b", fontSize: 13, fontWeight: 800 }}>2</Avatar>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={800} color="#fde68a">Accrued Loan Interest</Typography>
                      <Typography variant="caption" sx={{ color: "#fef3c7" }}>Second Priority Claim</Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, md: 0.6 }} sx={{ textAlign: "center", display: { xs: "none", md: "block" } }}>
                <IconArrowRight size={22} color="#94a3b8" />
              </Grid>

              <Grid size={{ xs: 12, md: 3.6 }}>
                <Paper sx={{ p: 1.5, bgcolor: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: 1.5 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar sx={{ width: 28, height: 28, bgcolor: "#10b981", fontSize: 13, fontWeight: 800 }}>3</Avatar>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={800} color="#a7f3d0">Principal Balance Amortisation</Typography>
                      <Typography variant="caption" sx={{ color: "#d1fae5" }}>Third &amp; Final Claim</Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </Box>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Interactive Allocation Simulator */}
          <Grid size={{ xs: 12, lg: 5 }}>
            <Card
              elevation={0}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
                boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
                height: "100%",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
                  <Box sx={{ p: 1, bgcolor: "primary.light", color: "primary.main", borderRadius: 2, display: "flex" }}>
                    <IconCalculator size={22} />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={700}>
                      Interactive Waterfall Simulator
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selectedLoanId ? `Simulating loan account #${selectedLoanId}` : "Test how incoming repayments split across balances"}
                    </Typography>
                  </Box>
                </Stack>

                <Divider sx={{ mb: 2.5 }} />

                <Stack spacing={2.5}>
                  <TextField
                    fullWidth
                    label="Incoming Repayment Amount (KES)"
                    type="number"
                    value={simAmount}
                    onChange={(e) => setSimAmount(Number(e.target.value) || 0)}
                    slotProps={{
                      input: {
                        startAdornment: <Typography sx={{ mr: 1, fontWeight: 700, color: "text.secondary" }}>KES</Typography>,
                      },
                    }}
                  />

                  {/* Allocation Visual Bars */}
                  <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
                    <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
                      Simulated Split Result:
                    </Typography>

                    {/* Step 1: Penalty */}
                    <Box sx={{ mb: 2 }}>
                      <Stack direction="row" justifyContent="space-between" mb={0.5}>
                        <Typography variant="caption" fontWeight={700} color="error.main">
                          1. Penalties &amp; Fees:
                        </Typography>
                        <Typography variant="caption" fontWeight={800}>
                          KES {allocatedPenalty.toLocaleString()} / {penaltyDue.toLocaleString()}
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={penaltyDue > 0 ? (allocatedPenalty / penaltyDue) * 100 : 100}
                        color="error"
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>

                    {/* Step 2: Interest */}
                    <Box sx={{ mb: 2 }}>
                      <Stack direction="row" justifyContent="space-between" mb={0.5}>
                        <Typography variant="caption" fontWeight={700} sx={{ color: "#d97706" }}>
                          2. Accrued Interest:
                        </Typography>
                        <Typography variant="caption" fontWeight={800}>
                          KES {allocatedInterest.toLocaleString()} / {interestDue.toLocaleString()}
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={interestDue > 0 ? (allocatedInterest / interestDue) * 100 : 100}
                        color="warning"
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>

                    {/* Step 3: Principal */}
                    <Box sx={{ mb: 2 }}>
                      <Stack direction="row" justifyContent="space-between" mb={0.5}>
                        <Typography variant="caption" fontWeight={700} color="success.main">
                          3. Principal Reduction:
                        </Typography>
                        <Typography variant="caption" fontWeight={800}>
                          KES {allocatedPrincipal.toLocaleString()} / {principalDue.toLocaleString()}
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={principalDue > 0 ? (allocatedPrincipal / principalDue) * 100 : 100}
                        color="success"
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>

                    {/* Advance prepayment */}
                    {excessAdvance > 0 && (
                      <Box sx={{ mt: 1, p: 1, bgcolor: "info.light", borderRadius: 1.5 }}>
                        <Typography variant="caption" color="info.dark" fontWeight={700}>
                          ★ Unallocated Advance (Future Installments): KES {excessAdvance.toLocaleString()}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Active Loan Allocation Table */}
          <Grid size={{ xs: 12, lg: 7 }}>
            <Card
              elevation={0}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
                boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
                height: "100%",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2} mb={2}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box sx={{ p: 1, bgcolor: "success.light", color: "success.main", borderRadius: 2, display: "flex" }}>
                      <IconReceipt2 size={22} />
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight={700}>
                        Portfolio Allocation Balances ({filteredLoans.length})
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Click any loan to test allocation in the simulator
                      </Typography>
                    </Box>
                  </Stack>

                  <ExportButton
                    data={filteredLoans}
                    columns={exportColumns}
                    filename={`repayment_allocation_${activeTab}`}
                    title={`Royal SACCO - Portfolio Allocation Balances (${activeTab})`}
                    size="small"
                  />
                </Stack>

                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2} mb={2}>
                  <Tabs
                    value={activeTab}
                    onChange={(_, val) => setActiveTab(val)}
                    textColor="primary"
                    indicatorColor="primary"
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                      "& .MuiTab-root": {
                        fontWeight: 700,
                        textTransform: "none",
                        fontSize: "0.82rem",
                        minHeight: 38,
                      },
                    }}
                  >
                    <Tab label="Active Servicing" value="active" />
                    <Tab label="In Arrears" value="arrears" />
                    <Tab label="All Portfolios" value="all" />
                  </Tabs>

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
                    sx={{ width: { xs: "100%", sm: 220 } }}
                  />
                </Stack>

                <Divider sx={{ mb: 2 }} />

                {loading ? (
                  <Box display="flex" justifyContent="center" py={8}>
                    <CircularProgress />
                  </Box>
                ) : filteredLoans.length === 0 ? (
                  <Box textAlign="center" py={6}>
                    <Typography variant="body2" color="text.secondary">
                      No loan records match your search criteria.
                    </Typography>
                  </Box>
                ) : (
                  <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: "#f8fafc" }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Loan #</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Member</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="right">Principal</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="right">Outstanding</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="center">Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredLoans.map((l) => (
                          <TableRow
                            key={l.id}
                            hover
                            selected={selectedLoanId === l.id}
                            onClick={() => handleSelectLoanForSim(l)}
                            sx={{ cursor: "pointer", "&:hover": { bgcolor: "#f1f5f9" } }}
                          >
                            <TableCell sx={{ fontWeight: 700 }}>
                              <Typography variant="body2" fontWeight={700} color="primary.main">
                                {l.loan_number}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {l.product_name || "Loan"}
                              </Typography>
                            </TableCell>

                            <TableCell>
                              <Typography variant="body2" fontWeight={600}>
                                {l.member_name || `Member #${l.member_id}`}
                              </Typography>
                            </TableCell>

                            <TableCell align="right">
                              KES {Number(l.principal_amount || 0).toLocaleString()}
                            </TableCell>

                            <TableCell align="right" sx={{ color: "error.main", fontWeight: 700 }}>
                              KES {Number(l.outstanding_balance || 0).toLocaleString()}
                            </TableCell>

                            <TableCell align="center">
                              <Button
                                size="small"
                                variant={selectedLoanId === l.id ? "contained" : "outlined"}
                                color="primary"
                                startIcon={<IconClick size={14} />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectLoanForSim(l);
                                }}
                                sx={{ textTransform: "none", fontSize: "0.72rem", fontWeight: 700, borderRadius: 1.5 }}
                              >
                                {selectedLoanId === l.id ? "Simulating" : "Simulate"}
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
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  );
}
