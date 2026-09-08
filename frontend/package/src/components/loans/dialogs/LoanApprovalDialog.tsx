"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Box,
  Typography,
  InputAdornment,
  Grid,
  Alert,
  IconButton,
  CircularProgress,
} from "@mui/material";
import {
  IconCheck,
  IconX,
  IconCoins,
  IconCalendar,
  IconShieldCheck,
} from "@tabler/icons-react";
import { Loan } from "@/interfaces/loan";

interface LoanApprovalDialogProps {
  open: boolean;
  loan: Loan | null;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (data: {
    approved_amount: number;
    approval_date: string;
    notes: string;
  }) => Promise<void> | void;
}

export default function LoanApprovalDialog({
  open,
  loan,
  loading = false,
  onClose,
  onConfirm,
}: LoanApprovalDialogProps) {
  const [approvedAmount, setApprovedAmount] = useState<string>("");
  const [approvalDate, setApprovalDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loan && open) {
      const initialAmount = loan.approved_amount ?? loan.principal_amount ?? 0;
      setApprovedAmount(String(initialAmount));
      setApprovalDate(
        loan.approval_date || new Date().toISOString().split("T")[0]
      );
      setNotes(loan.approval_notes || "");
      setError(null);
    }
  }, [loan, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loan) return;

    const amountNum = parseFloat(approvedAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Please enter a valid approved amount greater than zero.");
      return;
    }

    if (!approvalDate) {
      setError("Please select the approval date.");
      return;
    }

    setError(null);
    try {
      await onConfirm({
        approved_amount: amountNum,
        approval_date: approvalDate,
        notes: notes.trim(),
      });
    } catch (err: any) {
      setError(err?.message || "Failed to submit loan approval.");
    }
  };

  if (!loan) return null;

  const appliedPrincipal = Number(loan.principal_amount || 0);
  const currentApproved = parseFloat(approvedAmount) || 0;
  const isReduced = currentApproved < appliedPrincipal && currentApproved > 0;

  return (
    <Dialog
      open={open}
      onClose={() => !loading && onClose()}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3.5,
          p: 1,
          boxShadow: "0 25px 50px -12px rgba(6, 78, 59, 0.25)",
        },
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2.5,
                  bgcolor: "#dcfce7",
                  color: "#059669",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(5, 150, 105, 0.2)",
                }}
              >
                <IconShieldCheck size={24} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={900} sx={{ color: "#064e3b" }}>
                  Credit Committee Loan Approval
                </Typography>
                <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
                  Authorize facility terms &amp; establish official sanction limit
                </Typography>
              </Box>
            </Stack>
            <IconButton
              size="small"
              onClick={onClose}
              disabled={loading}
              sx={{ color: "#94a3b8", "&:hover": { color: "#475569" } }}
            >
              <IconX size={20} />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent dividers sx={{ py: 2.5 }}>
          <Stack spacing={2.5}>
            {error && (
              <Alert severity="error" sx={{ borderRadius: 2, fontWeight: 600 }}>
                {error}
              </Alert>
            )}

            {/* Read-only Context Summary Card */}
            <Box
              sx={{
                p: 2,
                borderRadius: 2.5,
                bgcolor: "#f8fafc",
                border: "1px solid #e2e8f0",
              }}
            >
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                    Loan Reference
                  </Typography>
                  <Typography variant="body2" fontWeight={800} sx={{ color: "#0f172a", fontFamily: "monospace" }}>
                    {loan.loan_number}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                    Borrower Member
                  </Typography>
                  <Typography variant="body2" fontWeight={800} sx={{ color: "#0f172a" }}>
                    {loan.member_name || `Member #${loan.member_id}`}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                    Product Tier
                  </Typography>
                  <Typography variant="body2" fontWeight={700} sx={{ color: "#334155" }}>
                    {loan.product_name || `Product #${loan.loan_product_id}`}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                    Applied Principal
                  </Typography>
                  <Typography variant="body2" fontWeight={900} sx={{ color: "#047857", fontFamily: "monospace" }}>
                    KES {appliedPrincipal.toLocaleString("en-KE", { minimumFractionDigits: 2 })}
                  </Typography>
                </Grid>
              </Grid>
            </Box>

            {/* Approved Amount Input */}
            <Box>
              <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#1e293b", mb: 0.8 }}>
                Approved Amount (KES) <span style={{ color: "#e11d48" }}>*</span>
              </Typography>
              <TextField
                fullWidth
                required
                type="number"
                placeholder="e.g. 100000"
                value={approvedAmount}
                onChange={(e) => setApprovedAmount(e.target.value)}
                disabled={loading}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <IconCoins size={18} style={{ color: "#059669" }} />
                          <Typography variant="caption" fontWeight={800} sx={{ color: "#059669" }}>
                            KES
                          </Typography>
                        </Box>
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: 2,
                      fontWeight: 800,
                      fontFamily: "monospace",
                      bgcolor: "#ffffff",
                    },
                  },
                }}
                helperText={
                  isReduced ? (
                    <span style={{ color: "#d97706", fontWeight: 700 }}>
                      ⚠️ Partial approval: KES {(appliedPrincipal - currentApproved).toLocaleString()} below requested amount.
                    </span>
                  ) : (
                    "Confirm the sanctioned credit ceiling approved by committee."
                  )
                }
              />
            </Box>

            {/* Approval Date Input */}
            <Box>
              <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#1e293b", mb: 0.8 }}>
                Approval Date <span style={{ color: "#e11d48" }}>*</span>
              </Typography>
              <TextField
                fullWidth
                required
                type="date"
                value={approvalDate}
                onChange={(e) => setApprovalDate(e.target.value)}
                disabled={loading}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconCalendar size={18} style={{ color: "#64748b" }} />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: 2, fontWeight: 700 },
                  },
                }}
              />
            </Box>

            {/* Approval Notes */}
            <Box>
              <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#1e293b", mb: 0.8 }}>
                Credit Committee Resolution Notes (Optional)
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="e.g. Approved per Credit Committee Resolution Minute #42, subject to 30% guarantor coverage..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={loading}
                slotProps={{
                  input: {
                    sx: { borderRadius: 2 },
                  },
                }}
              />
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, justifyContent: "space-between" }}>
          <Button
            onClick={onClose}
            disabled={loading}
            sx={{ fontWeight: 700, color: "#64748b" }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !approvedAmount || !approvalDate}
            startIcon={
              loading ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <IconCheck size={18} />
              )
            }
            sx={{
              background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
              color: "#ffffff",
              fontWeight: 800,
              borderRadius: 2.5,
              px: 3,
              py: 1,
              boxShadow: "0 4px 14px rgba(5, 150, 105, 0.35)",
              "&:hover": {
                background: "linear-gradient(135deg, #047857 0%, #065f46 100%)",
              },
            }}
          >
            {loading ? "Approving Facility..." : "Confirm & Approve Facility"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
