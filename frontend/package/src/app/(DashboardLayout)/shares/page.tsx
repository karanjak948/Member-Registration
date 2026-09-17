"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
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
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tooltip,
  MenuItem,
} from "@mui/material";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import sharesService from "@/services/shares.service";
import { SharePayment, SharesSummary } from "@/types/shares";
import {
  IconCoins,
  IconPlus,
  IconUpload,
  IconSearch,
  IconEye,
  IconTrash,
  IconPrinter,
  IconFileSpreadsheet,
  IconDownload,
  IconBuildingBank,
  IconShieldCheck,
  IconUsers,
  IconCertificate,
  IconReceipt2,
  IconRefresh,
  IconShieldLock,
} from "@tabler/icons-react";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/constants/permissions";

function amountToWords(num: number): string {
  if (!num || isNaN(num) || num <= 0) return "Zero Kenya Shillings Only";
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const inWords = (n: number): string => {
    if (n === 0) return "";
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " and " + inWords(n % 100) : "");
    if (n < 1000000) return inWords(Math.floor(n / 1000)) + " Thousand" + (n % 1000 !== 0 ? " " + inWords(n % 1000) : "");
    if (n < 1000000000) return inWords(Math.floor(n / 1000000)) + " Million" + (n % 1000000 !== 0 ? " " + inWords(n % 1000000) : "");
    return n.toString();
  };

  const whole = Math.floor(num);
  const cents = Math.round((num - whole) * 100);
  let words = inWords(whole) + " Kenya Shillings";
  if (cents > 0) {
    words += " and " + inWords(cents) + " Cents";
  }
  return words + " Only";
}

