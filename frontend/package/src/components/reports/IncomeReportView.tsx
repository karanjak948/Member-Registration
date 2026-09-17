"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
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
  Chip,
  Button,
  MenuItem,
  IconButton,
} from "@mui/material";
import loanService from "@/services/loan.service";
import {
  IconCoin,
  IconFilter,
  IconDownload,
  IconPrinter,
  IconRefresh,
  IconFileSpreadsheet,
  IconReceipt,
} from "@tabler/icons-react";

export default function IncomeReportView() {
  const [data, setData] = useState<{
    summary: {
      total_form_fees: number;
      total_processing_fees: number;
      total_security_deposits: number;
      total_interest_income: number;
      total_penalties: number;
      grand_total: number;
    };
    count: number;
    entries: Array<{
      entry_id: number;
      transaction_id: number;
      transaction_number: string;
      transaction_date: string;
      account_code: string;
      account_name: string;
      account_type: string;
      entry_type: "debit" | "credit";
      amount: number;
      narration: string;
      loan_id?: number;
      loan_number?: string;
      reference_type: string;
      reference_id: string;
    }>;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [accountCode, setAccountCode] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const rowsPerPage = 12;

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await loanService.getIncomeReport({
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        account_code: accountCode === "ALL" ? undefined : accountCode,
      });
      setData(res);
    } catch (err) {
      console.error("Failed to load fee & income report:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const entries = data?.entries || [];
  const filteredEntries = entries.filter((e) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      e.transaction_number.toLowerCase().includes(q) ||
      (e.loan_number && e.loan_number.toLowerCase().includes(q)) ||
      e.account_name.toLowerCase().includes(q) ||
      e.narration.toLowerCase().includes(q)
    );
  });

  const paginatedEntries = filteredEntries.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const totalPages = Math.ceil(filteredEntries.length / rowsPerPage) || 1;

  const exportCSV = () => {
    if (!filteredEntries.length) return;
    const headers = ["Date", "Transaction #", "Loan #", "Account Code", "Account Name", "Amount (KES)", "Narration"];
    const rows = filteredEntries.map((e) => [
      e.transaction_date,
      e.transaction_number,
      e.loan_number || "-",
      e.account_code,
      `"${e.account_name.replace(/"/g, '""')}"`,
      e.amount,
      `"${(e.narration || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sacco_fee_income_report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box>
      {/* 6 Income Category Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: "Loan Form Fees (4150)", value: data?.summary?.total_form_fees || 0, color: "#0284c7", bg: "#f0f9ff" },
          { label: "Processing Fees (4100)", value: data?.summary?.total_processing_fees || 0, color: "#2563eb", bg: "#eff6ff" },
          { label: "Security Deposits (2100)", value: data?.summary?.total_security_deposits || 0, color: "#7c3aed", bg: "#faf5ff" },
          { label: "Interest Income (4000)", value: data?.summary?.total_interest_income || 0, color: "#059669", bg: "#ecfdf5" },
          { label: "Penalty Collections (4200)", value: data?.summary?.total_penalties || 0, color: "#e11d48", bg: "#fff1f2" },
          { label: "Grand Total Income", value: data?.summary?.grand_total || 0, color: "#0f172a", bg: "#f8fafc" },
        ].map((item, idx) => (
          <Grid key={idx} size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 2.5,
                border: "1px solid #e2e8f0",
                bgcolor: item.bg,
                p: 2,
                boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
              }}
            >
              <Typography variant="caption" fontWeight={700} color="#475569" sx={{ fontSize: "0.72rem", textTransform: "uppercase" }}>
                {item.label}
              </Typography>
              <Typography variant="h6" fontWeight={900} sx={{ color: item.color, mt: 0.5 }}>
                KES {item.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filter Bar */}
      <Paper elevation={0} sx={{ p: 2, mb: 2.5, borderRadius: 2.5, border: "1px solid #e2e8f0" }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} flex={1}>
            <TextField
              size="small"
              placeholder="Search transaction #, loan #, narration..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              sx={{ minWidth: 240 }}
            />

            <TextField
              select
              size="small"
              value={accountCode}
              onChange={(e) => setAccountCode(e.target.value)}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="ALL">All Income Accounts</MenuItem>
              <MenuItem value="4150">4150 - Form Fees</MenuItem>
              <MenuItem value="4100">4100 - Processing Fees</MenuItem>
              <MenuItem value="2100">2100 - Security Deposits</MenuItem>
              <MenuItem value="4000">4000 - Interest Income</MenuItem>
              <MenuItem value="4200">4200 - Penalties</MenuItem>
            </TextField>

            <TextField
              size="small"
              type="date"
              label="Date From"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <TextField
              size="small"
              type="date"
              label="Date To"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <Button
              variant="contained"
              onClick={fetchReport}
              startIcon={<IconFilter size={16} />}
              sx={{
                bgcolor: "#0284c7",
                "&:hover": { bgcolor: "#0369a1" },
                textTransform: "none",
                fontWeight: 700,
                borderRadius: 2,
                px: 2.5,
              }}
            >
              Apply Filter
            </Button>
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
              <TableCell sx={{ fontWeight: 800, color: "#334155" }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 800, color: "#334155" }}>Transaction #</TableCell>
              <TableCell sx={{ fontWeight: 800, color: "#334155" }}>Loan #</TableCell>
              <TableCell sx={{ fontWeight: 800, color: "#334155" }}>Account</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, color: "#334155" }}>Amount (KES)</TableCell>
              <TableCell sx={{ fontWeight: 800, color: "#334155" }}>Narration</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={28} />
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    Loading income records...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : paginatedEntries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    No fee or income transactions found for selected filters.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedEntries.map((e) => (
                <TableRow key={e.entry_id} hover>
                  <TableCell sx={{ fontSize: "0.85rem" }}>{e.transaction_date}</TableCell>
                  <TableCell sx={{ fontFamily: "monospace", fontWeight: 700, color: "#2563eb" }}>
                    {e.transaction_number}
                  </TableCell>
                  <TableCell sx={{ fontFamily: "monospace", fontSize: "0.85rem" }}>
                    {e.loan_number || "—"}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={`${e.account_code} - ${e.account_name}`}
                      sx={{ fontSize: "0.72rem", fontWeight: 700, bgcolor: "#f1f5f9" }}
                    />
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, color: "#059669" }}>
                    {e.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.85rem", color: "#475569" }}>{e.narration}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Footer */}
        <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
          <Typography variant="caption" color="text.secondary">
            Showing {(page - 1) * rowsPerPage + 1} to {Math.min(page * rowsPerPage, filteredEntries.length)} of {filteredEntries.length} entries
          </Typography>
          {filteredEntries.length > rowsPerPage && (
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
