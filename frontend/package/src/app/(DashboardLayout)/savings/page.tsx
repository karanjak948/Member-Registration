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
} from "@mui/material";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import savingsService from "@/services/savings.service";
import { SavingsPayment, SavingsSummary } from "@/types/savings";
import {
  IconBuildingBank,
  IconArrowsExchange,
  IconPlus,
  IconUpload,
  IconSearch,
  IconEdit,
  IconEye,
  IconTrash,
  IconCash,
  IconPrinter,
  IconFileSpreadsheet,
  IconFileTypePdf,
  IconCopy,
  IconList,
  IconCheck,
  IconReceipt2,
  IconDownload,
  IconShieldCheck,
} from "@tabler/icons-react";

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

export default function SavingsPaymentsPage() {
  const [payments, setPayments] = useState<SavingsPayment[]>([]);
  const [summary, setSummary] = useState<SavingsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  // View modal state
  const [viewPayment, setViewPayment] = useState<SavingsPayment | null>(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<SavingsPayment | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Alert message
  const [alertInfo, setAlertInfo] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Upload modal state
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);

  const handleDownloadTemplate = async () => {
    try {
      const blob = await savingsService.downloadTemplate();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "savings_payment_template.csv");
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      console.error("Template download error:", err);
      const csvContent =
        "data:text/csv;charset=utf-8," +
        "Member No,Savings Type,Amount,Payment Mode,Paid On,Bank Name,Transaction No,Paid By,Remarks\n" +
        "RC-00001,Normal,2500.00,M-Pesa,2026-09-08,Co-operative Bank,QWE1234567,John Doe,Monthly savings contribution\n" +
        "RC-00002,Welfare,500.00,Cash,2026-09-08,,,Jane Smith,Weekly welfare contribution";
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "savings_payment_template.csv");
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
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
      const res = await savingsService.bulkUpload(uploadFile);
      setUploadSuccessMsg(
        res.message || `Successfully imported ${res.imported_count} savings payments!`
      );
      await loadData();
      setTimeout(() => {
        setOpenUploadDialog(false);
        setUploadFile(null);
        setUploadSuccessMsg(null);
        setAlertInfo({
          type: "success",
          message: `Successfully imported ${res.imported_count} savings payments totalling KES ${Number(
            res.total_amount
          ).toLocaleString(undefined, { minimumFractionDigits: 2 })}!`,
        });
      }, 1500);
    } catch (err: any) {
      const respData = err.response?.data;
      if (respData?.errors && Array.isArray(respData.errors)) {
        setUploadErrors(respData.errors);
      } else if (respData?.error) {
        setUploadErrors([respData.error]);
      } else {
        setUploadErrors([
          err.message || "Failed to upload file. Please check file format.",
        ]);
      }
    } finally {
      setUploading(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [paymentsData, summaryData] = await Promise.all([
        savingsService.getPayments(),
        savingsService.getSummary().catch(() => null),
      ]);
      setPayments(paymentsData);
      setSummary(summaryData);
    } catch (err) {
      console.error("Error loading savings data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered payments by search
  const filteredPayments = useMemo(() => {
    if (!searchQuery.trim()) return payments;
    const q = searchQuery.toLowerCase();
    return payments.filter(
      (p) =>
        p.member_name?.toLowerCase().includes(q) ||
        p.membership_number?.toLowerCase().includes(q) ||
        p.document_no?.toLowerCase().includes(q) ||
        p.transaction_no?.toLowerCase().includes(q) ||
        p.bank_name?.toLowerCase().includes(q) ||
        p.paid_by?.toLowerCase().includes(q) ||
        p.remarks?.toLowerCase().includes(q) ||
        p.savings_type?.toLowerCase().includes(q)
    );
  }, [payments, searchQuery]);

  // Pagination calculation
  const totalEntries = filteredPayments.length;
  const totalPages = Math.ceil(totalEntries / rowsPerPage) || 1;
  const paginatedPayments = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredPayments.slice(start, start + rowsPerPage);
  }, [filteredPayments, page, rowsPerPage]);

  const startIndex = totalEntries === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const endIndex = Math.min(page * rowsPerPage, totalEntries);

  // Computed summary fallback if backend endpoint wasn't reached
  const computedTotal = useMemo(() => {
    if (summary) {
      return {
        txnCount: summary.transactions_count,
        totalSavings: Number(summary.total_savings || 0),
      };
    }
    const count = payments.length;
    const total = payments
      .filter((p) => p.transaction_type === "money_in")
      .reduce((acc, cur) => acc + Number(cur.amount || 0), 0);
    return { txnCount: count, totalSavings: total };
  }, [payments, summary]);

  // Export handlers
  const handleCopy = () => {
    const text = filteredPayments
      .map(
        (p, i) =>
          `${i + 1}\t${p.member_name}\t${p.membership_number}\t${p.week ?? "-"}\t${p.month ?? "-"}\t${p.year ?? "-"}\t${p.document_no}\t${p.savings_type_display}\t${p.money_in}\t${p.payment_mode_display}\t${p.bank_name ?? "-"}\t${p.transaction_no ?? "-"}\t${p.paid_on}`
      )
      .join("\n");
    navigator.clipboard.writeText(text);
    setAlertInfo({ type: "success", message: "Savings register copied to clipboard!" });
    setTimeout(() => setAlertInfo(null), 3000);
  };

  const handleExportCSV = () => {
    const headers = [
      "#",
      "Member",
      "Member No",
      "Week",
      "Month",
      "Year",
      "Document No",
      "Savings Type",
      "Money In",
      "Money Out",
      "Payment Mode",
      "Bank",
      "Transaction No",
      "Currency",
      "Paid On",
      "Paid By",
      "Remarks",
    ];
    const rows = filteredPayments.map((p, i) => [
      i + 1,
      `"${p.member_name || ""}"`,
      `"${p.membership_number || ""}"`,
      p.week ?? "",
      p.month ?? "",
      p.year ?? "",
      `"${p.document_no || ""}"`,
      `"${p.savings_type_display || ""}"`,
      p.money_in,
      p.money_out,
      `"${p.payment_mode_display || ""}"`,
      `"${p.bank_name || ""}"`,
      `"${p.transaction_no || ""}"`,
      `"${p.currency || ""}"`,
      `"${p.paid_on || ""}"`,
      `"${p.paid_by || ""}"`,
      `"${p.remarks || ""}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Savings_Register_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  // Delete handler
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await savingsService.deletePayment(deleteTarget.id);
      setPayments((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
      setAlertInfo({ type: "success", message: "Savings payment entry deleted successfully." });
      setTimeout(() => setAlertInfo(null), 3000);
    } catch (err) {
      setAlertInfo({ type: "error", message: "Failed to delete savings payment entry." });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <PageContainer title="Savings payments - Royal SACCO" description="Manage and track member savings contributions">
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        {/* Header matching Screenshot 2 */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
          mb={3}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{ p: 1, borderRadius: 2, bgcolor: "#eff6ff", color: "#1d4ed8" }}>
              <IconBuildingBank size={32} />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={800} color="#0f172a">
                Savings payments
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage and track member savings contributions.
              </Typography>
            </Box>
          </Stack>

          {/* Header Action Buttons */}
          <Stack direction="row" spacing={1.5}>
            <Button
              component={Link}
              href="/savings/new"
              variant="contained"
              startIcon={<IconPlus size={18} />}
              sx={{
                bgcolor: "#0284c7",
                "&:hover": { bgcolor: "#0369a1" },
                fontWeight: 700,
                textTransform: "none",
                borderRadius: 1.5,
                px: 2.5,
                boxShadow: "0 2px 6px rgba(2, 132, 199, 0.3)",
              }}
            >
              New Savings Payment
            </Button>
            <Button
              variant="contained"
              startIcon={<IconUpload size={18} />}
              onClick={() => {
                setOpenUploadDialog(true);
                setUploadErrors([]);
                setUploadSuccessMsg(null);
                setUploadFile(null);
              }}
              sx={{
                bgcolor: "#0284c7",
                "&:hover": { bgcolor: "#0369a1" },
                fontWeight: 700,
                textTransform: "none",
                borderRadius: 1.5,
                px: 2,
              }}
            >
              Upload Savings Payment
            </Button>
          </Stack>
        </Stack>

        {alertInfo && (
          <Alert severity={alertInfo.type} sx={{ mb: 2.5 }} onClose={() => setAlertInfo(null)}>
            {alertInfo.message}
          </Alert>
        )}

        {/* Top KPI Cards matching Screenshot 2 */}
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          {/* Transactions Count Card */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              elevation={0}
              sx={{
                border: "1px solid #e2e8f0",
                borderRadius: 2,
                bgcolor: "#ffffff",
                height: 100,
                display: "flex",
                alignItems: "center",
                px: 2.5,
              }}
            >
              <Stack direction="row" spacing={2.5} alignItems="center" width="100%">
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: 1.5,
                    bgcolor: "#f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#94a3b8",
                  }}
                >
                  <IconArrowsExchange size={32} />
                </Box>
                <Box>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" letterSpacing={0.5}>
                    TRANSACTIONS
                  </Typography>
                  <Typography variant="h4" fontWeight={800} color="#0f172a">
                    {computedTotal.txnCount}
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>

          {/* Total Savings Card (Vibrant Green matching Screenshot 2) */}
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 2,
                bgcolor: "#22c55e",
                backgroundImage: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                height: 100,
                display: "flex",
                alignItems: "center",
                px: 2.5,
                color: "#ffffff",
                boxShadow: "0 4px 14px rgba(34, 197, 94, 0.35)",
              }}
            >
              <Stack direction="row" spacing={2.5} alignItems="center" width="100%">
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: 1.5,
                    border: "2px solid rgba(255,255,255,0.7)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                  }}
                >
                  <IconCash size={32} />
                </Box>
                <Box>
                  <Typography variant="caption" fontWeight={800} sx={{ opacity: 0.9, letterSpacing: 0.5 }}>
                    TOTAL SAVINGS
                  </Typography>
                  <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: -0.5 }}>
                    {computedTotal.totalSavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>
        </Grid>

        {/* Savings Payments Register Card */}
        <Card
          elevation={0}
          sx={{
            border: "1px solid #e2e8f0",
            borderRadius: 2,
            bgcolor: "#ffffff",
            overflow: "hidden",
            boxShadow: "0 1px 4px rgba(0,0,0,0.02)",
          }}
        >
          {/* Card Header & Title */}
          <Box sx={{ p: 2.5, borderBottom: "1px solid #e2e8f0" }}>
            <Stack direction="row" spacing={1} alignItems="center" mb={2}>
              <IconList size={20} color="#334155" />
              <Typography variant="h6" fontWeight={700} color="#1e293b">
                Savings Payments Register
              </Typography>
            </Stack>

            {/* Export Toolbar and Search (matching Screenshot 2) */}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "center" }}
              spacing={2}
            >
              {/* DataTables standard action buttons */}
              <Stack direction="row" spacing={0.5} flexWrap="wrap">
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleCopy}
                  sx={{
                    color: "#475569",
                    borderColor: "#cbd5e1",
                    bgcolor: "#f8fafc",
                    "&:hover": { bgcolor: "#f1f5f9" },
                    textTransform: "none",
                    fontWeight: 600,
                    px: 1.5,
                  }}
                >
                  Copy
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleExportCSV}
                  sx={{
                    color: "#475569",
                    borderColor: "#cbd5e1",
                    bgcolor: "#f8fafc",
                    "&:hover": { bgcolor: "#f1f5f9" },
                    textTransform: "none",
                    fontWeight: 600,
                    px: 1.5,
                  }}
                >
                  CSV
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleExportCSV}
                  sx={{
                    color: "#475569",
                    borderColor: "#cbd5e1",
                    bgcolor: "#f8fafc",
                    "&:hover": { bgcolor: "#f1f5f9" },
                    textTransform: "none",
                    fontWeight: 600,
                    px: 1.5,
                  }}
                >
                  Excel
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handlePrint}
                  sx={{
                    color: "#475569",
                    borderColor: "#cbd5e1",
                    bgcolor: "#f8fafc",
                    "&:hover": { bgcolor: "#f1f5f9" },
                    textTransform: "none",
                    fontWeight: 600,
                    px: 1.5,
                  }}
                >
                  PDF
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handlePrint}
                  sx={{
                    color: "#475569",
                    borderColor: "#cbd5e1",
                    bgcolor: "#f8fafc",
                    "&:hover": { bgcolor: "#f1f5f9" },
                    textTransform: "none",
                    fontWeight: 600,
                    px: 1.5,
                  }}
                >
                  Print
                </Button>
              </Stack>

              {/* Search input */}
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" fontWeight={600} color="text.secondary">
                  Search:
                </Typography>
                <TextField
                  size="small"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Filter register..."
                  sx={{ width: 220 }}
                />
              </Stack>
            </Stack>
          </Box>

          {/* Table */}
          <TableContainer>
            <Table size="small" sx={{ minWidth: 1200 }}>
              <TableHead sx={{ bgcolor: "#f8fafc" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: "#475569", py: 1.5 }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Member</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Member No</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Week</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Month</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Year</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Document No</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Savings Type</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#475569" }} align="right">
                    Money In
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#475569" }} align="right">
                    Money Out
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Payment Mode</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Bank</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Transaction No</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Currency</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Paid On</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Paid By</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Remarks</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#475569" }} align="center">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={18} align="center" sx={{ py: 8 }}>
                      <CircularProgress size={32} />
                      <Typography variant="body2" color="text.secondary" mt={1}>
                        Loading savings register...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : paginatedPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={18} align="center" sx={{ py: 8 }}>
                      <Typography variant="h6" fontWeight={700} color="#64748b">
                        No savings payments recorded
                      </Typography>
                      <Typography variant="body2" color="text.secondary" mt={0.5} mb={2}>
                        Click &quot;New Savings Payment&quot; above to capture member savings or welfare contributions.
                      </Typography>
                      <Button
                        component={Link}
                        href="/savings/new"
                        variant="contained"
                        size="small"
                        startIcon={<IconPlus size={16} />}
                        sx={{ bgcolor: "#0284c7", "&:hover": { bgcolor: "#0369a1" }, textTransform: "none", fontWeight: 700 }}
                      >
                        Create First Payment
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedPayments.map((item, index) => {
                    const rowIndex = (page - 1) * rowsPerPage + index + 1;
                    return (
                      <TableRow key={item.id} hover sx={{ "&:nth-of-type(even)": { bgcolor: "#fcfcfd" } }}>
                        <TableCell sx={{ color: "#64748b", fontWeight: 600 }}>{rowIndex}</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: "#0f172a", textTransform: "uppercase" }}>
                          {item.member_name}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, color: "#475569" }}>
                          {item.membership_number?.replace("RC-", "") || item.member}
                        </TableCell>
                        <TableCell sx={{ color: "#475569" }}>{item.week ?? "-"}</TableCell>
                        <TableCell sx={{ color: "#475569" }}>{item.month ?? "-"}</TableCell>
                        <TableCell sx={{ color: "#475569" }}>{item.year ?? "-"}</TableCell>
                        <TableCell>
                          <Chip
                            label={item.document_no}
                            size="small"
                            sx={{
                              bgcolor: "#0284c7",
                              color: "#ffffff",
                              fontWeight: 700,
                              fontSize: "0.75rem",
                              borderRadius: 1,
                              maxWidth: 160,
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, color: "#334155" }}>
                          {item.savings_type === "welfare" ? "Welfare ksh" : "Normal"}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: "#16a34a" }}>
                          {Number(item.money_in).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: "#64748b" }}>
                          {Number(item.money_out).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={item.payment_mode_display || item.payment_mode}
                            size="small"
                            sx={{
                              bgcolor: "#06b6d4",
                              color: "#ffffff",
                              fontWeight: 700,
                              fontSize: "0.72rem",
                              borderRadius: 1,
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: "#475569" }}>{item.bank_name || "-"}</TableCell>
                        <TableCell sx={{ color: "#0f172a", fontWeight: 600 }}>{item.transaction_no || "-"}</TableCell>
                        <TableCell sx={{ color: "#64748b", fontSize: "0.8rem" }}>{item.currency || "KES"}</TableCell>
                        <TableCell sx={{ color: "#475569", whiteSpace: "nowrap" }}>
                          {item.paid_on
                            ? new Date(item.paid_on).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "-"}
                        </TableCell>
                        <TableCell sx={{ color: "#475569", textTransform: "uppercase" }}>{item.paid_by || "-"}</TableCell>
                        <TableCell sx={{ color: "#64748b", maxWidth: 180, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {item.remarks || "-"}
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={0.75} justifyContent="center">
                            <Tooltip title="View Receipt">
                              <IconButton
                                size="small"
                                onClick={() => setViewPayment(item)}
                                sx={{
                                  bgcolor: "#10b981",
                                  color: "#ffffff",
                                  "&:hover": { bgcolor: "#059669" },
                                  borderRadius: 1,
                                  width: 26,
                                  height: 26,
                                }}
                              >
                                <IconEye size={15} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                onClick={() => setDeleteTarget(item)}
                                sx={{
                                  bgcolor: "#ef4444",
                                  color: "#ffffff",
                                  "&:hover": { bgcolor: "#dc2626" },
                                  borderRadius: 1,
                                  width: 26,
                                  height: 26,
                                }}
                              >
                                <IconTrash size={15} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination bar matching Screenshot 2 */}
          <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #e2e8f0" }}>
            <Typography variant="body2" color="text.secondary">
              Showing {startIndex} to {endIndex} of {totalEntries} entries
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                size="small"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                sx={{ textTransform: "none", fontWeight: 600 }}
              >
                Previous
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                <Button
                  key={num}
                  size="small"
                  variant={num === page ? "contained" : "outlined"}
                  onClick={() => setPage(num)}
                  sx={{
                    minWidth: 32,
                    height: 32,
                    p: 0,
                    fontWeight: 700,
                    bgcolor: num === page ? "#0284c7" : "transparent",
                    borderColor: "#cbd5e1",
                    color: num === page ? "#ffffff" : "#475569",
                  }}
                >
                  {num}
                </Button>
              ))}
              <Button
                size="small"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                sx={{ textTransform: "none", fontWeight: 600 }}
              >
                Next
              </Button>
            </Stack>
          </Box>
        </Card>

        {/* Global Styles for Official Receipt Printing */}
        <style jsx global>{`
          @media print {
            body {
              background: #ffffff !important;
              color: #000000 !important;
            }
            body * {
              visibility: hidden !important;
            }
            #official-sacco-receipt,
            #official-sacco-receipt * {
              visibility: visible !important;
            }
            #official-sacco-receipt {
              position: fixed !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              max-width: 780px !important;
              margin: 0 auto !important;
              padding: 24px !important;
              background: #ffffff !important;
              border: 2px solid #064e3b !important;
              box-shadow: none !important;
              z-index: 9999999 !important;
            }
            .no-print {
              display: none !important;
            }
          }
        `}</style>

        {/* ======================================================== */}
        {/* OFFICIAL VIEW PAYMENT & PRINTABLE RECEIPT VOUCHER DIALOG */}
        {/* ======================================================== */}
        <Dialog
          open={!!viewPayment}
          onClose={() => setViewPayment(null)}
          maxWidth="md"
          fullWidth
        >
          {viewPayment && (
            <>
              {/* Screen Modal Title Bar (Hidden in print) */}
              <DialogTitle
                className="no-print"
                sx={{
                  bgcolor: "#064e3b",
                  color: "#ffffff",
                  py: 1.8,
                  px: 3,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <IconReceipt2 size={24} color="#34d399" />
                  <Typography variant="h6" fontWeight={800} color="#ffffff">
                    Official Savings Receipt Voucher: SAV-{viewPayment.document_no}
                  </Typography>
                </Stack>
                <Chip
                  label="COMMITTED TO LEDGER"
                  size="small"
                  sx={{
                    bgcolor: "#059669",
                    color: "#ffffff",
                    fontWeight: 800,
                    fontSize: "0.7rem",
                    letterSpacing: "0.5px",
                  }}
                />
              </DialogTitle>

              <DialogContent sx={{ p: { xs: 2, sm: 4 }, bgcolor: "#f8fafc" }}>
                {/* Official Printable Receipt Slip Card */}
                <Paper
                  id="official-sacco-receipt"
                  elevation={3}
                  sx={{
                    p: { xs: 2.5, sm: 4 },
                    bgcolor: "#ffffff",
                    borderRadius: 2.5,
                    border: "2px solid #064e3b",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
                    position: "relative",
                  }}
                >
                  {/* SACCO Official Header */}
                  <Box textAlign="center" pb={2.5} borderBottom="2px solid #064e3b">
                    <Stack direction="row" justifyContent="center" alignItems="center" spacing={1.5} mb={0.5}>
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: 2,
                          bgcolor: "#064e3b",
                          color: "#34d399",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <IconBuildingBank size={28} stroke={2.2} />
                      </Box>
                      <Typography variant="h4" fontWeight={900} color="#064e3b" letterSpacing={0.5}>
                        ROYAL SACCO SOCIETY LIMITED
                      </Typography>
                    </Stack>
                    <Typography variant="caption" fontWeight={700} color="#059669" display="block" letterSpacing={0.5}>
                      SAVINGS &amp; CREDIT CO-OPERATIVE SOCIETY &bull; EMPOWERING MEMBERS, BUILDING FUTURES
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                      Registered under the Co-operative Societies Act &bull; P.O. Box 45678-00100, Nairobi, Kenya
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Head Office: SACCO Plaza, Upper Hill &bull; Tel: +254 700 000 000 &bull; Email: info@royalsacco.co.ke &bull; KRA PIN: P051234567Z
                    </Typography>
                  </Box>

                  {/* Voucher Badge Strip */}
                  <Box
                    sx={{
                      my: 2,
                      py: 1,
                      px: 2,
                      bgcolor: viewPayment.savings_type === "welfare" ? "#eff6ff" : "#ecfdf5",
                      border: viewPayment.savings_type === "welfare" ? "1px solid #bfdbfe" : "1px solid #a7f3d0",
                      borderRadius: 1.5,
                      textAlign: "center",
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      fontWeight={900}
                      color={viewPayment.savings_type === "welfare" ? "#1e40af" : "#065f46"}
                      letterSpacing={0.8}
                    >
                      OFFICIAL {viewPayment.savings_type === "welfare" ? "WELFARE CONTRIBUTION" : "SAVINGS"} RECEIPT VOUCHER
                    </Typography>
                  </Box>

                  {/* Metadata Table */}
                  <Grid container spacing={2} sx={{ mb: 2.5 }}>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        VOUCHER / RECEIPT NO:
                      </Typography>
                      <Typography variant="body1" fontWeight={800} color="#0f172a">
                        SAV-{viewPayment.document_no}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }} textAlign="right">
                      <Typography variant="caption" color="text.secondary" display="block">
                        DATE &amp; TIME ISSUED:
                      </Typography>
                      <Typography variant="body1" fontWeight={800} color="#0f172a">
                        {viewPayment.paid_on}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Divider />
                    </Grid>

                    {/* Member Information Box */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Box sx={{ p: 1.8, bgcolor: "#f8fafc", borderRadius: 2, border: "1px solid #e2e8f0" }}>
                        <Typography variant="caption" color="#64748b" fontWeight={700}>
                          RECEIVED FROM MEMBER:
                        </Typography>
                        <Typography variant="subtitle1" fontWeight={900} color="#064e3b" mt={0.3}>
                          {viewPayment.member_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Membership No: <strong>{viewPayment.membership_number}</strong>
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Phone: <strong>{viewPayment.member_phone || "—"}</strong>
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Box sx={{ p: 1.8, bgcolor: "#f8fafc", borderRadius: 2, border: "1px solid #e2e8f0" }}>
                        <Typography variant="caption" color="#64748b" fontWeight={700}>
                          TRANSACTION PARTICULARS:
                        </Typography>
                        <Typography variant="body2" fontWeight={700} color="#0f172a" mt={0.3}>
                          Channel: <strong>{viewPayment.payment_mode_display.toUpperCase()}</strong>
                          {viewPayment.bank_name ? ` (${viewPayment.bank_name})` : ""}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Reference / M-Pesa Code: <strong>{viewPayment.transaction_no || "—"}</strong>
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Contribution Period:{" "}
                          <strong>
                            Week {viewPayment.week ?? "—"}, Month {viewPayment.month ?? "—"}/{viewPayment.year ?? "—"}
                          </strong>
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  {/* Financial Breakdown Table */}
                  <TableContainer sx={{ border: "1px solid #cbd5e1", borderRadius: 1.5, mb: 2.5 }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: "#064e3b" }}>
                        <TableRow>
                          <TableCell sx={{ color: "#ffffff", fontWeight: 800 }}>#</TableCell>
                          <TableCell sx={{ color: "#ffffff", fontWeight: 800 }}>Item Description</TableCell>
                          <TableCell sx={{ color: "#ffffff", fontWeight: 800 }}>Fund Account</TableCell>
                          <TableCell sx={{ color: "#ffffff", fontWeight: 800 }}>Period</TableCell>
                          <TableCell sx={{ color: "#ffffff", fontWeight: 800 }} align="right">
                            Amount (KES)
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>1</TableCell>
                          <TableCell sx={{ fontWeight: 800, color: "#0f172a" }}>
                            {viewPayment.savings_type === "welfare"
                              ? "Member Welfare Benevolent Fund Contribution"
                              : "Member Normal Personal Savings Deposit"}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={viewPayment.savings_type === "welfare" ? "2020 - Welfare Fund" : "2010 - Member Savings"}
                              size="small"
                              sx={{ fontWeight: 700, fontSize: "0.72rem" }}
                            />
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>
                            Wk {viewPayment.week ?? "-"} / M{viewPayment.month ?? "-"}-{viewPayment.year ?? "-"}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 900, color: "#059669", fontSize: "1rem" }}>
                            {Number(viewPayment.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                        <TableRow sx={{ bgcolor: "#f8fafc" }}>
                          <TableCell colSpan={4} align="right" sx={{ fontWeight: 800, color: "#1e293b", py: 1.5 }}>
                            TOTAL AMOUNT RECEIVED:
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 900, color: "#064e3b", fontSize: "1.15rem", py: 1.5 }}>
                            KES {Number(viewPayment.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* Amount in Words Callout */}
                  <Box
                    sx={{
                      p: 1.8,
                      bgcolor: "#ecfdf5",
                      borderRadius: 1.5,
                      borderLeft: "4px solid #059669",
                      mb: 2.5,
                    }}
                  >
                    <Typography variant="caption" fontWeight={800} color="#047857" display="block">
                      AMOUNT IN WORDS:
                    </Typography>
                    <Typography variant="body1" fontWeight={800} color="#065f46" fontStyle="italic">
                      {amountToWords(Number(viewPayment.amount))}
                    </Typography>
                  </Box>

                  {/* Remarks */}
                  {viewPayment.remarks && (
                    <Box sx={{ p: 1.5, bgcolor: "#f8fafc", borderRadius: 1.5, mb: 2.5, border: "1px solid #e2e8f0" }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">
                        REMARKS / NARRATION:
                      </Typography>
                      <Typography variant="body2" color="#334155">
                        {viewPayment.remarks}
                      </Typography>
                    </Box>
                  )}

                  {/* Signatures & Seal Section */}
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-end" pt={2} pb={1}>
                    <Box textAlign="center">
                      <Box sx={{ width: 140, borderBottom: "1px dashed #475569", mb: 0.8 }} />
                      <Typography variant="caption" fontWeight={700} color="#334155">
                        Received By (Cashier)
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {viewPayment.paid_by || "System Cashier"}
                      </Typography>
                    </Box>

                    {/* Official Stamp Box */}
                    <Box
                      sx={{
                        width: 100,
                        height: 100,
                        borderRadius: "50%",
                        border: "2px dashed #059669",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#059669",
                        fontWeight: 900,
                        textAlign: "center",
                        lineHeight: 1.15,
                        transform: "rotate(-6deg)",
                      }}
                    >
                      <span style={{ fontSize: "0.62rem" }}>ROYAL SACCO</span>
                      <span style={{ fontSize: "0.8rem", color: "#059669" }}>★ ★ ★</span>
                      <span style={{ fontSize: "0.58rem" }}>AUDITED</span>
                      <span style={{ fontSize: "0.55rem" }}>OFFICIAL SEAL</span>
                    </Box>

                    <Box textAlign="center">
                      <Box sx={{ width: 140, borderBottom: "1px dashed #475569", mb: 0.8 }} />
                      <Typography variant="caption" fontWeight={700} color="#334155">
                        Member Signature
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Authorized Depositor
                      </Typography>
                    </Box>
                  </Stack>

                  <Typography
                    variant="caption"
                    color="#94a3b8"
                    display="block"
                    textAlign="center"
                    mt={3}
                    fontSize="0.68rem"
                  >
                    This is an official computer-generated receipt voucher issued by Royal SACCO Core Banking &bull; Valid without physical alteration.
                  </Typography>
                </Paper>
              </DialogContent>

              {/* Action Buttons in Modal (Hidden in Print) */}
              <DialogActions className="no-print" sx={{ p: 2.5, bgcolor: "#ffffff", borderTop: "1px solid #e2e8f0" }}>
                <Button onClick={() => setViewPayment(null)} sx={{ textTransform: "none", fontWeight: 700, color: "#64748b" }}>
                  Close
                </Button>
                <Button
                  variant="contained"
                  startIcon={<IconPrinter size={18} />}
                  onClick={handlePrint}
                  sx={{
                    bgcolor: "#059669",
                    "&:hover": { bgcolor: "#047857" },
                    textTransform: "none",
                    fontWeight: 800,
                    px: 3,
                    boxShadow: "0 4px 12px rgba(5, 150, 105, 0.3)",
                  }}
                >
                  Print Official Receipt
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteTarget} onClose={() => !deleting && setDeleteTarget(null)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontWeight: 800, color: "#dc2626" }}>Delete Savings Payment?</DialogTitle>
          <DialogContent>
            <Typography variant="body2">
              Are you sure you want to delete payment record #{deleteTarget?.document_no} for{" "}
              <strong>{deleteTarget?.member_name}</strong>? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setDeleteTarget(null)} disabled={deleting} sx={{ textTransform: "none" }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleDelete}
              disabled={deleting}
              sx={{ textTransform: "none", fontWeight: 700 }}
            >
              {deleting ? "Deleting..." : "Confirm Delete"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ======================================================== */}
        {/* EXECUTIVE BULK SAVINGS PAYMENTS UPLOAD MODAL              */}
        {/* ======================================================== */}
        <Dialog
          open={openUploadDialog}
          onClose={() => !uploading && setOpenUploadDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ p: 2.5, bgcolor: "#064e3b", color: "#ffffff", borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  p: 1.2,
                  borderRadius: 2,
                  bgcolor: "rgba(255, 255, 255, 0.15)",
                  color: "#34d399",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconUpload size={24} stroke={2.2} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={900} color="#ffffff">
                  Upload Bulk Savings Payments
                </Typography>
                <Typography variant="caption" sx={{ color: "#a7f3d0" }}>
                  Import batch member personal savings or welfare contributions via CSV or Excel (.xlsx)
                </Typography>
              </Box>
            </Stack>
          </DialogTitle>

          <DialogContent sx={{ p: { xs: 2.5, sm: 3.5 }, bgcolor: "#f8fafc" }}>
            {/* Step 1: Download Template */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                bgcolor: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: 2.5,
                mb: 3,
              }}
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", sm: "center" }}
                spacing={2}
              >
                <Box sx={{ flex: 1 }}>
                  <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                    <IconFileSpreadsheet size={20} color="#059669" />
                    <Typography variant="subtitle1" fontWeight={800} color="#064e3b">
                      Step 1: Download Standard Template
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="#047857" mb={1.5}>
                    Download our verified CSV format with column headers matching Royal SACCO standards:
                  </Typography>

                  {/* Column Badges Preview */}
                  <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
                    {[
                      "Member No *",
                      "Savings Type *",
                      "Amount *",
                      "Payment Mode *",
                      "Paid On *",
                      "Bank Name",
                      "Transaction No",
                      "Paid By",
                      "Remarks",
                    ].map((col) => (
                      <Chip
                        key={col}
                        label={col}
                        size="small"
                        sx={{
                          bgcolor: col.includes("*") ? "#dcfce7" : "#ffffff",
                          color: col.includes("*") ? "#065f46" : "#475569",
                          fontWeight: 700,
                          fontSize: "0.72rem",
                          border: "1px solid #86efac",
                        }}
                      />
                    ))}
                  </Stack>
                </Box>

                <Button
                  variant="contained"
                  startIcon={<IconDownload size={18} />}
                  onClick={handleDownloadTemplate}
                  sx={{
                    bgcolor: "#059669",
                    "&:hover": { bgcolor: "#047857" },
                    textTransform: "none",
                    fontWeight: 800,
                    borderRadius: 2,
                    px: 3,
                    py: 1.2,
                    whiteSpace: "nowrap",
                    boxShadow: "0 2px 8px rgba(5, 150, 105, 0.3)",
                  }}
                >
                  Download CSV Template
                </Button>
              </Stack>
            </Paper>

            {/* Step 2: Select File */}
            <Typography variant="subtitle1" fontWeight={800} color="#1e293b" mb={1}>
              Step 2: Select or Drag &amp; Drop Your File (.csv, .xlsx)
            </Typography>

            <Box
              sx={{
                border: "2px dashed",
                borderColor: uploadFile ? "#059669" : "#cbd5e1",
                borderRadius: 3,
                p: 4,
                textAlign: "center",
                bgcolor: uploadFile ? "#f0fdf4" : "#ffffff",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                "&:hover": { borderColor: "#059669", bgcolor: "#f0fdf4" },
              }}
              onClick={() => document.getElementById("bulk-savings-file-input")?.click()}
            >
              <input
                id="bulk-savings-file-input"
                type="file"
                accept=".csv, .xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                style={{ display: "none" }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setUploadFile(e.target.files[0]);
                    setUploadErrors([]);
                    setUploadSuccessMsg(null);
                  }
                }}
              />

              {uploadFile ? (
                <Stack spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 52,
                      height: 52,
                      borderRadius: "50%",
                      bgcolor: "#dcfce7",
                      color: "#059669",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 4px 12px rgba(5, 150, 105, 0.2)",
                    }}
                  >
                    <IconCheck size={32} stroke={2.5} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={900} color="#064e3b">
                      {uploadFile.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      File Size: {(uploadFile.size / 1024).toFixed(1)} KB &bull; Click to select a different file
                    </Typography>
                  </Box>
                  <Chip
                    label="READY FOR IMPORT"
                    size="small"
                    sx={{ bgcolor: "#059669", color: "#ffffff", fontWeight: 800, fontSize: "0.7rem" }}
                  />
                </Stack>
              ) : (
                <Stack spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 52,
                      height: 52,
                      borderRadius: 3,
                      bgcolor: "#ecfdf5",
                      color: "#059669",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <IconUpload size={28} stroke={2} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={800} color="#1e293b">
                      Click to browse or drop your CSV or Excel file here
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Supported formats: <strong>.CSV</strong> or <strong>.XLSX</strong> &bull; Maximum file size: 10MB
                    </Typography>
                  </Box>
                </Stack>
              )}
            </Box>

            {/* Error notifications */}
            {uploadErrors.length > 0 && (
              <Alert severity="error" sx={{ mt: 2.5, maxHeight: 180, overflowY: "auto", borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight={800}>
                  Please review the following {uploadErrors.length} validation issue(s):
                </Typography>
                <ul style={{ margin: "6px 0 0 0", paddingLeft: 18 }}>
                  {uploadErrors.map((err, i) => (
                    <li key={i}>
                      <Typography variant="caption" fontWeight={600}>{err}</Typography>
                    </li>
                  ))}
                </ul>
              </Alert>
            )}

            {/* Success notification */}
            {uploadSuccessMsg && (
              <Alert severity="success" sx={{ mt: 2.5, borderRadius: 2 }}>
                {uploadSuccessMsg}
              </Alert>
            )}
          </DialogContent>

          <DialogActions sx={{ p: 2.5, bgcolor: "#ffffff", borderTop: "1px solid #e2e8f0" }}>
            <Button
              onClick={() => {
                setOpenUploadDialog(false);
                setUploadFile(null);
                setUploadErrors([]);
              }}
              disabled={uploading}
              sx={{ textTransform: "none", fontWeight: 700, color: "#64748b" }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={
                uploading ? <CircularProgress size={18} color="inherit" /> : <IconUpload size={18} />
              }
              onClick={handleUploadSubmit}
              disabled={!uploadFile || uploading}
              sx={{
                bgcolor: "#059669",
                "&:hover": { bgcolor: "#047857" },
                textTransform: "none",
                fontWeight: 800,
                fontSize: "0.95rem",
                px: 3.5,
                py: 1.2,
                borderRadius: 2,
                boxShadow: "0 4px 14px rgba(5, 150, 105, 0.3)",
              }}
            >
              {uploading ? "Importing & Posting to Ledger..." : "Upload & Process Payments"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </PageContainer>
  );
}
