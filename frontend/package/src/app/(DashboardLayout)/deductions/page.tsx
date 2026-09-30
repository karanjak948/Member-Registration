"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
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
  Select,
  FormControl,
  InputLabel,
  Checkbox,
  Pagination,
  Snackbar,
  Avatar,
  Container,
} from "@mui/material";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import ExportButton from "@/components/common/ExportButton";
import { ExportColumn } from "@/utils/exportGrid";
import deductionsService from "@/services/deductions.service";
import memberService from "@/services/member.service";
import { MonthlyDeduction, DeductionSummary, CreateDeductionPayload } from "@/types/deductions";
import {
  IconFileSpreadsheet,
  IconUpload,
  IconSearch,
  IconEdit,
  IconTrash,
  IconPrinter,
  IconCopy,
  IconRefresh,
  IconPlus,
  IconFilter,
  IconCoin,
  IconCoins,
  IconUsers,
  IconArrowRight,
  IconCheck,
  IconBuildingBank,
  IconPigMoney,
  IconCash,
  IconAlertCircle,
  IconReceiptTax,
  IconCalendarEvent,
  IconX,
} from "@tabler/icons-react";

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 7 }, (_, i) => currentYear - 2 + i);

export default function MonthlyDeductionsPage() {
  const currentMonth = new Date().getMonth() + 1;

  // Filter States
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Data States
  const [deductions, setDeductions] = useState<MonthlyDeduction[]>([]);
  const [summary, setSummary] = useState<DeductionSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);

  // Selected Row Checkboxes
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Feedback Notification
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" | "info" }>({
    open: false,
    message: "",
    severity: "info",
  });

  // Dialog States
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MonthlyDeduction | null>(null);
  const [editForm, setEditForm] = useState<Partial<CreateDeductionPayload>>({});

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [membersList, setMembersList] = useState<any[]>([]);
  const [createForm, setCreateForm] = useState<Partial<CreateDeductionPayload>>({
    month: selectedMonth,
    year: selectedYear,
    charges: "0.00",
    loan_principal: "0.00",
    loan_interest: "0.00",
    registration_fee: "0.00",
    savings: "1500.00",
    shares: "0.00",
    others: "0.00",
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Load Deductions & Summary
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [res, sumRes] = await Promise.all([
        deductionsService.getDeductions({
          month: selectedMonth,
          year: selectedYear,
          status: statusFilter !== "all" ? statusFilter : undefined,
          search: searchTerm || undefined,
          page,
          page_size: pageSize,
        }),
        deductionsService.getSummary({
          month: selectedMonth,
          year: selectedYear,
        }),
      ]);
      setDeductions(res.results);
      setTotalCount(res.count);
      setSummary(sumRes);
    } catch (err: any) {
      console.error(err);
      setSnackbar({
        open: true,
        message: err?.response?.data?.error || "Failed to load monthly deductions.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, statusFilter, searchTerm, page, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Load members for manual Create Dialog
  useEffect(() => {
    if (createDialogOpen && membersList.length === 0) {
      memberService.getAll().then((res: any) => {
        const list = Array.isArray(res) ? res : res?.results || [];
        setMembersList(list);
      }).catch(console.error);
    }
  }, [createDialogOpen, membersList.length]);

  // Handle Generate / Regenerate
  const handleGenerate = async (forceRegenerate: boolean = false) => {
    setGenerating(true);
    try {
      const res = forceRegenerate
        ? await deductionsService.regenerateDeductions({ month: selectedMonth, year: selectedYear })
        : await deductionsService.generateDeductions({ month: selectedMonth, year: selectedYear });
      setSnackbar({
        open: true,
        message: res.message || "Monthly deductions roll generated successfully!",
        severity: "success",
      });
      fetchData();
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err?.response?.data?.error || "Failed to generate monthly deductions.",
        severity: "error",
      });
    } finally {
      setGenerating(false);
    }
  };

  // Checkbox select all / toggle
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(deductions.map((d) => d.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Export columns definition for universal ExportButton
  const exportColumns: ExportColumn<MonthlyDeduction>[] = useMemo(() => [
    { header: "ID", key: "id" },
    { header: "Member Name", key: "member_name" },
    { header: "Payroll / Member No", key: "membership_number" },
    { header: "National ID", key: "national_id" },
    { header: "Phone Number", key: "phone_number" },
    { header: "Category", key: "category_name" },
    { header: "Month", key: "month" },
    { header: "Year", key: "year" },
    { header: "Charges (KES)", key: "charges", format: (val) => Number(val || 0).toFixed(2) },
    { header: "Loan Installment (KES)", key: "loan_principal", format: (val) => Number(val || 0).toFixed(2) },
    { header: "Loan Interest (KES)", key: "loan_interest", format: (val) => Number(val || 0).toFixed(2) },
    { header: "Registration Fee (KES)", key: "registration_fee", format: (val) => Number(val || 0).toFixed(2) },
    { header: "Savings (KES)", key: "savings", format: (val) => Number(val || 0).toFixed(2) },
    { header: "Shares (KES)", key: "shares", format: (val) => Number(val || 0).toFixed(2) },
    { header: "Others (KES)", key: "others", format: (val) => Number(val || 0).toFixed(2) },
    { header: "Total Expected (KES)", key: "total_expected", format: (val) => Number(val || 0).toFixed(2) },
    { header: "Amount Remitted (KES)", key: "amount_paid", format: (val) => Number(val || 0).toFixed(2) },
    { header: "Remaining Balance (KES)", key: "balance", format: (val) => Number(val || 0).toFixed(2) },
    { header: "Status", key: "status", format: (val) => String(val || "").toUpperCase() },
  ], []);

  // Quick Copy
  const handleCopyTable = () => {
    if (!deductions.length) return;
    const header = "ID\tMember\tPayroll No\tMonth\tYear\tCharges\tLoan Principal\tLoan Interest\tReg Fee\tSavings\tShares\tOthers\tTotal\tPaid\tBalance\tStatus\n";
    const rows = deductions
      .map(
        (d) =>
          `${d.id}\t${d.member_name}\t${d.membership_number}\t${d.month}\t${d.year}\t${d.charges}\t${d.loan_principal}\t${d.loan_interest}\t${d.registration_fee}\t${d.savings}\t${d.shares}\t${d.others}\t${d.total_expected}\t${d.amount_paid}\t${d.balance}\t${d.status}`
      )
      .join("\n");
    navigator.clipboard.writeText(header + rows);
    setSnackbar({ open: true, message: "Table data copied to clipboard!", severity: "success" });
  };

  const handlePrint = () => {
    window.print();
  };

  // Edit / Add Item action
  const handleOpenEdit = (item: MonthlyDeduction) => {
    setEditingItem(item);
    setEditForm({
      charges: item.charges,
      loan_principal: item.loan_principal,
      loan_interest: item.loan_interest,
      registration_fee: item.registration_fee,
      savings: item.savings,
      shares: item.shares,
      others: item.others,
      amount_paid: item.amount_paid,
      notes: item.notes || "",
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    try {
      await deductionsService.updateDeduction(editingItem.id, editForm);
      setSnackbar({ open: true, message: "Deduction item updated successfully.", severity: "success" });
      setEditDialogOpen(false);
      fetchData();
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err?.response?.data?.error || "Failed to update item.",
        severity: "error",
      });
    }
  };

  // Create manual deduction action
  const handleSaveCreate = async () => {
    if (!createForm.member) {
      setSnackbar({ open: true, message: "Please select a member.", severity: "error" });
      return;
    }
    try {
      await deductionsService.createDeduction({
        member: Number(createForm.member),
        month: selectedMonth,
        year: selectedYear,
        charges: createForm.charges || "0.00",
        loan_principal: createForm.loan_principal || "0.00",
        loan_interest: createForm.loan_interest || "0.00",
        registration_fee: createForm.registration_fee || "0.00",
        savings: createForm.savings || "1500.00",
        shares: createForm.shares || "0.00",
        others: createForm.others || "0.00",
        notes: createForm.notes || "",
      });
      setSnackbar({ open: true, message: "New monthly deduction item created.", severity: "success" });
      setCreateDialogOpen(false);
      fetchData();
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err?.response?.data?.error || "Failed to create deduction item.",
        severity: "error",
      });
    }
  };

  // Delete action
  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deductionsService.deleteDeduction(deletingId);
      setSnackbar({ open: true, message: "Deduction record removed.", severity: "success" });
      setDeleteDialogOpen(false);
      setDeletingId(null);
      fetchData();
    } catch (err: any) {
      setSnackbar({ open: true, message: "Failed to delete record.", severity: "error" });
    }
  };

  // Format currency
  const formatMoney = (val: string | number | undefined) => {
    const num = Number(val || 0);
    return num.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Chip
            label="Fully Paid"
            size="small"
            sx={{
              bgcolor: "#ecfdf5",
              color: "#059669",
              border: "1px solid #a7f3d0",
              fontWeight: 700,
            }}
          />
        );
      case "partial":
        return (
          <Chip
            label="Partially Paid"
            size="small"
            sx={{
              bgcolor: "#fffbeb",
              color: "#d97706",
              border: "1px solid #fde68a",
              fontWeight: 700,
            }}
          />
        );
      case "overpaid":
        return (
          <Chip
            label="Overpaid"
            size="small"
            sx={{
              bgcolor: "#eff6ff",
              color: "#2563eb",
              border: "1px solid #bfdbfe",
              fontWeight: 700,
            }}
          />
        );
      default:
        return (
          <Chip
            label="Pending"
            size="small"
            sx={{
              bgcolor: "#f8fafc",
              color: "#64748b",
              border: "1px solid #cbd5e1",
              fontWeight: 700,
            }}
          />
        );
    }
  };

  return (
    <PageContainer title="Monthly Deductions" description="SACCO Monthly Check-off & Remittance Schedule">
      <Box sx={{ mb: 4 }}>
        {/* Executive Header Banner (Matching Members & Loans Executive Layout) */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3 },
            mb: 3,
            borderRadius: 3,
            border: "1px solid #2563eb",
            background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #2563eb 100%)",
            color: "#ffffff",
            boxShadow: "0 8px 24px rgba(30, 58, 138, 0.25)",
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "center" }}
            spacing={2}
          >
            <Box>
              <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: "-0.5px", color: "#ffffff" }}>
                Monthly Deductions &amp; Check-off Roll
              </Typography>
              <Typography variant="body2" sx={{ color: "#bfdbfe", mt: 0.5, fontWeight: 500 }}>
                Generate, review, adjust, and reconcile monthly payroll deductions, loan installments, savings, and shares
              </Typography>
            </Box>

            {/* Header Action Badges & Buttons */}
            <Stack direction="row" spacing={1.5} flexWrap="wrap" alignItems="center">
              {summary && (
                <Box
                  sx={{
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    bgcolor: "rgba(255, 255, 255, 0.12)",
                    border: "1px solid rgba(255, 255, 255, 0.25)",
                    backdropFilter: "blur(6px)",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <IconUsers size={18} color="#93c5fd" />
                  <Typography variant="caption" sx={{ color: "#ffffff", fontWeight: 800 }}>
                    {summary.total_members} Members in Roll
                  </Typography>
                </Box>
              )}

              <Button
                component={Link}
                href="/deductions/upload"
                variant="outlined"
                startIcon={<IconUpload size={18} />}
                sx={{
                  color: "#ffffff",
                  borderColor: "rgba(255,255,255,0.4)",
                  bgcolor: "rgba(255,255,255,0.08)",
                  backdropFilter: "blur(6px)",
                  fontWeight: 700,
                  borderRadius: 2,
                  "&:hover": {
                    borderColor: "#ffffff",
                    bgcolor: "rgba(255,255,255,0.18)",
                  },
                }}
              >
                Bulk Upload
              </Button>

              <Button
                variant="contained"
                startIcon={<IconPlus size={18} />}
                onClick={() => {
                  setCreateForm({
                    month: selectedMonth,
                    year: selectedYear,
                    charges: "0.00",
                    loan_principal: "0.00",
                    loan_interest: "0.00",
                    registration_fee: "0.00",
                    savings: "1500.00",
                    shares: "0.00",
                    others: "0.00",
                  });
                  setCreateDialogOpen(true);
                }}
                sx={{
                  bgcolor: "#ffffff",
                  color: "#1e3a8a",
                  fontWeight: 700,
                  borderRadius: 2,
                  "&:hover": { bgcolor: "#f1f5f9" },
                }}
              >
                + Create New
              </Button>

              <Tooltip title="Refresh Deductions Data">
                <IconButton
                  size="small"
                  sx={{
                    bgcolor: "rgba(255,255,255,0.12)",
                    color: "#ffffff",
                    border: "1px solid rgba(255,255,255,0.25)",
                    "&:hover": { bgcolor: "rgba(255,255,255,0.25)" },
                  }}
                  onClick={fetchData}
                >
                  <IconRefresh size={18} />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </Paper>

        {/* Top Period Selector Bar (Matches Screenshot 1 & 2) */}
        <Card
          elevation={0}
          sx={{
            p: 2.5,
            mb: 3,
            border: "1px solid #e2e8f0",
            borderRadius: 3,
            backgroundColor: "#ffffff",
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="month-label">Select Month</InputLabel>
                <Select
                  labelId="month-label"
                  value={selectedMonth}
                  label="Select Month"
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                >
                  {MONTHS.map((m) => (
                    <MenuItem key={m.value} value={m.value}>
                      {m.label} ({m.value})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="year-label">Select Year</InputLabel>
                <Select
                  labelId="year-label"
                  value={selectedYear}
                  label="Select Year"
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                >
                  {YEARS.map((y) => (
                    <MenuItem key={y} value={y}>
                      {y}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="status-label">Filter by Status</InputLabel>
                <Select
                  labelId="status-label"
                  value={statusFilter}
                  label="Filter by Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="partial">Partially Paid</MenuItem>
                  <MenuItem value="paid">Fully Paid</MenuItem>
                  <MenuItem value="overpaid">Overpaid</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Button
                fullWidth
                variant="contained"
                onClick={fetchData}
                startIcon={<IconFilter size={18} />}
                sx={{
                  backgroundColor: "#2563eb",
                  "&:hover": { backgroundColor: "#1d4ed8" },
                  height: "40px",
                  fontWeight: 700,
                  borderRadius: 2,
                  textTransform: "none",
                }}
              >
                Apply Filter
              </Button>
            </Grid>

            <Grid size={{ xs: 12, md: 2.5 }}>
              <Button
                fullWidth
                variant="contained"
                color="success"
                disabled={generating}
                onClick={() => handleGenerate(false)}
                startIcon={generating ? <CircularProgress size={16} color="inherit" /> : <IconArrowRight size={18} />}
                sx={{
                  height: "40px",
                  fontWeight: 700,
                  borderRadius: 2,
                  textTransform: "none",
                  backgroundColor: "#059669",
                  "&:hover": { backgroundColor: "#047857" },
                }}
              >
                {generating ? "Calculating..." : "Generate Month"}
              </Button>
            </Grid>
          </Grid>
        </Card>

        {/* Executive KPI Stat Cards */}
        {summary && (
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            {/* Total Expected Deductions */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                elevation={0}
                sx={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 3,
                  bgcolor: "#ffffff",
                  height: 110,
                  display: "flex",
                  alignItems: "center",
                  px: 2.5,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center" width="100%">
                  <Avatar
                    sx={{
                      width: 50,
                      height: 50,
                      bgcolor: "#eff6ff",
                      color: "#2563eb",
                      borderRadius: 2.5,
                      border: "1px solid #bfdbfe",
                    }}
                  >
                    <IconCoins size={28} />
                  </Avatar>
                  <Box>
                    <Typography variant="caption" fontWeight={700} color="text.secondary" letterSpacing={0.5}>
                      TOTAL EXPECTED
                    </Typography>
                    <Typography variant="h5" fontWeight={800} color="#0f172a">
                      KES {formatMoney(summary.total_expected)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight={500}>
                      {summary.total_members} Active in Roll
                    </Typography>
                  </Box>
                </Stack>
              </Card>
            </Grid>

            {/* Total Remitted / Paid */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                elevation={0}
                sx={{
                  border: "1px solid #bbf7d0",
                  borderRadius: 3,
                  bgcolor: "#f0fdf4",
                  height: 110,
                  display: "flex",
                  alignItems: "center",
                  px: 2.5,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center" width="100%">
                  <Avatar
                    sx={{
                      width: 50,
                      height: 50,
                      bgcolor: "#dcfce7",
                      color: "#059669",
                      borderRadius: 2.5,
                      border: "1px solid #86efac",
                    }}
                  >
                    <IconReceiptTax size={28} />
                  </Avatar>
                  <Box>
                    <Typography variant="caption" fontWeight={700} color="#15803d" letterSpacing={0.5}>
                      TOTAL REMITTED / PAID
                    </Typography>
                    <Typography variant="h5" fontWeight={800} color="#166534">
                      KES {formatMoney(summary.total_paid)}
                    </Typography>
                    <Typography variant="caption" color="#15803d" fontWeight={600}>
                      {summary.paid_count} Paid | {summary.partial_count} Partial
                    </Typography>
                  </Box>
                </Stack>
              </Card>
            </Grid>

            {/* Outstanding Balance */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                elevation={0}
                sx={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 3,
                  bgcolor: "#ffffff",
                  height: 110,
                  display: "flex",
                  alignItems: "center",
                  px: 2.5,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center" width="100%">
                  <Avatar
                    sx={{
                      width: 50,
                      height: 50,
                      bgcolor: Number(summary.total_balance) > 0 ? "#fff1f2" : "#f8fafc",
                      color: Number(summary.total_balance) > 0 ? "#e11d48" : "#64748b",
                      borderRadius: 2.5,
                      border: Number(summary.total_balance) > 0 ? "1px solid #fecdd3" : "1px solid #e2e8f0",
                    }}
                  >
                    <IconAlertCircle size={28} />
                  </Avatar>
                  <Box>
                    <Typography variant="caption" fontWeight={700} color="text.secondary" letterSpacing={0.5}>
                      OUTSTANDING VARIANCE
                    </Typography>
                    <Typography
                      variant="h5"
                      fontWeight={800}
                      color={Number(summary.total_balance) > 0 ? "#e11d48" : "#0f172a"}
                    >
                      KES {formatMoney(summary.total_balance)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight={500}>
                      {summary.pending_count} Unsettled Accounts
                    </Typography>
                  </Box>
                </Stack>
              </Card>
            </Grid>

            {/* Savings & Loans Breakdown */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                elevation={0}
                sx={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 3,
                  bgcolor: "#ffffff",
                  height: 110,
                  display: "flex",
                  alignItems: "center",
                  px: 2.5,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center" width="100%">
                  <Avatar
                    sx={{
                      width: 50,
                      height: 50,
                      bgcolor: "#faf5ff",
                      color: "#9333ea",
                      borderRadius: 2.5,
                      border: "1px solid #e9d5ff",
                    }}
                  >
                    <IconPigMoney size={28} />
                  </Avatar>
                  <Box>
                    <Typography variant="caption" fontWeight={700} color="text.secondary" letterSpacing={0.5}>
                      SAVINGS &amp; LOANS DUES
                    </Typography>
                    <Typography variant="subtitle1" fontWeight={800} color="#0f172a">
                      Loans: KES {formatMoney(Number(summary.total_principal) + Number(summary.total_interest))}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight={500}>
                      Savings: KES {formatMoney(summary.total_savings)} | Shares: KES {formatMoney(summary.total_shares)}
                    </Typography>
                  </Box>
                </Stack>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Data Register Card with Universal ExportButton and Table */}
        <Card
          elevation={0}
          sx={{
            border: "1px solid #e2e8f0",
            borderRadius: 3,
            overflow: "hidden",
            backgroundColor: "#ffffff",
            boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
          }}
        >
          {/* Card Header & Export Toolbar */}
          <Box
            sx={{
              p: 2.5,
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
              borderBottom: "1px solid #f1f5f9",
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <IconFileSpreadsheet size={22} color="#2563eb" />
              <Typography variant="h6" fontWeight={700} color="#1e293b">
                Scheduled Deductions Register — {MONTHS.find((m) => m.value === selectedMonth)?.label} {selectedYear}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
              {/* Universal ExportButton */}
              <ExportButton
                data={deductions}
                columns={exportColumns}
                filename={`monthly_deductions_${selectedMonth}_${selectedYear}`}
                title={`Monthly Deductions Check-off Schedule (${MONTHS.find((m) => m.value === selectedMonth)?.label} ${selectedYear})`}
                size="small"
              />

              {/* Quick Action Buttons */}
              <Button
                size="small"
                variant="outlined"
                startIcon={<IconCopy size={16} />}
                onClick={handleCopyTable}
                sx={{
                  color: "#475569",
                  borderColor: "#cbd5e1",
                  bgcolor: "#f8fafc",
                  "&:hover": { bgcolor: "#f1f5f9" },
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: 2,
                }}
              >
                Copy
              </Button>

              <Button
                size="small"
                variant="outlined"
                startIcon={<IconPrinter size={16} />}
                onClick={handlePrint}
                sx={{
                  color: "#475569",
                  borderColor: "#cbd5e1",
                  bgcolor: "#f8fafc",
                  "&:hover": { bgcolor: "#f1f5f9" },
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: 2,
                }}
              >
                Print
              </Button>

              {/* Search Box */}
              <TextField
                size="small"
                placeholder="Search member, ID, payroll..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ minWidth: 240 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconSearch size={18} color="#94a3b8" />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchTerm("")}>
                        <IconX size={14} />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                }}
              />
            </Stack>
          </Box>

          {/* Deductions Data Table */}
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow sx={{ "& th": { backgroundColor: "#f8fafc", fontWeight: 700, color: "#334155", py: 1.5 } }}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={deductions.length > 0 && selectedIds.length === deductions.length}
                      indeterminate={selectedIds.length > 0 && selectedIds.length < deductions.length}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell>ID</TableCell>
                  <TableCell>Member Profile</TableCell>
                  <TableCell>Payroll / Member No</TableCell>
                  <TableCell align="center">Month / Year</TableCell>
                  <TableCell align="right">Charges</TableCell>
                  <TableCell align="right">Loan Principal</TableCell>
                  <TableCell align="right">Loan Interest</TableCell>
                  <TableCell align="right">Reg Fee</TableCell>
                  <TableCell align="right">Savings</TableCell>
                  <TableCell align="right">Shares</TableCell>
                  <TableCell align="right">Others</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>Total Expected</TableCell>
                  <TableCell align="right">Remitted</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={16} align="center" sx={{ py: 8 }}>
                      <CircularProgress size={36} />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, fontWeight: 500 }}>
                        Loading monthly deductions roll...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : deductions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={16} align="center" sx={{ py: 8 }}>
                      <Avatar
                        sx={{
                          width: 60,
                          height: 60,
                          bgcolor: "#f1f5f9",
                          color: "#64748b",
                          mx: "auto",
                          mb: 2,
                        }}
                      >
                        <IconCalendarEvent size={32} />
                      </Avatar>
                      <Typography variant="h6" fontWeight={700} color="#1e293b">
                        No monthly deductions generated for {MONTHS.find((m) => m.value === selectedMonth)?.label} {selectedYear}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2.5, maxWidth: 450, mx: "auto" }}>
                        Click &quot;Generate Monthly Deductions&quot; to calculate scheduled loans, savings, and shares for all registered members.
                      </Typography>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<IconArrowRight size={18} />}
                        onClick={() => handleGenerate(false)}
                        sx={{
                          fontWeight: 700,
                          borderRadius: 2,
                          px: 3,
                          py: 1,
                          backgroundColor: "#059669",
                          "&:hover": { backgroundColor: "#047857" },
                        }}
                      >
                        Generate Monthly Deductions
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  deductions.map((row) => {
                    const isSelected = selectedIds.includes(row.id);
                    return (
                      <TableRow
                        key={row.id}
                        hover
                        selected={isSelected}
                        sx={{
                          "&:nth-of-type(even)": { backgroundColor: "#fafbfc" },
                        }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox checked={isSelected} onChange={() => handleToggleSelect(row.id)} />
                        </TableCell>
                        <TableCell sx={{ color: "text.secondary", fontSize: "0.85rem", fontFamily: "monospace" }}>
                          #{row.id}
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight={700} color="#0f172a">
                            {row.member_name}
                          </Typography>
                          {row.category_name && (
                            <Typography variant="caption" color="text.secondary">
                              {row.category_name}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={row.membership_number}
                            size="small"
                            variant="outlined"
                            sx={{
                              fontFamily: "monospace",
                              fontWeight: 600,
                              borderColor: "#cbd5e1",
                              color: "#334155",
                              bgcolor: "#f8fafc",
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight={600}>
                            {row.month}/{row.year}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{formatMoney(row.charges)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{formatMoney(row.loan_principal)}</TableCell>
                        <TableCell align="right">{formatMoney(row.loan_interest)}</TableCell>
                        <TableCell align="right">{formatMoney(row.registration_fee)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: "#0284c7" }}>
                          {formatMoney(row.savings)}
                        </TableCell>
                        <TableCell align="right">{formatMoney(row.shares)}</TableCell>
                        <TableCell align="right">{formatMoney(row.others)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, color: "#0f172a" }}>
                          {formatMoney(row.total_expected)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: "#16a34a" }}>
                          {formatMoney(row.amount_paid)}
                        </TableCell>
                        <TableCell align="center">{getStatusBadge(row.status)}</TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center">
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleOpenEdit(row)}
                              sx={{
                                minWidth: 68,
                                py: 0.25,
                                fontSize: "0.75rem",
                                textTransform: "none",
                                fontWeight: 600,
                                borderRadius: 1.5,
                              }}
                            >
                              Add Item
                            </Button>
                            <Tooltip title="Edit Row">
                              <IconButton size="small" color="primary" onClick={() => handleOpenEdit(row)}>
                                <IconEdit size={16} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => {
                                  setDeletingId(row.id);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <IconTrash size={16} />
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

          {/* Table Footer: Regenerate Button & Pagination */}
          <Box
            sx={{
              p: 2.5,
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px solid #e2e8f0",
              backgroundColor: "#f8fafc",
              gap: 2,
            }}
          >
            <Button
              variant="contained"
              color="success"
              disabled={generating}
              onClick={() => handleGenerate(true)}
              startIcon={generating ? <CircularProgress size={16} color="inherit" /> : <IconRefresh size={18} />}
              sx={{
                fontWeight: 700,
                borderRadius: 2,
                backgroundColor: "#16a34a",
                "&:hover": { backgroundColor: "#15803d" },
                textTransform: "none",
                px: 2.5,
              }}
            >
              {generating ? "Recalculating..." : "Regenerate Roll"}
            </Button>

            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                Showing {deductions.length} of {totalCount} records
              </Typography>
              <Pagination
                count={Math.ceil(totalCount / pageSize) || 1}
                page={page}
                onChange={(_, p) => setPage(p)}
                color="primary"
                size="small"
              />
            </Stack>
          </Box>
        </Card>
      </Box>

      {/* Edit / Add Item Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, pb: 1, borderBottom: "1px solid #f1f5f9" }}>
          Adjust Monthly Deduction: {editingItem?.member_name}
        </DialogTitle>
        <DialogContent sx={{ pt: 2.5 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Charges / Fees (KES)"
                type="number"
                value={editForm.charges || ""}
                onChange={(e) => setEditForm({ ...editForm, charges: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Loan Installment (KES)"
                type="number"
                value={editForm.loan_principal || ""}
                onChange={(e) => setEditForm({ ...editForm, loan_principal: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Loan Interest (KES)"
                type="number"
                value={editForm.loan_interest || ""}
                onChange={(e) => setEditForm({ ...editForm, loan_interest: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Registration Fee (KES)"
                type="number"
                value={editForm.registration_fee || ""}
                onChange={(e) => setEditForm({ ...editForm, registration_fee: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Savings Contribution (KES)"
                type="number"
                value={editForm.savings || ""}
                onChange={(e) => setEditForm({ ...editForm, savings: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Shares Contribution (KES)"
                type="number"
                value={editForm.shares || ""}
                onChange={(e) => setEditForm({ ...editForm, shares: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Others / Welfare (KES)"
                type="number"
                value={editForm.others || ""}
                onChange={(e) => setEditForm({ ...editForm, others: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Amount Paid So Far (KES)"
                type="number"
                value={editForm.amount_paid || ""}
                onChange={(e) => setEditForm({ ...editForm, amount_paid: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                size="small"
                label="Notes / Justification"
                multiline
                rows={2}
                value={editForm.notes || ""}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: "1px solid #f1f5f9" }}>
          <Button onClick={() => setEditDialogOpen(false)} sx={{ fontWeight: 600 }}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleSaveEdit} sx={{ fontWeight: 700, borderRadius: 2 }}>
            Save Adjustments
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Manual Deduction Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, pb: 1, borderBottom: "1px solid #f1f5f9" }}>
          Create Monthly Deduction Entry
        </DialogTitle>
        <DialogContent sx={{ pt: 2.5 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="create-member-label">Select Member *</InputLabel>
                <Select
                  labelId="create-member-label"
                  label="Select Member *"
                  value={createForm.member || ""}
                  onChange={(e) => setCreateForm({ ...createForm, member: Number(e.target.value) })}
                >
                  {membersList.map((m) => (
                    <MenuItem key={m.id} value={m.id}>
                      {m.membership_number} — {m.full_name || `${m.first_name} ${m.other_names || ""}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Charges (KES)"
                type="number"
                value={createForm.charges || "0.00"}
                onChange={(e) => setCreateForm({ ...createForm, charges: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Loan Installment (KES)"
                type="number"
                value={createForm.loan_principal || "0.00"}
                onChange={(e) => setCreateForm({ ...createForm, loan_principal: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Loan Interest (KES)"
                type="number"
                value={createForm.loan_interest || "0.00"}
                onChange={(e) => setCreateForm({ ...createForm, loan_interest: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Savings (KES)"
                type="number"
                value={createForm.savings || "1500.00"}
                onChange={(e) => setCreateForm({ ...createForm, savings: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Shares (KES)"
                type="number"
                value={createForm.shares || "0.00"}
                onChange={(e) => setCreateForm({ ...createForm, shares: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Others (KES)"
                type="number"
                value={createForm.others || "0.00"}
                onChange={(e) => setCreateForm({ ...createForm, others: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                size="small"
                label="Remarks"
                multiline
                rows={2}
                value={createForm.notes || ""}
                onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: "1px solid #f1f5f9" }}>
          <Button onClick={() => setCreateDialogOpen(false)} sx={{ fontWeight: 600 }}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleSaveCreate} sx={{ fontWeight: 700, borderRadius: 2 }}>
            Create Entry
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle sx={{ fontWeight: 800 }}>Delete Monthly Deduction</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete this monthly deduction record? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ fontWeight: 600 }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} sx={{ fontWeight: 700, borderRadius: 2 }}>
            Confirm Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </PageContainer>
  );
}
