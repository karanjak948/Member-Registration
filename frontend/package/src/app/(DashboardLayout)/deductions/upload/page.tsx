"use client";

import React, { useState, useRef, useMemo } from "react";
import Link from "next/link";
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
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Snackbar,
  LinearProgress,
  Avatar,
  IconButton,
} from "@mui/material";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import ExportButton from "@/components/common/ExportButton";
import { ExportColumn } from "@/utils/exportGrid";
import deductionsService from "@/services/deductions.service";
import { BulkUploadResult } from "@/types/deductions";
import {
  IconUpload,
  IconDownload,
  IconArrowLeft,
  IconCheck,
  IconAlertCircle,
  IconFileSpreadsheet,
  IconCircleCheck,
  IconBuildingBank,
  IconCoins,
  IconPigMoney,
  IconReceiptTax,
  IconClock,
  IconTrash,
  IconInfoCircle,
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
const currentMonth = new Date().getMonth() + 1;
const todayStr = new Date().toISOString().split("T")[0];
const YEARS = Array.from({ length: 7 }, (_, i) => currentYear - 2 + i);

const PAYMENT_MODES = [
  { value: "payroll", label: "Employer Payroll Checkoff" },
  { value: "bank", label: "Bank Transfer / Standing Order" },
  { value: "mpesa", label: "M-Pesa Paybill / C2B" },
  { value: "cheque", label: "Company Cheque" },
  { value: "cash", label: "Cash / Counter Deposit" },
];

export default function BulkUploadDeductionsPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form State
  const [deductionType, setDeductionType] = useState("all");
  const [month, setMonth] = useState<number>(currentMonth);
  const [year, setYear] = useState<number>(currentYear);
  const [paidThro, setPaidThro] = useState("payroll");
  const [datePaid, setDatePaid] = useState(todayStr);
  const [remarks, setRemarks] = useState("");

  // File & Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(null);

  // Snackbar Notification
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" | "info" }>({
    open: false,
    message: "",
    severity: "info",
  });

  // Download Sample Template
  const handleDownloadTemplate = async () => {
    try {
      const blob = await deductionsService.downloadTemplate(month, year);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `monthly_deductions_template_${month}_${year}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "Failed to download template.", severity: "error" });
    }
  };

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const name = file.name.toLowerCase();
      if (!name.endsWith(".xlsx") && !name.endsWith(".xls") && !name.endsWith(".csv")) {
        setSnackbar({
          open: true,
          message: "Please choose an Excel (.xlsx/.xls) or CSV (.csv) file.",
          severity: "error",
        });
        return;
      }
      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  // Handle Drag & Drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const name = file.name.toLowerCase();
      if (!name.endsWith(".xlsx") && !name.endsWith(".xls") && !name.endsWith(".csv")) {
        setSnackbar({
          open: true,
          message: "Please drop an Excel (.xlsx/.xls) or CSV (.csv) file.",
          severity: "error",
        });
        return;
      }
      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  // Submit Upload
  const handleUpload = async () => {
    if (!selectedFile) {
      setSnackbar({ open: true, message: "Please select a file to upload.", severity: "error" });
      return;
    }
    if (!month || !year) {
      setSnackbar({ open: true, message: "Please select month and year.", severity: "error" });
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      const result = await deductionsService.bulkUpload(selectedFile, {
        month,
        year,
        paid_thro: paidThro,
        date_paid: datePaid,
        remarks,
      });

      setUploadResult(result);
      if (result.success) {
        setSnackbar({
          open: true,
          message: `Successfully processed ${result.success_count} remittance deductions!`,
          severity: "success",
        });
      } else {
        setSnackbar({
          open: true,
          message: result.error || "Upload failed with errors.",
          severity: "error",
        });
      }
    } catch (err: any) {
      console.error(err);
      const errMsg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Upload failed. Please check file format.";
      setSnackbar({ open: true, message: errMsg, severity: "error" });
    } finally {
      setUploading(false);
    }
  };

  const formatMoney = (val: string | number | undefined) => {
    const num = Number(val || 0);
    return num.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Export Columns for Remittance Upload Results
  const resultExportColumns: ExportColumn<any>[] = useMemo(() => [
    { header: "Member No", key: "membership_number" },
    { header: "Member Name", key: "member_name" },
    { header: "Remitted Amount (KES)", key: "remitted_amount", format: (v) => Number(v || 0).toFixed(2) },
    { header: "To Loans (KES)", key: "loan_allocated", format: (v) => Number(v || 0).toFixed(2) },
    { header: "To Savings (KES)", key: "savings_allocated", format: (v) => Number(v || 0).toFixed(2) },
    { header: "To Shares (KES)", key: "shares_allocated", format: (v) => Number(v || 0).toFixed(2) },
    { header: "Remaining Balance (KES)", key: "new_balance", format: (v) => Number(v || 0).toFixed(2) },
    { header: "Status", key: "status", format: (v) => String(v || "").toUpperCase() },
  ], []);

  return (
    <PageContainer
      title="Monthly Deductions Bulk Upload"
      description="Upload employer monthly deductions check-off remittance spreadsheet"
    >
      <Box sx={{ mb: 4 }}>
        {/* Executive Header Banner (Matching Members & Loans Executive Layout) */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3 },
            mb: 3,
            borderRadius: 3,
            border: "1px solid #10b981",
            background: "linear-gradient(135deg, #064e3b 0%, #047857 50%, #059669 100%)",
            color: "#ffffff",
            boxShadow: "0 8px 24px rgba(6, 78, 59, 0.25)",
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "center" }}
            spacing={2}
          >
            <Box>
              <Stack direction="row" spacing={1.5} alignItems="center" mb={0.5}>
                <Button
                  component={Link}
                  href="/deductions"
                  variant="outlined"
                  size="small"
                  startIcon={<IconArrowLeft size={16} />}
                  sx={{
                    color: "#ffffff",
                    borderColor: "rgba(255,255,255,0.4)",
                    bgcolor: "rgba(255,255,255,0.08)",
                    backdropFilter: "blur(6px)",
                    fontWeight: 700,
                    borderRadius: 2,
                    textTransform: "none",
                    "&:hover": {
                      borderColor: "#ffffff",
                      bgcolor: "rgba(255,255,255,0.18)",
                    },
                  }}
                >
                  Back to Deductions Roll
                </Button>
              </Stack>
              <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: "-0.5px", color: "#ffffff", mt: 1 }}>
                Monthly Deductions &amp; Check-off Bulk Upload
              </Typography>
              <Typography variant="body2" sx={{ color: "#d1fae5", mt: 0.5, fontWeight: 500 }}>
                Import employer check-off remittance spreadsheets with automated member account reconciliation and SACCO waterfall allocation
              </Typography>
            </Box>

            <Stack direction="row" spacing={1.5} alignItems="center">
              <Button
                variant="contained"
                startIcon={<IconDownload size={18} />}
                onClick={handleDownloadTemplate}
                sx={{
                  bgcolor: "#ffffff",
                  color: "#065f46",
                  fontWeight: 700,
                  borderRadius: 2,
                  px: 2.5,
                  py: 1,
                  textTransform: "none",
                  "&:hover": { bgcolor: "#f1f5f9" },
                }}
              >
                Download Excel Template
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {/* Template Instructions Card */}
        <Card
          elevation={0}
          sx={{
            p: 2.5,
            mb: 3,
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 3,
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
          }}
        >
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2.5} alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: "#eff6ff",
                  color: "#2563eb",
                  borderRadius: 2.5,
                  border: "1px solid #bfdbfe",
                }}
              >
                <IconFileSpreadsheet size={28} />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={700} color="#1e293b">
                  Spreadsheet Column Format Required
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ensure your Excel (.xlsx) or CSV (.csv) file contains these 3 columns in the header row:
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
                  <Chip
                    label="Column A: EMPLOYEE NO"
                    size="small"
                    sx={{ bgcolor: "#eff6ff", color: "#1d4ed8", fontWeight: 700, border: "1px solid #bfdbfe" }}
                  />
                  <Chip
                    label="Column B: EMPLOYEE NAME"
                    size="small"
                    sx={{ bgcolor: "#f8fafc", color: "#475569", fontWeight: 700, border: "1px solid #cbd5e1" }}
                  />
                  <Chip
                    label="Column C: TOTAL DED"
                    size="small"
                    sx={{ bgcolor: "#ecfdf5", color: "#047857", fontWeight: 700, border: "1px solid #a7f3d0" }}
                  />
                </Stack>
              </Box>
            </Stack>

            <Button
              variant="outlined"
              color="primary"
              size="small"
              startIcon={<IconDownload size={16} />}
              onClick={handleDownloadTemplate}
              sx={{ fontWeight: 700, borderRadius: 2, textTransform: "none", minWidth: 170 }}
            >
              Get Sample File
            </Button>
          </Stack>
        </Card>

        {/* Upload Form Card */}
        <Card
          elevation={0}
          sx={{
            border: "1px solid #e2e8f0",
            borderRadius: 3,
            mb: 3,
            backgroundColor: "#ffffff",
            boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
          }}
        >
          <CardContent sx={{ p: 3.5 }}>
            <Typography variant="h6" fontWeight={700} color="#1e293b" sx={{ mb: 2.5 }}>
              Remittance Batch Parameters
            </Typography>

            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="ded-type-label">Deduction Type *</InputLabel>
                  <Select
                    labelId="ded-type-label"
                    value={deductionType}
                    label="Deduction Type *"
                    onChange={(e) => setDeductionType(e.target.value)}
                  >
                    <MenuItem value="all">All Monthly Deductions</MenuItem>
                    <MenuItem value="savings">Normal Savings Only</MenuItem>
                    <MenuItem value="loans">Loan Installments Only</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="month-select-label">Month *</InputLabel>
                  <Select
                    labelId="month-select-label"
                    value={month}
                    label="Month *"
                    onChange={(e) => setMonth(Number(e.target.value))}
                  >
                    {MONTHS.map((m) => (
                      <MenuItem key={m.value} value={m.value}>
                        {m.label} ({m.value})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="year-select-label">Year *</InputLabel>
                  <Select
                    labelId="year-select-label"
                    value={year}
                    label="Year *"
                    onChange={(e) => setYear(Number(e.target.value))}
                  >
                    {YEARS.map((y) => (
                      <MenuItem key={y} value={y}>
                        {y}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="paid-thro-label">Paid Thro *</InputLabel>
                  <Select
                    labelId="paid-thro-label"
                    value={paidThro}
                    label="Paid Thro *"
                    onChange={(e) => setPaidThro(e.target.value)}
                  >
                    {PAYMENT_MODES.map((p) => (
                      <MenuItem key={p.value} value={p.value}>
                        {p.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Date of Remittance *"
                  type="date"
                  value={datePaid}
                  onChange={(e) => setDatePaid(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            {/* Drag & Drop File Upload Box */}
            <Box
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              sx={{
                mt: 3.5,
                p: 5,
                border: "2px dashed #94a3b8",
                borderRadius: 3,
                backgroundColor: "#f8fafc",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  borderColor: "#2563eb",
                  backgroundColor: "#eff6ff",
                },
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
              />

              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: "#dbeafe",
                  color: "#2563eb",
                  mx: "auto",
                  mb: 1.5,
                }}
              >
                <IconUpload size={32} />
              </Avatar>

              <Typography variant="h6" fontWeight={700} color="#1e293b">
                Drag and drop your remittance file here, or click to browse
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Supported file types: Microsoft Excel (<strong>.xlsx, .xls</strong>) or Comma-Separated Values (<strong>.csv</strong>)
              </Typography>

              {selectedFile ? (
                <Box
                  sx={{
                    mt: 2.5,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 1.5,
                    px: 2.5,
                    py: 1.25,
                    backgroundColor: "#ecfdf5",
                    borderRadius: 2,
                    border: "1px solid #86efac",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <IconCheck size={20} color="#059669" />
                  <Typography variant="body2" fontWeight={700} color="#065f46">
                    Ready to Upload: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </Typography>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  >
                    <IconTrash size={16} />
                  </IconButton>
                </Box>
              ) : (
                <Button
                  variant="outlined"
                  size="small"
                  sx={{ mt: 2.5, textTransform: "none", fontWeight: 700, borderRadius: 2 }}
                >
                  Choose Excel or CSV File
                </Button>
              )}
            </Box>

            {/* Remarks Optional */}
            <Box sx={{ mt: 3 }}>
              <TextField
                fullWidth
                size="small"
                label="Batch Remarks / Reference Notes (Optional)"
                placeholder="e.g. TSC Check-off June 2026 Batch 01"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </Box>

            {uploading && (
              <Box sx={{ mt: 3 }}>
                <LinearProgress sx={{ borderRadius: 1, height: 6 }} />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: "center", fontWeight: 500 }}>
                  Parsing remittance rows, matching member accounts, and applying SACCO waterfall allocation...
                </Typography>
              </Box>
            )}

            {/* Action Buttons */}
            <Box sx={{ mt: 3.5, display: "flex", justifyContent: "flex-start", gap: 2 }}>
              <Button
                variant="contained"
                size="large"
                color="primary"
                disabled={!selectedFile || uploading}
                onClick={handleUpload}
                startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <IconUpload size={20} />}
                sx={{
                  px: 4,
                  py: 1.25,
                  fontWeight: 700,
                  borderRadius: 2,
                  backgroundColor: "#2563eb",
                  "&:hover": { backgroundColor: "#1d4ed8" },
                  textTransform: "none",
                }}
              >
                {uploading ? "Processing Remittance..." : "Upload Deductions Remittance"}
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Upload Results Summary Card */}
        {uploadResult && (
          <Paper
            elevation={0}
            sx={{
              border: "1px solid #e2e8f0",
              borderRadius: 3,
              p: 3.5,
              backgroundColor: "#ffffff",
              boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
                mb: 3,
                pb: 2,
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar sx={{ width: 48, height: 48, bgcolor: "#dcfce7", color: "#16a34a" }}>
                  <IconCircleCheck size={30} />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={800} color="#1e293b">
                    Remittance Batch Processed: {uploadResult.batch_no}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Allocated for Month {month}/{year} via {paidThro.toUpperCase()} on {datePaid}
                  </Typography>
                </Box>
              </Box>

              {/* Universal ExportButton for Remittance Results */}
              <ExportButton
                data={uploadResult.items || []}
                columns={resultExportColumns}
                filename={`remittance_batch_${uploadResult.batch_no}`}
                title={`Remittance Allocation Report - Batch ${uploadResult.batch_no}`}
                size="small"
              />
            </Box>

            {/* Stat Cards */}
            <Grid container spacing={2.5} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Paper variant="outlined" sx={{ p: 2.5, textAlign: "center", backgroundColor: "#f8fafc", borderRadius: 2.5 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>
                    TOTAL SPREADSHEET ROWS
                  </Typography>
                  <Typography variant="h4" fontWeight={800} color="#0f172a" sx={{ mt: 0.5 }}>
                    {uploadResult.total_rows}
                  </Typography>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Paper variant="outlined" sx={{ p: 2.5, textAlign: "center", backgroundColor: "#f0fdf4", borderRadius: 2.5, borderColor: "#bbf7d0" }}>
                  <Typography variant="caption" color="success.main" fontWeight={700}>
                    SUCCESSFULLY ALLOCATED
                  </Typography>
                  <Typography variant="h4" fontWeight={800} color="success.main" sx={{ mt: 0.5 }}>
                    {uploadResult.success_count}
                  </Typography>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Paper variant="outlined" sx={{ p: 2.5, textAlign: "center", backgroundColor: uploadResult.error_count > 0 ? "#fef2f2" : "#f8fafc", borderRadius: 2.5 }}>
                  <Typography variant="caption" color={uploadResult.error_count > 0 ? "error.main" : "text.secondary"} fontWeight={700}>
                    ERRORS / UNMATCHED
                  </Typography>
                  <Typography variant="h4" fontWeight={800} color={uploadResult.error_count > 0 ? "error.main" : "#64748b"} sx={{ mt: 0.5 }}>
                    {uploadResult.error_count}
                  </Typography>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Paper variant="outlined" sx={{ p: 2.5, textAlign: "center", backgroundColor: "#eff6ff", borderRadius: 2.5, borderColor: "#bfdbfe" }}>
                  <Typography variant="caption" color="primary.main" fontWeight={700}>
                    TOTAL REMITTED AMOUNT
                  </Typography>
                  <Typography variant="h4" fontWeight={800} color="primary.main" sx={{ mt: 0.5 }}>
                    KES {formatMoney(uploadResult.total_remitted)}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Waterfall allocation breakdown pills */}
            <Box sx={{ mb: 3, p: 2.5, backgroundColor: "#f8fafc", borderRadius: 2.5, border: "1px solid #e2e8f0" }}>
              <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.5, color: "#1e293b" }}>
                SACCO Waterfall Allocation Breakdown:
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Box sx={{ p: 1.5, bgcolor: "#ffffff", borderRadius: 2, border: "1px solid #e2e8f0" }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      Loan Repayments Settled
                    </Typography>
                    <Typography variant="h6" fontWeight={800} color="#0f172a">
                      KES {formatMoney(uploadResult.total_loans_allocated)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Box sx={{ p: 1.5, bgcolor: "#ffffff", borderRadius: 2, border: "1px solid #e2e8f0" }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      Savings Deposits Credited
                    </Typography>
                    <Typography variant="h6" fontWeight={800} color="#0284c7">
                      KES {formatMoney(uploadResult.total_savings_allocated)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Box sx={{ p: 1.5, bgcolor: "#ffffff", borderRadius: 2, border: "1px solid #e2e8f0" }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      Share Capital Added
                    </Typography>
                    <Typography variant="h6" fontWeight={800} color="#059669">
                      KES {formatMoney(uploadResult.total_shares_allocated)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>

            {/* Errors List if any */}
            {uploadResult.errors && uploadResult.errors.length > 0 && (
              <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
                  Errors / Unmatched Rows ({uploadResult.errors.length}):
                </Typography>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {uploadResult.errors.slice(0, 10).map((err, idx) => (
                    <li key={idx}>
                      <Typography variant="body2">{err}</Typography>
                    </li>
                  ))}
                  {uploadResult.errors.length > 10 && (
                    <li>
                      <Typography variant="body2">
                        ...and {uploadResult.errors.length - 10} additional error items.
                      </Typography>
                    </li>
                  )}
                </ul>
              </Alert>
            )}

            {/* Allocated items data table */}
            {uploadResult.items && uploadResult.items.length > 0 && (
              <TableContainer sx={{ maxHeight: 400, borderRadius: 2, border: "1px solid #e2e8f0" }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow sx={{ "& th": { backgroundColor: "#f8fafc", fontWeight: 700, py: 1.5 } }}>
                      <TableCell>Member No</TableCell>
                      <TableCell>Member Full Name</TableCell>
                      <TableCell align="right">Remitted (TOTAL DED)</TableCell>
                      <TableCell align="right">To Loans</TableCell>
                      <TableCell align="right">To Savings</TableCell>
                      <TableCell align="right">To Shares</TableCell>
                      <TableCell align="right">New Balance</TableCell>
                      <TableCell align="center">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {uploadResult.items.map((item, idx) => (
                      <TableRow key={idx} hover sx={{ "&:nth-of-type(even)": { bgcolor: "#fafbfc" } }}>
                        <TableCell sx={{ fontFamily: "monospace", fontWeight: 700 }}>
                          {item.membership_number}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{item.member_name}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800 }}>
                          KES {formatMoney(item.remitted_amount)}
                        </TableCell>
                        <TableCell align="right">{formatMoney(item.loan_allocated)}</TableCell>
                        <TableCell align="right" sx={{ color: "#0284c7", fontWeight: 600 }}>
                          {formatMoney(item.savings_allocated)}
                        </TableCell>
                        <TableCell align="right">{formatMoney(item.shares_allocated)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          {formatMoney(item.new_balance)}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={item.status.toUpperCase()}
                            size="small"
                            sx={{
                              fontWeight: 700,
                              bgcolor: item.status === "paid" ? "#ecfdf5" : "#eff6ff",
                              color: item.status === "paid" ? "#059669" : "#2563eb",
                              border: `1px solid ${item.status === "paid" ? "#a7f3d0" : "#bfdbfe"}`,
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
              <Button
                component={Link}
                href="/deductions"
                variant="contained"
                color="primary"
                sx={{ fontWeight: 700, borderRadius: 2, textTransform: "none", px: 3 }}
              >
                View Updated Deductions Schedule
              </Button>
            </Box>
          </Paper>
        )}
      </Box>

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
