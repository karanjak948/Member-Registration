"use client";

import React, { useState, useMemo } from "react";
import {
  Box,
  Card,
  CircularProgress,
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
  Chip,
  Button,
  MenuItem,
  InputAdornment,
} from "@mui/material";
import {
  IconSearch,
  IconCash,
  IconFileSpreadsheet,
  IconPrinter,
  IconAlertTriangle,
  IconCheck,
  IconShieldCheck,
} from "@tabler/icons-react";

interface LoanBalancesReportViewProps {
  loans: any[];
  loading: boolean;
}

export default function LoanBalancesReportView({ loans, loading }: LoanBalancesReportViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const rowsPerPage = 12;

  // Filtered loans
  const filteredLoans = useMemo(() => {
    return loans.filter((l) => {
      const q = searchQuery.toLowerCase().trim();
      const memberName = l.member
        ? `${l.member.first_name} ${l.member.other_names}`.toLowerCase()
        : (l.member_name || "").toLowerCase();
      const memberNo = (l.member?.membership_number || l.membership_number || "").toLowerCase();
      const loanNum = (l.loan_number || "").toLowerCase();

      const matchesSearch = !q || memberName.includes(q) || memberNo.includes(q) || loanNum.includes(q);
      const matchesStatus = statusFilter === "ALL" || (l.status || "").toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [loans, searchQuery, statusFilter]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    let totalPrincipal = 0;
    let totalOutstanding = 0;
    let totalDeposit = 0;
    let totalRepaid = 0;
    let activeCount = 0;
    let arrearsCount = 0;

    loans.forEach((l) => {
      const princ = parseFloat(l.principal_amount || "0");
      const out = parseFloat(l.outstanding_balance || "0");
      const dep = parseFloat(l.deposit_paid_amount || "0");
      const stat = (l.status || "").toLowerCase();

      totalPrincipal += princ;
      totalOutstanding += out;
      totalDeposit += dep;
      totalRepaid += Math.max(0, princ - out);

      if (stat === "active" || stat === "disbursed") activeCount++;
      if (["watchful", "non_performing", "doubtful", "loss"].includes(stat)) arrearsCount++;
    });

    return { totalPrincipal, totalOutstanding, totalDeposit, totalRepaid, activeCount, arrearsCount };
  }, [loans]);

  const paginatedLoans = filteredLoans.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const totalPages = Math.ceil(filteredLoans.length / rowsPerPage) || 1;

  const exportCSV = () => {
    if (!filteredLoans.length) return;
    const headers = [
      "Loan #",
      "Member No",
      "Member Name",
      "Product",
      "Disbursed Date",
      "Principal (KES)",
      "Repaid (KES)",
      "Outstanding Balance (KES)",
      "Deposit Held (KES)",
      "Status",
    ];
    const rows = filteredLoans.map((l) => {
      const memberName = l.member ? `${l.member.first_name} ${l.member.other_names}` : l.member_name || "-";
      const memberNo = l.member?.membership_number || l.membership_number || "-";
      const princ = parseFloat(l.principal_amount || "0");
      const out = parseFloat(l.outstanding_balance || "0");
      const repaid = Math.max(0, princ - out);
      return [
        l.loan_number || "-",
        memberNo,
        `"${memberName.replace(/"/g, '""')}"`,
        `"${(l.product_name || l.product?.name || "Jiinue").replace(/"/g, '""')}"`,
        l.disbursement_date || l.created_at?.split("T")[0] || "-",
        princ,
        repaid,
        out,
        parseFloat(l.deposit_paid_amount || "0"),
        l.status || "-",
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `loan_balances_report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box>
      {/* 4 Summary KPI Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid #e2e8f0", bgcolor: "#ffffff" }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase">
              Total Principal Disbursed
            </Typography>
            <Typography variant="h5" fontWeight={900} color="#0f172a" mt={0.5}>
              KES {metrics.totalPrincipal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {loans.length} total loan facilities originated
            </Typography>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid #e2e8f0", bgcolor: "#f0fdf4" }}>
            <Typography variant="caption" fontWeight={700} color="#065f46" textTransform="uppercase">
              Total Principal Repaid
            </Typography>
            <Typography variant="h5" fontWeight={900} color="#059669" mt={0.5}>
              KES {metrics.totalRepaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </Typography>
            <Typography variant="caption" color="#047857">
              {((metrics.totalRepaid / (metrics.totalPrincipal || 1)) * 100).toFixed(1)}% recovery rate
            </Typography>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid #e2e8f0", bgcolor: "#eff6ff" }}>
            <Typography variant="caption" fontWeight={700} color="#1e40af" textTransform="uppercase">
              Total Outstanding Balance
            </Typography>
            <Typography variant="h5" fontWeight={900} color="#2563eb" mt={0.5}>
              KES {metrics.totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </Typography>
            <Typography variant="caption" color="#3b82f6">
              {metrics.activeCount} active performing loan accounts
            </Typography>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid #e2e8f0", bgcolor: "#faf5ff" }}>
            <Typography variant="caption" fontWeight={700} color="#6b21a8" textTransform="uppercase">
              Security Deposits Held
            </Typography>
            <Typography variant="h5" fontWeight={900} color="#7c3aed" mt={0.5}>
              KES {metrics.totalDeposit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </Typography>
            <Typography variant="caption" color="#9333ea">
              Mandatory borrower collateral reserves
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Filter Bar */}
      <Paper elevation={0} sx={{ p: 2, mb: 2.5, borderRadius: 2.5, border: "1px solid #e2e8f0" }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} flex={1}>
            <TextField
              size="small"
              placeholder="Search member, loan #, membership #..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconSearch size={18} color="#94a3b8" />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ minWidth: 260 }}
            />

            <TextField
              select
              size="small"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="ALL">All Statuses</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="disbursed">Disbursed</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="watchful">Watchful / Arrears</MenuItem>
            </TextField>
          </Stack>

          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<IconFileSpreadsheet size={16} />}
              onClick={exportCSV}
              sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
            >
              Export CSV
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<IconPrinter size={16} />}
              onClick={() => window.print()}
              sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
            >
              Print
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2.5, border: "1px solid #e2e8f0" }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: "#f8fafc" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 800, color: "#334155" }}>Loan #</TableCell>
              <TableCell sx={{ fontWeight: 800, color: "#334155" }}>Member</TableCell>
              <TableCell sx={{ fontWeight: 800, color: "#334155" }}>Product</TableCell>
              <TableCell sx={{ fontWeight: 800, color: "#334155" }}>Disbursed Date</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, color: "#334155" }}>Principal (KES)</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, color: "#334155" }}>Repaid (KES)</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, color: "#334155" }}>Outstanding (KES)</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, color: "#334155" }}>Deposit (KES)</TableCell>
              <TableCell align="center" sx={{ fontWeight: 800, color: "#334155" }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={28} />
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    Loading loan balances...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : paginatedLoans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    No loan balance records found for selected filters.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedLoans.map((l, i) => {
                const memberName = l.member ? `${l.member.first_name} ${l.member.other_names}` : l.member_name || "—";
                const memberNo = l.member?.membership_number || l.membership_number || "—";
                const princ = parseFloat(l.principal_amount || "0");
                const out = parseFloat(l.outstanding_balance || "0");
                const repaid = Math.max(0, princ - out);
                const stat = (l.status || "active").toLowerCase();

                return (
                  <TableRow key={l.id || i} hover>
                    <TableCell sx={{ fontFamily: "monospace", fontWeight: 700, color: "#2563eb" }}>
                      {l.loan_number || "—"}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={800} color="#0f172a">
                        {memberName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        #{memberNo}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.82rem" }}>
                      {l.product_name || l.product?.name || "Jiinue Microfinance"}
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.82rem", color: "#475569" }}>
                      {l.disbursement_date || l.created_at?.split("T")[0] || "—"}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: "#0f172a" }}>
                      {princ.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell align="right" sx={{ color: "#059669", fontWeight: 700 }}>
                      {repaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 900, color: out > 0 ? "#dc2626" : "#059669" }}>
                      {out.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell align="right" sx={{ color: "#7c3aed", fontWeight: 700 }}>
                      {parseFloat(l.deposit_paid_amount || "0").toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        size="small"
                        label={l.status?.toUpperCase() || "ACTIVE"}
                        sx={{
                          fontWeight: 800,
                          fontSize: "0.68rem",
                          height: 22,
                          bgcolor: stat === "completed" ? "#f0fdf4" : stat === "active" ? "#eff6ff" : "#fff1f2",
                          color: stat === "completed" ? "#15803d" : stat === "active" ? "#1d4ed8" : "#be123c",
                        }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Footer */}
        <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
          <Typography variant="caption" color="text.secondary">
            Showing {(page - 1) * rowsPerPage + 1} to {Math.min(page * rowsPerPage, filteredLoans.length)} of {filteredLoans.length} loans
          </Typography>
          {filteredLoans.length > rowsPerPage && (
            <Stack direction="row" spacing={1}>
              <Button size="small" variant="outlined" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button size="small" variant="outlined" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </Stack>
          )}
        </Box>
      </TableContainer>
    </Box>
  );
}
