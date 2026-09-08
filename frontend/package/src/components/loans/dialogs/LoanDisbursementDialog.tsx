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
  MenuItem,
  CircularProgress,
  Divider,
} from "@mui/material";
import {
  IconCash,
  IconX,
  IconBuildingBank,
  IconDeviceMobile,
  IconCalendar,
  IconFileText,
  IconCheck,
  IconCoins,
  IconReceipt,
} from "@tabler/icons-react";
import { Loan } from "@/interfaces/loan";

const KENYAN_BANKS = [
  "Equity Bank Kenya",
  "KCB Bank Kenya",
  "Co-operative Bank of Kenya",
  "NCBA Bank Kenya",
  "Absa Bank Kenya",
  "Stanbic Bank Kenya",
  "Diamond Trust Bank (DTB)",
  "Family Bank",
  "Standard Chartered Kenya",
  "I&M Bank",
  "Prime Bank",
  "Postbank",
  "Other Commercial Bank",
];

interface LoanDisbursementDialogProps {
  open: boolean;
  loan: Loan | null;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (data: {
    disbursed_amount: number;
    disbursement_date: string;
    disbursement_method: string;
    disbursement_bank: string;
    disbursement_reference: string;
    disbursement_notes: string;
  }) => Promise<void> | void;
}

