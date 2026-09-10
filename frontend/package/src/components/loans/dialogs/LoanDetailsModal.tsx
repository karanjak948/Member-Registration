"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Box,
  Typography,
  Grid,
  Chip,
  IconButton,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Divider,
} from "@mui/material";
import {
  IconX,
  IconFileDescription,
  IconShieldCheck,
  IconCash,
  IconCalendarTime,
  IconCoins,
  IconBuildingBank,
  IconUser,
  IconCheck,
  IconClock,
  IconAlertTriangle,
  IconDownload,
  IconExternalLink,
  IconReceipt,
} from "@tabler/icons-react";
import { Loan, LoanScheduleEntry } from "@/interfaces/loan";
import loanService from "@/services/loan.service";

interface LoanDetailsModalProps {
  open: boolean;
  loanId: number | null;
  onClose: () => void;
  onOpenDossier?: (loanId: number) => void;
}

const statusConfig: Record<
  string,
  { label: string; bg: string; color: string; border: string }
> = {
  pending_application: {
    label: "Pending Review",
    bg: "#fef3c7",
    color: "#d97706",
    border: "#fde68a",
  },
  appraised: {
    label: "Appraised",
    bg: "#eff6ff",
    color: "#2563eb",
    border: "#bfdbfe",
  },
  approved: {
    label: "Approved & Ready for Payout",
    bg: "#e0e7ff",
    color: "#4338ca",
    border: "#c7d2fe",
  },
  active: {
    label: "Active Credit Facility",
    bg: "#ecfdf5",
    color: "#059669",
    border: "#a7f3d0",
  },
  watchful: {
    label: "Watchful",
    bg: "#fffbeb",
    color: "#b45309",
    border: "#fde68a",
  },
  non_performing: {
    label: "Non-Performing",
    bg: "#fff1f2",
    color: "#e11d48",
    border: "#fecdd3",
  },
  doubtful: {
    label: "Doubtful",
    bg: "#fef2f2",
    color: "#dc2626",
    border: "#fecaca",
  },
  closed: {
    label: "Fully Repaid & Closed",
    bg: "#f1f5f9",
    color: "#475569",
    border: "#cbd5e1",
  },
  written_off: {
    label: "Written Off",
    bg: "#f3f4f6",
    color: "#6b7280",
    border: "#e5e7eb",
  },
  rejected: {
    label: "Rejected",
    bg: "#fee2e2",
    color: "#991b1b",
    border: "#fca5a5",
  },
};

