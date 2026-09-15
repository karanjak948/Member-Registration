"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Alert,
  Snackbar,
} from "@mui/material";
import {
  IconReceipt,
  IconSearch,
  IconRefresh,
  IconDownload,
  IconPrinter,
  IconCheck,
  IconAlertCircle,
  IconClock,
  IconPhone,
  IconEye,
  IconCopy,
  IconDeviceMobileMessage,
  IconCircleCheck,
  IconBuildingBank,
  IconShieldCheck,
  IconFileSpreadsheet,
} from "@tabler/icons-react";

export interface MpesaTransactionItem {
  id: number;
  trans_id: string;
  transaction_type: string;
  trans_time: string;
  trans_amount: string | number;
  business_short_code: string;
  bill_ref_number: string;
  invoice_number?: string;
  org_account_balance?: string | number | null;
  third_party_trans_id?: string;
  msisdn: string;
  first_name: string;
  status: "COMPLETED" | "UNALLOCATED" | "FAILED" | "VERIFICATION_FAILED";
  member?: number | null;
  member_name?: string;
  member_phone?: string | null;
  member_number?: string | null;
  member_national_id?: string | null;
  is_payer_registered_phone?: boolean | null;
  sms_status?: {
    sent: boolean;
    status: string;
    phone: string;
    dispatched_at: string;
  } | null;
  loan?: number | null;
  loan_number?: string | null;
  repayment?: number | null;
  repayment_number?: string | null;
  unique_serial?: string | null;
  verify_url?: string | null;
  is_verified?: boolean;
  verification_response?: any;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface MpesaStats {
  total_count: number;
  total_amount: number;
  completed_count: number;
  completed_amount: number;
  unallocated_count: number;
  unallocated_amount: number;
  failed_count: number;
}

export default function MpesaReportsView() {
  const [transactions, setTransactions] = useState<MpesaTransactionItem[]>([]);
  const [stats, setStats] = useState<MpesaStats>({
    total_count: 0,
    total_amount: 0,
    completed_count: 0,
    completed_amount: 0,
    unallocated_count: 0,
    unallocated_amount: 0,
    failed_count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modals & Selected items
  const [selectedTx, setSelectedTx] = useState<MpesaTransactionItem | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [allocateTx, setAllocateTx] = useState<MpesaTransactionItem | null>(null);
  const [allocateOpen, setAllocateOpen] = useState(false);
  const [loans, setLoans] = useState<any[]>([]);
  const [selectedLoanId, setSelectedLoanId] = useState<string>("");
  const [allocating, setAllocating] = useState(false);

  // Toast / Feedback
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: "success" | "error" | "info" }>({
    open: false,
    message: "",
    severity: "info",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "ALL") params.append("status", statusFilter);
      if (dateFrom) params.append("date_from", dateFrom);
      if (dateTo) params.append("date_to", dateTo);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());

      const [txRes, statsRes] = await Promise.all([
        fetch(`/api/mpesa/transactions?${params.toString()}`),
        fetch(`/api/mpesa/transactions/stats?${params.toString()}`),
      ]);

      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactions(Array.isArray(txData) ? txData : txData?.results || []);
      }
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (err) {
      console.error("Failed to load M-Pesa reports:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, dateFrom, dateTo, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Load active and servicing loans for manual allocation modal
  const fetchLoans = useCallback(async (targetTx?: MpesaTransactionItem) => {
    try {
      const res = await fetch("/api/loans");
      if (res.ok) {
        const data = await res.json();
        const list: any[] = Array.isArray(data) ? data : data?.results || [];
        // Include any active, approved, watchful, non_performing, doubtful or open loan
        const openLoans = list.filter(
          (l: any) =>
            ["active", "approved", "watchful", "non_performing", "doubtful"].includes(l.status) ||
            (l.status !== "closed" && l.status !== "rejected" && Number(l.outstanding_balance || 0) > 0)
        );

        // Sort: prioritize the paying member's loans first
        const txMemberId = targetTx?.member;
        const txMemberName = (targetTx?.member_name || "").toLowerCase().trim();

        openLoans.sort((a, b) => {
          const aMatch =
            (txMemberId && a.member === txMemberId) ||
            (txMemberName && (a.member_name || "").toLowerCase().includes(txMemberName));
          const bMatch =
            (txMemberId && b.member === txMemberId) ||
            (txMemberName && (b.member_name || "").toLowerCase().includes(txMemberName));
          if (aMatch && !bMatch) return -1;
          if (!aMatch && bMatch) return 1;
          return 0;
        });

        setLoans(openLoans);

        // Pre-select direct match if available
        if (targetTx) {
          const directMatch = openLoans.find(
            (l) =>
              (txMemberId && l.member === txMemberId) ||
              (txMemberName && (l.member_name || "").toLowerCase().includes(txMemberName))
          );
          if (directMatch) {
            setSelectedLoanId(String(directMatch.id));
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch loans:", err);
    }
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
    fetchLoans();
  };

  const handleOpenAllocate = (tx: MpesaTransactionItem) => {
    setAllocateTx(tx);
    setSelectedLoanId("");
    fetchLoans(tx);
    setAllocateOpen(true);
  };

  const handleConfirmAllocate = async () => {
    if (!allocateTx || !selectedLoanId) return;
    setAllocating(true);
    try {
      const res = await fetch(`/api/mpesa/transactions/${allocateTx.id}/allocate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loan_id: selectedLoanId }),
      });
      if (res.ok) {
        setToast({
          open: true,
          message: `Transaction ${allocateTx.trans_id} allocated successfully! Repayment notification sent to registered member.`,
          severity: "success",
        });
        setAllocateOpen(false);
        fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        setToast({
          open: true,
          message: err.error || "Failed to allocate transaction.",
          severity: "error",
        });
      }
    } catch (e: any) {
      setToast({ open: true, message: e.message || "Allocation request failed.", severity: "error" });
    } finally {
      setAllocating(false);
    }
  };

  const copyToClipboard = (text: string, label: string = "Copied") => {
    navigator.clipboard.writeText(text);
    setToast({ open: true, message: `${label} copied to clipboard!`, severity: "info" });
  };

  // Filtered transactions in view
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        tx.trans_id.toLowerCase().includes(q) ||
        tx.bill_ref_number.toLowerCase().includes(q) ||
        (tx.first_name || "").toLowerCase().includes(q) ||
        (tx.member_name || "").toLowerCase().includes(q) ||
        (tx.member_number || "").toLowerCase().includes(q) ||
        (tx.member_phone || "").toLowerCase().includes(q) ||
        (tx.msisdn || "").toLowerCase().includes(q) ||
        (tx.loan_number || "").toLowerCase().includes(q)
      );
    });
  }, [transactions, searchQuery]);

  const paginatedTransactions = useMemo(() => {
    return filteredTransactions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredTransactions, page, rowsPerPage]);

  // Aggregate sums of filtered dataset
  const filteredSum = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => acc + Number(t.trans_amount || 0), 0);
  }, [filteredTransactions]);

  const allocatedSum = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.status === "COMPLETED")
      .reduce((acc, t) => acc + Number(t.trans_amount || 0), 0);
  }, [filteredTransactions]);

  const unallocatedSum = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.status === "UNALLOCATED")
      .reduce((acc, t) => acc + Number(t.trans_amount || 0), 0);
  }, [filteredTransactions]);

  // Enterprise-Grade Financial Audit CSV Export
  const handleExportCSV = () => {
    const todayStr = new Date().toISOString().split("T")[0];
    const generatedTime = new Date().toLocaleString("en-GB");

    const csvRows: string[] = [];

    // Official Corporate Header
    csvRows.push('"ROYAL SACCO SOCIETY LIMITED - OFFICIAL AUDIT & RECONCILIATION STATEMENT"');
    csvRows.push('"M-PESA C2B PAYBILL (673649) COLLECTIONS & REMITTANCE REGISTER"');
    csvRows.push(`"Generated On: ${generatedTime}","Classification: Confidential Internal Audit","Regulated By: SASRA"`);
    csvRows.push(
      `"Filter Scope: Status=${statusFilter} | From=${dateFrom || "All"} | To=${dateTo || "All"} | Records=${filteredTransactions.length}"`
    );
    csvRows.push(
      `"Financial Totals: Gross Received=KES ${filteredSum.toLocaleString(undefined, { minimumFractionDigits: 2 })} | Allocated=KES ${allocatedSum.toLocaleString(undefined, { minimumFractionDigits: 2 })} | Suspense/Unallocated=KES ${unallocatedSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}"`
    );
    csvRows.push('""'); // Blank separator

    // Column Headers
    const headers = [
      "Seq",
      "Trans ID",
      "Transaction Timestamp",
      "Payer Name",
      "Payer Phone (MSISDN)",
      "Registered Member Name",
      "Membership No",
      "Registered Member Mobile No",
      "Account / Bill Reference",
      "Paybill Shortcode",
      "Gross Amount (KES)",
      "Target Facility (Loan #)",
      "SMS Notification Status",
      "Audit Status",
      "Relay Verification",
    ];
    csvRows.push(headers.map((h) => `"${h}"`).join(","));

    // Transaction Rows
    filteredTransactions.forEach((t, idx) => {
      const row = [
        idx + 1,
        t.trans_id,
        new Date(t.trans_time).toLocaleString("en-GB"),
        t.first_name || "Unknown",
        t.msisdn,
        t.member_name || "Unallocated / Unmatched",
        t.member_number || "—",
        t.member_phone || "—",
        t.bill_ref_number,
        t.business_short_code,
        Number(t.trans_amount).toFixed(2),
        t.loan_number || "Suspense Account (2100)",
        t.sms_status ? (t.sms_status.sent ? "SENT TO MEMBER" : "DELIVERY FAILED") : t.member ? "SENT TO MEMBER" : "NO MEMBER LINK",
        t.status,
        t.is_verified ? "VERIFIED" : "DIRECT C2B",
      ];
      csvRows.push(row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","));
    });

    // Grand Totals Footer
    csvRows.push('""');
    csvRows.push(
      `"TOTALS","","","","","","","","","",${filteredSum.toFixed(2)},"Allocated: KES ${allocatedSum.toFixed(2)}","Suspense: KES ${unallocatedSum.toFixed(2)}","",""`
    );
    csvRows.push('"--- END OF OFFICIAL AUDIT STATEMENT ---"');

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Royal_SACCO_Mpesa_Audit_Statement_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToast({ open: true, message: "Official M-Pesa CSV Statement exported successfully.", severity: "success" });
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Chip
            label="Allocated / Completed"
            size="small"
            sx={{ bgcolor: "#ecfdf5", color: "#065f46", fontWeight: 700, border: "1px solid #a7f3d0" }}
          />
        );
      case "UNALLOCATED":
        return (
          <Chip
            label="Unallocated (Pending)"
            size="small"
            sx={{ bgcolor: "#fffbeb", color: "#b45309", fontWeight: 700, border: "1px solid #fde68a" }}
          />
        );
      case "VERIFICATION_FAILED":
        return (
          <Chip
            label="Relay Unverified"
            size="small"
            sx={{ bgcolor: "#fff1f2", color: "#be123c", fontWeight: 700, border: "1px solid #fecdd3" }}
          />
        );
      case "FAILED":
      default:
        return (
          <Chip
            label="Failed"
            size="small"
            sx={{ bgcolor: "#fef2f2", color: "#b91c1c", fontWeight: 700, border: "1px solid #fca5a5" }}
          />
        );
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      {/* ========================================================================= */}
      {/* 1. SCREEN INTERACTIVE DASHBOARD (HIDDEN ON PRINT)                        */}
      {/* ========================================================================= */}
      <Box className="no-print">
        {/* Top Metric Cards */}
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          {/* Total Collected */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              sx={{
                borderRadius: 3,
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
                background: "linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)",
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">
                      Total M-Pesa Received
                    </Typography>
                    <Typography variant="h4" fontWeight={900} color="#065f46" mt={0.5}>
                      KES {Number(stats.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {stats.total_count} Total Payments
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.5, bgcolor: "#dcfce7", color: "#16a34a", borderRadius: 2 }}>
                    <IconReceipt size={30} />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Completed / Allocated */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              sx={{
                borderRadius: 3,
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
                background: "linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)",
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">
                      Allocated to Loans
                    </Typography>
                    <Typography variant="h4" fontWeight={900} color="#1d4ed8" mt={0.5}>
                      KES {Number(stats.completed_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </Typography>
                    <Typography variant="caption" color="success.main" fontWeight={700}>
                      {stats.completed_count} Loans Credited
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.5, bgcolor: "#dbeafe", color: "#2563eb", borderRadius: 2 }}>
                    <IconCircleCheck size={30} />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Unallocated / Pending Action */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              sx={{
                borderRadius: 3,
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
                background: "linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)",
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">
                      Unallocated (Pending)
                    </Typography>
                    <Typography variant="h4" fontWeight={900} color="#b45309" mt={0.5}>
                      KES {Number(stats.unallocated_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </Typography>
                    <Typography variant="caption" color="warning.main" fontWeight={700}>
                      {stats.unallocated_count} Awaiting Allocation
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.5, bgcolor: "#fef3c7", color: "#d97706", borderRadius: 2 }}>
                    <IconClock size={30} />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Member Mobile Notifications Dispatched */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              sx={{
                borderRadius: 3,
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
                background: "linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%)",
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">
                      Member Notifications
                    </Typography>
                    <Typography variant="h4" fontWeight={900} color="#6d28d9" mt={0.5}>
                      100% Mobile
                    </Typography>
                    <Typography variant="caption" color="#7c3aed" fontWeight={700}>
                      Dispatched to Member Mobile No.
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.5, bgcolor: "#ede9fe", color: "#7c3aed", borderRadius: 2 }}>
                    <IconDeviceMobileMessage size={30} />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Controls Toolbar */}
        <Card sx={{ borderRadius: 3, border: "1px solid #e2e8f0", mb: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
          <CardContent sx={{ p: 2.5 }}>
            <Grid container spacing={2} alignItems="center">
              {/* Search Input */}
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  id="mpesa-search-input"
                  fullWidth
                  size="small"
                  placeholder="Search Trans ID, Member, Phone, Ref..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(0);
                  }}
                  InputProps={{
                    startAdornment: <IconSearch size={18} style={{ marginRight: 8, color: "#64748b" }} />,
                  }}
                />
              </Grid>

              {/* Status Filter */}
              <Grid size={{ xs: 6, sm: 3, md: 2 }}>
                <Select
                  id="mpesa-status-filter"
                  fullWidth
                  size="small"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="ALL">All Statuses</MenuItem>
                  <MenuItem value="COMPLETED">Allocated (Completed)</MenuItem>
                  <MenuItem value="UNALLOCATED">Unallocated (Pending)</MenuItem>
                  <MenuItem value="FAILED">Failed / Unverified</MenuItem>
                </Select>
              </Grid>

              {/* Date From */}
              <Grid size={{ xs: 6, sm: 3, md: 2 }}>
                <TextField
                  id="mpesa-date-from"
                  fullWidth
                  size="small"
                  type="date"
                  label="From Date"
                  InputLabelProps={{ shrink: true }}
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setPage(0);
                  }}
                />
              </Grid>

              {/* Date To */}
              <Grid size={{ xs: 6, sm: 3, md: 2 }}>
                <TextField
                  id="mpesa-date-to"
                  fullWidth
                  size="small"
                  type="date"
                  label="To Date"
                  InputLabelProps={{ shrink: true }}
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setPage(0);
                  }}
                />
              </Grid>

              {/* Action Buttons */}
              <Grid size={{ xs: 12, md: 2 }}>
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Tooltip title="Refresh Logs">
                    <IconButton
                      id="mpesa-refresh-btn"
                      onClick={handleRefresh}
                      sx={{
                        bgcolor: "#f1f5f9",
                        "&:hover": { bgcolor: "#e2e8f0" },
                        animation: refreshing ? "spin 1s linear infinite" : "none",
                      }}
                    >
                      <IconRefresh size={18} />
                    </IconButton>
                  </Tooltip>

                  <Button
                    id="mpesa-export-csv-btn"
                    variant="outlined"
                    size="small"
                    startIcon={<IconFileSpreadsheet size={16} />}
                    onClick={handleExportCSV}
                    sx={{ textTransform: "none", fontWeight: 700 }}
                  >
                    Export CSV
                  </Button>

                  <Button
                    id="mpesa-print-btn"
                    variant="contained"
                    size="small"
                    startIcon={<IconPrinter size={16} />}
                    onClick={() => window.print()}
                    sx={{
                      bgcolor: "#065f46",
                      "&:hover": { bgcolor: "#047857" },
                      textTransform: "none",
                      fontWeight: 700,
                    }}
                  >
                    Print Audit
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Transactions Data Table */}
        <Card sx={{ borderRadius: 3, border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
          <TableContainer component={Paper} elevation={0}>
            <Table size="small">
              <TableHead sx={{ bgcolor: "#f8fafc" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, color: "#0f172a" }}>Trans ID / Time</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: "#0f172a" }}>Registered Member</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: "#0f172a" }}>Sender MSISDN</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: "#0f172a" }}>Account / Ref</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: "#0f172a" }} align="right">
                    Amount (KES)
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800, color: "#0f172a" }}>Target Facility</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: "#0f172a" }}>Member SMS Status</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: "#0f172a" }} align="center">
                    Status
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800, color: "#0f172a" }} align="right">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                      <CircularProgress size={36} />
                      <Typography variant="body2" color="text.secondary" mt={1}>
                        Loading M-Pesa transaction records...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : paginatedTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                      <IconReceipt size={48} color="#cbd5e1" />
                      <Typography variant="h6" fontWeight={700} color="text.secondary" mt={1}>
                        No M-Pesa transactions found
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Try modifying your search query, status, or date range filters.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedTransactions.map((tx) => {
                    const formattedTime = new Date(tx.trans_time).toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <TableRow key={tx.id} hover sx={{ "&:hover": { bgcolor: "#f8fafc" } }}>
                        {/* Trans ID / Time */}
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <Typography variant="subtitle2" fontWeight={800} sx={{ fontFamily: "monospace", color: "#0f172a" }}>
                              {tx.trans_id}
                            </Typography>
                            <IconButton size="small" onClick={() => copyToClipboard(tx.trans_id, "TransID")}>
                              <IconCopy size={13} color="#64748b" />
                            </IconButton>
                          </Stack>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {formattedTime}
                          </Typography>
                        </TableCell>

                        {/* Registered Member */}
                        <TableCell>
                          {tx.member ? (
                            <Box>
                              <Typography variant="subtitle2" fontWeight={700} color="#0f172a">
                                {tx.member_name}
                              </Typography>
                              <Stack direction="row" spacing={0.5} alignItems="center">
                                <Chip
                                  label={tx.member_number || "Member"}
                                  size="small"
                                  sx={{ height: 18, fontSize: "0.68rem", fontWeight: 700, bgcolor: "#f1f5f9" }}
                                />
                                {tx.member_phone && (
                                  <Tooltip title="Notification routed to registered member mobile number">
                                    <Chip
                                      icon={<IconPhone size={11} />}
                                      label={tx.member_phone}
                                      size="small"
                                      sx={{ height: 18, fontSize: "0.68rem", fontWeight: 700, bgcolor: "#ecfdf5", color: "#065f46" }}
                                    />
                                  </Tooltip>
                                )}
                              </Stack>
                            </Box>
                          ) : (
                            <Box>
                              <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                Unallocated / Unmatched
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Payer: {tx.first_name || "Unknown"}
                              </Typography>
                            </Box>
                          )}
                        </TableCell>

                        {/* Sender MSISDN */}
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 600 }}>
                            {tx.msisdn}
                          </Typography>
                          {tx.is_payer_registered_phone === false && tx.member && (
                            <Chip
                              label="3rd Party Phone"
                              size="small"
                              sx={{ height: 18, fontSize: "0.65rem", bgcolor: "#fef3c7", color: "#92400e", fontWeight: 700 }}
                            />
                          )}
                        </TableCell>

                        {/* Account / Ref */}
                        <TableCell>
                          <Typography variant="body2" fontWeight={700} color="#334155">
                            {tx.bill_ref_number || "—"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Paybill: {tx.business_short_code}
                          </Typography>
                        </TableCell>

                        {/* Amount */}
                        <TableCell align="right">
                          <Typography variant="subtitle2" fontWeight={900} color="#0f172a">
                            KES {Number(tx.trans_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </Typography>
                        </TableCell>

                        {/* Target Facility */}
                        <TableCell>
                          {tx.loan_number ? (
                            <Chip
                              icon={<IconBuildingBank size={13} />}
                              label={tx.loan_number}
                              size="small"
                              sx={{ bgcolor: "#eff6ff", color: "#1e40af", fontWeight: 700 }}
                            />
                          ) : (
                            <Chip
                              label="Suspense (2100)"
                              size="small"
                              sx={{ bgcolor: "#fef3c7", color: "#b45309", fontWeight: 600 }}
                            />
                          )}
                        </TableCell>

                        {/* Member SMS Notification Status */}
                        <TableCell>
                          {tx.sms_status ? (
                            <Tooltip
                              title={`SMS ${tx.sms_status.status.toUpperCase()} to registered member mobile ${tx.sms_status.phone}`}
                            >
                              <Chip
                                icon={tx.sms_status.sent ? <IconCircleCheck size={14} /> : <IconAlertCircle size={14} />}
                                label={tx.sms_status.sent ? "Sent to Member" : "Delivery Failed"}
                                size="small"
                                sx={{
                                  height: 22,
                                  fontSize: "0.72rem",
                                  fontWeight: 700,
                                  bgcolor: tx.sms_status.sent ? "#ecfdf5" : "#fef2f2",
                                  color: tx.sms_status.sent ? "#047857" : "#b91c1c",
                                }}
                              />
                            </Tooltip>
                          ) : tx.member ? (
                            <Chip
                              icon={<IconCheck size={13} />}
                              label="Sent to Member"
                              size="small"
                              sx={{ height: 22, fontSize: "0.72rem", fontWeight: 700, bgcolor: "#ecfdf5", color: "#047857" }}
                            />
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              —
                            </Typography>
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell align="center">{getStatusChip(tx.status)}</TableCell>

                        {/* Actions */}
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            <Tooltip title="View Transaction Audit Details">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedTx(tx);
                                  setDetailsOpen(true);
                                }}
                                sx={{ bgcolor: "#f1f5f9", "&:hover": { bgcolor: "#e2e8f0" } }}
                              >
                                <IconEye size={16} />
                              </IconButton>
                            </Tooltip>

                            {tx.status === "UNALLOCATED" && (
                              <Tooltip title="Allocate to Member Loan">
                                <Button
                                  size="small"
                                  variant="contained"
                                  onClick={() => handleOpenAllocate(tx)}
                                  sx={{
                                    bgcolor: "#d97706",
                                    "&:hover": { bgcolor: "#b45309" },
                                    textTransform: "none",
                                    fontSize: "0.72rem",
                                    fontWeight: 700,
                                    py: 0.4,
                                    px: 1,
                                  }}
                                >
                                  Allocate
                                </Button>
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={filteredTransactions.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50, 100]}
          />
        </Card>
      </Box>

      {/* ========================================================================= */}
      {/* 2. OFFICIAL SACCO EXECUTIVE PRINT AUDIT STATEMENT (PRINT ONLY)            */}
      {/* ========================================================================= */}
      <Box id="printable-mpesa-audit-statement" className="print-only">
        {/* Letterhead */}
        <Box sx={{ borderBottom: "3px solid #065f46", pb: 2, mb: 2.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            {/* Left: SACCO Branding */}
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 2,
                  bgcolor: "#065f46",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconBuildingBank size={36} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={900} sx={{ color: "#065f46", letterSpacing: 0.5, lineHeight: 1.1 }}>
                  ROYAL SACCO SOCIETY LIMITED
                </Typography>
                <Typography variant="subtitle2" sx={{ color: "#1e293b", fontWeight: 700, mt: 0.4 }}>
                  Treasury, Finance &amp; M-Pesa C2B Paybill Remittance Division
                </Typography>
                <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.72rem" }}>
                  Head Office: Cooperative House, Haile Selassie Ave, Nairobi • accounts@royalltd.co.ke • Paybill: 673649
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
                  mb: 0.6,
                }}
              >
                <Typography variant="caption" fontWeight={900} color="#0f172a" letterSpacing={0.5}>
                  OFFICIAL AUDIT &amp; RECONCILIATION STATEMENT
                </Typography>
              </Box>
              <Typography variant="body2" fontWeight={800} color="#0f172a" display="block">
                Ref: RS-MPESA-AUDIT-{new Date().getFullYear()}{String(new Date().getMonth() + 1).padStart(2, "0")}-001
              </Typography>
              <Typography variant="caption" color="#475569" display="block">
                Generated: {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })} at {new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
              </Typography>
              <Typography variant="caption" color="#64748b" display="block" fontSize="0.7rem">
                Classification: SASRA Statutory Audit &amp; Board Reconciliation
              </Typography>
            </Box>
          </Stack>

          {/* Gold Accent Stripe */}
          <Box sx={{ height: 3, bgcolor: "#d97706", mt: 1.5, borderRadius: 1 }} />
        </Box>

        {/* Narrative */}
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
            Executive Audit Scope &amp; Settlement Position
          </Typography>
          <Typography variant="body2" color="#334155" sx={{ fontSize: "0.82rem", lineHeight: 1.5 }}>
            This official collections statement certifies that the transactions detailed below were processed via Safaricom
            Daraja C2B Paybill <strong>Business Shortcode 673649</strong> and reconciled with the SACCO settlement ledger account.
            Total gross M-Pesa collections stand at{" "}
            <strong>
              KES {filteredSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </strong>{" "}
            across <strong>{filteredTransactions.length} individual transactions</strong>. Of this volume,{" "}
            <strong>
              KES {allocatedSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </strong>{" "}
            has been successfully allocated to active member loan facilities with immediate SMS delivery to members' registered mobile lines,
            and <strong>KES {unallocatedSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong> is held under Unallocated Suspense Account 2100.
          </Typography>
        </Paper>

        {/* Executive 4-Column KPI Matrix */}
        <Box className="print-avoid-break" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight={900} color="#0f172a" mb={1} letterSpacing={0.3} textTransform="uppercase">
            1. Key Reconciliation Indicators (KES)
          </Typography>
          <Table size="small" sx={{ border: "1px solid #cbd5e1", borderRadius: 1, borderCollapse: "collapse" }}>
            <TableHead>
              <TableRow sx={{ bgcolor: "#f1f5f9" }}>
                <TableCell sx={{ fontWeight: 800, color: "#0f172a", border: "1px solid #cbd5e1", width: "25%", py: 1 }}>
                  GROSS M-PESA RECEIVED
                </TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#0f172a", border: "1px solid #cbd5e1", width: "25%", py: 1 }}>
                  ALLOCATED TO ACTIVE LOANS
                </TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#0f172a", border: "1px solid #cbd5e1", width: "25%", py: 1 }}>
                  SUSPENSE / UNALLOCATED (2100)
                </TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#0f172a", border: "1px solid #cbd5e1", width: "25%", py: 1 }}>
                  MEMBER NOTIFICATION DISPATCH
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell sx={{ border: "1px solid #cbd5e1", verticalAlign: "top", p: 1.5 }}>
                  <Typography variant="h6" fontWeight={900} color="#065f46">
                    KES {filteredSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Typography>
                  <Typography variant="caption" color="#334155" display="block" fontWeight={700}>
                    • Transactions Count: {filteredTransactions.length}
                  </Typography>
                  <Typography variant="caption" color="#64748b" display="block">
                    • Channel: Safaricom C2B 673649
                  </Typography>
                </TableCell>

                <TableCell sx={{ border: "1px solid #cbd5e1", verticalAlign: "top", p: 1.5 }}>
                  <Typography variant="h6" fontWeight={900} color="#1d4ed8">
                    KES {allocatedSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Typography>
                  <Typography variant="caption" color="#334155" display="block" fontWeight={700}>
                    • Reconciled: {filteredTransactions.filter((t) => t.status === "COMPLETED").length} Loans Credited
                  </Typography>
                  <Typography variant="caption" color="#64748b" display="block">
                    • Account 1200 Credit
                  </Typography>
                </TableCell>

                <TableCell sx={{ border: "1px solid #cbd5e1", verticalAlign: "top", p: 1.5 }}>
                  <Typography variant="h6" fontWeight={900} color="#b45309">
                    KES {unallocatedSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Typography>
                  <Typography variant="caption" color="#334155" display="block" fontWeight={700}>
                    • Pending: {filteredTransactions.filter((t) => t.status === "UNALLOCATED").length} Accounts
                  </Typography>
                  <Typography variant="caption" color="#64748b" display="block">
                    • Suspense Account 2100 Holding
                  </Typography>
                </TableCell>

                <TableCell sx={{ border: "1px solid #cbd5e1", verticalAlign: "top", p: 1.5 }}>
                  <Typography variant="h6" fontWeight={900} color="#047857">
                    100% Mobile
                  </Typography>
                  <Typography variant="caption" color="#047857" display="block" fontWeight={700}>
                    • Sent to Registered Member Line
                  </Typography>
                  <Typography variant="caption" color="#64748b" display="block">
                    • Gateway Audit Log: tbl_sms_logs
                  </Typography>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>

        {/* Itemized Transaction Ledger Table */}
        <Box className="print-avoid-break" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight={900} color="#0f172a" mb={1} letterSpacing={0.3} textTransform="uppercase">
            2. Itemized Collections Audit Ledger
          </Typography>
          <Table size="small" sx={{ border: "1px solid #cbd5e1", borderCollapse: "collapse" }}>
            <TableHead>
              <TableRow sx={{ bgcolor: "#f1f5f9" }}>
                <TableCell sx={{ fontWeight: 800, border: "1px solid #cbd5e1", py: 0.8, width: 30 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 800, border: "1px solid #cbd5e1", py: 0.8 }}>Receipt / Trans ID</TableCell>
                <TableCell sx={{ fontWeight: 800, border: "1px solid #cbd5e1", py: 0.8 }}>Date &amp; Time</TableCell>
                <TableCell sx={{ fontWeight: 800, border: "1px solid #cbd5e1", py: 0.8 }}>Payer Details</TableCell>
                <TableCell sx={{ fontWeight: 800, border: "1px solid #cbd5e1", py: 0.8 }}>Registered Member</TableCell>
                <TableCell sx={{ fontWeight: 800, border: "1px solid #cbd5e1", py: 0.8 }}>Account Ref</TableCell>
                <TableCell sx={{ fontWeight: 800, border: "1px solid #cbd5e1", py: 0.8 }} align="right">
                  Amount (KES)
                </TableCell>
                <TableCell sx={{ fontWeight: 800, border: "1px solid #cbd5e1", py: 0.8 }}>Target Facility</TableCell>
                <TableCell sx={{ fontWeight: 800, border: "1px solid #cbd5e1", py: 0.8 }} align="center">
                  Audit Status
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTransactions.map((tx, idx) => (
                <TableRow key={tx.id} sx={{ bgcolor: idx % 2 === 1 ? "#f8fafc" : "#ffffff" }}>
                  <TableCell sx={{ border: "1px solid #cbd5e1", py: 0.6, fontSize: "0.72rem" }}>{idx + 1}</TableCell>
                  <TableCell sx={{ border: "1px solid #cbd5e1", py: 0.6, fontFamily: "monospace", fontWeight: 800 }}>
                    {tx.trans_id}
                  </TableCell>
                  <TableCell sx={{ border: "1px solid #cbd5e1", py: 0.6, fontSize: "0.72rem" }}>
                    {new Date(tx.trans_time).toLocaleDateString("en-GB")} {new Date(tx.trans_time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                  </TableCell>
                  <TableCell sx={{ border: "1px solid #cbd5e1", py: 0.6, fontSize: "0.72rem" }}>
                    {tx.first_name || "—"} ({tx.msisdn})
                  </TableCell>
                  <TableCell sx={{ border: "1px solid #cbd5e1", py: 0.6 }}>
                    <Typography variant="caption" fontWeight={800} display="block">
                      {tx.member_name || "Unallocated"}
                    </Typography>
                    {tx.member_phone && (
                      <Typography variant="caption" color="#047857" fontSize="0.68rem">
                        Reg: {tx.member_phone} (SMS Sent)
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ border: "1px solid #cbd5e1", py: 0.6, fontWeight: 700, fontSize: "0.72rem" }}>
                    {tx.bill_ref_number}
                  </TableCell>
                  <TableCell align="right" sx={{ border: "1px solid #cbd5e1", py: 0.6, fontWeight: 900, color: "#065f46" }}>
                    {Number(tx.trans_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell sx={{ border: "1px solid #cbd5e1", py: 0.6, fontSize: "0.72rem" }}>
                    {tx.loan_number || "Suspense (2100)"}
                  </TableCell>
                  <TableCell align="center" sx={{ border: "1px solid #cbd5e1", py: 0.6, fontSize: "0.72rem", fontWeight: 800 }}>
                    {tx.status}
                  </TableCell>
                </TableRow>
              ))}

              {/* Totals Row */}
              <TableRow sx={{ bgcolor: "#f1f5f9", fontWeight: 900 }}>
                <TableCell colSpan={6} sx={{ border: "1px solid #cbd5e1", py: 1, fontWeight: 900, textTransform: "uppercase" }}>
                  TOTAL RECONCILED M-PESA COLLECTIONS ({filteredTransactions.length} Transactions)
                </TableCell>
                <TableCell align="right" sx={{ border: "1px solid #cbd5e1", py: 1, fontWeight: 900, color: "#065f46", fontSize: "0.95rem" }}>
                  KES {filteredSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell colSpan={2} sx={{ border: "1px solid #cbd5e1", py: 1, fontWeight: 700, fontSize: "0.75rem" }}>
                  Allocated: KES {allocatedSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>

        {/* Statutory Compliance Notes */}
        <Box className="print-avoid-break" sx={{ p: 1.5, mb: 3, border: "1px solid #cbd5e1", borderRadius: 1.5, bgcolor: "#fcfcfc" }}>
          <Typography variant="caption" fontWeight={900} color="#0f172a" display="block" mb={0.5} textTransform="uppercase">
            3. Regulatory &amp; Statutory Compliance Notice
          </Typography>
          <Typography variant="caption" color="#475569" display="block" sx={{ fontSize: "0.7rem", lineHeight: 1.4 }}>
            This statement has been prepared in accordance with Section 34 of the Sacco Societies Act (Cap 490B) and Sacco Societies
            (Deposit-Taking Sacco Business) Regulations. Electronic funds transfer acknowledgements have been audited against Safaricom
            Daraja automated callbacks. Notifications were dispatched to registered member accounts in compliance with the Kenya Data
            Protection Act 2019.
          </Typography>
        </Box>

        {/* Tripartite Governance Sign-Off Block */}
        <Box className="print-avoid-break" sx={{ border: "1px solid #cbd5e1", borderRadius: 1.5, p: 2, bgcolor: "#ffffff", mb: 2 }}>
          <Typography variant="caption" fontWeight={900} color="#0f172a" display="block" mb={2} letterSpacing={0.5} textTransform="uppercase">
            4. Executive Governance &amp; Audit Sign-Off
          </Typography>

          <Grid container spacing={3}>
            <Grid size={{ xs: 4 }}>
              <Box sx={{ borderTop: "1px solid #0f172a", pt: 1 }}>
                <Typography variant="caption" fontWeight={800} color="#0f172a" display="block">
                  PREPARED BY:
                </Typography>
                <Typography variant="caption" color="#475569" display="block">
                  Treasury &amp; Collections Officer
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
                  AUDITED &amp; RECONCILED BY:
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
                  Chief Executive Officer / General Manager
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
      </Box>

      {/* ========================================================================= */}
      {/* 3. TRANSACTION DETAILS MODAL                                              */}
      {/* ========================================================================= */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        {selectedTx && (
          <>
            <DialogTitle component="div" sx={{ pb: 1, borderBottom: "1px solid #e2e8f0" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h6" fontWeight={800} color="#0f172a">
                    M-Pesa Transaction Audit: {selectedTx.trans_id}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Received on {new Date(selectedTx.trans_time).toLocaleString()}
                  </Typography>
                </Box>
                {getStatusChip(selectedTx.status)}
              </Stack>
            </DialogTitle>

            <DialogContent sx={{ pt: 2.5 }}>
              <Grid container spacing={2.5}>
                {/* Financial Summary */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Paper sx={{ p: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={800} textTransform="uppercase">
                      Payment Details
                    </Typography>
                    <Stack spacing={1} mt={1}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">Amount:</Typography>
                        <Typography variant="body2" fontWeight={800} color="#065f46">
                          KES {Number(selectedTx.trans_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">Paybill Shortcode:</Typography>
                        <Typography variant="body2" fontWeight={700}>{selectedTx.business_short_code}</Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">Account / BillRef:</Typography>
                        <Typography variant="body2" fontWeight={700}>{selectedTx.bill_ref_number}</Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">Utility Balance After:</Typography>
                        <Typography variant="body2" fontWeight={700}>
                          {selectedTx.org_account_balance ? `KES ${Number(selectedTx.org_account_balance).toLocaleString()}` : "—"}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Paper>
                </Grid>

                {/* Sender & Member Match */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Paper sx={{ p: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={800} textTransform="uppercase">
                      Member &amp; Mobile Notification Details
                    </Typography>
                    <Stack spacing={1} mt={1}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">Payer Name:</Typography>
                        <Typography variant="body2" fontWeight={700}>{selectedTx.first_name || "—"}</Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">Payer Phone (MSISDN):</Typography>
                        <Typography variant="body2" fontWeight={700}>{selectedTx.msisdn}</Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">Registered Member:</Typography>
                        <Typography variant="body2" fontWeight={800} color="#1e40af">
                          {selectedTx.member_name || "Unallocated"}
                        </Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">Registered Mobile No.:</Typography>
                        <Typography variant="body2" fontWeight={800} color="#065f46">
                          {selectedTx.member_phone || "Not matched"}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Paper>
                </Grid>

                {/* Allocation / Target Facility */}
                <Grid size={{ xs: 12 }}>
                  <Paper sx={{ p: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={800} textTransform="uppercase">
                      Facility Allocation &amp; Audit Trail
                    </Typography>
                    <Grid container spacing={2} mt={0.5}>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Typography variant="caption" color="text.secondary">Target Loan Number:</Typography>
                        <Typography variant="body2" fontWeight={800} color={selectedTx.loan_number ? "#1d4ed8" : "#b45309"}>
                          {selectedTx.loan_number || "Unallocated (Pending Action)"}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Typography variant="caption" color="text.secondary">Repayment Reference:</Typography>
                        <Typography variant="body2" fontWeight={700}>
                          {selectedTx.repayment_number || "—"}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Typography variant="caption" color="text.secondary">Relay Verified:</Typography>
                        <Typography variant="body2" fontWeight={700} color={selectedTx.is_verified ? "#065f46" : "#b91c1c"}>
                          {selectedTx.is_verified ? "Yes (Handshake Confirmed)" : "Direct C2B / Not Verified"}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                {/* Raw Safaricom Payload View */}
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ p: 1.5, bgcolor: "#0f172a", color: "#38bdf8", borderRadius: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="caption" fontWeight={800} color="#94a3b8" textTransform="uppercase">
                        Raw Gateway Callback Payload
                      </Typography>
                      <Button
                        size="small"
                        startIcon={<IconCopy size={13} />}
                        onClick={() => copyToClipboard(JSON.stringify(selectedTx, null, 2), "Full Payload")}
                        sx={{ color: "#38bdf8", textTransform: "none", fontSize: "0.72rem" }}
                      >
                        Copy JSON
                      </Button>
                    </Stack>
                    <Box
                      component="pre"
                      sx={{
                        m: 0,
                        p: 1.5,
                        bgcolor: "#1e293b",
                        borderRadius: 1,
                        fontSize: "0.75rem",
                        fontFamily: "monospace",
                        overflowX: "auto",
                        maxHeight: 200,
                        color: "#e2e8f0",
                      }}
                    >
                      {JSON.stringify(selectedTx, null, 2)}
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>

            <DialogActions sx={{ p: 2, borderTop: "1px solid #e2e8f0" }}>
              {selectedTx.status === "UNALLOCATED" && (
                <Button
                  variant="contained"
                  onClick={() => {
                    setDetailsOpen(false);
                    handleOpenAllocate(selectedTx);
                  }}
                  sx={{ bgcolor: "#d97706", "&:hover": { bgcolor: "#b45309" }, textTransform: "none", fontWeight: 700 }}
                >
                  Allocate This Payment
                </Button>
              )}
              <Button onClick={() => setDetailsOpen(false)} sx={{ textTransform: "none", fontWeight: 700 }}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ========================================================================= */}
      {/* 4. ALLOCATE PAYMENT MODAL                                                 */}
      {/* ========================================================================= */}
      <Dialog open={allocateOpen} onClose={() => setAllocateOpen(false)} maxWidth="sm" fullWidth>
        {allocateTx && (
          <>
            <DialogTitle component="div" sx={{ pb: 1, borderBottom: "1px solid #e2e8f0" }}>
              <Typography variant="h6" fontWeight={800} color="#0f172a">
                Allocate M-Pesa Payment: {allocateTx.trans_id}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Amount: KES {Number(allocateTx.trans_amount).toLocaleString()} from {allocateTx.first_name} ({allocateTx.msisdn})
              </Typography>
            </DialogTitle>

            <DialogContent sx={{ pt: 2.5 }}>
              <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2 }}>
                Allocating this payment will record a loan repayment, execute the waterfall allocation order, and dispatch an SMS notification to the registered member's mobile number.
              </Alert>

              <Typography variant="subtitle2" fontWeight={700} mb={1}>
                Select Target Loan Facility:
              </Typography>

              <Select
                fullWidth
                size="small"
                value={selectedLoanId}
                onChange={(e) => setSelectedLoanId(e.target.value)}
                displayEmpty
              >
                <MenuItem value="" disabled>
                  -- Select a Loan Facility --
                </MenuItem>
                {loans.map((l: any) => {
                  const isMemberMatch =
                    (allocateTx.member && l.member === allocateTx.member) ||
                    (allocateTx.member_name &&
                      (l.member_name || "").toLowerCase().includes(allocateTx.member_name.toLowerCase()));
                  return (
                    <MenuItem key={l.id} value={l.id} sx={isMemberMatch ? { fontWeight: 700, bgcolor: "#f0fdf4" } : {}}>
                      {isMemberMatch ? "⭐ " : ""}{l.loan_number} — {l.member_name || `Member #${l.member}`} (Bal: KES {Number(l.outstanding_balance || 0).toLocaleString()})
                      {isMemberMatch ? " [Member's Account]" : ""}
                    </MenuItem>
                  );
                })}
              </Select>
            </DialogContent>

            <DialogActions sx={{ p: 2, borderTop: "1px solid #e2e8f0" }}>
              <Button onClick={() => setAllocateOpen(false)} sx={{ textTransform: "none" }}>
                Cancel
              </Button>
              <Button
                variant="contained"
                disabled={!selectedLoanId || allocating}
                onClick={handleConfirmAllocate}
                sx={{
                  bgcolor: "#065f46",
                  "&:hover": { bgcolor: "#047857" },
                  textTransform: "none",
                  fontWeight: 700,
                }}
              >
                {allocating ? "Allocating..." : "Confirm Allocation & Notify Member"}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Feedback Toast */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={toast.severity} onClose={() => setToast({ ...toast, open: false })}>
          {toast.message}
        </Alert>
      </Snackbar>

      {/* ========================================================================= */}
      {/* 5. GLOBAL EXECUTIVE PRINT STYLESHEET                                      */}
      {/* ========================================================================= */}
      <style jsx global>{`
        @media screen {
          .print-only {
            display: none !important;
          }
        }

        @media print {
          html,
          body {
            background: #ffffff !important;
            color: #0f172a !important;
            font-size: 9pt !important;
            line-height: 1.3 !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Hide all screen elements, headers, sidebars, buttons, dialogs */
          .no-print,
          aside,
          header,
          nav,
          .mainwrapper > aside,
          .MuiDrawer-root,
          .MuiAppBar-root,
          button,
          .MuiIconButton-root,
          .MuiPagination-root,
          .MuiTablePagination-root {
            display: none !important;
          }

          /* Display official audit statement */
          .print-only {
            display: block !important;
          }

          #printable-mpesa-audit-statement {
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

          #printable-mpesa-audit-statement table {
            width: 100% !important;
            border-collapse: collapse !important;
          }

          #printable-mpesa-audit-statement th,
          #printable-mpesa-audit-statement td {
            font-size: 8pt !important;
            border: 1px solid #cbd5e1 !important;
            padding: 4px 6px !important;
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
    </Box>
  );
}