export default function LoanDisbursementDialog({
  open,
  loan,
  loading = false,
  onClose,
  onConfirm,
}: LoanDisbursementDialogProps) {
  const [disbursedAmount, setDisbursedAmount] = useState<string>("");
  const [disbursementDate, setDisbursementDate] = useState<string>("");
  const [disbursementMethod, setDisbursementMethod] = useState<string>("BANK");
  const [disbursementBank, setDisbursementBank] = useState<string>("Equity Bank Kenya");
  const [bankAccount, setBankAccount] = useState<string>("");
  const [mpesaPhone, setMpesaPhone] = useState<string>("");
  const [documentNo, setDocumentNo] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loan && open) {
      const defaultAmount =
        loan.approved_amount ?? loan.principal_amount ?? 0;
      setDisbursedAmount(String(defaultAmount));
      setDisbursementDate(
        loan.disbursement_date || new Date().toISOString().split("T")[0]
      );
      setDisbursementMethod(loan.disbursement_method || "BANK");
      setDisbursementBank(loan.disbursement_bank || "Equity Bank Kenya");
      setDocumentNo(loan.disbursement_reference || "");
      setNotes(loan.disbursement_notes || "");
      setMpesaPhone(loan.member_phone || "");
      setError(null);
    }
  }, [loan, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loan) return;

    const amountNum = parseFloat(disbursedAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Please enter a valid disbursement amount greater than zero.");
      return;
    }

    if (!disbursementDate) {
      setError("Please select the disbursement date.");
      return;
    }

    if (!documentNo.trim()) {
      setError("Please enter the document / payment reference number.");
      return;
    }

    setError(null);
    try {
      const bankDetails =
        disbursementMethod === "BANK"
          ? bankAccount.trim()
            ? `${disbursementBank} - Acc: ${bankAccount.trim()}`
            : disbursementBank
          : disbursementMethod === "MPESA"
          ? `M-Pesa (${mpesaPhone.trim() || "Borrower Phone"})`
          : "";

      await onConfirm({
        disbursed_amount: amountNum,
        disbursement_date: disbursementDate,
        disbursement_method: disbursementMethod,
        disbursement_bank: bankDetails,
        disbursement_reference: documentNo.trim(),
        disbursement_notes: notes.trim(),
      });
    } catch (err: any) {
      setError(err?.message || "Failed to process loan disbursement.");
    }
  };

  if (!loan) return null;

  const appliedAmount = Number(loan.principal_amount || 0);
  const approvedAmount = Number(loan.approved_amount ?? loan.principal_amount ?? 0);

  return (
    <Dialog
      open={open}
      onClose={() => !loading && onClose()}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3.5,
          p: 1,
          boxShadow: "0 25px 50px -12px rgba(15, 118, 110, 0.25)",
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
                  bgcolor: "#ccfbf1",
                  color: "#0d9488",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(13, 148, 136, 0.2)",
                }}
              >
                <IconCash size={24} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={900} sx={{ color: "#0f766e" }}>
                  Disburse &amp; Activate Loan Facility
                </Typography>
                <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
                  Release credit funds, generate repayment schedule &amp; post general ledger journal
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

            {/* 3-Card Financial Metric Summary: Applied, Approved, Disbursed */}
            <Grid container spacing={2}>
              {/* Applied Amount */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    bgcolor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                    Applied Amount
                  </Typography>
                  <Typography variant="h6" fontWeight={900} sx={{ color: "#334155", mt: 0.5, fontFamily: "monospace" }}>
                    KES {appliedAmount.toLocaleString("en-KE", { minimumFractionDigits: 2 })}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 600 }}>
                    Requested by Borrower
                  </Typography>
                </Box>
              </Grid>

              {/* Approved Amount */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    bgcolor: "#eff6ff",
                    border: "1px solid #bfdbfe",
                  }}
                >
                  <Typography variant="caption" sx={{ color: "#1e40af", fontWeight: 700, textTransform: "uppercase" }}>
                    Approved Amount
                  </Typography>
                  <Typography variant="h6" fontWeight={900} sx={{ color: "#1d4ed8", mt: 0.5, fontFamily: "monospace" }}>
                    KES {approvedAmount.toLocaleString("en-KE", { minimumFractionDigits: 2 })}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#3b82f6", fontWeight: 600 }}>
                    Credit Committee Limit
                  </Typography>
                </Box>
              </Grid>

              {/* Disbursed Amount Target */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    bgcolor: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                  }}
                >
                  <Typography variant="caption" sx={{ color: "#166534", fontWeight: 700, textTransform: "uppercase" }}>
                    Payout to Member
                  </Typography>
                  <Typography variant="h6" fontWeight={900} sx={{ color: "#15803d", mt: 0.5, fontFamily: "monospace" }}>
                    KES {(parseFloat(disbursedAmount) || approvedAmount).toLocaleString("en-KE", { minimumFractionDigits: 2 })}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#22c55e", fontWeight: 600 }}>
                    Active Capital Outlay
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {/* Borrower & Facility Header */}
            <Box
              sx={{
                p: 1.8,
                borderRadius: 2,
                bgcolor: "#f1f5f9",
                border: "1px solid #e2e8f0",
              }}
            >
              <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
                <Typography variant="body2" sx={{ color: "#334155", fontWeight: 700 }}>
                  Borrower:{" "}
                  <strong style={{ color: "#0f172a" }}>
                    {loan.member_name || `Member #${loan.member_id}`}
                  </strong>{" "}
                  {loan.membership_number && (
                    <span style={{ color: "#64748b", fontFamily: "monospace" }}>
                      ({loan.membership_number})
                    </span>
                  )}
                </Typography>
                <Typography variant="body2" sx={{ color: "#334155", fontWeight: 700 }}>
                  Facility:{" "}
                  <strong style={{ color: "#0d9488", fontFamily: "monospace" }}>
                    {loan.loan_number}
                  </strong>{" "}
                  • {loan.num_periods || 0} {loan.repayment_frequency || "installments"}
                </Typography>
              </Stack>
            </Box>

            <Divider sx={{ my: 0.5 }} />

            {/* Disbursement Details Form */}
            <Typography variant="subtitle2" fontWeight={900} sx={{ color: "#0f172a", textTransform: "uppercase", fontSize: "0.82rem", letterSpacing: 0.5 }}>
              Payment &amp; Settlement Particulars
            </Typography>

            <Grid container spacing={2}>
              {/* Disbursed Amount Field */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#1e293b", mb: 0.8 }}>
                  Disbursed Principal (KES) <span style={{ color: "#e11d48" }}>*</span>
                </Typography>
                <TextField
                  fullWidth
                  required
                  type="number"
                  placeholder="e.g. 100000"
                  value={disbursedAmount}
                  onChange={(e) => setDisbursedAmount(e.target.value)}
                  disabled={loading}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <IconCoins size={18} style={{ color: "#0d9488" }} />
                          <Typography variant="caption" fontWeight={800} sx={{ color: "#0d9488", ml: 0.5 }}>
                            KES
                          </Typography>
                        </InputAdornment>
                      ),
                      sx: { borderRadius: 2, fontWeight: 800, fontFamily: "monospace" },
                    },
                  }}
                  helperText="Amortization schedule will compute automatically on this base."
                />
              </Grid>

              {/* Disbursement Date Field */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#1e293b", mb: 0.8 }}>
                  Disbursement Date <span style={{ color: "#e11d48" }}>*</span>
                </Typography>
                <TextField
                  fullWidth
                  required
                  type="date"
                  value={disbursementDate}
                  onChange={(e) => setDisbursementDate(e.target.value)}
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
                  helperText="First installment due date will count from this anchor date."
                />
              </Grid>

              {/* Disbursement Channel / Method */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#1e293b", mb: 0.8 }}>
                  Disbursement Channel <span style={{ color: "#e11d48" }}>*</span>
                </Typography>
                <TextField
                  select
                  fullWidth
                  value={disbursementMethod}
                  onChange={(e) => setDisbursementMethod(e.target.value)}
                  disabled={loading}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          {disbursementMethod === "BANK" ? (
                            <IconBuildingBank size={18} style={{ color: "#0d9488" }} />
                          ) : (
                            <IconDeviceMobile size={18} style={{ color: "#059669" }} />
                          )}
                        </InputAdornment>
                      ),
                      sx: { borderRadius: 2, fontWeight: 700 },
                    },
                  }}
                >
                  <MenuItem value="BANK">Bank Transfer (EFT / RTGS / Cheque Deposit)</MenuItem>
                  <MenuItem value="MPESA">M-Pesa / Mobile Money (B2C)</MenuItem>
                  <MenuItem value="CHEQUE">SACCO Physical Cheque</MenuItem>
                  <MenuItem value="CASH">Cash Over the Counter</MenuItem>
                </TextField>
              </Grid>

              {/* Document / Payment Reference Number */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#1e293b", mb: 0.8 }}>
                  Document / Payment Reference No. <span style={{ color: "#e11d48" }}>*</span>
                </Typography>
                <TextField
                  fullWidth
                  required
                  placeholder={
                    disbursementMethod === "BANK"
                      ? "e.g. EFT-982173 / RTGS Ref"
                      : disbursementMethod === "MPESA"
                      ? "e.g. QHK82914LA"
                      : "e.g. CHQ-004821"
                  }
                  value={documentNo}
                  onChange={(e) => setDocumentNo(e.target.value)}
                  disabled={loading}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <IconFileText size={18} style={{ color: "#64748b" }} />
                        </InputAdornment>
                      ),
                      sx: { borderRadius: 2, fontWeight: 700, fontFamily: "monospace" },
                    },
                  }}
                  helperText="Audit tracking key recorded in SACCO general ledger."
                />
              </Grid>

              {/* Conditional Bank Details */}
              {disbursementMethod === "BANK" && (
                <>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#1e293b", mb: 0.8 }}>
                      Receiving Commercial Bank
                    </Typography>
                    <TextField
                      select
                      fullWidth
                      value={disbursementBank}
                      onChange={(e) => setDisbursementBank(e.target.value)}
                      disabled={loading}
                      slotProps={{
                        input: { sx: { borderRadius: 2, fontWeight: 700 } },
                      }}
                    >
                      {KENYAN_BANKS.map((b) => (
                        <MenuItem key={b} value={b}>
                          {b}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#1e293b", mb: 0.8 }}>
                      Borrower Bank Account Number
                    </Typography>
                    <TextField
                      fullWidth
                      placeholder="e.g. 01109283749100"
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                      disabled={loading}
                      slotProps={{
                        input: { sx: { borderRadius: 2, fontFamily: "monospace", fontWeight: 700 } },
                      }}
                    />
                  </Grid>
                </>
              )}

              {/* Conditional M-Pesa Phone */}
              {disbursementMethod === "MPESA" && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#1e293b", mb: 0.8 }}>
                    M-Pesa Recipient Phone Number
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="e.g. 0712345678"
                    value={mpesaPhone}
                    onChange={(e) => setMpesaPhone(e.target.value)}
                    disabled={loading}
                    slotProps={{
                      input: { sx: { borderRadius: 2, fontFamily: "monospace", fontWeight: 700 } },
                    }}
                    helperText="Pre-filled from borrower's registered SACCO profile."
                  />
                </Grid>
              )}

              {/* Notes / Remarks */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#1e293b", mb: 0.8 }}>
                  Disbursement Notes / Audit Remarks (Optional)
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="e.g. Disbursed via KCB Treasury Portal Batch #19..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={loading}
                  slotProps={{
                    input: { sx: { borderRadius: 2 } },
                  }}
                />
              </Grid>
            </Grid>

            {/* Information Banner */}
            <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: "#f0fdfa", border: "1px solid #99f6e4" }}>
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <IconReceipt size={22} style={{ color: "#0d9488", flexShrink: 0, marginTop: 2 }} />
                <Box>
                  <Typography variant="body2" fontWeight={800} sx={{ color: "#0f766e" }}>
                    Automated Actions on Disbursement:
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#134e4a", display: "block", mt: 0.3 }}>
                    1. Computes and posts official <strong>Amortization Repayment Schedule</strong> into the database.
                    <br />
                    2. Posts double-entry disbursement journal in the General Ledger.
                    <br />
                    3. Transitions loan status to <strong>Active Credit Facility</strong>.
                  </Typography>
                </Box>
              </Stack>
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
            disabled={loading || !disbursedAmount || !disbursementDate || !documentNo.trim()}
            startIcon={
              loading ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <IconCheck size={18} />
              )
            }
            sx={{
              background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
              color: "#ffffff",
              fontWeight: 800,
              borderRadius: 2.5,
              px: 3,
              py: 1,
              boxShadow: "0 4px 14px rgba(13, 148, 136, 0.35)",
              "&:hover": {
                background: "linear-gradient(135deg, #0f766e 0%, #115e59 100%)",
              },
            }}
          >
            {loading ? "Processing Disbursement..." : "Confirm & Disburse Funds"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
