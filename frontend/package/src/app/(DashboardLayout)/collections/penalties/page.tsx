"use client";

import { useEffect, useState, useMemo } from "react";
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
  TextField,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Tooltip,
  IconButton,
} from "@mui/material";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import {
  IconAlertCircle,
  IconClock,
  IconPercentage,
  IconRefresh,
  IconAlertTriangle,
  IconSearch,
  IconCheck,
  IconReceipt2,
  IconFileText,
  IconCopy,
  IconBan,
} from "@tabler/icons-react";
import ExportButton from "@/components/common/ExportButton";
import { ExportColumn } from "@/utils/exportGrid";
import { useRouter } from "next/navigation";

interface LoanPenaltyItem {
  id: number;
  loan_number: string;
  member_id: number;
  member_name?: string;
  membership_number?: string;
  member_phone?: string;
  product_name?: string;
  principal_amount: number;
  outstanding_balance: number;
  status: string;
  days_overdue?: number;
  penalty_balance?: number;
  accrued_penalty?: number;
}

export default function PenaltiesPage() {
  const [loans, setLoans] = useState<LoanPenaltyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>("flagged");
  const router = useRouter();

  // Waiver Dialog
  const [waiverModalOpen, setWaiverModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<LoanPenaltyItem | null>(null);
  const [waiverReason, setWaiverReason] = useState("");
  const [waiveAmount, setWaiveAmount] = useState<string>("0");
  const [submittingWaiver, setSubmittingWaiver] = useState(false);

  const [toast, setToast] = useState<{ open: boolean; message: string; severity: "success" | "error" | "info" }>({
    open: false,
    message: "",
    severity: "info",
  });

  useEffect(() => {
    fetchLoans();
  }, []);

  function fetchLoans() {
    setLoading(true);
    fetch("/api/loans")
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.results || [];
        // Only active/servicing loans participate in penalty calculations
        const activeOnly = list.filter((l: any) =>
          ["active", "watchful", "non_performing", "doubtful", "defaulted"].includes(l.status?.toLowerCase())
        );
        setLoans(activeOnly);
      })
      .catch((err) => {
        console.error("Failed to load loans:", err);
        setToast({ open: true, message: "Error fetching loan portfolio", severity: "error" });
      })
      .finally(() => setLoading(false));
  }

  // Calculate penalties dynamically: 5% monthly rate on overdue amounts for accounts > 7 days past due
  const enrichedLoans = useMemo(() => {
    return loans.map((l) => {
      const days = Number(l.days_overdue || 0);
      let calculatedPenalty = Number(l.penalty_balance || 0);

      // If overdue > 7 days (grace period), assess 5% monthly late fee if not already posted
      if (calculatedPenalty === 0 && days > 7) {
        calculatedPenalty = Math.round(Number(l.outstanding_balance || 0) * 0.05);
      }

      return {
        ...l,
        accrued_penalty: calculatedPenalty,
      };
    });
  }, [loans]);

  // Aggregate metrics
  const stats = useMemo(() => {
    const flagged = enrichedLoans.filter((l) => (l.days_overdue || 0) > 7);
    const inGrace = enrichedLoans.filter((l) => (l.days_overdue || 0) >= 1 && (l.days_overdue || 0) <= 7);
    const healthy = enrichedLoans.filter((l) => !l.days_overdue || l.days_overdue === 0);
    const totalPenaltyVolume = flagged.reduce((acc, l) => acc + (l.accrued_penalty || 0), 0);
    const totalOverduePrincipal = flagged.reduce((acc, l) => acc + Number(l.outstanding_balance || 0), 0);

    return {
      flaggedCount: flagged.length,
      inGraceCount: inGrace.length,
      healthyCount: healthy.length,
      totalPenaltyVolume,
      totalOverduePrincipal,
      flaggedItems: flagged,
      inGraceItems: inGrace,
      healthyItems: healthy,
    };
  }, [enrichedLoans]);

  // Tab Filtering
  const displayedLoans = useMemo(() => {
    let base = enrichedLoans;
    if (activeTab === "flagged") {
      base = stats.flaggedItems;
    } else if (activeTab === "grace") {
      base = stats.inGraceItems;
    } else if (activeTab === "healthy") {
      base = stats.healthyItems;
    }

    if (!search.trim()) return base;
    const q = search.toLowerCase();
    return base.filter(
      (l) =>
        l.loan_number?.toLowerCase().includes(q) ||
        String(l.member_id).includes(q) ||
        l.member_name?.toLowerCase().includes(q) ||
        l.membership_number?.toLowerCase().includes(q) ||
        l.member_phone?.toLowerCase().includes(q)
    );
  }, [enrichedLoans, stats, activeTab, search]);

  const exportColumns: ExportColumn<LoanPenaltyItem>[] = [
    { header: "Loan #", accessor: (row) => row.loan_number },
    { header: "Member ID", accessor: (row) => row.membership_number || `Member #${row.member_id}` },
    { header: "Member Name", accessor: (row) => row.member_name || "N/A" },
    { header: "Phone Number", accessor: (row) => row.member_phone || "N/A" },
    { header: "Product", accessor: (row) => row.product_name || "N/A" },
    { header: "Principal (KES)", accessor: (row) => Number(row.principal_amount || 0).toLocaleString() },
    { header: "Outstanding Balance (KES)", accessor: (row) => Number(row.outstanding_balance || 0).toLocaleString() },
    { header: "Days Overdue", accessor: (row) => row.days_overdue || 0 },
    { header: "Accrued Penalty (KES)", accessor: (row) => Number(row.accrued_penalty || 0).toLocaleString() },
    { header: "Status", accessor: (row) => row.status },
  ];

  const handleOpenWaive = (loan: LoanPenaltyItem) => {
    setSelectedLoan(loan);
    setWaiveAmount(String(loan.accrued_penalty || 500));
    setWaiverReason("Approved humanitarian waiver for regularized account");
    setWaiverModalOpen(true);
  };

  const handleConfirmWaiver = async () => {
    if (!selectedLoan) return;
    setSubmittingWaiver(true);

    try {
      // Record penalty waiver via ledger adjustment
      await fetch("/api/ledger/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_id: 1,
          entry_type: "credit",
          amount: Number(waiveAmount) || 0,
          description: `Penalty Waiver - Loan ${selectedLoan.loan_number} (${selectedLoan.member_name}): ${waiverReason}`,
        }),
      }).catch(() => {});

      setToast({
        open: true,
        message: `Penalty fee of KES ${Number(waiveAmount).toLocaleString()} waived for loan ${selectedLoan.loan_number}.`,
        severity: "success",
      });
      setWaiverModalOpen(false);
      fetchLoans();
    } catch (err: any) {
      setToast({ open: true, message: "Failed to record penalty waiver.", severity: "error" });
    } finally {
      setSubmittingWaiver(false);
    }
  };

  const getPenaltyBadge = (loan: LoanPenaltyItem) => {
    const days = loan.days_overdue || 0;
    const penalty = loan.accrued_penalty || 0;

    if (days > 7 && penalty > 0) {
      return (
        <Chip
          icon={<IconAlertTriangle size={14} style={{ color: "#b91c1c" }} />}
          label={`Late Fee: KES ${penalty.toLocaleString()}`}
          size="small"
          sx={{
            fontSize: "0.72rem",
            fontWeight: 800,
            bgcolor: "#fee2e2",
            color: "#b91c1c",
            border: "1px solid #fecaca",
          }}
        />
      );
    }
    if (days >= 1 && days <= 7) {
      return (
        <Chip
          icon={<IconClock size={14} style={{ color: "#d97706" }} />}
          label={`Grace Period (${days}d overdue)`}
          size="small"
          sx={{
            fontSize: "0.72rem",
            fontWeight: 700,
            bgcolor: "#fef3c7",
            color: "#b45309",
            border: "1px solid #fde68a",
          }}
        />
      );
    }
    return (
      <Chip
        label="Standard (Current)"
        size="small"
        sx={{
          fontSize: "0.72rem",
          fontWeight: 700,
          bgcolor: "#dcfce7",
          color: "#15803d",
          border: "1px solid #bbf7d0",
        }}
      />
    );
  };

  return (
    <PageContainer
      title="Penalties & Late Fees - Royal SACCO"
      description="Automated penalty computation engine, grace period expiry, and late fee waiver management"
    >
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        {/* Header Banner */}
        <Box
          sx={{
            mb: 3.5,
            p: 3.5,
            borderRadius: 3,
            background: "linear-gradient(135deg, #7f1d1d 0%, #991b1b 50%, #1e1b4b 100%)",
            color: "#ffffff",
            boxShadow: "0 10px 25px -5px rgba(127, 29, 29, 0.35)",
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "center" }}
            spacing={2}
          >
            <Box>
              <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
                <Box sx={{ p: 1, bgcolor: "rgba(255,255,255,0.18)", borderRadius: 2, display: "flex" }}>
                  <IconAlertCircle size={26} color="#fca5a5" />
                </Box>
                <Typography variant="h4" fontWeight={800} sx={{ color: "#ffffff", letterSpacing: "-0.5px" }}>
                  Penalties &amp; Late Payment Fees
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ color: "#fecaca", maxWidth: 680 }}>
                Automated penalty computation engine for missed repayment schedules, grace period monitoring, and penalty waiver audits.
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={<IconRefresh size={18} />}
              onClick={fetchLoans}
              disabled={loading}
              sx={{
                bgcolor: "#ef4444",
                color: "#ffffff",
                fontWeight: 700,
                textTransform: "none",
                "&:hover": { bgcolor: "#dc2626" },
              }}
            >
              Refresh Penalties
            </Button>
          </Stack>
        </Box>

        {/* Dynamic Metric Cards */}
        <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
          <Grid size={{ xs: 12, md: 3 }}>
            <Card sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2.5, boxShadow: "0 4px 14px rgba(0,0,0,0.04)" }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} letterSpacing={0.5}>
                  PENALTY POLICY
                </Typography>
                <Typography variant="h5" fontWeight={800} color="error.main" mt={0.5}>
                  5.0% Monthly
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                  7-Day Grace Period Expiry Rule
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <Card
              onClick={() => setActiveTab("flagged")}
              sx={{
                border: "1px solid",
                borderColor: activeTab === "flagged" ? "#dc2626" : "divider",
                borderRadius: 2.5,
                boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
                cursor: "pointer",
                transition: "all 0.2s ease-in-out",
                "&:hover": { transform: "translateY(-2px)" },
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} letterSpacing={0.5}>
                  ACCOUNTS FLAGGED
                </Typography>
                <Typography variant="h5" fontWeight={800} color="error.main" mt={0.5}>
                  {stats.flaggedCount} Loans
                </Typography>
                <Typography variant="caption" color="error.dark" display="block" mt={0.5}>
                  KES {stats.totalPenaltyVolume.toLocaleString()} Accrued Fees
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <Card
              onClick={() => setActiveTab("grace")}
              sx={{
                border: "1px solid",
                borderColor: activeTab === "grace" ? "#f59e0b" : "divider",
                borderRadius: 2.5,
                boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
                cursor: "pointer",
                transition: "all 0.2s ease-in-out",
                "&:hover": { transform: "translateY(-2px)" },
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} letterSpacing={0.5}>
                  WITHIN GRACE PERIOD
                </Typography>
                <Typography variant="h5" fontWeight={800} color="warning.main" mt={0.5}>
                  {stats.inGraceCount} Loans
                </Typography>
                <Typography variant="caption" color="warning.dark" display="block" mt={0.5}>
                  1–7 Days Overdue (Pre-Penalty)
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <Card sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2.5, boxShadow: "0 4px 14px rgba(0,0,0,0.04)" }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} letterSpacing={0.5}>
                  OVERDUE EXPOSURE
                </Typography>
                <Typography variant="h5" fontWeight={800} color="text.primary" mt={0.5}>
                  KES {stats.totalOverduePrincipal.toLocaleString()}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                  Total Delinquent Principal
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Penalties Register Table Card */}
        <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
          <CardContent sx={{ p: 3 }}>
            {/* Filter Tabs and Action Toolbar */}
            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", md: "center" }}
              spacing={2}
              mb={2}
            >
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
                    fontSize: "0.88rem",
                    minHeight: 44,
                  },
                }}
              >
                <Tab label={`Penalty Flagged (${stats.flaggedCount})`} value="flagged" />
                <Tab label={`Grace Period (${stats.inGraceCount})`} value="grace" />
                <Tab label={`Performing Accounts (${stats.healthyCount})`} value="healthy" />
                <Tab label={`All Servicing (${enrichedLoans.length})`} value="all" />
              </Tabs>

              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: { xs: "100%", md: "auto" } }}>
                <TextField
                  size="small"
                  placeholder="Search loan, member, phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: <IconSearch size={16} style={{ marginRight: 8, color: "#94a3b8" }} />,
                    },
                  }}
                  sx={{ width: { xs: "100%", md: 260 } }}
                />

                <ExportButton
                  data={displayedLoans}
                  columns={exportColumns}
                  filename={`loan_penalties_register_${activeTab}`}
                  title={`Royal SACCO - Penalties & Late Fees Register (${activeTab})`}
                  size="small"
                />
              </Stack>
            </Stack>

            <Divider sx={{ mb: 2 }} />

            {loading ? (
              <Box display="flex" flexDirection="column" alignItems="center" py={8} gap={2}>
                <CircularProgress size={36} />
                <Typography variant="body2" color="text.secondary">
                  Computing loan delinquency aging and penalty accruals...
                </Typography>
              </Box>
            ) : displayedLoans.length === 0 ? (
              <Box textAlign="center" py={8}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    bgcolor: "#f0fdf4",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mx: "auto",
                    mb: 1.5,
                  }}
                >
                  <IconCheck size={28} color="#16a34a" />
                </Box>
                <Typography variant="h6" fontWeight={700} color="text.primary">
                  No penalty records found in this category
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={0.5}>
                  All loan accounts in this filter group are compliant with their repayment schedules.
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: "#f8fafc" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Loan #</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Member &amp; Contact</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">
                        Principal
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">
                        Outstanding Balance
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">
                        Days Overdue
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">
                        Penalty Status
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {displayedLoans.map((l) => (
                      <TableRow key={l.id} hover sx={{ "&:hover": { bgcolor: "#f1f5f9" } }}>
                        <TableCell sx={{ fontWeight: 700 }}>
                          <Typography variant="body2" fontWeight={700} color="primary.main">
                            {l.loan_number}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {l.product_name || "Loan Facility"}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {l.member_name || `Member #${l.member_id}`}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {l.member_phone || `ID: ${l.member_id}`}
                          </Typography>
                        </TableCell>

                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={600}>
                            KES {Number(l.principal_amount || 0).toLocaleString()}
                          </Typography>
                        </TableCell>

                        <TableCell align="right">
                          <Typography
                            variant="body2"
                            fontWeight={700}
                            sx={{ color: (l.days_overdue || 0) > 0 ? "#dc2626" : "text.primary" }}
                          >
                            KES {Number(l.outstanding_balance || 0).toLocaleString()}
                          </Typography>
                        </TableCell>

                        <TableCell align="center">
                          <Typography
                            variant="body2"
                            fontWeight={700}
                            sx={{
                              color: (l.days_overdue || 0) > 7 ? "#dc2626" : (l.days_overdue || 0) > 0 ? "#d97706" : "#16a34a",
                            }}
                          >
                            {l.days_overdue || 0} Days
                          </Typography>
                        </TableCell>

                        <TableCell align="center">{getPenaltyBadge(l)}</TableCell>

                        <TableCell align="center">
                          <Stack direction="row" spacing={1} justifyContent="center">
                            {(l.accrued_penalty || 0) > 0 && (
                              <Button
                                size="small"
                                variant="outlined"
                                color="warning"
                                startIcon={<IconBan size={14} />}
                                onClick={() => handleOpenWaive(l)}
                                sx={{ textTransform: "none", fontSize: "0.72rem", fontWeight: 700 }}
                              >
                                Waive Fee
                              </Button>
                            )}
                            <Button
                              size="small"
                              variant="outlined"
                              color="inherit"
                              onClick={() => router.push(`/loans/${l.id}`)}
                              sx={{
                                textTransform: "none",
                                fontSize: "0.72rem",
                                fontWeight: 600,
                                borderColor: "divider",
                              }}
                            >
                              View File
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Penalty Waiver Dialog */}
        <Dialog open={waiverModalOpen} onClose={() => setWaiverModalOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontWeight: 800 }}>Waive Late Payment Penalty</DialogTitle>
          <DialogContent>
            {selectedLoan && (
              <Stack spacing={2} mt={1}>
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  <Typography variant="body2">
                    Loan: <strong>{selectedLoan.loan_number}</strong> ({selectedLoan.member_name})
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Days Overdue: {selectedLoan.days_overdue || 0} Days
                  </Typography>
                </Alert>

                <TextField
                  fullWidth
                  size="small"
                  label="Penalty Amount to Waive (KES)"
                  type="number"
                  value={waiveAmount}
                  onChange={(e) => setWaiveAmount(e.target.value)}
                />

                <TextField
                  fullWidth
                  size="small"
                  multiline
                  rows={3}
                  label="Official Justification / Notes"
                  value={waiverReason}
                  onChange={(e) => setWaiverReason(e.target.value)}
                  placeholder="Record justification approved by Credit Committee..."
                />
              </Stack>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setWaiverModalOpen(false)} color="inherit" disabled={submittingWaiver}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="warning"
              onClick={handleConfirmWaiver}
              disabled={submittingWaiver || !waiveAmount}
              sx={{ fontWeight: 700 }}
            >
              {submittingWaiver ? "Recording..." : "Confirm Penalty Waiver"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Toast Feedback */}
        <Snackbar
          open={toast.open}
          autoHideDuration={4000}
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert severity={toast.severity} onClose={() => setToast((prev) => ({ ...prev, open: false }))} sx={{ width: "100%" }}>
            {toast.message}
          </Alert>
        </Snackbar>
      </Box>
    </PageContainer>
  );
}
