"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Card,
  CardContent,
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
  TextField,
  Typography,
  IconButton,
  Tooltip,
  Alert,
  Button,
  Grid,
  InputAdornment,
} from "@mui/material";
import {
  IconSearch,
  IconRefresh,
  IconPlus,
  IconEye,
  IconCoins,
  IconCash,
  IconReceipt,
  IconClock,
  IconCheck,
  IconBuildingBank,
  IconCertificate,
  IconChecklist,
  IconSettings,
} from "@tabler/icons-react";
import ExportButton from "@/components/common/ExportButton";
import { useLoans } from "@/hooks/useLoans";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/constants/permissions";

const statusConfig: Record<
  string,
  { label: string; bg: string; color: string; border: string }
> = {
  pending_application: {
    label: "Pending Review",
    bg: "#fef3c7",
    color: "#d97706",
    border: "#fde68a",
  },
  appraised: {
    label: "Appraised",
    bg: "#eff6ff",
    color: "#2563eb",
    border: "#bfdbfe",
  },
  approved: {
    label: "Approved & Ready for Payout",
    bg: "#e0e7ff",
    color: "#4338ca",
    border: "#c7d2fe",
  },
  active: {
    label: "Active Credit Facility",
    bg: "#ecfdf5",
    color: "#059669",
    border: "#a7f3d0",
  },
  watchful: {
    label: "Watchful",
    bg: "#fffbeb",
    color: "#b45309",
    border: "#fde68a",
  },
  non_performing: {
    label: "Non-Performing",
    bg: "#fff1f2",
    color: "#e11d48",
    border: "#fecdd3",
  },
  doubtful: {
    label: "Doubtful",
    bg: "#fef2f2",
    color: "#dc2626",
    border: "#fecaca",
  },
  closed: {
    label: "Fully Repaid & Closed",
    bg: "#f1f5f9",
    color: "#475569",
    border: "#cbd5e1",
  },
  written_off: {
    label: "Written Off",
    bg: "#f3f4f6",
    color: "#6b7280",
    border: "#e5e7eb",
  },
  rejected: {
    label: "Rejected",
    bg: "#fee2e2",
    color: "#991b1b",
    border: "#fca5a5",
  },
};

function LoansContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status");

  const { loans, loading, error, refresh } = useLoans();
  const { can, isSuperuser, isStaff, role } = usePermissions();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Sync statusFilter whenever the URL query parameter changes
  useEffect(() => {
    if (!statusParam) {
      setStatusFilter("ALL");
    } else if (statusParam === "disbursement") {
      setStatusFilter("approved");
    } else if (statusParam === "approval" || statusParam === "pending") {
      setStatusFilter("pending_application");
    } else if (statusParam === "active") {
      setStatusFilter("active");
    } else if (statusParam === "completed" || statusParam === "closed") {
      setStatusFilter("closed");
    } else {
      setStatusFilter(statusParam);
    }
  }, [statusParam]);

  const roleName = role?.name?.toUpperCase();
  const isSystemAdmin = isSuperuser || roleName === "SUPERADMIN" || roleName === "OWNER";

  // Strict Permission Gates
  const canApproveLoans = isSystemAdmin || can(PERMISSIONS.APPROVE_LOANS);
  const canDisburseLoans = isSystemAdmin || can(PERMISSIONS.DISBURSE_LOANS);

  const filteredLoans = useMemo(() => {
    return loans.filter((loan: any) => {
      const searchLower = search.toLowerCase();
      const matchesSearch =
        !search.trim() ||
        loan.loan_number?.toLowerCase().includes(searchLower) ||
        loan.member_id?.toString().includes(searchLower) ||
        loan.status?.toLowerCase().includes(searchLower);

      let matchesStatus = true;
      if (statusFilter !== "ALL") {
        if (statusFilter === "pending_application") {
          matchesStatus = ["pending_application", "appraised"].includes(loan.status);
        } else {
          matchesStatus = loan.status?.toLowerCase() === statusFilter.toLowerCase();
        }
      }

      return matchesSearch && matchesStatus;
    });
  }, [loans, search, statusFilter]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalCount = loans.length;
    const activeLoans = loans.filter((l) => l.status === "active");
    const pendingLoans = loans.filter((l) =>
      ["pending_application", "appraised"].includes(l.status),
    );
    const approvedLoans = loans.filter((l) => l.status === "approved");

    const totalPrincipal = loans.reduce(
      (sum, l) => sum + (Number(l.principal_amount) || 0),
      0,
    );
    const totalOutstanding = loans.reduce(
      (sum, l) => sum + (Number(l.outstanding_balance) || 0),
      0,
    );

    return {
      totalCount,
      activeCount: activeLoans.length,
      pendingCount: pendingLoans.length,
      approvedCount: approvedLoans.length,
      totalPrincipal,
      totalOutstanding,
    };
  }, [loans]);

  const formatCurrency = (amount: string | number | null) => {
    if (!amount && amount !== 0) return "KES 0.00";
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 2,
    }).format(Number(amount));
  };

  const formatDate = (date: string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-KE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const loanExportColumns = useMemo(
    () => [
      { header: "Loan Ref #", accessor: (l: any) => l.loan_reference_number || l.loan_number || `LN-${l.id}` },
      { header: "Borrower ID", accessor: (l: any) => l.borrower_name || `Member #${l.member || l.borrower || l.member_id || l.id}` },
      { header: "Product Tier", accessor: (l: any) => l.product_name || `Product #${l.loan_product || l.product_id || "Standard"}` },
      { header: "Principal (KES)", accessor: (l: any) => formatCurrency(Number(l.principal_amount || 0)) },
      { header: "Outstanding (KES)", accessor: (l: any) => formatCurrency(Number(l.outstanding_balance ?? l.principal_amount ?? 0)) },
      { header: "Application Date", accessor: (l: any) => l.application_date ? new Date(l.application_date).toLocaleDateString() : "—" },
      { header: "Status", accessor: (l: any) => statusConfig[l.status]?.label || l.status || "—" },
    ],
    [],
  );

  const handleViewLoan = (loan: any) => {
    const identifier = loan.id;
    router.push(`/loans/${identifier}`);
  };

  const handleQuickApprove = async (loanId: number) => {
    try {
      await fetch(`/api/loans/${loanId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });
      refresh();
    } catch (err) {
      console.error("Failed to approve loan:", err);
    }
  };

  const handleQuickDisburse = async (loanId: number) => {
    try {
      await fetch(`/api/loans/${loanId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "active",
          disbursement_date: new Date().toISOString().split("T")[0],
        }),
      });
      refresh();
    } catch (err) {
      console.error("Failed to disburse loan:", err);
    }
  };

  // Compute context-aware banner details
  const getBannerDetails = () => {
    if (statusFilter === "approved" || statusParam === "disbursement") {
      return {
        title: "Loan Disbursement & Payout Desk",
        subtitle: "Review approved loan facilities, verify member accounts, and release/disburse loan capital.",
        icon: <IconCash size={30} stroke={2.5} />,
      };
    }
    if (statusFilter === "pending_application" || statusParam === "approval" || statusParam === "pending") {
      return {
        title: "Loan Appraisal & Approval Desk",
        subtitle: "Evaluate pending loan applications, review guarantor KYC & collateral securities, and grant credit approvals.",
        icon: <IconChecklist size={30} stroke={2.5} />,
      };
    }
    if (statusFilter === "active") {
      return {
        title: "Active Credit Facilities",
        subtitle: "Monitor actively servicing loan accounts, weekly repayment schedules, and principal balances.",
        icon: <IconCoins size={30} stroke={2.5} />,
      };
    }
    if (statusFilter === "closed" || statusParam === "completed") {
      return {
        title: "Completed & Cleared Loans",
        subtitle: "Inspect fully repaid credit facilities and issue formal SACCO clearance certificates.",
        icon: <IconCertificate size={30} stroke={2.5} />,
      };
    }
    return {
      title: "Loan Portfolio & Credit Registry",
      subtitle: "Monitor disbursements, outstanding balances, loan approval stages, and credit performance.",
      icon: <IconBuildingBank size={30} stroke={2.5} />,
    };
  };

  const banner = getBannerDetails();

  if (loading) {
    return (
      <Container maxWidth={false}>
        <Box display="flex" justifyContent="center" alignItems="center" py={12}>
          <CircularProgress color="success" size={44} />
        </Box>
      </Container>
    );
  }

  return (
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
                {banner.icon}
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={900} sx={{ color: "#ffffff", letterSpacing: "-0.5px" }}>
                  {banner.title}
                </Typography>
                <Typography variant="body2" sx={{ color: "#a7f3d0", fontWeight: 500, mt: 0.3 }}>
                  {banner.subtitle}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
              <Button
                variant="outlined"
                startIcon={<IconRefresh size={18} />}
                onClick={refresh}
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
                variant="outlined"
                startIcon={<IconSettings size={18} />}
                onClick={() => router.push("/loan-products")}
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
                Product Tiers
              </Button>

              <Button
                variant="contained"
                startIcon={<IconPlus size={18} />}
                onClick={() => router.push("/loans/apply")}
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
                Apply for Loan
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ borderRadius: 2.5, fontWeight: 700 }}>
            {error}
          </Alert>
        )}

        {/* 4 Financial KPI Stat Cards */}
        <Grid container spacing={2.5}>
          {/* Total Applications */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border: "1px solid #e2e8f0",
                borderLeft: "5px solid #059669",
                bgcolor: "#ffffff",
                boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
              }}
            >
              <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                      Total Applications
                    </Typography>
                    <Typography variant="h5" fontWeight={900} sx={{ color: "#0f172a", mt: 0.5 }}>
                      {metrics.totalCount}
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: "#ecfdf5", color: "#059669" }}>
                    <IconReceipt size={24} />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Principal Value */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border: "1px solid #e2e8f0",
                borderLeft: "5px solid #0d9488",
                bgcolor: "#ffffff",
                boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
              }}
            >
              <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                      Total Principal Value
                    </Typography>
                    <Typography variant="h6" fontWeight={900} sx={{ color: "#0f172a", mt: 0.5, fontFamily: "monospace" }}>
                      {formatCurrency(metrics.totalPrincipal)}
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: "#f0fdfa", color: "#0d9488" }}>
                    <IconCoins size={24} />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Outstanding Balance */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border: "1px solid #e2e8f0",
                borderLeft: "5px solid #2563eb",
                bgcolor: "#ffffff",
                boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
              }}
            >
              <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                      Outstanding Balance
                    </Typography>
                    <Typography variant="h6" fontWeight={900} sx={{ color: "#1e3a8a", mt: 0.5, fontFamily: "monospace" }}>
                      {formatCurrency(metrics.totalOutstanding)}
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: "#eff6ff", color: "#2563eb" }}>
                    <IconReceipt size={24} />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Pending Approval / Ready for Payout */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border: "1px solid #e2e8f0",
                borderLeft: "5px solid #d97706",
                bgcolor: "#ffffff",
                boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
              }}
            >
              <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                      Pending Appraisal
                    </Typography>
                    <Typography variant="h5" fontWeight={900} sx={{ color: "#b45309", mt: 0.5 }}>
                      {metrics.pendingCount}
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: "#fffbeb", color: "#d97706" }}>
                    <IconClock size={24} />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filter and Search Bar */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 3,
            border: "1px solid #e2e8f0",
            bgcolor: "#ffffff",
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ xs: "stretch", md: "center" }}
            justifyContent="space-between"
          >
            {/* Search Input */}
            <TextField
              size="small"
              placeholder="Search by loan reference number, member ID, or workflow stage..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ flex: 1 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconSearch size={20} style={{ color: "#64748b" }} />
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius: 2.5,
                    bgcolor: "#f8fafc",
                    "& fieldset": { borderColor: "#cbd5e1" },
                    "&:hover fieldset": { borderColor: "#059669" },
                    "&.Mui-focused fieldset": { borderColor: "#059669", borderWidth: 2 },
                  },
                },
              }}
            />

            {/* Quick Status Filter Chips */}
            <Stack
              direction="row"
              spacing={1}
              flexWrap="wrap"
              useFlexGap
              sx={{ flexShrink: 0 }}
            >
              {[
                { key: "ALL", label: "All Loans" },
                { key: "pending_application", label: "Pending Approval" },
                { key: "approved", label: "Ready for Disbursement" },
                { key: "active", label: "Active" },
                { key: "closed", label: "Repaid & Closed" },
              ].map((filter) => {
                const isActive = statusFilter === filter.key;
                return (
                  <Chip
                    key={filter.key}
                    label={filter.label}
                    onClick={() => {
                      setStatusFilter(filter.key);
                      if (filter.key === "ALL") {
                        router.push("/loans");
                      } else if (filter.key === "approved") {
                        router.push("/loans?status=disbursement");
                      } else if (filter.key === "pending_application") {
                        router.push("/loans?status=approval");
                      } else if (filter.key === "active") {
                        router.push("/loans?status=active");
                      } else if (filter.key === "closed") {
                        router.push("/loans?status=completed");
                      }
                    }}
                    sx={{
                      fontWeight: 800,
                      cursor: "pointer",
                      px: 0.5,
                      bgcolor: isActive ? "#064e3b" : "#f1f5f9",
                      color: isActive ? "#ffffff" : "#475569",
                      border: `1px solid ${isActive ? "#064e3b" : "#cbd5e1"}`,
                      "&:hover": {
                        bgcolor: isActive ? "#047857" : "#e2e8f0",
                      },
                    }}
                  />
                );
              })}

              <ExportButton
                data={filteredLoans}
                columns={loanExportColumns}
                filename="royal_sacco_loan_portfolio"
                title="Royal SACCO - Loan Portfolio & Credit Registry"
              />
            </Stack>
          </Stack>
        </Paper>

        {/* Results Counter */}
        <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 700, px: 0.5 }}>
          Showing {filteredLoans.length} loan account{filteredLoans.length === 1 ? "" : "s"}
        </Typography>

        {/* Loans Data Table */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px solid #e2e8f0",
            bgcolor: "#ffffff",
            overflow: "hidden",
            boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05)",
          }}
        >
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                  <TableCell sx={{ fontWeight: 800, color: "#1e293b", py: 2 }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: "#1e293b", py: 2 }}>Loan Ref #</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: "#1e293b", py: 2 }}>Borrower ID</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: "#1e293b", py: 2 }}>Product Tier</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: "#1e293b", py: 2 }}>Principal Amount</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: "#1e293b", py: 2 }}>Outstanding Balance</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: "#1e293b", py: 2 }}>Application Date</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: "#1e293b", py: 2 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: "#1e293b", py: 2, textAlign: "center" }}>
                    Action
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLoans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center">
                        <IconCoins size={44} color="#94a3b8" />
                        <Typography variant="h6" fontWeight={700} sx={{ color: "#475569", mt: 1.5 }}>
                          {search ? "No matching loan records found" : "No loan records in this stage"}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#64748b", mt: 0.5 }}>
                          {statusFilter === "approved"
                            ? "No approved loans waiting for disbursement right now."
                            : "Click 'Apply for Loan' above to register a member credit facility."}
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLoans.map((loan) => {
                    const statusInfo = statusConfig[loan.status] || {
                      label: loan.status,
                      bg: "#f1f5f9",
                      color: "#475569",
                      border: "#cbd5e1",
                    };

                    return (
                      <TableRow
                        key={loan.id || loan.loan_number}
                        hover
                        sx={{
                          transition: "all 0.2s ease",
                          "&:hover": { bgcolor: "#f8fafc" },
                        }}
                      >
                        <TableCell sx={{ fontWeight: 800, color: "#64748b", fontFamily: "monospace" }}>
                          #{loan.id}
                        </TableCell>

                        <TableCell>
                          <Typography
                            fontWeight={800}
                            sx={{
                              color: "#065f46",
                              fontFamily: "monospace",
                              fontSize: "0.92rem",
                            }}
                          >
                            {loan.loan_number}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Chip
                            size="small"
                            label={`Member #${loan.member_id}`}
                            sx={{
                              fontWeight: 700,
                              fontSize: "0.75rem",
                              bgcolor: "#f1f5f9",
                              color: "#334155",
                            }}
                          />
                        </TableCell>

                        <TableCell>
                          <Typography fontWeight={700} sx={{ color: "#334155" }}>
                            Product #{loan.loan_product_id}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography fontWeight={900} sx={{ color: "#0f172a", fontFamily: "monospace" }}>
                            {formatCurrency(loan.principal_amount)}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography
                            fontWeight={900}
                            sx={{
                              color: Number(loan.outstanding_balance) > 0 ? "#2563eb" : "#059669",
                              fontFamily: "monospace",
                            }}
                          >
                            {formatCurrency(loan.outstanding_balance)}
                          </Typography>
                        </TableCell>

                        <TableCell sx={{ color: "#475569", fontWeight: 600 }}>
                          {formatDate(loan.application_date)}
                        </TableCell>

                        <TableCell>
                          <Chip
                            label={statusInfo.label}
                            size="small"
                            sx={{
                              fontWeight: 800,
                              fontSize: "0.75rem",
                              bgcolor: statusInfo.bg,
                              color: statusInfo.color,
                              border: `1px solid ${statusInfo.border}`,
                            }}
                          />
                        </TableCell>

                        <TableCell align="center">
                          <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                            {canApproveLoans && (loan.status === "pending_application" || loan.status === "appraised") && (
                              <Button
                                size="small"
                                variant="contained"
                                startIcon={<IconCheck size={14} />}
                                onClick={() => handleQuickApprove(loan.id)}
                                sx={{
                                  bgcolor: "#059669",
                                  color: "#ffffff",
                                  fontWeight: 800,
                                  textTransform: "none",
                                  borderRadius: 2,
                                  fontSize: "0.76rem",
                                  py: 0.4,
                                  px: 1.4,
                                  boxShadow: "0 2px 8px rgba(5, 150, 105, 0.25)",
                                  "&:hover": { bgcolor: "#047857" },
                                }}
                              >
                                Approve
                              </Button>
                            )}

                            {canDisburseLoans && loan.status === "approved" && (
                              <Button
                                size="small"
                                variant="contained"
                                startIcon={<IconCash size={14} />}
                                onClick={() => handleQuickDisburse(loan.id)}
                                sx={{
                                  bgcolor: "#0d9488",
                                  color: "#ffffff",
                                  fontWeight: 800,
                                  textTransform: "none",
                                  borderRadius: 2,
                                  fontSize: "0.76rem",
                                  py: 0.4,
                                  px: 1.4,
                                  boxShadow: "0 2px 8px rgba(13, 148, 136, 0.25)",
                                  "&:hover": { bgcolor: "#0f766e" },
                                }}
                              >
                                Disburse
                              </Button>
                            )}

                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<IconEye size={14} />}
                              onClick={() => handleViewLoan(loan)}
                              sx={{
                                color: "#0f766e",
                                borderColor: "#99f6e4",
                                bgcolor: "#f0fdfa",
                                fontWeight: 800,
                                textTransform: "none",
                                borderRadius: 2,
                                fontSize: "0.76rem",
                                py: 0.4,
                                px: 1.2,
                                "&:hover": { bgcolor: "#ccfbf1", borderColor: "#0d9488" },
                              }}
                            >
                              Dossier
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Stack>
    </Container>
  );
}

export default function LoansPage() {
  return (
    <Suspense
      fallback={
        <Container maxWidth={false}>
          <Box display="flex" justifyContent="center" alignItems="center" py={12}>
            <CircularProgress color="success" size={44} />
          </Box>
        </Container>
      }
    >
      <LoansContent />
    </Suspense>
  );
}