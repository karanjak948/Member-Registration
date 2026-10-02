"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
  IconButton,
  Tooltip,
} from "@mui/material";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import ExportButton from "@/components/common/ExportButton";
import { ExportColumn } from "@/utils/exportGrid";
import savingsService from "@/services/savings.service";
import memberService from "@/services/member.service";
import {
  IconPlus,
  IconFilter,
  IconRefresh,
  IconArrowLeft,
  IconCheck,
  IconTrash,
  IconEdit,
  IconAlertCircle,
  IconBuildingBank,
  IconPigMoney,
  IconCash,
} from "@tabler/icons-react";

interface SavingsWithdrawalItem {
  id: number;
  member: number;
  member_name: string;
  payroll_no: string;
  membership_number: string;
  withdrawal_type: string;
  withdrawal_type_display: string;
  amount: string | number;
  date_withdrawn: string;
  savings_drawn_from: string;
  savings_drawn_from_display: string;
  bank: string;
  bank_display: string;
  document_code: string;
  reason: string;
  is_active: boolean;
  created_at: string;
}

const WITHDRAWAL_TYPES = [
  { value: "all", label: "[all types]" },
  { value: "exit_sacco", label: "Exit Sacco" },
  { value: "loan_repayment", label: "Loan Repayment" },
  { value: "saving_refund", label: "Saving Refund" },
  { value: "excess_savings", label: "Excess Savings" },
  { value: "partial_withdrawal", label: "Partial Withdrawal" },
  { value: "other", label: "Other" },
];

const SAVINGS_SOURCES = [
  { value: "normal", label: "Normal Savings" },
  { value: "welfare", label: "Welfare" },
];

const BANKS = [
  { value: "mpesa", label: "M-Pesa" },
  { value: "bank", label: "Bank Transfer" },
  { value: "cash", label: "Cash" },
  { value: "cheque", label: "Cheque" },
];

