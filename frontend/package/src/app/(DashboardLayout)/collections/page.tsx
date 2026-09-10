"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  ButtonGroup,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  InputAdornment,
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
  IconCalendar,
  IconSearch,
  IconFileSpreadsheet,
  IconPlus,
} from "@tabler/icons-react";
import loanService from "@/services/loan.service";

export default function CollectionsOverviewPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const [repayments, setRepayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Period Filter: DAILY (Today), WEEKLY (This Week), MONTHLY (This Month), ALL
  const [periodFilter, setPeriodFilter] = useState<"DAILY" | "WEEKLY" | "MONTHLY" | "ALL">("DAILY");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [loansData, repaymentsData] = await Promise.all([
        fetch("/api/loans")
          .then((res) => res.json())
          .catch(() => []),
        loanService.getRepayments().catch(() => []),
      ]);

      setLoans(Array.isArray(loansData) ? loansData : []);
      setRepayments(Array.isArray(repaymentsData) ? repaymentsData : []);
    } catch (err) {
      console.error("Failed to load collections data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalOutstanding = loans.reduce(
    (acc, l) => acc + Number(l.outstanding_balance || 0),
    0
  );

  // Period Dates Calculation
  const dateRanges = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    // This week (Monday to today)
    const dayOfWeek = now.getDay();
    const diffToMon = (dayOfWeek + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diffToMon);
    const mondayStr = monday.toISOString().split("T")[0];

    // This month (1st of month to today)
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

    return {
      todayStr,
      mondayStr,
      monthStr,
    };
  }, []);

  // Filter Repayments by Period & Search
  const filteredRepayments = useMemo(() => {
    return repayments.filter((r) => {
      const payDate = r.payment_date || "";

      // Period match
      let matchesPeriod = true;
      if (periodFilter === "DAILY") {
        matchesPeriod = payDate === dateRanges.todayStr;
      } else if (periodFilter === "WEEKLY") {
        matchesPeriod = payDate >= dateRanges.mondayStr && payDate <= dateRanges.todayStr;
      } else if (periodFilter === "MONTHLY") {
        matchesPeriod = payDate >= dateRanges.monthStr;
      } else if (periodFilter === "ALL") {
        if (customStartDate && payDate < customStartDate) matchesPeriod = false;
        if (customEndDate && payDate > customEndDate) matchesPeriod = false;
      }

      // Search match
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.repayment_number?.toLowerCase().includes(q) ||
        r.transaction_reference?.toLowerCase().includes(q) ||
        r.loan_number?.toLowerCase().includes(q) ||
        r.member_name?.toLowerCase().includes(q) ||
        r.membership_number?.toLowerCase().includes(q) ||
        r.payment_method?.toLowerCase().includes(q);

      return matchesPeriod && matchesSearch;
    });
  }, [repayments, periodFilter, search, dateRanges, customStartDate, customEndDate]);

  // Aggregates for Selected Period
  const periodTotal = filteredRepayments.reduce(
    (acc, r) => acc + Number(r.amount_paid || 0),
    0
  );
  const periodPrincipal = filteredRepayments.reduce(
    (acc, r) => acc + Number(r.allocated_principal || 0),
    0
  );
  const periodInterest = filteredRepayments.reduce(
    (acc, r) => acc + Number(r.allocated_interest || 0),
    0
  );
  const periodFees = filteredRepayments.reduce(
    (acc, r) => acc + Number(r.allocated_fees || 0) + Number(r.allocated_penalty || 0),
    0
  );
  const periodCount = filteredRepayments.length;
  const periodAverage = periodCount > 0 ? periodTotal / periodCount : 0;

  const exportCSV = () => {
    if (filteredRepayments.length === 0) return;
    const headers = [
      "Receipt #",
      "Date",
      "Member Name",
      "Membership #",
      "Loan Ref #",
      "Amount Paid",
      "Payment Mode",
      "Reference",
      "Principal",
      "Interest",
      "Fees/Penalties",
    ];
    const rows = filteredRepayments.map((r) => [
      r.repayment_number || "",
      r.payment_date || "",
      `"${r.member_name || ""}"`,
      r.membership_number || "",
      r.loan_number || "",
      r.amount_paid || 0,
      r.payment_method || "",
      r.transaction_reference || "",
      r.allocated_principal || 0,
      r.allocated_interest || 0,
      (Number(r.allocated_fees || 0) + Number(r.allocated_penalty || 0)).toFixed(2),
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `collections_${periodFilter.toLowerCase()}_${dateRanges.todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
                    Daily, weekly, and monthly loan repayment tracking, settlement audit, and inflow aggregation
                  </Typography>
                </Box>
              </Stack>

              <Stack direction="row" spacing={1.5}>
                <Button
                  component={Link}
                  href="/collections/receive"
                  variant="contained"
                  startIcon={<IconPlus size={18} />}
                  sx={{
                    bgcolor: "#ffffff",
                    color: "#065f46",
                    fontWeight: 800,
                    borderRadius: 2.5,
                    px: 2.5,
                    py: 1,
                    "&:hover": { bgcolor: "#f0fdf4" },
                  }}
                >
                  Receive Payment
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<IconRefresh size={18} />}
                  onClick={fetchData}
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
            </Stack>
          </Paper>

          {/* Period Filter Selector & Actions Bar */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: "1px solid #e2e8f0",
              bgcolor: "#ffffff",
              boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
            }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              alignItems={{ xs: "flex-start", md: "center" }}
              justifyContent="space-between"
            >
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Typography variant="subtitle2" fontWeight={800} color="#1e293b" mr={1}>
                  Collection Period:
                </Typography>
                {[
                  { key: "DAILY", label: "Today (Daily)" },
                  { key: "WEEKLY", label: "This Week (Weekly)" },
                  { key: "MONTHLY", label: "This Month (Monthly)" },
                  { key: "ALL", label: "All Records / Custom" },
                ].map((tab) => {
                  const active = periodFilter === tab.key;
                  return (
                    <Chip
                      key={tab.key}
                      label={tab.label}
                      onClick={() => setPeriodFilter(tab.key as any)}
                      sx={{
                        fontWeight: 800,
                        fontSize: "0.82rem",
                        px: 1,
                        py: 2,
                        borderRadius: 2.5,
                        bgcolor: active ? "#059669" : "#f1f5f9",
                        color: active ? "#ffffff" : "#475569",
                        border: active ? "1px solid #059669" : "1px solid #e2e8f0",
                        "&:hover": { bgcolor: active ? "#047857" : "#e2e8f0" },
                      }}
                    />
                  );
                })}
              </Stack>

              <Stack direction="row" spacing={1.5} alignItems="center">
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<IconFileSpreadsheet size={16} />}
                  onClick={exportCSV}
                  disabled={filteredRepayments.length === 0}
                  sx={{
                    borderRadius: 2,
                    fontWeight: 700,
                    textTransform: "none",
                    borderColor: "#cbd5e1",
                    color: "#334155",
                    "&:hover": { borderColor: "#059669", color: "#059669" },
                  }}
                >
                  Export CSV
                </Button>
              </Stack>
            </Stack>

            {periodFilter === "ALL" && (
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mt={2} pt={2} borderTop="1px solid #f1f5f9">
                <TextField
                  size="small"
                  type="date"
                  label="From Date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={{ width: 200 }}
                />
                <TextField
                  size="small"
                  type="date"
                  label="To Date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={{ width: 200 }}
                />
                {(customStartDate || customEndDate) && (
                  <Button
                    size="small"
                    variant="text"
                    color="error"
                    onClick={() => {
                      setCustomStartDate("");
                      setCustomEndDate("");
                    }}
                    sx={{ fontWeight: 700 }}
                  >
                    Clear Dates
                  </Button>
                )}
              </Stack>
            )}
          </Paper>

          {/* Period Aggregate Cards */}
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 2.5,
                  border: "1px solid #e2e8f0",
                  borderLeft: "5px solid #059669",
                  bgcolor: "#ffffff",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                    {periodFilter === "DAILY"
                      ? "Today's Collections"
                      : periodFilter === "WEEKLY"
                      ? "Weekly Inflow Total"
                      : periodFilter === "MONTHLY"
                      ? "Monthly Inflow Total"
                      : "Filtered Inflow Total"}
                  </Typography>
                  <Typography variant="h5" fontWeight={900} sx={{ color: "#059669", mt: 0.5 }}>
                    KES {periodTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                    {periodCount} Transaction{periodCount === 1 ? "" : "s"} Recorded
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 2.5,
                  border: "1px solid #e2e8f0",
                  borderLeft: "5px solid #0284c7",
                  bgcolor: "#ffffff",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                    Principal Recovered
                  </Typography>
                  <Typography variant="h5" fontWeight={900} sx={{ color: "#0284c7", mt: 0.5 }}>
                    KES {periodPrincipal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                    Loan Asset Credit (1200)
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 2.5,
                  border: "1px solid #e2e8f0",
                  borderLeft: "5px solid #d97706",
                  bgcolor: "#ffffff",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                    Interest &amp; Fees Inflow
                  </Typography>
                  <Typography variant="h5" fontWeight={900} sx={{ color: "#d97706", mt: 0.5 }}>
                    KES {(periodInterest + periodFees).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                    Revenue Recognized (4000/4100)
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 2.5,
                  border: "1px solid #e2e8f0",
                  borderLeft: "5px solid #7c3aed",
                  bgcolor: "#ffffff",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                    Average Receipt Value
                  </Typography>
                  <Typography variant="h5" fontWeight={900} sx={{ color: "#7c3aed", mt: 0.5 }}>
                    KES {periodAverage.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                    Per collection transaction
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Collections Activity & Breakdown Table */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: "1px solid #e2e8f0",
              bgcolor: "#ffffff",
              overflow: "hidden",
              boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
            }}
          >
            <Box sx={{ p: 2.5, borderBottom: "1px solid #e2e8f0" }}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", sm: "center" }}
                spacing={2}
              >
                <Box>
                  <Typography variant="h6" fontWeight={800} color="#0f172a">
                    Collections Activity Log (
                    {periodFilter === "DAILY"
                      ? "Today"
                      : periodFilter === "WEEKLY"
                      ? "This Week"
                      : periodFilter === "MONTHLY"
                      ? "This Month"
                      : "Filtered"}
                    )
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Showing {filteredRepayments.length} verified payment receipt{filteredRepayments.length === 1 ? "" : "s"}
                  </Typography>
                </Box>

                <TextField
                  size="small"
                  placeholder="Search receipt, member, loan..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <IconSearch size={16} color="#64748b" />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{ width: { xs: "100%", sm: 260 } }}
                />
              </Stack>
            </Box>

            {loading ? (
              <Box display="flex" justifyContent="center" py={8}>
                <CircularProgress size={32} color="primary" />
              </Box>
            ) : filteredRepayments.length === 0 ? (
              <Box textAlign="center" py={7}>
                <IconCash size={40} color="#94a3b8" />
                <Typography variant="subtitle1" fontWeight={700} color="#475569" mt={1.5}>
                  No collections recorded for this period
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={0.5}>
                  Switch the period tab above or click &apos;Receive Payment&apos; to process a new member installment.
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: "#f8fafc" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800, color: "#1e293b", py: 1.5 }}>Receipt #</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: "#1e293b", py: 1.5 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: "#1e293b", py: 1.5 }}>Borrower Member</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: "#1e293b", py: 1.5 }}>Loan Ref #</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: "#1e293b", py: 1.5 }} align="right">
                        Amount Paid
                      </TableCell>
                      <TableCell sx={{ fontWeight: 800, color: "#1e293b", py: 1.5 }} align="center">
                        Channel
                      </TableCell>
                      <TableCell sx={{ fontWeight: 800, color: "#1e293b", py: 1.5 }}>Reference</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: "#1e293b", py: 1.5 }} align="right">
                        Principal Paid
                      </TableCell>
                      <TableCell sx={{ fontWeight: 800, color: "#1e293b", py: 1.5 }} align="right">
                        Interest Paid
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredRepayments.map((r) => (
                      <TableRow key={r.id || r.repayment_number} hover sx={{ "&:hover": { bgcolor: "#f8fafc" } }}>
                        <TableCell sx={{ fontWeight: 800, color: "#065f46", fontFamily: "monospace" }}>
                          {r.repayment_number}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, color: "#475569" }}>{r.payment_date}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700} color="#0f172a">
                            {r.member_name || `Member #${r.member_id || "—"}`}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {r.membership_number}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: "monospace", color: "#0f766e" }}>
                          {r.loan_number}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, color: "#059669", fontSize: "0.95rem" }}>
                          KES {Number(r.amount_paid || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={(r.payment_method || "MPESA").toUpperCase()}
                            size="small"
                            sx={{
                              fontWeight: 800,
                              fontSize: "0.7rem",
                              bgcolor:
                                (r.payment_method || "").toLowerCase() === "mpesa"
                                  ? "#ecfdf5"
                                  : "#f1f5f9",
                              color:
                                (r.payment_method || "").toLowerCase() === "mpesa"
                                  ? "#059669"
                                  : "#334155",
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontFamily: "monospace", fontSize: "0.8rem", color: "#64748b" }}>
                          {r.transaction_reference || "—"}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: "#0284c7" }}>
                          KES {Number(r.allocated_principal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: "#d97706" }}>
                          KES {Number(r.allocated_interest || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>

          {/* Module Cards Grid */}
          <Typography variant="subtitle1" fontWeight={800} color="#0f172a">
            Collections Operational Modules
          </Typography>
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
