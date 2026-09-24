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
  TextField,
  Typography,
  Tabs,
  Tab,
  Tooltip,
  IconButton,
  Alert,
  Snackbar,
} from "@mui/material";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import { useRouter } from "next/navigation";
import {
  IconAlertTriangle,
  IconRefresh,
  IconSearch,
  IconPhoneCall,
  IconCash,
  IconCheck,
  IconSend,
  IconFileText,
  IconCalendar,
  IconCopy,
} from "@tabler/icons-react";

interface LoanRecord {
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
  last_payment_date?: string;
  reference_weekly_installment?: number;
}

export default function ArrearsManagementPage() {
  const [loans, setLoans] = useState<LoanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>("delinquent");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: "success" | "info" | "error" }>({
    open: false,
    message: "",
    severity: "info",
  });
  const [batchSmsSending, setBatchSmsSending] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchLoans();
  }, []);

  function fetchLoans() {
    setLoading(true);
    fetch("/api/loans")
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.results || [];
        setLoans(list);
      })
      .catch((err) => {
        console.error("Failed to load loans:", err);
        setToast({ open: true, message: "Error fetching loan portfolio data", severity: "error" });
      })
      .finally(() => setLoading(false));
  }

  // Filter out rejected, closed, and pending applications from active arrears evaluation
  const activePortfolio = useMemo(() => {
    return loans.filter((l) =>
      ["active", "watchful", "non_performing", "doubtful", "defaulted"].includes(l.status)
    );
  }, [loans]);

  // Stage categorizations
  const stages = useMemo(() => {
    const performing = activePortfolio.filter(
      (l) => (!l.days_overdue || l.days_overdue === 0) && l.status === "active"
    );
    const watchlist = activePortfolio.filter(
      (l) => (l.days_overdue && l.days_overdue >= 1 && l.days_overdue <= 30) || l.status === "watchful"
    );
    const nonPerforming = activePortfolio.filter(
      (l) => (l.days_overdue && l.days_overdue > 30 && l.days_overdue <= 90) || l.status === "non_performing"
    );
    const doubtful = activePortfolio.filter(
      (l) => (l.days_overdue && l.days_overdue > 90) || ["doubtful", "defaulted"].includes(l.status)
    );

    return {
      performing: {
        count: performing.length,
        volume: performing.reduce((acc, l) => acc + Number(l.outstanding_balance || 0), 0),
        items: performing,
      },
      watchlist: {
        count: watchlist.length,
        volume: watchlist.reduce((acc, l) => acc + Number(l.outstanding_balance || 0), 0),
        items: watchlist,
      },
      nonPerforming: {
        count: nonPerforming.length,
        volume: nonPerforming.reduce((acc, l) => acc + Number(l.outstanding_balance || 0), 0),
        items: nonPerforming,
      },
      doubtful: {
        count: doubtful.length,
        volume: doubtful.reduce((acc, l) => acc + Number(l.outstanding_balance || 0), 0),
        items: doubtful,
      },
    };
  }, [activePortfolio]);

  // Tab filtering
  const displayedLoans = useMemo(() => {
    let base = activePortfolio;
    if (activeTab === "delinquent") {
      base = activePortfolio.filter(
        (l) => (l.days_overdue && l.days_overdue > 0) || ["watchful", "non_performing", "doubtful", "defaulted"].includes(l.status)
      );
    } else if (activeTab === "watchlist") {
      base = stages.watchlist.items;
    } else if (activeTab === "non_performing") {
      base = stages.nonPerforming.items;
    } else if (activeTab === "doubtful") {
      base = stages.doubtful.items;
    } else if (activeTab === "performing") {
      base = stages.performing.items;
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
  }, [activePortfolio, activeTab, stages, search]);

  const handleCopyPhone = (phone: string, id: string) => {
    if (!phone) return;
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    setToast({ open: true, message: `Copied ${phone} to clipboard`, severity: "info" });
  };

  const handleSendBatchSms = async () => {
    const delinquentLoans = activePortfolio.filter(
      (l) => (l.days_overdue && l.days_overdue > 0) || ["watchful", "non_performing", "doubtful", "defaulted"].includes(l.status)
    );
    if (delinquentLoans.length === 0) {
      setToast({ open: true, message: "No delinquent loans currently requiring SMS alerts.", severity: "info" });
      return;
    }

    setBatchSmsSending(true);
    try {
      const res = await fetch("/api/members/sms/overdue/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setToast({
          open: true,
          message: data.message || `Dispatched SMS reminders to ${data.dispatched_count || delinquentLoans.length} borrowers!`,
          severity: "success",
        });
      } else {
        setToast({
          open: true,
          message: data.error || data.detail || "Batch SMS dispatch failed.",
          severity: "error",
        });
      }
    } catch (e: any) {
      setToast({ open: true, message: e.message || "Failed to trigger batch SMS.", severity: "error" });
    } finally {
      setBatchSmsSending(false);
    }
  };

  const getClassificationChip = (loan: LoanRecord) => {
    const days = loan.days_overdue || 0;
    if (days > 90 || loan.status === "doubtful" || loan.status === "defaulted") {
      return (
        <Chip
          label={`Doubtful (${days}d overdue)`}
          size="small"
          sx={{ bgcolor: "#fee2e2", color: "#991b1b", fontWeight: 700, fontSize: "0.72rem" }}
        />
      );
    }
    if (days > 30 || loan.status === "non_performing") {
      return (
        <Chip
          label={`Non-Performing (${days}d overdue)`}
          size="small"
          sx={{ bgcolor: "#ffedd5", color: "#9a3412", fontWeight: 700, fontSize: "0.72rem" }}
        />
      );
    }
    if (days >= 1 || loan.status === "watchful") {
      return (
        <Chip
          label={`Watchlist (${days}d overdue)`}
          size="small"
          sx={{ bgcolor: "#fef9c3", color: "#854d0e", fontWeight: 700, fontSize: "0.72rem" }}
        />
      );
    }
    return (
      <Chip
        label="Performing (Normal)"
        size="small"
        sx={{ bgcolor: "#dcfce7", color: "#166534", fontWeight: 700, fontSize: "0.72rem" }}
      />
    );
  };

  return (
    <PageContainer
      title="Arrears &amp; Delinquency Management - Royal SACCO"
      description="Portfolio at Risk (PAR) monitoring, arrears aging, and collection follow-up workflows"
    >
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        {/* Header Banner */}
        <Box
          sx={{
            mb: 3.5,
            p: 3,
            borderRadius: 3,
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #047857 100%)",
            color: "#ffffff",
            boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.35)",
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "center" }}
            spacing={2}
          >
            <Box>
              <Stack direction="row" spacing={1.5} alignItems="center" mb={0.75}>
                <Box
                  sx={{
                    p: 1,
                    bgcolor: "rgba(255,255,255,0.15)",
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <IconAlertTriangle size={24} color="#fcd34d" />
                </Box>
                <Typography variant="h4" fontWeight={800} sx={{ color: "#ffffff", letterSpacing: "-0.5px" }}>
                  Arrears &amp; Delinquency Management
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ color: "#cbd5e1", maxWidth: 680 }}>
                Portfolio at Risk (PAR) classification, delinquency tracking, borrower follow-ups, and recovery workflows.
              </Typography>
            </Box>

            <Stack direction="row" spacing={1.5} alignItems="center">
              <Button
                variant="outlined"
                startIcon={<IconSend size={18} />}
                onClick={handleSendBatchSms}
                disabled={batchSmsSending}
                sx={{
                  borderColor: "rgba(255, 255, 255, 0.4)",
                  color: "#ffffff",
                  fontWeight: 600,
                  textTransform: "none",
                  "&:hover": { borderColor: "#ffffff", bgcolor: "rgba(255, 255, 255, 0.1)" },
                }}
              >
                {batchSmsSending ? "Dispatching..." : "Send Arrears SMS"}
              </Button>
              <Button
                variant="contained"
                startIcon={<IconRefresh size={18} />}
                onClick={fetchLoans}
                disabled={loading}
                sx={{
                  bgcolor: "#10b981",
                  color: "#ffffff",
                  fontWeight: 700,
                  textTransform: "none",
                  "&:hover": { bgcolor: "#059669" },
                }}
              >
                Refresh Data
              </Button>
            </Stack>
          </Stack>
        </Box>

        {/* Dynamic PAR Stage Summary Cards */}
        <Grid container spacing={2} sx={{ mb: 3.5 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              onClick={() => setActiveTab("performing")}
              sx={{
                border: "1px solid",
                borderColor: activeTab === "performing" ? "#10b981" : "divider",
                borderRadius: 2.5,
                boxShadow: activeTab === "performing" ? "0 4px 14px rgba(16, 185, 129, 0.25)" : "none",
                cursor: "pointer",
                transition: "all 0.2s ease-in-out",
                "&:hover": { transform: "translateY(-2px)", boxShadow: "0 6px 16px rgba(0,0,0,0.06)" },
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} letterSpacing={0.5}>
                  CURRENT (0–30 DAYS)
                </Typography>
                <Typography variant="h4" fontWeight={800} color="success.main" mt={0.5}>
                  {stages.performing.count}
                </Typography>
                <Typography variant="body2" fontWeight={600} color="text.secondary" mt={0.5}>
                  KES {stages.performing.volume.toLocaleString()}
                </Typography>
                <Typography variant="caption" color="success.dark" display="block" mt={0.2}>
                  ● Healthy Repayments
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              onClick={() => setActiveTab("watchlist")}
              sx={{
                border: "1px solid",
                borderColor: activeTab === "watchlist" ? "#f59e0b" : "divider",
                borderRadius: 2.5,
                boxShadow: activeTab === "watchlist" ? "0 4px 14px rgba(245, 158, 11, 0.25)" : "none",
                cursor: "pointer",
                transition: "all 0.2s ease-in-out",
                "&:hover": { transform: "translateY(-2px)", boxShadow: "0 6px 16px rgba(0,0,0,0.06)" },
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} letterSpacing={0.5}>
                  WATCHLIST (1–30 DAYS)
                </Typography>
                <Typography variant="h4" fontWeight={800} color="warning.main" mt={0.5}>
                  {stages.watchlist.count}
                </Typography>
                <Typography variant="body2" fontWeight={600} color="text.secondary" mt={0.5}>
                  KES {stages.watchlist.volume.toLocaleString()}
                </Typography>
                <Typography variant="caption" color="warning.dark" display="block" mt={0.2}>
                  ▲ Early Warning
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              onClick={() => setActiveTab("non_performing")}
              sx={{
                border: "1px solid",
                borderColor: activeTab === "non_performing" ? "#f97316" : "divider",
                borderRadius: 2.5,
                boxShadow: activeTab === "non_performing" ? "0 4px 14px rgba(249, 115, 22, 0.25)" : "none",
                cursor: "pointer",
                transition: "all 0.2s ease-in-out",
                "&:hover": { transform: "translateY(-2px)", boxShadow: "0 6px 16px rgba(0,0,0,0.06)" },
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} letterSpacing={0.5}>
                  NON-PERFORMING (31–90 D)
                </Typography>
                <Typography variant="h4" fontWeight={800} sx={{ color: "#ea580c" }} mt={0.5}>
                  {stages.nonPerforming.count}
                </Typography>
                <Typography variant="body2" fontWeight={600} color="text.secondary" mt={0.5}>
                  KES {stages.nonPerforming.volume.toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ color: "#c2410c" }} display="block" mt={0.2}>
                  ■ Officer Action Required
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              onClick={() => setActiveTab("doubtful")}
              sx={{
                border: "1px solid",
                borderColor: activeTab === "doubtful" ? "#ef4444" : "divider",
                borderRadius: 2.5,
                boxShadow: activeTab === "doubtful" ? "0 4px 14px rgba(239, 68, 68, 0.25)" : "none",
                cursor: "pointer",
                transition: "all 0.2s ease-in-out",
                "&:hover": { transform: "translateY(-2px)", boxShadow: "0 6px 16px rgba(0,0,0,0.06)" },
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} letterSpacing={0.5}>
                  DOUBTFUL / LOSS (&gt;90 D)
                </Typography>
                <Typography variant="h4" fontWeight={800} color="error.main" mt={0.5}>
                  {stages.doubtful.count}
                </Typography>
                <Typography variant="body2" fontWeight={600} color="text.secondary" mt={0.5}>
                  KES {stages.doubtful.volume.toLocaleString()}
                </Typography>
                <Typography variant="caption" color="error.dark" display="block" mt={0.2}>
                  ✖ Guarantor / Recovery Stage
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Main Delinquency Register Table Card */}
        <Card
          elevation={0}
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 3,
            boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
          }}
        >
          <CardContent sx={{ p: 3 }}>
            {/* Filter Tabs and Search Bar */}
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
                <Tab label={`In Arrears (${stages.watchlist.count + stages.nonPerforming.count + stages.doubtful.count})`} value="delinquent" />
                <Tab label={`Watchlist (${stages.watchlist.count})`} value="watchlist" />
                <Tab label={`Non-Performing (${stages.nonPerforming.count})`} value="non_performing" />
                <Tab label={`Doubtful (${stages.doubtful.count})`} value="doubtful" />
                <Tab label={`Performing (${stages.performing.count})`} value="performing" />
                <Tab label={`All Facilities (${activePortfolio.length})`} value="all" />
              </Tabs>

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
                sx={{ width: { xs: "100%", md: 280 } }}
              />
            </Stack>

            <Divider sx={{ mb: 2 }} />

            {loading ? (
              <Box display="flex" flexDirection="column" alignItems="center" py={8} gap={2}>
                <CircularProgress size={36} />
                <Typography variant="body2" color="text.secondary">
                  Loading loan accounts &amp; delinquency classifications...
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
                  No delinquency records in this view
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={0.5}>
                  All loan accounts in this classification category are healthy and current.
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
                        Delinquency Stage
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {displayedLoans.map((l) => {
                      const memberDisplayName =
                        l.member_name || (l.membership_number ? `Member #${l.membership_number}` : `Member #${l.member_id}`);
                      const phone = l.member_phone || "";

                      return (
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
                              {memberDisplayName}
                            </Typography>
                            {phone && (
                              <Stack direction="row" spacing={0.5} alignItems="center">
                                <Typography variant="caption" color="text.secondary">
                                  {phone}
                                </Typography>
                                <Tooltip title={copiedId === String(l.id) ? "Copied!" : "Copy Phone"}>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleCopyPhone(phone, String(l.id))}
                                    sx={{ p: 0.2 }}
                                  >
                                    <IconCopy size={12} />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            )}
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
                              sx={{
                                color: (l.days_overdue && l.days_overdue > 0) ? "#dc2626" : "text.primary",
                              }}
                            >
                              KES {Number(l.outstanding_balance || 0).toLocaleString()}
                            </Typography>
                          </TableCell>

                          <TableCell align="center">{getClassificationChip(l)}</TableCell>

                          <TableCell align="center">
                            <Stack direction="row" spacing={1} justifyContent="center">
                              <Button
                                size="small"
                                variant="contained"
                                color="primary"
                                startIcon={<IconPhoneCall size={14} />}
                                onClick={() => router.push(`/collections/arrears/follow-up/${l.id}`)}
                                sx={{
                                  textTransform: "none",
                                  fontSize: "0.76rem",
                                  fontWeight: 700,
                                  bgcolor: "#0f766e",
                                  "&:hover": { bgcolor: "#115e59" },
                                }}
                              >
                                Follow Up
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color="inherit"
                                startIcon={<IconFileText size={14} />}
                                onClick={() => router.push(`/loans/${l.id}`)}
                                sx={{
                                  textTransform: "none",
                                  fontSize: "0.76rem",
                                  fontWeight: 600,
                                  borderColor: "divider",
                                }}
                              >
                                View File
                              </Button>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Feedback Snackbar */}
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