export default function SharesPaymentsPage() {
  const { isAdmin, can, loading: authLoading } = usePermissions();
  const canViewShares = isAdmin || can(PERMISSIONS.VIEW_SHARES);
  const [payments, setPayments] = useState<SharePayment[]>([]);
  const [summary, setSummary] = useState<SharesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterMode, setFilterMode] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const rowsPerPage = 12;

  // View Receipt Voucher Modal
  const [viewPayment, setViewPayment] = useState<SharePayment | null>(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<SharePayment | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Bulk upload modal state
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);

  const [alertInfo, setAlertInfo] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pmts, smy] = await Promise.all([
        sharesService.getPayments(),
        sharesService.getSummary(),
      ]);
      setPayments(pmts);
      setSummary(smy);
    } catch (err) {
      console.error("Failed to load shares data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDownloadTemplate = async () => {
    try {
      const blob = await sharesService.downloadTemplate();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "shares_payment_template.csv");
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      console.error("Template download error:", err);
    }
  };

  const handleUploadSubmit = async () => {
    if (!uploadFile) {
      setUploadErrors(["Please select a CSV or Excel (.xlsx) file to upload."]);
      return;
    }
    setUploading(true);
    setUploadErrors([]);
    setUploadSuccessMsg(null);
    try {
      const res = await sharesService.bulkUpload(uploadFile);
      setUploadSuccessMsg(res.message || `Successfully imported ${res.imported_count} share payments!`);
      await loadData();
      setTimeout(() => {
        setOpenUploadDialog(false);
        setUploadFile(null);
        setUploadSuccessMsg(null);
      }, 1500);
    } catch (err: any) {
      const errRes = err.response?.data;
      if (errRes?.errors && Array.isArray(errRes.errors)) {
        setUploadErrors(errRes.errors);
      } else {
        setUploadErrors([errRes?.error || "Bulk upload failed. Please verify file format."]);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await sharesService.deletePayment(deleteTarget.id);
      setAlertInfo({ type: "success", message: `Share payment #${deleteTarget.document_no} deleted.` });
      setDeleteTarget(null);
      await loadData();
    } catch (err: any) {
      setAlertInfo({
        type: "error",
        message: err.response?.data?.error || "Failed to delete share payment.",
      });
    } finally {
      setDeleting(false);
    }
  };

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (p.member_name && p.member_name.toLowerCase().includes(q)) ||
        (p.membership_number && p.membership_number.toLowerCase().includes(q)) ||
        (p.document_no && p.document_no.toLowerCase().includes(q)) ||
        (p.transaction_no && p.transaction_no.toLowerCase().includes(q)) ||
        (p.paid_by && p.paid_by.toLowerCase().includes(q));

      const matchesType = filterType === "ALL" || p.share_type === filterType;
      const matchesMode = filterMode === "ALL" || p.payment_mode === filterMode;

      return matchesSearch && matchesType && matchesMode;
    });
  }, [payments, searchQuery, filterType, filterMode]);

  const totalPages = Math.ceil(filteredPayments.length / rowsPerPage) || 1;
  const paginatedPayments = filteredPayments.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const exportCSV = () => {
    if (!filteredPayments.length) return;
    const headers = ["Doc #", "Paid On", "Member No", "Member Name", "Share Type", "No of Shares", "Unit Price", "Total (KES)", "Payment Mode", "Transaction No", "Paid By"];
    const rows = filteredPayments.map((p) => [
      p.document_no,
      p.paid_on,
      p.membership_number,
      `"${p.member_name.replace(/"/g, '""')}"`,
      p.share_type_display,
      p.number_of_shares,
      p.share_price,
      p.total_amount,
      p.payment_mode_display,
      p.transaction_no || "",
      `"${(p.paid_by || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sacco_shares_register_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!authLoading && !canViewShares) {
    return (
      <PageContainer title="Shares Access Denied" description="Access Restricted">
        <Box sx={{ p: 4, display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
          <Paper
            elevation={0}
            sx={{
              p: 5,
              maxWidth: 520,
              textAlign: "center",
              borderRadius: 3.5,
              border: "1px solid #fee2e2",
              bgcolor: "#fff5f5",
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                bgcolor: "#fef2f2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 2.5,
                color: "#dc2626",
              }}
            >
              <IconShieldLock size={32} />
            </Box>
            <Typography variant="h5" fontWeight={800} color="#991b1b" gutterBottom>
              Administrative Access Required
            </Typography>
            <Typography variant="body2" color="#7f1d1d" sx={{ mb: 3.5, lineHeight: 1.6 }}>
              You do not have permission to view or manage SACCO Share Capital or Shareholder Registers. Please contact your organization administrator.
            </Typography>
            <Button
              component={Link}
              href="/dashboard"
              variant="contained"
              sx={{
                bgcolor: "#064e3b",
                "&:hover": { bgcolor: "#047857" },
                fontWeight: 700,
                textTransform: "none",
                borderRadius: 2,
                px: 3,
              }}
            >
              Return to Dashboard
            </Button>
          </Paper>
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Member Shares Register - Royal SACCO"
      description="Member Share Capital ledger, share purchase transactions, and certificates"
    >
      <Box sx={{ p: { xs: 1.5, sm: 3 } }}>
        {/* Header */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
          mb={3}
        >
          <Box>
            <Typography variant="h4" fontWeight={800} color="#0f172a">
              Shares Register &amp; Capital
            </Typography>
            <Typography variant="body2" color="text.secondary">
              SACCO Member Share Capital tracking, share issues, and double-entry equity postings
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Button
              variant="outlined"
              startIcon={<IconUpload size={18} />}
              onClick={() => {
                setUploadErrors([]);
                setUploadSuccessMsg(null);
                setUploadFile(null);
                setOpenUploadDialog(true);
              }}
              sx={{
                borderColor: "#cbd5e1",
                color: "#334155",
                fontWeight: 700,
                textTransform: "none",
                borderRadius: 2,
                "&:hover": { borderColor: "#94a3b8", bgcolor: "#f8fafc" },
              }}
            >
              Bulk Upload
            </Button>
            <Button
              component={Link}
              href="/shares/new"
              variant="contained"
              startIcon={<IconPlus size={18} />}
              sx={{
                bgcolor: "#059669",
                "&:hover": { bgcolor: "#047857" },
                fontWeight: 700,
                textTransform: "none",
                borderRadius: 2,
                boxShadow: "0 2px 8px rgba(5, 150, 105, 0.25)",
              }}
            >
              Create Shares Payment
            </Button>
            <IconButton
              onClick={loadData}
              sx={{
                border: "1px solid #e2e8f0",
                bgcolor: "#ffffff",
                "&:hover": { bgcolor: "#f8fafc" },
              }}
            >
              <IconRefresh size={18} />
            </IconButton>
          </Stack>
        </Stack>

        {alertInfo && (
          <Alert
            severity={alertInfo.type}
            sx={{ mb: 3, borderRadius: 2 }}
            onClose={() => setAlertInfo(null)}
          >
            {alertInfo.message}
          </Alert>
        )}

        {/* 4 Summary KPI Cards */}
        <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border: "1px solid #e2e8f0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                p: 2.5,
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase">
                    Total Share Capital
                  </Typography>
                  <Typography variant="h5" fontWeight={900} color="#059669" mt={0.5}>
                    KES {parseFloat(summary?.total_share_capital || "0").toLocaleString("en-KE", { minimumFractionDigits: 2 })}
                  </Typography>
                </Box>
                <Box sx={{ bgcolor: "#ecfdf5", p: 1.5, borderRadius: 2.5 }}>
                  <IconCoins size={28} color="#059669" />
                </Box>
              </Stack>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border: "1px solid #e2e8f0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                p: 2.5,
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase">
                    Shares Issued
                  </Typography>
                  <Typography variant="h5" fontWeight={900} color="#2563eb" mt={0.5}>
                    {parseFloat(summary?.total_shares_issued || "0").toLocaleString("en-KE")} units
                  </Typography>
                </Box>
                <Box sx={{ bgcolor: "#eff6ff", p: 1.5, borderRadius: 2.5 }}>
                  <IconCertificate size={28} color="#2563eb" />
                </Box>
              </Stack>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border: "1px solid #e2e8f0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                p: 2.5,
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase">
                    Shareholders
                  </Typography>
                  <Typography variant="h5" fontWeight={900} color="#7c3aed" mt={0.5}>
                    {summary?.shareholders_count || 0} Members
                  </Typography>
                </Box>
                <Box sx={{ bgcolor: "#faf5ff", p: 1.5, borderRadius: 2.5 }}>
                  <IconUsers size={28} color="#7c3aed" />
                </Box>
              </Stack>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border: "1px solid #e2e8f0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                p: 2.5,
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase">
                    Transactions
                  </Typography>
                  <Typography variant="h5" fontWeight={900} color="#0f172a" mt={0.5}>
                    {summary?.transactions_count || 0} Posts
                  </Typography>
                </Box>
                <Box sx={{ bgcolor: "#f1f5f9", p: 1.5, borderRadius: 2.5 }}>
                  <IconReceipt2 size={28} color="#475569" />
                </Box>
              </Stack>
            </Card>
          </Grid>
        </Grid>

        {/* Filter & Action Bar */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px solid #e2e8f0",
            p: 2,
            mb: 2.5,
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", md: "center" }}
            spacing={2}
          >
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} flex={1}>
              <TextField
                size="small"
                placeholder="Search member, Doc #, transaction #..."
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
                sx={{ minWidth: { sm: 260 } }}
              />

              <TextField
                select
                size="small"
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setPage(1);
                }}
                sx={{ minWidth: 160 }}
              >
                <MenuItem value="ALL">All Share Types</MenuItem>
                <MenuItem value="ordinary">Ordinary Shares</MenuItem>
                <MenuItem value="preference">Preference Shares</MenuItem>
                <MenuItem value="capital">Capital Shares</MenuItem>
              </TextField>

              <TextField
                select
                size="small"
                value={filterMode}
                onChange={(e) => {
                  setFilterMode(e.target.value);
                  setPage(1);
                }}
                sx={{ minWidth: 150 }}
              >
                <MenuItem value="ALL">All Modes</MenuItem>
                <MenuItem value="mpesa">M-Pesa</MenuItem>
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="bank">Bank</MenuItem>
                <MenuItem value="cheque">Cheque</MenuItem>
              </TextField>
            </Stack>

            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<IconFileSpreadsheet size={16} />}
                onClick={exportCSV}
                sx={{
                  borderColor: "#e2e8f0",
                  color: "#475569",
                  fontWeight: 700,
                  textTransform: "none",
                  borderRadius: 2,
                }}
              >
                Export CSV
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<IconDownload size={16} />}
                onClick={handleDownloadTemplate}
                sx={{
                  borderColor: "#e2e8f0",
                  color: "#475569",
                  fontWeight: 700,
                  textTransform: "none",
                  borderRadius: 2,
                }}
              >
                CSV Template
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {/* Table */}
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
            overflow: "hidden",
          }}
        >
          <Table>
            <TableHead sx={{ bgcolor: "#f8fafc" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, color: "#475569", fontSize: "0.8rem" }}>Doc #</TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#475569", fontSize: "0.8rem" }}>Paid On</TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#475569", fontSize: "0.8rem" }}>Member</TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#475569", fontSize: "0.8rem" }}>Share Type</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: "#475569", fontSize: "0.8rem" }}>No. of Shares</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: "#475569", fontSize: "0.8rem" }}>Price / Share</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: "#475569", fontSize: "0.8rem" }}>Total Capital (KES)</TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#475569", fontSize: "0.8rem" }}>Mode</TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#475569", fontSize: "0.8rem" }}>Reference</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, color: "#475569", fontSize: "0.8rem" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} />
                    <Typography variant="body2" color="text.secondary" mt={1}>
                      Loading shares register...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : paginatedPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                    <IconCoins size={40} color="#cbd5e1" />
                    <Typography variant="subtitle1" fontWeight={700} color="#64748b" mt={1}>
                      No share payment records found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {searchQuery ? "Try changing your search filters." : "Click 'Create Shares Payment' to issue shares."}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedPayments.map((p) => (
                  <TableRow key={p.id} hover sx={{ "&:hover": { bgcolor: "#f8fafc" } }}>
                    <TableCell sx={{ fontFamily: "monospace", fontWeight: 800, color: "#2563eb" }}>
                      #{p.document_no}
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.85rem", color: "#334155" }}>
                      {p.paid_on}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={800} color="#0f172a">
                        {p.member_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        #{p.membership_number} • {p.member_phone || "—"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={p.share_type_display}
                        sx={{
                          fontWeight: 700,
                          fontSize: "0.72rem",
                          bgcolor: p.share_type === "capital" ? "#faf5ff" : p.share_type === "preference" ? "#eff6ff" : "#f0fdf4",
                          color: p.share_type === "capital" ? "#7c3aed" : p.share_type === "preference" ? "#2563eb" : "#059669",
                        }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: "#0f172a" }}>
                      {parseFloat(p.number_of_shares.toString()).toLocaleString()}
                    </TableCell>
                    <TableCell align="right" sx={{ color: "#64748b", fontSize: "0.85rem" }}>
                      {parseFloat(p.share_price.toString()).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 900, color: "#059669" }}>
                      {parseFloat(p.total_amount.toString()).toLocaleString("en-KE", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={p.payment_mode_display}
                        sx={{
                          height: 22,
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          bgcolor: "#f1f5f9",
                          color: "#475569",
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontFamily: "monospace", fontSize: "0.8rem", color: "#475569" }}>
                      {p.transaction_no || "—"}
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Tooltip title="View Certificate Voucher">
                          <IconButton size="small" onClick={() => setViewPayment(p)} color="primary">
                            <IconEye size={18} />
                          </IconButton>
                        </Tooltip>
                        {isAdmin && (
                          <Tooltip title="Delete Transaction">
                            <IconButton size="small" onClick={() => setDeleteTarget(p)} sx={{ color: "#ef4444" }}>
                              <IconTrash size={18} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination Footer */}
          {!loading && filteredPayments.length > 0 && (
            <Box
              sx={{
                p: 2,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderTop: "1px solid #e2e8f0",
                bgcolor: "#f8fafc",
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Showing {(page - 1) * rowsPerPage + 1} to{" "}
                {Math.min(page * rowsPerPage, filteredPayments.length)} of {filteredPayments.length} entries
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="outlined"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  sx={{ textTransform: "none", borderRadius: 1.5 }}
                >
                  Previous
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  sx={{ textTransform: "none", borderRadius: 1.5 }}
                >
                  Next
                </Button>
              </Stack>
            </Box>
          )}
        </TableContainer>

        {/* View Share Certificate Voucher Modal */}
        <Dialog
          open={!!viewPayment}
          onClose={() => setViewPayment(null)}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          {viewPayment && (
            <>
              <DialogTitle sx={{ p: 2.5, bgcolor: "#064e3b", color: "#ffffff" }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <IconCertificate size={24} color="#34d399" />
                    <Box>
                      <Typography variant="h6" fontWeight={800} color="#ffffff">
                        Royal SACCO Share Certificate
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#a7f3d0" }}>
                        Official Equity Receipt • Doc #{viewPayment.document_no}
                      </Typography>
                    </Box>
                  </Stack>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<IconPrinter size={16} />}
                    onClick={() => window.print()}
                    sx={{
                      bgcolor: "#059669",
                      "&:hover": { bgcolor: "#047857" },
                      textTransform: "none",
                      fontWeight: 700,
                    }}
                  >
                    Print
                  </Button>
                </Stack>
              </DialogTitle>

              <DialogContent sx={{ p: 3 }}>
                <Stack spacing={2.5}>
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: "#f8fafc",
                      borderRadius: 2.5,
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" textTransform="uppercase">
                      Member / Shareholder
                    </Typography>
                    <Typography variant="h6" fontWeight={900} color="#0f172a">
                      {viewPayment.member_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Member #{viewPayment.membership_number} • {viewPayment.member_phone || "—"}
                    </Typography>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">
                        Share Category
                      </Typography>
                      <Typography variant="subtitle2" fontWeight={800} color="#0f172a">
                        {viewPayment.share_type_display}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">
                        Number of Shares
                      </Typography>
                      <Typography variant="subtitle2" fontWeight={800} color="#0f172a">
                        {parseFloat(viewPayment.number_of_shares.toString()).toLocaleString()} units
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">
                        Price Per Share
                      </Typography>
                      <Typography variant="subtitle2" fontWeight={800} color="#0f172a">
                        KES {parseFloat(viewPayment.share_price.toString()).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">
                        Payment Mode
                      </Typography>
                      <Typography variant="subtitle2" fontWeight={800} color="#0f172a">
                        {viewPayment.payment_mode_display}
                        {viewPayment.bank_name ? ` (${viewPayment.bank_name})` : ""}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">
                        Transaction Reference
                      </Typography>
                      <Typography variant="subtitle2" fontWeight={800} color="#2563eb" fontFamily="monospace">
                        {viewPayment.transaction_no || "—"}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">
                        Date of Issue
                      </Typography>
                      <Typography variant="subtitle2" fontWeight={800} color="#0f172a">
                        {viewPayment.paid_on}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Divider />

                  <Box sx={{ p: 2, bgcolor: "#ecfdf5", borderRadius: 2, border: "1px solid #a7f3d0" }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" fontWeight={800} color="#065f46">
                        Total Capital Paid:
                      </Typography>
                      <Typography variant="h5" fontWeight={900} color="#059669">
                        KES {parseFloat(viewPayment.total_amount.toString()).toLocaleString("en-KE", { minimumFractionDigits: 2 })}
                      </Typography>
                    </Stack>
                    <Typography variant="caption" color="#047857" sx={{ mt: 0.8, display: "block", fontStyle: "italic" }}>
                      {amountToWords(parseFloat(viewPayment.total_amount.toString()))}
                    </Typography>
                  </Box>

                  {viewPayment.remarks && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Remarks / Notes:
                      </Typography>
                      <Typography variant="body2" color="#475569">
                        {viewPayment.remarks}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </DialogContent>

              <DialogActions sx={{ p: 2.5, borderTop: "1px solid #e2e8f0" }}>
                <Button
                  onClick={() => setViewPayment(null)}
                  variant="outlined"
                  sx={{ borderRadius: 2, textTransform: "none" }}
                >
                  Close
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Delete Confirmation Modal */}
        {isAdmin && (
          <Dialog
            open={!!deleteTarget}
            onClose={() => !deleting && setDeleteTarget(null)}
            maxWidth="xs"
            fullWidth
            PaperProps={{ sx: { borderRadius: 3 } }}
          >
            <DialogTitle sx={{ fontWeight: 800, color: "#dc2626" }}>
              Delete Share Payment Record?
            </DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary">
                Are you sure you want to permanently delete share payment #{deleteTarget?.document_no} for{" "}
                <strong>{deleteTarget?.member_name}</strong> (KES {deleteTarget?.total_amount})?
              </Typography>
              <Typography variant="caption" color="#dc2626" sx={{ mt: 1, display: "block" }}>
                This will also void the linked General Ledger transaction.
              </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                variant="outlined"
                sx={{ borderRadius: 2, textTransform: "none" }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                disabled={deleting}
                variant="contained"
                sx={{ bgcolor: "#dc2626", "&:hover": { bgcolor: "#b91c1c" }, borderRadius: 2, textTransform: "none" }}
              >
                {deleting ? "Deleting..." : "Confirm Delete"}
              </Button>
            </DialogActions>
          </Dialog>
        )}

        {/* Bulk Upload Modal */}
        <Dialog
          open={openUploadDialog}
          onClose={() => !uploading && setOpenUploadDialog(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ fontWeight: 800, color: "#0f172a" }}>
            Bulk Upload Share Payments
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Select a CSV or Excel (.xlsx) file containing member share purchases.
            </Typography>

            {uploadErrors.length > 0 && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                {uploadErrors.map((err, i) => (
                  <div key={i}>{err}</div>
                ))}
              </Alert>
            )}

            {uploadSuccessMsg && (
              <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
                {uploadSuccessMsg}
              </Alert>
            )}

            <Box
              sx={{
                p: 3,
                border: "2px dashed #cbd5e1",
                borderRadius: 2.5,
                bgcolor: "#f8fafc",
                textAlign: "center",
                cursor: "pointer",
              }}
              onClick={() => document.getElementById("shares-file-input")?.click()}
            >
              <input
                id="shares-file-input"
                type="file"
                accept=".csv,.xlsx,.xls"
                style={{ display: "none" }}
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              />
              <IconUpload size={36} color="#64748b" style={{ margin: "0 auto 8px" }} />
              <Typography variant="subtitle2" fontWeight={800} color="#334155">
                {uploadFile ? uploadFile.name : "Click to browse CSV or Excel file"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Supported formats: .csv, .xlsx, .xls
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={() => setOpenUploadDialog(false)}
              disabled={uploading}
              variant="outlined"
              sx={{ borderRadius: 2, textTransform: "none" }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUploadSubmit}
              disabled={uploading || !uploadFile}
              variant="contained"
              sx={{ bgcolor: "#059669", "&:hover": { bgcolor: "#047857" }, borderRadius: 2, textTransform: "none" }}
            >
              {uploading ? "Importing..." : "Upload and Post to GL"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </PageContainer>
  );
}
