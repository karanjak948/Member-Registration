"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  InputAdornment,
} from "@mui/material";
import savingsService from "@/services/savings.service";
import { SavingsPayment } from "@/types/savings";
import {
  IconSearch,
  IconPigMoney,
  IconCoins,
  IconFileSpreadsheet,
  IconPrinter,
  IconUsers,
} from "@tabler/icons-react";

interface MemberSavingsSummary {
  memberId: number;
  memberName: string;
  membershipNumber: string;
  phone: string;
  category: string;
  normalSavings: number;
  welfareSavings: number;
  totalSavings: number;
  transactionsCount: number;
  lastDepositDate: string;
}

export default function SavingsBalancesReportView() {
  const [payments, setPayments] = useState<SavingsPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const rowsPerPage = 12;

  useEffect(() => {
    savingsService
      .getPayments()
      .then((data) => setPayments(data))
      .catch((err) => console.error("Failed to load savings payments:", err))
      .finally(() => setLoading(false));
  }, []);

  // Aggregate by member
  const memberBalances: MemberSavingsSummary[] = useMemo(() => {
    const map: Record<number, MemberSavingsSummary> = {};

    payments.forEach((p) => {
      const amt = parseFloat(p.amount || "0");
      const isOut = p.transaction_type === "money_out";
      const net = isOut ? -amt : amt;

      if (!map[p.member]) {
        map[p.member] = {
          memberId: p.member,
          memberName: p.member_name || "Unknown Member",
          membershipNumber: p.membership_number || "—",
          phone: p.member_phone || "—",
          category: "Normal Member",
          normalSavings: 0,
          welfareSavings: 0,
          totalSavings: 0,
          transactionsCount: 0,
          lastDepositDate: p.paid_on || "—",
        };
      }

      const item = map[p.member];
      item.transactionsCount++;
      if (p.savings_type === "welfare") {
        item.welfareSavings += net;
      } else {
        item.normalSavings += net;
      }
      item.totalSavings += net;

      if (p.paid_on && p.paid_on > item.lastDepositDate) {
        item.lastDepositDate = p.paid_on;
      }
    });

    return Object.values(map);
  }, [payments]);

  // Filtered members
  const filteredMembers = useMemo(() => {
    return memberBalances.filter((m) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        m.memberName.toLowerCase().includes(q) ||
        m.membershipNumber.toLowerCase().includes(q) ||
        m.phone.toLowerCase().includes(q)
      );
    });
  }, [memberBalances, searchQuery]);

  // Aggregate totals
  const totals = useMemo(() => {
    let totalNormal = 0;
    let totalWelfare = 0;
    let grandTotal = 0;

    memberBalances.forEach((m) => {
      totalNormal += m.normalSavings;
      totalWelfare += m.welfareSavings;
      grandTotal += m.totalSavings;
    });

    return { totalNormal, totalWelfare, grandTotal, totalMembers: memberBalances.length };
  }, [memberBalances]);

  const paginatedMembers = filteredMembers.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const totalPages = Math.ceil(filteredMembers.length / rowsPerPage) || 1;

  const exportCSV = () => {
    if (!filteredMembers.length) return;
    const headers = [
      "Member No",
      "Member Name",
      "Phone",
      "Normal Savings (KES)",
      "Welfare Savings (KES)",
      "Total Savings Balance (KES)",
      "Transactions",
      "Last Deposit Date",
    ];
    const rows = filteredMembers.map((m) => [
      m.membershipNumber,
      `"${m.memberName.replace(/"/g, '""')}"`,
      m.phone,
      m.normalSavings,
      m.welfareSavings,
      m.totalSavings,
      m.transactionsCount,
      m.lastDepositDate,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `savings_balances_report_${new Date().toISOString().split("T")[0]}.csv`);
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
              Shareholders / Savers
            </Typography>
            <Typography variant="h5" fontWeight={900} color="#0f172a" mt={0.5}>
              {totals.totalMembers} Members
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Active accounts holding savings
            </Typography>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid #e2e8f0", bgcolor: "#ecfdf5" }}>
            <Typography variant="caption" fontWeight={700} color="#065f46" textTransform="uppercase">
              Normal Savings Balance
            </Typography>
            <Typography variant="h5" fontWeight={900} color="#059669" mt={0.5}>
              KES {totals.totalNormal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </Typography>
            <Typography variant="caption" color="#047857">
              Member Personal Account (MPA)
            </Typography>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid #e2e8f0", bgcolor: "#eff6ff" }}>
            <Typography variant="caption" fontWeight={700} color="#1e40af" textTransform="uppercase">
              Welfare Contributions
            </Typography>
            <Typography variant="h5" fontWeight={900} color="#2563eb" mt={0.5}>
              KES {totals.totalWelfare.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </Typography>
            <Typography variant="caption" color="#3b82f6">
              Benevolent &amp; welfare pool
            </Typography>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid #e2e8f0", bgcolor: "#faf5ff" }}>
            <Typography variant="caption" fontWeight={700} color="#6b21a8" textTransform="uppercase">
              Total Combined Savings
            </Typography>
            <Typography variant="h5" fontWeight={900} color="#7c3aed" mt={0.5}>
              KES {totals.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </Typography>
            <Typography variant="caption" color="#9333ea">
              Total SACCO liability held
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Filter Bar */}
      <Paper elevation={0} sx={{ p: 2, mb: 2.5, borderRadius: 2.5, border: "1px solid #e2e8f0" }}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2}>
          <TextField
            size="small"
            placeholder="Search member name, membership #, phone..."
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
            sx={{ minWidth: 280 }}
          />

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
              <TableCell sx={{ fontWeight: 800, color: "#334155" }}>Member No</TableCell>
              <TableCell sx={{ fontWeight: 800, color: "#334155" }}>Member Name</TableCell>
              <TableCell sx={{ fontWeight: 800, color: "#334155" }}>Phone</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, color: "#334155" }}>Normal Savings (KES)</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, color: "#334155" }}>Welfare (KES)</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, color: "#334155" }}>Total Savings (KES)</TableCell>
              <TableCell align="center" sx={{ fontWeight: 800, color: "#334155" }}>Txns</TableCell>
              <TableCell sx={{ fontWeight: 800, color: "#334155" }}>Last Deposit</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={28} />
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    Loading savings balances...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : paginatedMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    No savings balances found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedMembers.map((m) => (
                <TableRow key={m.memberId} hover>
                  <TableCell sx={{ fontFamily: "monospace", fontWeight: 700, color: "#2563eb" }}>
                    #{m.membershipNumber}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800, color: "#0f172a" }}>
                    {m.memberName}
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.85rem", color: "#475569" }}>
                    {m.phone}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: "#059669" }}>
                    {m.normalSavings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: "#2563eb" }}>
                    {m.welfareSavings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 900, color: "#0f172a" }}>
                    {m.totalSavings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell align="center">
                    <Chip size="small" label={m.transactionsCount} sx={{ height: 20, fontSize: "0.72rem", fontWeight: 700 }} />
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.82rem", color: "#475569" }}>
                    {m.lastDepositDate}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Footer */}
        <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
          <Typography variant="caption" color="text.secondary">
            Showing {(page - 1) * rowsPerPage + 1} to {Math.min(page * rowsPerPage, filteredMembers.length)} of {filteredMembers.length} members
          </Typography>
          {filteredMembers.length > rowsPerPage && (
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