export default function LoanDetailsModal({
  open,
  loanId,
  onClose,
  onOpenDossier,
}: LoanDetailsModalProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loan, setLoan] = useState<Loan | null>(null);
  const [repayments, setRepayments] = useState<any[]>([]);

  useEffect(() => {
    if (open && loanId) {
      loadLoanData(loanId);
    } else {
      setLoan(null);
      setActiveTab(0);
    }
  }, [open, loanId]);

  const loadLoanData = async (id: number) => {
    try {
      setLoading(true);
      const data = await loanService.getById(id);
      setLoan(data);

      // Fetch repayments for this loan
      try {
        const repData = await loanService.getRepayments(id);
        setRepayments(repData || []);
      } catch {
        setRepayments([]);
      }
    } catch (err) {
      console.error("Failed to load full loan details:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: string | number | null | undefined) => {
    if (amount === null || amount === undefined || amount === "") return "KES 0.00";
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 2,
    }).format(Number(amount));
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-KE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (!open) return null;

  const statusInfo = loan
    ? statusConfig[loan.status] || {
        label: loan.status,
        bg: "#f1f5f9",
        color: "#475569",
        border: "#cbd5e1",
      }
    : null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3.5,
          p: 1,
          boxShadow: "0 25px 60px -15px rgba(15, 23, 42, 0.3)",
          minHeight: 600,
        },
      }}
    >
      {/* Header */}
      <DialogTitle sx={{ pb: 1.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              sx={{
                width: 46,
                height: 46,
                borderRadius: 2.5,
                bgcolor: "#ecfdf5",
                color: "#059669",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 10px rgba(5, 150, 105, 0.18)",
              }}
            >
              <IconCoins size={26} />
            </Box>
            <Box>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Typography variant="h5" fontWeight={900} sx={{ color: "#064e3b", fontFamily: "monospace" }}>
                  {loan?.loan_number || `Loan #${loanId}`}
                </Typography>
                {statusInfo && (
                  <Chip
                    label={statusInfo.label}
                    size="small"
                    sx={{
                      fontWeight: 800,
                      fontSize: "0.76rem",
                      bgcolor: statusInfo.bg,
                      color: statusInfo.color,
                      border: `1px solid ${statusInfo.border}`,
                    }}
                  />
                )}
              </Stack>
              <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 600, mt: 0.3 }}>
                {loan?.member_name || "Borrower Member"}{" "}
                {loan?.membership_number && (
                  <span style={{ color: "#059669", fontFamily: "monospace", fontWeight: 700 }}>
                    ({loan.membership_number})
                  </span>
                )}{" "}
                • {loan?.product_name || `Product #${loan?.loan_product_id || ""}`}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            {onOpenDossier && loan && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<IconExternalLink size={15} />}
                onClick={() => onOpenDossier(loan.id)}
                sx={{
                  fontWeight: 700,
                  textTransform: "none",
                  borderRadius: 2,
                  borderColor: "#cbd5e1",
                  color: "#334155",
                  fontSize: "0.8rem",
                  "&:hover": { borderColor: "#059669", color: "#059669" },
                }}
              >
                Open Loan File
              </Button>
            )}
            <IconButton size="small" onClick={onClose} sx={{ color: "#94a3b8" }}>
              <IconX size={20} />
            </IconButton>
          </Stack>
        </Stack>
      </DialogTitle>

      {/* Tab Navigation */}
      <Box sx={{ borderBottom: "1px solid #e2e8f0", px: 3, bgcolor: "#f8fafc" }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          sx={{
            minHeight: 48,
            "& .MuiTab-root": {
              fontWeight: 800,
              fontSize: "0.85rem",
              textTransform: "none",
              minHeight: 48,
              color: "#64748b",
              "&.Mui-selected": { color: "#059669" },
            },
            "& .MuiTabs-indicator": {
              backgroundColor: "#059669",
              height: 3,
              borderRadius: "3px 3px 0 0",
            },
          }}
        >
          <Tab
            icon={<IconFileDescription size={18} />}
            iconPosition="start"
            label="1. Application Details"
          />
          <Tab
            icon={<IconShieldCheck size={18} />}
            iconPosition="start"
            label="2. Approval Details"
          />
          <Tab
            icon={<IconCash size={18} />}
            iconPosition="start"
            label="3. Disbursement Details"
          />
          <Tab
            icon={<IconCalendarTime size={18} />}
            iconPosition="start"
            label={`4. Repayment Schedule (${loan?.schedule_entries?.length || 0})`}
          />
          <Tab
            icon={<IconReceipt size={18} />}
            iconPosition="start"
            label={`5. Repayment Details (${repayments.length})`}
          />
        </Tabs>
      </Box>

      {/* Content */}
      <DialogContent sx={{ p: 3, maxHeight: "70vh", overflowY: "auto" }}>
        {loading ? (
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={10}>
            <CircularProgress size={36} sx={{ color: "#059669" }} />
            <Typography variant="body2" sx={{ color: "#64748b", mt: 2, fontWeight: 700 }}>
              Loading facility particulars &amp; amortization schedule...
            </Typography>
          </Box>
        ) : !loan ? (
          <Box py={8} textAlign="center">
            <Typography variant="body1" color="text.secondary">
              Unable to load loan details. Please try again.
            </Typography>
          </Box>
        ) : (
          <Box>
            {/* TAB 0: APPLICATION DETAILS */}
            {activeTab === 0 && (
              <Stack spacing={3}>
                {/* Financial Summary Card */}
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    bgcolor: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                  }}
                >
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <Typography variant="caption" sx={{ color: "#166534", fontWeight: 700, textTransform: "uppercase" }}>
                        Requested Principal
                      </Typography>
                      <Typography variant="h6" fontWeight={900} sx={{ color: "#15803d", mt: 0.5, fontFamily: "monospace" }}>
                        {formatCurrency(loan.principal_amount)}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <Typography variant="caption" sx={{ color: "#166534", fontWeight: 700, textTransform: "uppercase" }}>
                        Outstanding Balance
                      </Typography>
                      <Typography variant="h6" fontWeight={900} sx={{ color: "#047857", mt: 0.5, fontFamily: "monospace" }}>
                        {formatCurrency(loan.outstanding_balance)}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <Typography variant="caption" sx={{ color: "#166534", fontWeight: 700, textTransform: "uppercase" }}>
                        Interest Engine
                      </Typography>
                      <Typography variant="body1" fontWeight={800} sx={{ color: "#15803d", mt: 0.5 }}>
                        {loan.interest_rate}% ({loan.interest_method?.replace("_", " ") || "reducing"})
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <Typography variant="caption" sx={{ color: "#166534", fontWeight: 700, textTransform: "uppercase" }}>
                        Tenor &amp; Frequency
                      </Typography>
                      <Typography variant="body1" fontWeight={800} sx={{ color: "#15803d", mt: 0.5 }}>
                        {loan.num_periods || 0} {loan.repayment_frequency || "Periods"}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>

                {/* Section 1: Borrower Particulars */}
                <Box>
                  <Typography variant="subtitle2" fontWeight={900} sx={{ color: "#0f172a", textTransform: "uppercase", fontSize: "0.8rem", letterSpacing: 0.5, mb: 1.5 }}>
                    1. Borrower Profile &amp; Application KYC
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Paper elevation={0} sx={{ p: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 2.5 }}>
                        <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700 }}>FULL APPLICANT NAME</Typography>
                        <Typography variant="body1" fontWeight={800} sx={{ color: "#0f172a", mt: 0.3 }}>
                          {loan.member_name || `Member #${loan.member_id}`}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Paper elevation={0} sx={{ p: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 2.5 }}>
                        <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700 }}>MEMBERSHIP NUMBER</Typography>
                        <Typography variant="body1" fontWeight={800} sx={{ color: "#0f766e", fontFamily: "monospace", mt: 0.3 }}>
                          {loan.membership_number || "—"}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Paper elevation={0} sx={{ p: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 2.5 }}>
                        <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700 }}>PHONE NUMBER</Typography>
                        <Typography variant="body1" fontWeight={800} sx={{ color: "#0f172a", mt: 0.3 }}>
                          {loan.member_phone || "—"}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Paper elevation={0} sx={{ p: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 2.5 }}>
                        <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700 }}>NATIONAL ID / PASSPORT</Typography>
                        <Typography variant="body1" fontWeight={800} sx={{ color: "#0f172a", mt: 0.3 }}>
                          {loan.member_national_id || "—"}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Paper elevation={0} sx={{ p: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 2.5 }}>
                        <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700 }}>APPLICATION DATE</Typography>
                        <Typography variant="body1" fontWeight={800} sx={{ color: "#0f172a", mt: 0.3 }}>
                          {formatDate(loan.application_date)}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Paper elevation={0} sx={{ p: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 2.5 }}>
                        <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700 }}>CREDIT PRODUCT</Typography>
                        <Typography variant="body1" fontWeight={800} sx={{ color: "#0f172a", mt: 0.3 }}>
                          {loan.product_name || `Product #${loan.loan_product_id}`}
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>

                {/* Section 2: Security & Collateral */}
                <Box>
                  <Typography variant="subtitle2" fontWeight={900} sx={{ color: "#0f172a", textTransform: "uppercase", fontSize: "0.8rem", letterSpacing: 0.5, mb: 1.5 }}>
                    2. Security Collateral &amp; Endorsement
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Paper elevation={0} sx={{ p: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 2.5 }}>
                        <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700 }}>PLEDGED SECURITY VALUE</Typography>
                        <Typography variant="body1" fontWeight={800} sx={{ color: "#0f172a", mt: 0.3 }}>
                          {loan.security_provided_value ? formatCurrency(loan.security_provided_value) : "Not Specified"}
                        </Typography>
                        {loan.security_provided_notes && (
                          <Typography variant="caption" sx={{ color: "#64748b", display: "block", mt: 0.5 }}>
                            {loan.security_provided_notes}
                          </Typography>
                        )}
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Paper elevation={0} sx={{ p: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 2.5 }}>
                        <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700 }}>GUARANTORS COUNT</Typography>
                        <Typography variant="body1" fontWeight={800} sx={{ color: "#0f172a", mt: 0.3 }}>
                          {loan.guarantors?.length || 0} guarantor(s) attached
                        </Typography>
                        {loan.guarantors && loan.guarantors.length > 0 && (
                          <Typography variant="caption" sx={{ color: "#059669", fontWeight: 700, display: "block", mt: 0.5 }}>
                            {loan.guarantors.map((g) => g.guarantor_name).filter(Boolean).join(", ")}
                          </Typography>
                        )}
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
              </Stack>
            )}

            {/* TAB 1: APPROVAL DETAILS */}
            {activeTab === 1 && (
              <Stack spacing={3}>
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    bgcolor: loan.approval_date ? "#eff6ff" : "#fffbeb",
                    border: `1px solid ${loan.approval_date ? "#bfdbfe" : "#fde68a"}`,
                  }}
                >
                  <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} gap={2}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box
                        sx={{
                          width: 50,
                          height: 50,
                          borderRadius: 2.5,
                          bgcolor: loan.approval_date ? "#2563eb" : "#d97706",
                          color: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <IconShieldCheck size={28} />
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: loan.approval_date ? "#1e40af" : "#92400e", fontWeight: 800, textTransform: "uppercase" }}>
                          Credit Committee Status
                        </Typography>
                        <Typography variant="h6" fontWeight={900} sx={{ color: "#0f172a" }}>
                          {loan.approval_date ? "Credit Sanctioned & Approved" : "Pending Committee Review"}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
                          {loan.approval_date
                            ? `Formally approved on ${formatDate(loan.approval_date)}`
                            : "Waiting for governance committee resolution"}
                        </Typography>
                      </Box>
                    </Stack>

                    <Box textAlign={{ sm: "right" }}>
                      <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                        Approved Amount
                      </Typography>
                      <Typography variant="h5" fontWeight={900} sx={{ color: "#1d4ed8", fontFamily: "monospace" }}>
                        {formatCurrency(loan.approved_amount ?? loan.principal_amount)}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 2.5 }}>
                      <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700 }}>APPROVAL DATE</Typography>
                      <Typography variant="body1" fontWeight={800} sx={{ color: "#0f172a", mt: 0.3 }}>
                        {formatDate(loan.approval_date)}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 2.5 }}>
                      <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700 }}>SANCTIONED CEILING</Typography>
                      <Typography variant="body1" fontWeight={900} sx={{ color: "#059669", fontFamily: "monospace", mt: 0.3 }}>
                        {formatCurrency(loan.approved_amount ?? loan.principal_amount)}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Paper elevation={0} sx={{ p: 2.5, bgcolor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 2.5 }}>
                      <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                        Committee Resolution Notes &amp; Conditions
                      </Typography>
                      <Typography variant="body1" sx={{ color: "#1e293b", mt: 1, whiteSpace: "pre-wrap", fontWeight: 600 }}>
                        {loan.approval_notes || "No formal committee notes recorded during approval."}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Stack>
            )}

            {/* TAB 2: DISBURSEMENT DETAILS */}
            {activeTab === 2 && (
              <Stack spacing={3}>
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    bgcolor: loan.disbursement_date ? "#f0fdf4" : "#fffbeb",
                    border: `1px solid ${loan.disbursement_date ? "#bbf7d0" : "#fde68a"}`,
                  }}
                >
                  <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} gap={2}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box
                        sx={{
                          width: 50,
                          height: 50,
                          borderRadius: 2.5,
                          bgcolor: loan.disbursement_date ? "#059669" : "#d97706",
                          color: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <IconCash size={28} />
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: loan.disbursement_date ? "#166534" : "#92400e", fontWeight: 800, textTransform: "uppercase" }}>
                          Disbursement Payout Status
                        </Typography>
                        <Typography variant="h6" fontWeight={900} sx={{ color: "#0f172a" }}>
                          {loan.disbursement_date ? "Disbursed & Active in Portfolio" : "Awaiting Capital Payout"}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
                          {loan.disbursement_date
                            ? `Disbursed on ${formatDate(loan.disbursement_date)}`
                            : "Funds will be credited once disburse form is finalized"}
                        </Typography>
                      </Box>
                    </Stack>

                    <Box textAlign={{ sm: "right" }}>
                      <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                        Disbursed Capital
                      </Typography>
                      <Typography variant="h5" fontWeight={900} sx={{ color: "#15803d", fontFamily: "monospace" }}>
                        {formatCurrency(loan.disbursed_amount ?? loan.principal_amount)}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 2.5 }}>
                      <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700 }}>DISBURSEMENT DATE</Typography>
                      <Typography variant="body1" fontWeight={800} sx={{ color: "#0f172a", mt: 0.3 }}>
                        {formatDate(loan.disbursement_date)}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 2.5 }}>
                      <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700 }}>SETTLEMENT CHANNEL</Typography>
                      <Typography variant="body1" fontWeight={800} sx={{ color: "#0d9488", mt: 0.3 }}>
                        {loan.disbursement_method || "Direct Bank/M-Pesa"}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 2.5 }}>
                      <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700 }}>DOCUMENT / REF NO.</Typography>
                      <Typography variant="body1" fontWeight={800} sx={{ color: "#0f172a", fontFamily: "monospace", mt: 0.3 }}>
                        {loan.disbursement_reference || "—"}
                      </Typography>
                    </Paper>
                  </Grid>

                  {loan.disbursement_bank && (
                    <Grid size={{ xs: 12 }}>
                      <Paper elevation={0} sx={{ p: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 2.5 }}>
                        <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700 }}>BANKING PARTICULARS</Typography>
                        <Typography variant="body1" fontWeight={800} sx={{ color: "#0f172a", mt: 0.3 }}>
                          {loan.disbursement_bank}
                        </Typography>
                      </Paper>
                    </Grid>
                  )}

                  {loan.disbursement_notes && (
                    <Grid size={{ xs: 12 }}>
                      <Paper elevation={0} sx={{ p: 2.5, bgcolor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 2.5 }}>
                        <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                          Disbursement Audit Remarks
                        </Typography>
                        <Typography variant="body1" sx={{ color: "#1e293b", mt: 1, whiteSpace: "pre-wrap", fontWeight: 600 }}>
                          {loan.disbursement_notes}
                        </Typography>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              </Stack>
            )}

            {/* TAB 3: REPAYMENT SCHEDULE (Matching Sample Schedule Format from Image 2) */}
            {activeTab === 3 && (
              <Stack spacing={3}>
                {/* Product Configuration Header (as shown in Screenshot 2) */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 2.5,
                    bgcolor: "#0f172a",
                    border: "1px solid #1e293b",
                    color: "#ffffff",
                  }}
                >
                  <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Product Configuration (at time of issuance)
                  </Typography>
                  <Grid container spacing={2} sx={{ mt: 0.5 }}>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Typography variant="caption" sx={{ color: "#94a3b8" }}>METHOD</Typography>
                      <Typography variant="body1" fontWeight={800} sx={{ color: "#38bdf8", textTransform: "capitalize" }}>
                        {loan.interest_method?.replace("_", " ") || "Reducing Balance"}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Typography variant="caption" sx={{ color: "#94a3b8" }}>RATE</Typography>
                      <Typography variant="body1" fontWeight={800} sx={{ color: "#34d399" }}>
                        {loan.interest_rate}% / monthly
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Typography variant="caption" sx={{ color: "#94a3b8" }}>REPAYMENT</Typography>
                      <Typography variant="body1" fontWeight={800} sx={{ color: "#fcd34d", textTransform: "capitalize" }}>
                        {loan.repayment_frequency || "Monthly"}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Typography variant="caption" sx={{ color: "#94a3b8" }}>TENOR</Typography>
                      <Typography variant="body1" fontWeight={800} sx={{ color: "#ffffff" }}>
                        {loan.num_periods || 0} installments
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>

                {/* Expected Repayment Schedule Card in sleek dark styling matching Screenshot 2 */}
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: "1px solid #1e293b",
                    bgcolor: "#0f172a",
                    overflow: "hidden",
                  }}
                >
                  <Box sx={{ p: 2.5, bgcolor: "#1e293b", borderBottom: "1px solid #334155" }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="subtitle1" fontWeight={900} sx={{ color: "#f8fafc" }}>
                          Expected Repayment Schedule
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 600 }}>
                          Rate: {loan.interest_rate}% / monthly · Repayment: {loan.repayment_frequency || "monthly"} · {loan.schedule_entries?.length || 0} installments
                        </Typography>
                      </Box>
                      <Chip
                        size="small"
                        label="Generated at disbursement"
                        sx={{ bgcolor: "rgba(16, 185, 129, 0.2)", color: "#34d399", fontWeight: 800, fontSize: "0.72rem", border: "1px solid rgba(16, 185, 129, 0.4)" }}
                      />
                    </Stack>
                  </Box>

                  <TableContainer sx={{ maxHeight: 440 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow sx={{ "& th": { bgcolor: "#1e293b", fontWeight: 800, color: "#94a3b8", py: 1.5, borderColor: "#334155", fontSize: "0.74rem" } }}>
                          <TableCell sx={{ width: 90 }}>{loan.repayment_frequency?.toUpperCase() || "PERIOD"} #</TableCell>
                          <TableCell>DUE DATE</TableCell>
                          <TableCell align="right">OPENING</TableCell>
                          <TableCell align="right">PRINCIPAL</TableCell>
                          <TableCell align="right">INTEREST</TableCell>
                          <TableCell align="right">EXPECTED INSTALLMENT</TableCell>
                          <TableCell align="center">STATUS</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {!loan.schedule_entries || loan.schedule_entries.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} align="center" sx={{ py: 6, color: "#94a3b8", borderColor: "#1e293b" }}>
                              <Typography variant="body2" fontWeight={700}>
                                Schedule will be automatically computed and generated upon loan disbursement.
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          loan.schedule_entries.map((entry) => (
                            <TableRow
                              key={entry.id || entry.period_number}
                              sx={{
                                "&:nth-of-type(even)": { bgcolor: "#131f37" },
                                "&:hover": { bgcolor: "#1e293b" },
                                "& td": { borderColor: "#1e293b" },
                              }}
                            >
                              <TableCell sx={{ fontWeight: 800, color: "#94a3b8", fontFamily: "monospace" }}>
                                #{entry.period_number}
                              </TableCell>
                              <TableCell sx={{ fontWeight: 700, color: "#e2e8f0" }}>
                                {formatDate(entry.due_date)}
                              </TableCell>
                              <TableCell align="right" sx={{ fontFamily: "monospace", color: "#94a3b8" }}>
                                {Math.round(Number(entry.opening_balance || 0)).toLocaleString()}
                              </TableCell>
                              <TableCell align="right" sx={{ fontFamily: "monospace", fontWeight: 700, color: "#f8fafc" }}>
                                {Math.round(Number(entry.expected_principal || 0)).toLocaleString()}
                              </TableCell>
                              <TableCell align="right" sx={{ fontFamily: "monospace", color: "#cbd5e1" }}>
                                {Math.round(Number(entry.expected_interest || 0)).toLocaleString()}
                              </TableCell>
                              <TableCell align="right" sx={{ fontFamily: "monospace", fontWeight: 900, color: "#34d399" }}>
                                {Math.round(Number(entry.expected_amount || 0)).toLocaleString()}
                              </TableCell>
                              <TableCell align="center">
                                {entry.is_paid ? (
                                  <Chip
                                    size="small"
                                    label="Paid"
                                    sx={{
                                      bgcolor: "rgba(16, 185, 129, 0.2)",
                                      color: "#34d399",
                                      fontWeight: 800,
                                      fontSize: "0.72rem",
                                      border: "1px solid rgba(16, 185, 129, 0.4)",
                                    }}
                                  />
                                ) : (
                                  <Chip
                                    size="small"
                                    label="Pending"
                                    sx={{
                                      bgcolor: "#451a03",
                                      color: "#fbbf24",
                                      fontWeight: 800,
                                      fontSize: "0.72rem",
                                      border: "1px solid #78350f",
                                    }}
                                  />
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Stack>
            )}

            {/* TAB 4: REPAYMENT DETAILS & LEDGER HISTORY */}
            {activeTab === 4 && (
              <Stack spacing={3}>
                {/* Repayment Overview Metrics */}
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 2.5 }}>
                      <Typography variant="caption" sx={{ color: "#059669", fontWeight: 800, textTransform: "uppercase" }}>
                        Total Principal Paid
                      </Typography>
                      <Typography variant="h6" fontWeight={900} sx={{ color: "#065f46", fontFamily: "monospace", mt: 0.5 }}>
                        {formatCurrency(loan.total_principal_paid || 0)}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 2.5 }}>
                      <Typography variant="caption" sx={{ color: "#2563eb", fontWeight: 800, textTransform: "uppercase" }}>
                        Total Interest Paid
                      </Typography>
                      <Typography variant="h6" fontWeight={900} sx={{ color: "#1e40af", fontFamily: "monospace", mt: 0.5 }}>
                        {formatCurrency(loan.total_interest_paid || 0)}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: "#fffbeb", border: "1px solid #fde68a", borderRadius: 2.5 }}>
                      <Typography variant="caption" sx={{ color: "#d97706", fontWeight: 800, textTransform: "uppercase" }}>
                        Outstanding Balance
                      </Typography>
                      <Typography variant="h6" fontWeight={900} sx={{ color: "#92400e", fontFamily: "monospace", mt: 0.5 }}>
                        {formatCurrency(loan.outstanding_balance)}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 2.5 }}>
                      <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 800, textTransform: "uppercase" }}>
                        Delinquency / Overdue
                      </Typography>
                      <Typography variant="h6" fontWeight={900} sx={{ color: Number(loan.days_overdue || 0) > 0 ? "#dc2626" : "#059669", mt: 0.5 }}>
                        {loan.days_overdue || 0} days
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                {/* Repayment History Ledger Table */}
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: "1px solid #e2e8f0",
                    overflow: "hidden",
                  }}
                >
                  <Box sx={{ p: 2, bgcolor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="subtitle1" fontWeight={900} sx={{ color: "#0f172a" }}>
                          Repayment History & Collections Ledger
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
                          {repayments.length} repayment transaction{repayments.length === 1 ? "" : "s"} recorded on this facility
                        </Typography>
                      </Box>
                      {loan.last_payment_date && (
                        <Chip
                          size="small"
                          label={`Last Paid: ${formatDate(loan.last_payment_date)}`}
                          sx={{ bgcolor: "#ecfdf5", color: "#059669", fontWeight: 800, fontSize: "0.74rem" }}
                        />
                      )}
                    </Stack>
                  </Box>

                  <TableContainer sx={{ maxHeight: 360 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ "& th": { bgcolor: "#f8fafc", fontWeight: 800, color: "#1e293b", py: 1.5 } }}>
                          <TableCell>#</TableCell>
                          <TableCell>PAYMENT DATE</TableCell>
                          <TableCell align="right">AMOUNT PAID</TableCell>
                          <TableCell align="right">→ PRINCIPAL</TableCell>
                          <TableCell align="right">→ INTEREST</TableCell>
                          <TableCell align="right">→ PENALTY</TableCell>
                          <TableCell>CHANNEL / REFERENCE</TableCell>
                          <TableCell>NOTES</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {repayments.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} align="center" sx={{ py: 6, color: "#64748b" }}>
                              <Typography variant="body2" fontWeight={700}>
                                No repayments recorded for this facility yet.
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          repayments.map((rep, idx) => (
                            <TableRow key={rep.id || idx} hover sx={{ "&:nth-of-type(even)": { bgcolor: "#f8fafc" } }}>
                              <TableCell sx={{ color: "#64748b", fontFamily: "monospace" }}>{idx + 1}</TableCell>
                              <TableCell sx={{ fontWeight: 700, color: "#0f172a" }}>{formatDate(rep.payment_date)}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 900, color: "#059669", fontFamily: "monospace" }}>
                                {formatCurrency(rep.amount_paid)}
                              </TableCell>
                              <TableCell align="right" sx={{ fontFamily: "monospace", color: "#0f172a" }}>
                                {formatCurrency(rep.allocated_principal || 0)}
                              </TableCell>
                              <TableCell align="right" sx={{ fontFamily: "monospace", color: "#d97706" }}>
                                {formatCurrency(rep.allocated_interest || 0)}
                              </TableCell>
                              <TableCell align="right" sx={{ fontFamily: "monospace", color: "#dc2626" }}>
                                {formatCurrency(rep.allocated_penalty || 0)}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  size="small"
                                  label={rep.transaction_reference || rep.payment_method || "Paid"}
                                  sx={{
                                    bgcolor: "#f1f5f9",
                                    color: "#334155",
                                    fontWeight: 700,
                                    fontFamily: "monospace",
                                    fontSize: "0.72rem",
                                  }}
                                />
                              </TableCell>
                              <TableCell sx={{ color: "#64748b", fontSize: "0.8rem", maxWidth: 200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {rep.notes || "—"}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Stack>
            )}
          </Box>
        )}
      </DialogContent>

      {/* Footer */}
      <DialogActions sx={{ px: 3, py: 2, justifyContent: "space-between", borderTop: "1px solid #e2e8f0" }}>
        <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700 }}>
          CONFIDENTIAL SACCO CREDIT FACILITY REGISTRY
        </Typography>
        <Button
          variant="contained"
          onClick={onClose}
          sx={{
            fontWeight: 800,
            borderRadius: 2,
            px: 3,
            bgcolor: "#059669",
            color: "#ffffff",
            "&:hover": { bgcolor: "#047857" },
          }}
        >
          Close View
        </Button>
      </DialogActions>
    </Dialog>
  );
}