export default function SavingsWithdrawalPage() {
  const [withdrawals, setWithdrawals] = useState<SavingsWithdrawalItem[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters (matching Jimanage Screenshot 3)
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State (matching Jimanage Screenshot 4)
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formData, setFormData] = useState({
    member: "",
    withdrawal_type: "partial_withdrawal",
    amount: "",
    date_withdrawn: new Date().toISOString().split("T")[0],
    savings_drawn_from: "normal",
    bank: "mpesa",
    document_code: "",
    reason: "",
  });

  // Snackbar Notification
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" | "info" }>({
    open: false,
    message: "",
    severity: "info",
  });

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const data = await savingsService.getWithdrawals({
        start_date: dateFrom || undefined,
        end_date: dateTo || undefined,
        withdrawal_type: selectedType !== "all" ? selectedType : undefined,
      });
      setWithdrawals(data);
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "Failed to load savings withdrawals.", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await memberService.getAll();
      setMembers(Array.isArray(res) ? res : (res as any)?.results || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
    fetchMembers();
  }, []);

  const handleFilter = () => {
    fetchWithdrawals();
  };

  const handleClear = () => {
    setDateFrom("");
    setDateTo("");
    setSelectedType("all");
    setSearchQuery("");
    setTimeout(() => {
      fetchWithdrawals();
    }, 50);
  };

  const handleOpenModal = () => {
    setFormError("");
    setFormData({
      member: "",
      withdrawal_type: "partial_withdrawal",
      amount: "",
      date_withdrawn: new Date().toISOString().split("T")[0],
      savings_drawn_from: "normal",
      bank: "mpesa",
      document_code: "",
      reason: "",
    });
    setModalOpen(true);
  };

  const handleSaveWithdrawal = async () => {
    setFormError("");
    if (!formData.member) {
      setFormError("Please select a Member.");
      return;
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      setFormError("Please enter a valid amount greater than zero.");
      return;
    }
    if (!formData.date_withdrawn) {
      setFormError("Please select the date withdrawn.");
      return;
    }

    setSubmitting(true);
    try {
      await savingsService.createWithdrawal({
        member: Number(formData.member),
        withdrawal_type: formData.withdrawal_type,
        amount: formData.amount,
        date_withdrawn: formData.date_withdrawn,
        savings_drawn_from: formData.savings_drawn_from,
        bank: formData.bank,
        document_code: formData.document_code,
        reason: formData.reason,
      });

      setSnackbar({ open: true, message: "Savings withdrawal recorded successfully!", severity: "success" });
      setModalOpen(false);
      fetchWithdrawals();
    } catch (err: any) {
      console.error(err);
      let errMsg = "Failed to process withdrawal.";
      const data = err?.response?.data;
      if (typeof data === "string") {
        errMsg = data;
      } else if (data && typeof data === "object") {
        const msgs: string[] = [];
        for (const [k, v] of Object.entries(data)) {
          const prefix = k === "detail" || k === "error" || k === "non_field_errors" ? "" : `${k.replace(/_/g, " ")}: `;
          if (Array.isArray(v)) {
            msgs.push(`${prefix}${v.join(", ")}`);
          } else if (typeof v === "string") {
            msgs.push(`${prefix}${v}`);
          }
        }
        if (msgs.length > 0) errMsg = msgs.join(" | ");
      } else if (err?.message) {
        errMsg = err.message;
      }
      setFormError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (id: number) => {
    if (!window.confirm("Are you sure you want to cancel / reverse this savings withdrawal?")) return;
    try {
      await savingsService.deleteWithdrawal(id);
      setSnackbar({ open: true, message: "Withdrawal cancelled and reversed successfully.", severity: "success" });
      fetchWithdrawals();
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "Failed to reverse withdrawal.", severity: "error" });
    }
  };

  // Filtered rows for client search
  const filteredWithdrawals = useMemo(() => {
    if (!searchQuery.trim()) return withdrawals;
    const q = searchQuery.toLowerCase();
    return withdrawals.filter(
      (w) =>
        w.member_name.toLowerCase().includes(q) ||
        (w.payroll_no && w.payroll_no.toLowerCase().includes(q)) ||
        (w.membership_number && w.membership_number.toLowerCase().includes(q)) ||
        (w.document_code && w.document_code.toLowerCase().includes(q)) ||
        (w.reason && w.reason.toLowerCase().includes(q))
    );
  }, [withdrawals, searchQuery]);

  // Export Columns matching Screenshot 3
  const exportColumns: ExportColumn[] = [
    { header: "#", key: "id" },
    { header: "Member", key: "member_name" },
    { header: "Payroll No", key: "payroll_no" },
    { header: "Withdrawal Type", key: "withdrawal_type_display" },
    { header: "Amount (KES)", key: "amount" },
    { header: "Date Withdrawn", key: "date_withdrawn" },
    { header: "Reason", key: "reason" },
    { header: "Created On", key: "created_at" },
    { header: "Is Active", key: "is_active" },
  ];

  const exportData = useMemo(() => {
    return filteredWithdrawals.map((w, index) => ({
      id: index + 1,
      member_name: w.member_name,
      payroll_no: w.payroll_no || w.membership_number || "—",
      withdrawal_type_display: w.withdrawal_type_display || w.withdrawal_type,
      amount: Number(w.amount).toLocaleString(undefined, { minimumFractionDigits: 2 }),
      date_withdrawn: w.date_withdrawn,
      reason: w.reason || "—",
      created_at: (w.created_at || "").split("T")[0],
      is_active: w.is_active ? "Yes" : "No",
    }));
  }, [filteredWithdrawals]);

  return (
    <PageContainer title="Savings Withdrawal" description="Manage and audit member savings withdrawals">
      <Box sx={{ width: "100%", pb: 5 }}>
        {/* Header Banner matching Jimanage & Royal SACCO executive style */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            background: "linear-gradient(135deg, #022c22 0%, #064e3b 50%, #0f172a 100%)",
            color: "#ffffff",
            borderRadius: 3,
            boxShadow: "0 10px 25px -5px rgba(2, 44, 34, 0.4)",
          }}
        >
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2}>
            <Box>
              <Stack direction="row" spacing={1.5} alignItems="center" mb={0.5}>
                <Button
                  component={Link}
                  href="/savings"
                  variant="outlined"
                  size="small"
                  startIcon={<IconArrowLeft size={16} />}
                  sx={{
                    color: "#ffffff",
                    borderColor: "rgba(255,255,255,0.4)",
                    bgcolor: "rgba(255,255,255,0.08)",
                    fontWeight: 700,
                    borderRadius: 2,
                    textTransform: "none",
                    "&:hover": { borderColor: "#ffffff", bgcolor: "rgba(255,255,255,0.18)" },
                  }}
                >
                  Back to Savings
                </Button>
              </Stack>
              <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: "-0.5px", color: "#ffffff", mt: 1 }}>
                JIMANAGE :: SAVINGS WITHDRAWAL
              </Typography>
              <Typography variant="body2" sx={{ color: "#d1fae5", mt: 0.5, fontWeight: 500 }}>
                Audit member savings withdrawals, exit settlements, refunds, and loan offsets
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={<IconPlus size={18} />}
              onClick={handleOpenModal}
              sx={{
                bgcolor: "#0891b2",
                color: "#ffffff",
                fontWeight: 700,
                borderRadius: 2,
                px: 2.5,
                py: 1,
                textTransform: "none",
                "&:hover": { bgcolor: "#0e7490" },
              }}
            >
              + Withdraw
            </Button>
          </Stack>
        </Paper>

        {/* Filters Card matching Screenshot 3 */}
        <Card elevation={0} sx={{ p: 2.5, mb: 3, bgcolor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Date withdrawn from"
                InputLabelProps={{ shrink: true }}
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Date withdrawn to"
                InputLabelProps={{ shrink: true }}
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Withdrawal type</InputLabel>
                <Select
                  label="Withdrawal type"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                >
                  {WITHDRAWAL_TYPES.map((t) => (
                    <MenuItem key={t.value} value={t.value}>
                      {t.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <Stack direction="row" spacing={1.5}>
                <Button
                  variant="contained"
                  startIcon={<IconFilter size={16} />}
                  onClick={handleFilter}
                  sx={{
                    bgcolor: "#0284c7",
                    color: "#ffffff",
                    fontWeight: 700,
                    borderRadius: 2,
                    textTransform: "none",
                    flex: 1,
                    "&:hover": { bgcolor: "#0369a1" },
                  }}
                >
                  Filter
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleClear}
                  sx={{
                    color: "#64748b",
                    borderColor: "#cbd5e1",
                    fontWeight: 600,
                    borderRadius: 2,
                    textTransform: "none",
                    "&:hover": { bgcolor: "#f8fafc" },
                  }}
                >
                  Clear
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Card>

        {/* Table & Export Toolbar matching Screenshot 3 */}
        <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, overflow: "hidden" }}>
          <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2, bgcolor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
            {/* Universal Export Buttons */}
            <ExportButton
              data={exportData}
              columns={exportColumns}
              filename="savings_withdrawals"
              title="Savings Withdrawals Register"
              size="small"
            />

            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <TextField
                size="small"
                placeholder="Search member, payroll no, doc code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ width: 280, bgcolor: "#ffffff" }}
              />
              <IconButton onClick={fetchWithdrawals} color="primary" sx={{ border: "1px solid #cbd5e1", bgcolor: "#ffffff" }}>
                <IconRefresh size={18} />
              </IconButton>
            </Box>
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: "#f1f5f9" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, color: "#475569" }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: "#475569" }}>Member</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: "#475569" }}>Payroll No</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: "#475569" }}>Withdrawal Type</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: "#475569", textAlign: "right" }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: "#475569" }}>Date withdrawn</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: "#475569" }}>Reason</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: "#475569" }}>Createdon</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: "#475569" }}>Is active</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: "#475569", textAlign: "center" }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} sx={{ textAlign: "center", py: 5 }}>
                      <CircularProgress size={32} />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Loading savings withdrawals...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : filteredWithdrawals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} sx={{ textAlign: "center", py: 5 }}>
                      <Typography variant="body2" color="text.secondary">
                        No savings withdrawal records found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredWithdrawals.map((item, idx) => (
                    <TableRow key={item.id} hover sx={{ opacity: item.is_active ? 1 : 0.6 }}>
                      <TableCell sx={{ fontWeight: 600 }}>{idx + 1}</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#1e293b" }}>{item.member_name}</TableCell>
                      <TableCell sx={{ color: "#64748b" }}>{item.payroll_no || item.membership_number || "—"}</TableCell>
                      <TableCell>
                        <Chip
                          label={item.withdrawal_type_display || item.withdrawal_type}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            bgcolor:
                              item.withdrawal_type === "exit_sacco"
                                ? "#fee2e2"
                                : item.withdrawal_type === "loan_repayment"
                                ? "#e0f2fe"
                                : "#fef3c7",
                            color:
                              item.withdrawal_type === "exit_sacco"
                                ? "#b91c1c"
                                : item.withdrawal_type === "loan_repayment"
                                ? "#0369a1"
                                : "#b45309",
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ textAlign: "right", fontWeight: 800, color: "#0f172a" }}>
                        KES {Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>{item.date_withdrawn}</TableCell>
                      <TableCell sx={{ color: "#64748b", maxWidth: 200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {item.reason || "—"}
                      </TableCell>
                      <TableCell>{(item.created_at || "").split("T")[0]}</TableCell>
                      <TableCell>
                        <Chip
                          label={item.is_active ? "Yes" : "No"}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            bgcolor: item.is_active ? "#dcfce7" : "#f1f5f9",
                            color: item.is_active ? "#15803d" : "#64748b",
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ textAlign: "center" }}>
                        {item.is_active && (
                          <Tooltip title="Cancel / Reverse Withdrawal">
                            <IconButton size="small" color="error" onClick={() => handleDeactivate(item.id)}>
                              <IconTrash size={16} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        {/* Modal: JIMANAGE :: NEW SAVINGS WITHDRAWAL (matching Screenshot 4) */}
        <Dialog open={modalOpen} onClose={() => !submitting && setModalOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle
            sx={{
              fontWeight: 800,
              bgcolor: "#f8fafc",
              borderBottom: "1px solid #e2e8f0",
              color: "#1e293b",
            }}
          >
            JIMANAGE :: NEW SAVINGS WITHDRAWAL
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            {formError && (
              <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
                {formError}
              </Alert>
            )}

            <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
              {/* Member Name* */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small" required>
                  <InputLabel>Member Name*</InputLabel>
                  <Select
                    label="Member Name*"
                    value={formData.member}
                    onChange={(e) => setFormData({ ...formData, member: e.target.value })}
                  >
                    <MenuItem value="">[select one]</MenuItem>
                    {members.map((m) => (
                      <MenuItem key={m.id} value={m.id}>
                        {m.full_name || `${m.first_name} ${m.other_names}`} ({m.membership_number})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Withdraw Type* */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small" required>
                  <InputLabel>Withdraw Type*</InputLabel>
                  <Select
                    label="Withdraw Type*"
                    value={formData.withdrawal_type}
                    onChange={(e) => setFormData({ ...formData, withdrawal_type: e.target.value })}
                  >
                    {WITHDRAWAL_TYPES.filter((t) => t.value !== "all").map((t) => (
                      <MenuItem key={t.value} value={t.value}>
                        {t.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Amount Withdrawn* */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  required
                  type="number"
                  label="Amount Withdrawn*"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </Grid>

              {/* Date Withdrawn* */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  required
                  type="date"
                  label="Date Withdrawn*"
                  InputLabelProps={{ shrink: true }}
                  value={formData.date_withdrawn}
                  onChange={(e) => setFormData({ ...formData, date_withdrawn: e.target.value })}
                />
              </Grid>

              {/* Savings Drawn From* */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small" required>
                  <InputLabel>Savings Drawn From*</InputLabel>
                  <Select
                    label="Savings Drawn From*"
                    value={formData.savings_drawn_from}
                    onChange={(e) => setFormData({ ...formData, savings_drawn_from: e.target.value })}
                  >
                    {SAVINGS_SOURCES.map((s) => (
                      <MenuItem key={s.value} value={s.value}>
                        {s.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Bank* */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small" required>
                  <InputLabel>Bank*</InputLabel>
                  <Select
                    label="Bank*"
                    value={formData.bank}
                    onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                  >
                    {BANKS.map((b) => (
                      <MenuItem key={b.value} value={b.value}>
                        {b.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Document/Transaction Code */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Document/Transaction Code"
                  placeholder="e.g. MPESA-QWE876 / CHQ-1092"
                  value={formData.document_code}
                  onChange={(e) => setFormData({ ...formData, document_code: e.target.value })}
                />
              </Grid>

              {/* Reason */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  rows={2}
                  label="Reason"
                  placeholder="Reason for withdrawal"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, bgcolor: "#f8fafc", borderTop: "1px solid #e2e8f0", justifyContent: "space-between" }}>
            <Button
              variant="contained"
              onClick={() => setModalOpen(false)}
              disabled={submitting}
              sx={{
                bgcolor: "#dc2626",
                color: "#ffffff",
                fontWeight: 700,
                textTransform: "none",
                borderRadius: 2,
                px: 3,
                "&:hover": { bgcolor: "#b91c1c" },
              }}
            >
              cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveWithdrawal}
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <IconCheck size={18} />}
              sx={{
                bgcolor: "#16a34a",
                color: "#ffffff",
                fontWeight: 700,
                textTransform: "none",
                borderRadius: 2,
                px: 3.5,
                "&:hover": { bgcolor: "#15803d" },
              }}
            >
              {submitting ? "Saving..." : "Save"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Global Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={5000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </PageContainer>
  );
}
