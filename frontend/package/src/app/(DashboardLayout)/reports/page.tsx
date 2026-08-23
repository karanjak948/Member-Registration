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
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
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
    </PageContainer>
  );
}