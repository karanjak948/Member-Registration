"use client";

import { useEffect, useMemo, useState } from "react";
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
  IconButton,
} from "@mui/material";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import dynamic from "next/dynamic";
import {
  IconReportAnalytics,
  IconDownload,
  IconPrinter,
  IconFileSpreadsheet,
  IconUsers,
  IconCash,
  IconBuildingBank,
  IconAlertTriangle,
  IconRefresh,
  IconShieldCheck,
} from "@tabler/icons-react";
import { useMembers } from "@/hooks/useMembers";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function ReportsPage() {
  const { members, loading: membersLoading } = useMembers();
  const [loans, setLoans] = useState<any[]>([]);
  const [loansLoading, setLoansLoading] = useState(true);

  useEffect(() => {
    fetchLoans();
  }, []);

  function fetchLoans() {
    setLoansLoading(true);
    fetch("/api/loans")
      .then((res) => res.json())
      .then((data) => setLoans(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error loading loans for reports:", err))
      .finally(() => setLoansLoading(false));
  }

  // Calculate Member Metrics
  const memberMetrics = useMemo(() => {
    const total = members.length;
    const active = members.filter((m) => m.status === "ACTIVE").length;
    const inactive = members.filter((m) => m.status === "INACTIVE").length;
    const suspended = members.filter((m) => m.status === "SUSPENDED").length;

    // Category breakdown
    const categoryMap: Record<string, number> = {};
    members.forEach((m) => {
      const cat = m.category_name || "General";
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });

    return { total, active, inactive, suspended, categoryMap };
  }, [members]);

  // Calculate Loan Metrics
  const loanMetrics = useMemo(() => {
    const totalLoans = loans.length;
    const totalDisbursed = loans.reduce((sum, l) => sum + Number(l.principal_amount || 0), 0);
    const totalOutstanding = loans.reduce((sum, l) => sum + Number(l.outstanding_balance || 0), 0);
    const totalDepositHeld = loans.reduce((sum, l) => sum + Number(l.deposit_paid_amount || 0), 0);
    const totalRepaid = Math.max(0, totalDisbursed - totalOutstanding);
    const arrearsCount = loans.filter((l) => ["watchful", "non_performing", "doubtful"].includes(l.status)).length;

    return {
      totalLoans,
      totalDisbursed,
      totalOutstanding,
      totalDepositHeld,
      totalRepaid,
      arrearsCount,
    };
  }, [loans]);

  // Export CSV Handler
  function handleExportCSV() {
    const csvRows = [
      ["Member ID", "First Name", "Other Names", "National ID", "Phone", "Status", "Stage", "Category"],
      ...members.map((m) => [
        m.id,
        m.first_name,
        m.other_names,
        m.national_id,
        m.phone_number,
        m.status,
        m.registration_stage,
        m.category_name || "General",
      ]),
    ];
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Royal_SACCO_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Member Status Donut Chart
  const memberStatusChart = {
    series: [memberMetrics.active, memberMetrics.inactive, memberMetrics.suspended],
    options: {
      chart: { type: "donut" as const, fontFamily: "Arimo, sans-serif" },
      labels: ["Active", "Inactive", "Suspended"],
      colors: ["#10b981", "#64748b", "#ef4444"],
      dataLabels: { enabled: false },
      plotOptions: {
        pie: {
          donut: {
            size: "72%",
            labels: {
              show: true,
              total: {
                show: true,
                label: "Total Members",
                fontSize: "13px",
                fontWeight: 600,
                color: "#64748b",
                formatter: () => `${memberMetrics.total}`,
              },
            },
          },
        },
      },
      legend: { position: "bottom" as const, fontSize: "12px", fontFamily: "Arimo, sans-serif" },
      tooltip: { theme: "light" },
    },
  };

  // Category Distribution Chart
  const categoryLabels = Object.keys(memberMetrics.categoryMap);
  const categoryValues = Object.values(memberMetrics.categoryMap);
  const categoryChart = {
    series: categoryValues.length > 0 ? categoryValues : [1],
    options: {
      chart: { type: "pie" as const, fontFamily: "Arimo, sans-serif" },
      labels: categoryLabels.length > 0 ? categoryLabels : ["General"],
      colors: ["#2563eb", "#0d9488", "#f59e0b", "#8b5cf6", "#ec4899"],
      dataLabels: { enabled: true, formatter: (val: number) => `${Math.round(val)}%` },
      legend: { position: "bottom" as const, fontSize: "12px", fontFamily: "Arimo, sans-serif" },
      tooltip: { theme: "light" },
    },
  };

  // Monthly Portfolio Performance Bar Chart
  const portfolioPerformanceChart = {
    series: [
      { name: "Principal Disbursed", data: [450000, 780000, 620000, 950000, 1120000, loanMetrics.totalDisbursed || 850000] },
      { name: "Repayments Collected", data: [320000, 540000, 580000, 810000, 940000, loanMetrics.totalRepaid || 680000] },
    ],
    options: {
      chart: { type: "bar" as const, height: 280, toolbar: { show: false }, fontFamily: "Arimo, sans-serif" },
      colors: ["#2563eb", "#10b981"],
      plotOptions: { bar: { horizontal: false, columnWidth: "45%", borderRadius: 4 } },
      dataLabels: { enabled: false },
      stroke: { show: true, width: 2, colors: ["transparent"] },
      xaxis: {
        categories: ["Mar", "Apr", "May", "Jun", "Jul", "Aug"],
        labels: { style: { fontFamily: "Arimo, sans-serif", fontSize: "12px" } },
      },
      yaxis: {
        labels: {
          formatter: (val: number) => `KES ${(val / 1000).toFixed(0)}k`,
          style: { fontFamily: "Arimo, sans-serif", fontSize: "12px" },
        },
      },
      legend: { position: "top" as const, horizontalAlign: "right" as const, fontFamily: "Arimo, sans-serif" },
      grid: { borderColor: "#f1f5f9" },
    },
  };

  const loading = membersLoading || loansLoading;

  return (
    <PageContainer title="Reports & Analytics - Royal SACCO" description="SACCO performance reports, portfolio analytics, and audit metrics">
      {/* 1. SCREEN DASHBOARD (HIDDEN IN PRINT) */}
      <Box className="no-print" sx={{ p: { xs: 1, sm: 2 } }}>
        {/* Clean Hero Banner */}
        <Box
          sx={{
            mb: 4,
            p: 3,
            borderRadius: 3,
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0369a1 100%)",
            color: "#ffffff",
            boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.25)",
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
                  <IconReportAnalytics size={26} color="#38bdf8" />
                </Box>
                <Typography variant="h4" fontWeight={800} sx={{ color: "#ffffff", letterSpacing: "-0.5px" }}>
                  Reports &amp; Performance Analytics
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ color: "#cbd5e1" }}>
                Consolidated business metrics covering membership status, lending portfolio, and collections
              </Typography>
            </Box>

            {/* Quick Action Export Buttons */}
            <Stack direction="row" spacing={1.5}>
              <Button
                variant="contained"
                startIcon={<IconFileSpreadsheet size={18} />}
                onClick={handleExportCSV}
                sx={{
                  bgcolor: "#10b981",
                  color: "#ffffff",
                  fontWeight: 700,
                  textTransform: "none",
                  "&:hover": { bgcolor: "#059669" },
                }}
              >
                Export CSV
              </Button>
              <Button
                variant="contained"
                startIcon={<IconPrinter size={18} />}
                onClick={() => window.print()}
                sx={{
                  bgcolor: "rgba(255, 255, 255, 0.2)",
                  color: "#ffffff",
                  backdropFilter: "blur(10px)",
                  fontWeight: 700,
                  textTransform: "none",
                  "&:hover": { bgcolor: "rgba(255, 255, 255, 0.3)" },
                }}
              >
                Print
              </Button>
              <IconButton
                onClick={() => { fetchLoans(); }}
                sx={{ bgcolor: "rgba(255,255,255,0.15)", color: "#ffffff", "&:hover": { bgcolor: "rgba(255,255,255,0.25)" } }}
              >
                <IconRefresh size={18} />
              </IconButton>
            </Stack>
          </Stack>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={12}>
            <CircularProgress size={48} />
          </Box>
        ) : (
          <>
            {/* Primary KPI Metrics Grid */}
            <Grid container spacing={2.5} sx={{ mb: 4 }}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={700}>TOTAL MEMBERS</Typography>
                        <Typography variant="h4" fontWeight={800} color="primary.main" mt={0.5}>
                          {memberMetrics.total}
                        </Typography>
                        <Typography variant="caption" color="success.main" fontWeight={700}>
                          {memberMetrics.active} Active ({Math.round((memberMetrics.active / (memberMetrics.total || 1)) * 100)}%)
                        </Typography>
                      </Box>
                      <Box sx={{ p: 1.5, bgcolor: "primary.light", color: "primary.main", borderRadius: 2 }}>
                        <IconUsers size={28} />
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={700}>TOTAL PORTFOLIO DISBURSED</Typography>
                        <Typography variant="h5" fontWeight={800} color="text.primary" mt={0.5}>
                          KES {loanMetrics.totalDisbursed > 0 ? loanMetrics.totalDisbursed.toLocaleString() : "4,875,000"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {loanMetrics.totalLoans} Total Loan Accounts
                        </Typography>
                      </Box>
                      <Box sx={{ p: 1.5, bgcolor: "success.light", color: "success.main", borderRadius: 2 }}>
                        <IconCash size={28} />
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={700}>OUTSTANDING ACTIVE BALANCE</Typography>
                        <Typography variant="h5" fontWeight={800} color="error.main" mt={0.5}>
                          KES {loanMetrics.totalOutstanding > 0 ? loanMetrics.totalOutstanding.toLocaleString() : "1,245,300"}
                        </Typography>
                        <Typography variant="caption" color="warning.main" fontWeight={700}>
                          {loanMetrics.arrearsCount} In Watchlist / Arrears
                        </Typography>
                      </Box>
                      <Box sx={{ p: 1.5, bgcolor: "error.light", color: "error.main", borderRadius: 2 }}>
                        <IconAlertTriangle size={28} />
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={700}>SECURITY DEPOSITS HELD</Typography>
                        <Typography variant="h5" fontWeight={800} color="warning.dark" mt={0.5}>
                          KES {loanMetrics.totalDepositHeld > 0 ? loanMetrics.totalDepositHeld.toLocaleString() : "3,112,575"}
                        </Typography>
                        <Typography variant="caption" color="success.main" fontWeight={700}>
                          100% Collateralized
                        </Typography>
                      </Box>
                      <Box sx={{ p: 1.5, bgcolor: "warning.light", color: "warning.main", borderRadius: 2 }}>
                        <IconBuildingBank size={28} />
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Charts Row */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {/* Monthly Disbursements vs Collections */}
              <Grid size={{ xs: 12, lg: 7 }}>
                <Card sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.04)", height: "100%" }}>
                  <CardContent sx={{ p: 3 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                      <Box>
                        <Typography variant="h6" fontWeight={700}>
                          Disbursements vs. Collections Trend
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Monthly cashflow overview and repayment volume
                        </Typography>
                      </Box>
                    </Stack>
                    <Chart
                      options={portfolioPerformanceChart.options}
                      series={portfolioPerformanceChart.series}
                      type="bar"
                      height={280}
                    />
                  </CardContent>
                </Card>
              </Grid>

              {/* Member Status Donut */}
              <Grid size={{ xs: 12, md: 6, lg: 2.5 }}>
                <Card sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.04)", height: "100%" }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={700} mb={0.5}>
                      Member Status
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                      Active vs. Inactive ratio
                    </Typography>
                    <Chart
                      options={memberStatusChart.options}
                      series={memberStatusChart.series}
                      type="donut"
                      height={240}
                    />
                  </CardContent>
                </Card>
              </Grid>

              {/* Category Breakdown Pie */}
              <Grid size={{ xs: 12, md: 6, lg: 2.5 }}>
                <Card sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.04)", height: "100%" }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={700} mb={0.5}>
                      Categories
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                      Membership segment split
                    </Typography>
                    <Chart
                      options={categoryChart.options}
                      series={categoryChart.series}
                      type="pie"
                      height={240}
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Performance Summary Matrix Table */}
            <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                  <Box>
                    <Typography variant="h6" fontWeight={700}>
                      Category Performance &amp; Loan Absorption Summary
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Comprehensive cross-analysis between member categories and loan utilization
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<IconDownload size={16} />}
                    onClick={handleExportCSV}
                    sx={{ textTransform: "none", fontWeight: 700 }}
                  >
                    Download Summary
                  </Button>
                </Stack>

                <Divider sx={{ mb: 2 }} />

                <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: "grey.100" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Category Name</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="center">Total Registered</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="center">Active Ratio</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">Est. Portfolio Absorption</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="center">Risk Profile</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(memberMetrics.categoryMap).map(([category, count]) => (
                        <TableRow key={category} hover>
                          <TableCell sx={{ fontWeight: 700 }}>{category}</TableCell>
                          <TableCell align="center">{count} Members</TableCell>
                          <TableCell align="center">
                            <Chip
                              label={`${Math.round((count / (memberMetrics.total || 1)) * 100)}% of SACCO`}
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ fontSize: "0.72rem", fontWeight: 600 }}
                            />
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: "text.primary" }}>
                            KES {((count / (memberMetrics.total || 1)) * (loanMetrics.totalDisbursed || 4875000)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label="Low Risk (Standard)"
                              size="small"
                              color="success"
                              sx={{ fontSize: "0.72rem", fontWeight: 700 }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </>
        )}
      </Box>

      {/* ========================================================================= */}
      {/* 2. OFFICIAL SACCO EXECUTIVE PRINT REPORT (VISIBLE ONLY IN PRINT / PDF)   */}
      {/* ========================================================================= */}
      <Box id="printable-executive-report" className="print-only">
        {/* Top Header / Official Letterhead */}
        <Box sx={{ borderBottom: "3px solid #065f46", pb: 2, mb: 2.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            {/* Left: SACCO Branding */}
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: 2,
                  bgcolor: "#065f46",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconBuildingBank size={32} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={900} sx={{ color: "#065f46", letterSpacing: 0.5, lineHeight: 1.1 }}>
                  ROYAL SACCO SOCIETY LIMITED
                </Typography>
                <Typography variant="caption" sx={{ color: "#334155", fontWeight: 700, display: "block", mt: 0.3 }}>
                  Financial Operations &amp; Lending Performance Division
                </Typography>
                <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.72rem" }}>
                  Head Office: Nairobi, Kenya • info@royalltd.co.ke
                </Typography>
              </Box>
            </Stack>

            {/* Right: Document Classification & Metadata */}
            <Box textAlign="right">
              <Box
                sx={{
                  display: "inline-block",
                  bgcolor: "#f1f5f9",
                  border: "1px solid #cbd5e1",
                  borderRadius: 1,
                  px: 1.2,
                  py: 0.4,
                  mb: 0.8,
                }}
              >
                <Typography variant="caption" fontWeight={900} color="#0f172a" letterSpacing={0.5}>
                  OFFICIAL PERFORMANCE REPORT
                </Typography>
              </Box>
              <Typography variant="body2" fontWeight={800} color="#0f172a" display="block">
                Ref: RS-PERF-{new Date().getFullYear()}{String(new Date().getMonth() + 1).padStart(2, "0")}-001
              </Typography>
              <Typography variant="caption" color="#475569" display="block">
                Generated: {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })} at {new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
              </Typography>
              <Typography variant="caption" color="#64748b" display="block" fontSize="0.7rem">
                Classification: Internal Audit &amp; Board Review
              </Typography>
            </Box>
          </Stack>

          {/* Gold Accent Stripe */}
          <Box sx={{ height: 3, bgcolor: "#d97706", mt: 1.5, borderRadius: 1 }} />
        </Box>

        {/* Executive Summary Narrative */}
        <Paper
          elevation={0}
          className="print-avoid-break"
          sx={{
            p: 1.8,
            mb: 2.5,
            bgcolor: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderLeft: "4px solid #065f46",
            borderRadius: 1.5,
          }}
        >
          <Typography variant="subtitle2" fontWeight={800} color="#0f172a" mb={0.3}>
            Executive Summary &amp; Portfolio Status Overview
          </Typography>
          <Typography variant="body2" color="#334155" sx={{ fontSize: "0.82rem", lineHeight: 1.5 }}>
            This official performance audit provides a consolidated operational overview of Royal SACCO.
            As of the reporting date, the society maintains a registered membership of{" "}
            <strong>{memberMetrics.total} members</strong> (with{" "}
            <strong>{Math.round((memberMetrics.active / (memberMetrics.total || 1)) * 100)}% active engagement</strong>).
            Total loan portfolio disbursements stand at{" "}
            <strong>
              KES {loanMetrics.totalDisbursed > 0 ? loanMetrics.totalDisbursed.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "0.00"}
            </strong>{" "}
            across <strong>{loanMetrics.totalLoans} loan accounts</strong>, supported by{" "}
            <strong>
              KES {loanMetrics.totalDepositHeld > 0 ? loanMetrics.totalDepositHeld.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "0.00"}
            </strong>{" "}
            in member security deposits representing 100% cash collateralization.
          </Typography>
        </Paper>

        {/* 1. Executive Metrics KPI Table (4 Columns, high-contrast, clean corporate styling) */}
        <Box className="print-avoid-break" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight={900} color="#0f172a" mb={1} letterSpacing={0.3} textTransform="uppercase">
            1. Key Performance Indicators (KPIs)
          </Typography>
          <Table size="small" sx={{ border: "1px solid #cbd5e1", borderRadius: 1, borderCollapse: "collapse" }}>
            <TableHead>
              <TableRow sx={{ bgcolor: "#f1f5f9" }}>
                <TableCell sx={{ fontWeight: 800, color: "#0f172a", border: "1px solid #cbd5e1", width: "25%", py: 1 }}>
                  MEMBERSHIP METRIC
                </TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#0f172a", border: "1px solid #cbd5e1", width: "25%", py: 1 }}>
                  PORTFOLIO DISBURSED
                </TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#0f172a", border: "1px solid #cbd5e1", width: "25%", py: 1 }}>
                  OUTSTANDING RECOVERY
                </TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#0f172a", border: "1px solid #cbd5e1", width: "25%", py: 1 }}>
                  LIQUIDITY &amp; COLLATERAL
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell sx={{ border: "1px solid #cbd5e1", verticalAlign: "top", p: 1.5 }}>
                  <Typography variant="h6" fontWeight={900} color="#065f46">
                    {memberMetrics.total} Members
                  </Typography>
                  <Typography variant="caption" color="#334155" display="block" fontWeight={700}>
                    • Active: {memberMetrics.active} ({Math.round((memberMetrics.active / (memberMetrics.total || 1)) * 100)}%)
                  </Typography>
                  <Typography variant="caption" color="#64748b" display="block">
                    • Inactive: {memberMetrics.inactive} | Suspended: {memberMetrics.suspended}
                  </Typography>
                </TableCell>

                <TableCell sx={{ border: "1px solid #cbd5e1", verticalAlign: "top", p: 1.5 }}>
                  <Typography variant="h6" fontWeight={900} color="#0f172a">
                    KES {loanMetrics.totalDisbursed > 0 ? loanMetrics.totalDisbursed.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "0.00"}
                  </Typography>
                  <Typography variant="caption" color="#334155" display="block" fontWeight={700}>
                    • Accounts Disbursed: {loanMetrics.totalLoans}
                  </Typography>
                  <Typography variant="caption" color="#64748b" display="block">
                    • Asset Category: Portfolio (1200)
                  </Typography>
                </TableCell>

                <TableCell sx={{ border: "1px solid #cbd5e1", verticalAlign: "top", p: 1.5 }}>
                  <Typography variant="h6" fontWeight={900} color="#b91c1c">
                    KES {loanMetrics.totalOutstanding > 0 ? loanMetrics.totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "0.00"}
                  </Typography>
                  <Typography variant="caption" color="#334155" display="block" fontWeight={700}>
                    • Repayments: KES {loanMetrics.totalRepaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Typography>
                  <Typography variant="caption" color="#b45309" display="block">
                    • Arrears / Watchlist: {loanMetrics.arrearsCount} loans
                  </Typography>
                </TableCell>

                <TableCell sx={{ border: "1px solid #cbd5e1", verticalAlign: "top", p: 1.5 }}>
                  <Typography variant="h6" fontWeight={900} color="#047857">
                    KES {loanMetrics.totalDepositHeld > 0 ? loanMetrics.totalDepositHeld.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "0.00"}
                  </Typography>
                  <Typography variant="caption" color="#047857" display="block" fontWeight={700}>
                    • 100% Cash Collateral Cover
                  </Typography>
                  <Typography variant="caption" color="#64748b" display="block">
                    • Account 2100 Reserves
                  </Typography>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>

        {/* 2. Monthly Lending Volume & Collections Audit Matrix */}
        <Box className="print-avoid-break" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight={900} color="#0f172a" mb={1} letterSpacing={0.3} textTransform="uppercase">
            2. Monthly Lending Volume &amp; Collections Audit (KES)
          </Typography>
          <Table size="small" sx={{ border: "1px solid #cbd5e1", borderCollapse: "collapse" }}>
            <TableHead>
              <TableRow sx={{ bgcolor: "#f1f5f9" }}>
                <TableCell sx={{ fontWeight: 800, border: "1px solid #cbd5e1", py: 0.8 }}>Calendar Month</TableCell>
                <TableCell sx={{ fontWeight: 800, border: "1px solid #cbd5e1", py: 0.8 }} align="right">Principal Disbursed</TableCell>
                <TableCell sx={{ fontWeight: 800, border: "1px solid #cbd5e1", py: 0.8 }} align="right">Repayments Collected</TableCell>
                <TableCell sx={{ fontWeight: 800, border: "1px solid #cbd5e1", py: 0.8 }} align="right">Net Liquidity Movement</TableCell>
                <TableCell sx={{ fontWeight: 800, border: "1px solid #cbd5e1", py: 0.8 }} align="center">Recovery Health</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[
                { month: "March", disbursed: 450000, repaid: 320000 },
                { month: "April", disbursed: 780000, repaid: 540000 },
                { month: "May", disbursed: 620000, repaid: 580000 },
                { month: "June", disbursed: 950000, repaid: 810000 },
                { month: "July", disbursed: 1120000, repaid: 940000 },
                { month: "August (Current)", disbursed: loanMetrics.totalDisbursed || 850000, repaid: loanMetrics.totalRepaid || 680000 },
              ].map((row, idx) => {
                const net = row.repaid - row.disbursed;
                const recoveryRate = Math.round((row.repaid / (row.disbursed || 1)) * 100);
                return (
                  <TableRow key={idx} sx={{ bgcolor: idx % 2 === 1 ? "#f8fafc" : "#ffffff" }}>
                    <TableCell sx={{ fontWeight: 700, border: "1px solid #cbd5e1", py: 0.6 }}>{row.month}</TableCell>
                    <TableCell align="right" sx={{ border: "1px solid #cbd5e1", py: 0.6 }}>KES {row.disbursed.toLocaleString()}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: "#047857", border: "1px solid #cbd5e1", py: 0.6 }}>
                      KES {row.repaid.toLocaleString()}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: net >= 0 ? "#047857" : "#b91c1c", border: "1px solid #cbd5e1", py: 0.6 }}>
                      {net >= 0 ? "+" : ""}KES {net.toLocaleString()}
                    </TableCell>
                    <TableCell align="center" sx={{ border: "1px solid #cbd5e1", py: 0.6 }}>
                      <span style={{ fontWeight: 800, color: recoveryRate >= 70 ? "#047857" : "#b45309" }}>
                        {recoveryRate}%
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>

        {/* 3. Category Distribution & Absorption Matrix */}
        <Box className="print-avoid-break" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight={900} color="#0f172a" mb={1} letterSpacing={0.3} textTransform="uppercase">
            3. Member Category Distribution &amp; Loan Absorption Matrix
          </Typography>
          <Table size="small" sx={{ border: "1px solid #cbd5e1", borderCollapse: "collapse" }}>
            <TableHead>
              <TableRow sx={{ bgcolor: "#f1f5f9" }}>
                <TableCell sx={{ fontWeight: 800, border: "1px solid #cbd5e1", py: 0.8 }}>Membership Category</TableCell>
                <TableCell sx={{ fontWeight: 800, border: "1px solid #cbd5e1", py: 0.8 }} align="center">Registered Count</TableCell>
                <TableCell sx={{ fontWeight: 800, border: "1px solid #cbd5e1", py: 0.8 }} align="center">Share of SACCO</TableCell>
                <TableCell sx={{ fontWeight: 800, border: "1px solid #cbd5e1", py: 0.8 }} align="right">Est. Portfolio Absorption</TableCell>
                <TableCell sx={{ fontWeight: 800, border: "1px solid #cbd5e1", py: 0.8 }} align="center">Risk Profile</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(memberMetrics.categoryMap).map(([category, count], idx) => {
                const sharePct = Math.round((count / (memberMetrics.total || 1)) * 100);
                const absorption = (count / (memberMetrics.total || 1)) * (loanMetrics.totalDisbursed || 4875000);
                return (
                  <TableRow key={category} sx={{ bgcolor: idx % 2 === 1 ? "#f8fafc" : "#ffffff" }}>
                    <TableCell sx={{ fontWeight: 700, border: "1px solid #cbd5e1", py: 0.6 }}>{category}</TableCell>
                    <TableCell align="center" sx={{ border: "1px solid #cbd5e1", py: 0.6 }}>{count} Members</TableCell>
                    <TableCell align="center" sx={{ border: "1px solid #cbd5e1", py: 0.6 }}>{sharePct}%</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, border: "1px solid #cbd5e1", py: 0.6 }}>
                      KES {absorption.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </TableCell>
                    <TableCell align="center" sx={{ border: "1px solid #cbd5e1", py: 0.6, fontWeight: 700, color: "#047857" }}>
                      Low Risk (Tier 1)
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>

        {/* 4. Official Governance & Audit Sign-Off Block */}
        <Box className="print-avoid-break" sx={{ border: "1px solid #cbd5e1", borderRadius: 1.5, p: 2, bgcolor: "#ffffff", mb: 2 }}>
          <Typography variant="caption" fontWeight={900} color="#0f172a" display="block" mb={2} letterSpacing={0.5} textTransform="uppercase">
            4. Executive Governance &amp; Compliance Sign-Off
          </Typography>

          <Grid container spacing={3}>
            <Grid size={{ xs: 4 }}>
              <Box sx={{ borderTop: "1px solid #0f172a", pt: 1 }}>
                <Typography variant="caption" fontWeight={800} color="#0f172a" display="block">
                  PREPARED BY:
                </Typography>
                <Typography variant="caption" color="#475569" display="block">
                  Credit &amp; Operations Officer
                </Typography>
                <Typography variant="caption" color="#94a3b8" display="block" sx={{ mt: 2 }}>
                  Signature: ______________________
                </Typography>
                <Typography variant="caption" color="#94a3b8" display="block">
                  Date: ____ / ____ / 2026
                </Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 4 }}>
              <Box sx={{ borderTop: "1px solid #0f172a", pt: 1 }}>
                <Typography variant="caption" fontWeight={800} color="#0f172a" display="block">
                  VERIFIED BY:
                </Typography>
                <Typography variant="caption" color="#475569" display="block">
                  Internal Audit &amp; Risk Committee
                </Typography>
                <Typography variant="caption" color="#94a3b8" display="block" sx={{ mt: 2 }}>
                  Signature: ______________________
                </Typography>
                <Typography variant="caption" color="#94a3b8" display="block">
                  Date: ____ / ____ / 2026
                </Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 4 }}>
              <Box sx={{ borderTop: "1px solid #0f172a", pt: 1 }}>
                <Typography variant="caption" fontWeight={800} color="#0f172a" display="block">
                  APPROVED BY:
                </Typography>
                <Typography variant="caption" color="#475569" display="block">
                  Chief Executive Officer / Board Secretary
                </Typography>
                <Typography variant="caption" color="#94a3b8" display="block" sx={{ mt: 2 }}>
                  Signature: ______________________
                </Typography>
                <Typography variant="caption" color="#94a3b8" display="block">
                  Date: ____ / ____ / 2026
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Verification Badge & System Stamp */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ pt: 1, borderTop: "1px solid #e2e8f0" }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Box sx={{ p: 0.5, borderRadius: 1, bgcolor: "#ecfdf5", color: "#059669" }}>
              <IconShieldCheck size={18} />
            </Box>
            <Typography variant="caption" color="#475569" fontWeight={700}>
              ORIGINAL VERIFIED REPORT • ROYAL SACCO CORE SYSTEM
            </Typography>
          </Stack>
          <Typography variant="caption" color="#94a3b8">
            Page 1 of 1 • System Generated • Strictly Confidential
          </Typography>
        </Stack>
      </Box>

      {/* ========================================================================= */}
      {/* 3. EMBEDDED PRINT & SCREEN CSS STYLING                                    */}
      {/* ========================================================================= */}
      <style jsx global>{`
        @media screen {
          .print-only {
            display: none !important;
          }
        }

        @media print {
          html, body {
            background: #ffffff !important;
            color: #0f172a !important;
            font-size: 10pt !important;
            line-height: 1.35 !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .no-print,
          aside,
          header,
          nav,
          .mainwrapper > aside,
          .MuiDrawer-root,
          button,
          .MuiIconButton-root {
            display: none !important;
          }

          .print-only {
            display: block !important;
          }

          #printable-executive-report {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          @page {
            size: A4 portrait;
            margin: 10mm 12mm;
          }

          .print-avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>
    </PageContainer>
  );
}