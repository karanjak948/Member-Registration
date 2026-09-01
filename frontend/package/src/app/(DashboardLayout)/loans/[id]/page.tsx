"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Grid,
  Paper,
  Stack,
  Typography,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  MenuItem,
  InputAdornment,
  Tooltip,
} from "@mui/material";
import {
  IconArrowLeft,
  IconRefresh,
  IconCoins,
  IconReceipt,
  IconCash,
  IconCalendar,
  IconUser,
  IconShieldCheck,
  IconFileText,
  IconBuildingBank,
  IconCheck,
  IconX,
  IconTrash,
  IconClock,
  IconExternalLink,
  IconCertificate,
  IconPlus,
} from "@tabler/icons-react";
import loanService from "@/services/loan.service";
import memberService from "@/services/member.service";
import guarantorService from "@/services/guarantor.service";
import { Loan } from "@/interfaces/loan";
import { Member } from "@/interfaces/member";
import { Guarantor } from "@/interfaces/guarantor";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/constants/permissions";

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
    label: "Approved & Ready for Disbursement",
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
    label: "Application Rejected",
    bg: "#fee2e2",
    color: "#991b1b",
    border: "#fca5a5",
  },
};

export default function LoanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { can, isSuperuser, isStaff, role } = usePermissions();

  const identifier = params.id as string;
  const isNumericId = /^\d+$/.test(identifier);

  const roleName = role?.name?.toUpperCase();
  const isSystemAdmin = isSuperuser || roleName === "SUPERADMIN" || roleName === "OWNER";

  // Strict Permission Gates
  const canApproveLoans = isSystemAdmin || can(PERMISSIONS.APPROVE_LOANS);
  const canDisburseLoans = isSystemAdmin || can(PERMISSIONS.DISBURSE_LOANS);
  const canRejectLoans = isSystemAdmin || can(PERMISSIONS.REJECT_LOANS) || can(PERMISSIONS.APPROVE_LOANS);
  const canDeleteLoans = isSystemAdmin || can(PERMISSIONS.DELETE_LOANS);
  const hasAnyGovernanceAction = canApproveLoans || canDisburseLoans || canRejectLoans || canDeleteLoans;

  const [loan, setLoan] = useState<Loan | null>(null);
  const [borrowerMember, setBorrowerMember] = useState<Member | null>(null);
  const [guarantorMember, setGuarantorMember] = useState<Member | null>(null);
  const [guarantorRecord, setGuarantorRecord] = useState<Guarantor | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Record Repayment Dialog States
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("MPESA");
  const [paymentMpesaRef, setPaymentMpesaRef] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentNotes, setPaymentNotes] = useState("");
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "warning" | "info";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loan || !paymentAmount || Number(paymentAmount) <= 0) {
      setSnackbar({
        open: true,
        message: "Please enter a valid repayment amount.",
        severity: "error",
      });
      return;
    }

    try {
      setPaymentSubmitting(true);
      const notesCombined = `${paymentMode} ${paymentMpesaRef ? `Ref: ${paymentMpesaRef} ` : ""}- ${paymentNotes}`.trim();
      const res = await fetch(`/api/loans/${loan.id}/repayments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_date: paymentDate,
          amount_paid: Number(paymentAmount),
          notes: notesCombined,
        }),
      });

      if (res.ok) {
        setSnackbar({
          open: true,
          message: `Repayment of KES ${Number(paymentAmount).toLocaleString()} recorded successfully!`,
          severity: "success",
        });
        setPaymentDialogOpen(false);
        setPaymentAmount("");
        setPaymentMpesaRef("");
        setPaymentNotes("");
        await loadLoan();
      } else {
        const err = await res.json().catch(() => ({}));
        setSnackbar({
          open: true,
          message: err.detail || err.error || "Failed to record repayment on Loan Engine.",
          severity: "error",
        });
      }
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: "Network error occurred while submitting payment.",
        severity: "error",
      });
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const loadLoan = async () => {
    try {
      setLoading(true);
      setError("");
      setNotFound(false);

      const loanId = isNumericId ? Number(identifier) : 0;

      if (loanId === 0) {
        setError(`Invalid loan identifier: "${identifier}". Please select a valid loan from the portfolio.`);
        setLoading(false);
        return;
      }

      const data = await loanService.getById(loanId);
      setLoan(data);

      if (data.member_id) {
        memberService.getById(data.member_id).then(setBorrowerMember).catch(() => null);
        guarantorService.getByMember(data.member_id).then(setGuarantorRecord).catch(() => null);
      }
      if (data.guarantor_member_id) {
        memberService.getById(data.guarantor_member_id).then(setGuarantorMember).catch(() => null);
      }
    } catch (err: any) {
      console.error("Failed to load loan details:", err);

      if (err.response?.status === 404) {
        setNotFound(true);
        setError(`Loan record #${identifier} was not found in the credit registry.`);
      } else if (err.response?.status === 500) {
        setError("The Loan Core Service encountered an internal error. Please try again.");
      } else {
        setError(err.message || "Unable to load loan details.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLoan();
  }, [identifier]);

  // Workflow Actions
  const handleUpdateStatus = async (newStatus: string, extraData: any = {}) => {
    if (!loan) return;
    try {
      setActionLoading(true);
      const payload = { status: newStatus, ...extraData };
      const updated = await loanService.update(loan.id, payload as any);
      setLoan(updated);
      setSnackbar({
        open: true,
        message: `Loan status successfully updated to: ${statusConfig[newStatus]?.label || newStatus}`,
        severity: "success",
      });
    } catch (err: any) {
      console.error("Failed to update loan status:", err);
      setSnackbar({
        open: true,
        message: err.response?.data?.detail || "Failed to update loan status. Please try again.",
        severity: "error",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteLoan = async () => {
    if (!loan) return;
    try {
      setActionLoading(true);
      await loanService.delete(loan.id);
      setDeleteDialogOpen(false);
      setSnackbar({
        open: true,
        message: "Loan application successfully deleted.",
        severity: "success",
      });
      setTimeout(() => {
        router.push("/loans");
      }, 1200);
    } catch (err: any) {
      console.error("Failed to delete loan:", err);
      setSnackbar({
        open: true,
        message: err.response?.data?.detail || "Failed to delete loan application.",
        severity: "error",
      });
      setActionLoading(false);
    }
  };

  const formatCurrency = (amount: string | number | null) => {
    if (!amount && amount !== 0) return "KES 0.00";
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 2,
    }).format(Number(amount));
  };

  const formatDate = (date: string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-KE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <Container maxWidth={false}>
        <Box display="flex" justifyContent="center" alignItems="center" py={12}>
          <CircularProgress color="success" size={44} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth={false} sx={{ px: { xs: 1.5, md: 3 }, py: 4 }}>
        <Stack spacing={3}>
          <Alert severity={notFound ? "warning" : "error"} sx={{ borderRadius: 3, fontWeight: 700 }}>
            {error}
          </Alert>
          <Box display="flex" gap={2}>
            <Button
              variant="contained"
              startIcon={<IconRefresh size={18} />}
              onClick={loadLoan}
              sx={{ bgcolor: "#059669", color: "#ffffff", fontWeight: 800, borderRadius: 2 }}
            >
              Retry
            </Button>
            <Button
              variant="outlined"
              startIcon={<IconArrowLeft size={18} />}
              onClick={() => router.push("/loans")}
              sx={{ fontWeight: 800, borderRadius: 2 }}
            >
              Back to Loans
            </Button>
          </Box>
        </Stack>
      </Container>
    );
  }

  if (!loan) {
    return (
      <Container maxWidth={false} sx={{ px: { xs: 1.5, md: 3 }, py: 4 }}>
        <Stack spacing={3}>
          <Alert severity="warning" sx={{ borderRadius: 3, fontWeight: 700 }}>
            Loan record could not be loaded.
          </Alert>
          <Button
            variant="outlined"
            startIcon={<IconArrowLeft size={18} />}
            onClick={() => router.push("/loans")}
            sx={{ fontWeight: 800, borderRadius: 2, alignSelf: "flex-start" }}
          >
            Back to Loans
          </Button>
        </Stack>
      </Container>
    );
  }

  const statusInfo = statusConfig[loan.status] || {
    label: loan.status,
    bg: "#f1f5f9",
    color: "#475569",
    border: "#cbd5e1",
  };

  const isPending = loan.status === "pending_application" || loan.status === "appraised";
  const isApproved = loan.status === "approved";
  const isActive = loan.status === "active";
  const isClosed = loan.status === "closed";
  const isRejected = loan.status === "rejected";

  return (
    <Container maxWidth={false} sx={{ px: { xs: 1.5, md: 3 }, py: 2 }}>
      <Stack spacing={3.5}>
        {/* Executive Hero Banner */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3.5 },
            borderRadius: 3.5,
            background: "linear-gradient(135deg, #064e3b 0%, #047857 50%, #059669 100%)",
            color: "#ffffff",
            boxShadow: "0 10px 28px rgba(6, 78, 59, 0.25)",
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2.5}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
          >
            <Stack direction="row" spacing={2.5} alignItems="center">
              <Box
                sx={{
                  width: 54,
                  height: 54,
                  borderRadius: 2.5,
                  bgcolor: "rgba(255, 255, 255, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}
              >
                <IconBuildingBank size={32} stroke={2.5} />
              </Box>
              <Box>
                <Stack direction="row" spacing={1.5} alignItems="center" mb={0.5} flexWrap="wrap">
                  <Typography variant="h4" fontWeight={900} sx={{ color: "#ffffff", letterSpacing: "-0.5px" }}>
                    Loan Dossier
                  </Typography>
                  <Chip
                    label={loan.loan_number}
                    sx={{
                      fontWeight: 900,
                      fontFamily: "monospace",
                      fontSize: "0.95rem",
                      bgcolor: "rgba(255, 255, 255, 0.2)",
                      color: "#ffffff",
                      border: "1px solid rgba(255, 255, 255, 0.35)",
                    }}
                  />
                  <Chip
                    label={statusInfo.label}
                    sx={{
                      fontWeight: 900,
                      fontSize: "0.82rem",
                      bgcolor: statusInfo.bg,
                      color: statusInfo.color,
                      border: `1px solid ${statusInfo.border}`,
                    }}
                  />
                </Stack>
                <Typography variant="body2" sx={{ color: "#a7f3d0", fontWeight: 500 }}>
                  Credit facility dossier, repayment schedules, security collateral, and borrower KYC
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1.5}>
              <Button
                variant="outlined"
                startIcon={<IconRefresh size={18} />}
                onClick={loadLoan}
                sx={{
                  bgcolor: "rgba(255, 255, 255, 0.12)",
                  color: "#ffffff",
                  fontWeight: 800,
                  borderRadius: 2.5,
                  px: 2.25,
                  py: 1,
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255, 255, 255, 0.25)",
                  "&:hover": { bgcolor: "rgba(255, 255, 255, 0.22)" },
                }}
              >
                Refresh
              </Button>

              <Button
                variant="contained"
                startIcon={<IconArrowLeft size={18} />}
                onClick={() => router.push("/loans")}
                sx={{
                  bgcolor: "#ffffff",
                  color: "#065f46",
                  fontWeight: 900,
                  borderRadius: 2.5,
                  px: 3,
                  py: 1,
                  boxShadow: "0 4px 14px rgba(0,0,0,0.18)",
                  "&:hover": { bgcolor: "#f0fdf4" },
                }}
              >
                Back to Loans
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {/* Loan Governance & Lifecycle Action Toolbar */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 3,
            border: "1px solid #e2e8f0",
            bgcolor: "#ffffff",
            boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05)",
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "center" }}
            spacing={2}
          >
            <Box>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 800,
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  display: "block",
                  mb: 0.5,
                }}
              >
                Credit Governance &amp; Lifecycle Controls
              </Typography>
              <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                {isPending && (
                  <Chip
                    icon={<IconClock size={16} color="#b45309" />}
                    label="Stage 1: Pending Appraisal & Approval"
                    sx={{
                      bgcolor: "#fffbeb",
                      color: "#92400e",
                      border: "1px solid #fde68a",
                      fontWeight: 800,
                      fontSize: "0.85rem",
                      py: 0.5,
                      px: 1,
                      borderRadius: 2,
                    }}
                  />
                )}
                {isApproved && (
                  <Chip
                    icon={<IconCheck size={16} color="#1d4ed8" />}
                    label="Stage 2: Approved (Ready for Disbursement)"
                    sx={{
                      bgcolor: "#eff6ff",
                      color: "#1e40af",
                      border: "1px solid #bfdbfe",
                      fontWeight: 800,
                      fontSize: "0.85rem",
                      py: 0.5,
                      px: 1,
                      borderRadius: 2,
                    }}
                  />
                )}
                {isActive && (
                  <Chip
                    icon={<IconShieldCheck size={16} color="#065f46" />}
                    label="Stage 3: Disbursed & Actively Servicing"
                    sx={{
                      bgcolor: "#ecfdf5",
                      color: "#065f46",
                      border: "1px solid #a7f3d0",
                      fontWeight: 800,
                      fontSize: "0.85rem",
                      py: 0.5,
                      px: 1,
                      borderRadius: 2,
                    }}
                  />
                )}
                {isClosed && (
                  <Chip
                    icon={<IconCertificate size={16} color="#475569" />}
                    label="Stage 4: Fully Cleared & Repaid"
                    sx={{
                      bgcolor: "#f1f5f9",
                      color: "#334155",
                      border: "1px solid #cbd5e1",
                      fontWeight: 800,
                      fontSize: "0.85rem",
                      py: 0.5,
                      px: 1,
                      borderRadius: 2,
                    }}
                  />
                )}
                {isRejected && (
                  <Chip
                    icon={<IconX size={16} color="#be123c" />}
                    label="Application Rejected"
                    sx={{
                      bgcolor: "#fff1f2",
                      color: "#be123c",
                      border: "1px solid #fecdd3",
                      fontWeight: 800,
                      fontSize: "0.85rem",
                      py: 0.5,
                      px: 1,
                      borderRadius: 2,
                    }}
                  />
                )}
              </Stack>
            </Box>

            {/* Action Buttons */}
            <Stack direction="row" spacing={1.5} flexWrap="wrap" alignItems="center">
              {!hasAnyGovernanceAction ? (
                <Chip
                  label="Administrative Approval &amp; Disbursement Controls Restricted to Authorized SACCO Officers"
                  sx={{
                    bgcolor: "#f8fafc",
                    color: "#64748b",
                    border: "1px solid #e2e8f0",
                    fontWeight: 700,
                    fontSize: "0.82rem",
                    py: 0.5,
                  }}
                />
              ) : (
                <>
                  {/* If Pending: Approve or Reject */}
                  {isPending && (
                    <>
                      {canApproveLoans && (
                        <Button
                          variant="contained"
                          startIcon={<IconCheck size={18} />}
                          disabled={actionLoading}
                          onClick={() => handleUpdateStatus("approved")}
                          sx={{
                            background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                            color: "#ffffff",
                            fontWeight: 800,
                            fontSize: "0.9rem",
                            px: 2.5,
                            py: 1,
                            borderRadius: 2.5,
                            boxShadow: "0 4px 14px rgba(5, 150, 105, 0.35)",
                            "&:hover": {
                              background: "linear-gradient(135deg, #047857 0%, #065f46 100%)",
                            },
                          }}
                        >
                          Approve Loan
                        </Button>
                      )}

                      {canRejectLoans && (
                        <Button
                          variant="outlined"
                          startIcon={<IconX size={18} />}
                          disabled={actionLoading}
                          onClick={() => handleUpdateStatus("rejected")}
                          sx={{
                            borderColor: "#f43f5e",
                            color: "#e11d48",
                            fontWeight: 800,
                            fontSize: "0.9rem",
                            px: 2.5,
                            py: 1,
                            borderRadius: 2.5,
                            "&:hover": {
                              borderColor: "#be123c",
                              bgcolor: "#fff1f2",
                            },
                          }}
                        >
                          Reject Loan
                        </Button>
                      )}

                      {canDeleteLoans && (
                        <Button
                          variant="outlined"
                          startIcon={<IconTrash size={18} />}
                          disabled={actionLoading}
                          onClick={() => setDeleteDialogOpen(true)}
                          sx={{
                            borderColor: "#fca5a5",
                            color: "#dc2626",
                            fontWeight: 800,
                            fontSize: "0.9rem",
                            px: 2,
                            py: 1,
                            borderRadius: 2.5,
                            "&:hover": {
                              borderColor: "#dc2626",
                              bgcolor: "#fef2f2",
                            },
                          }}
                        >
                          Delete Application
                        </Button>
                      )}
                    </>
                  )}

                  {/* If Approved: Disburse & Activate */}
                  {isApproved && (
                    <>
                      {canDisburseLoans && (
                        <Button
                          variant="contained"
                          startIcon={<IconCash size={18} />}
                          disabled={actionLoading}
                          onClick={() =>
                            handleUpdateStatus("active", {
                              disbursement_date: new Date().toISOString().split("T")[0],
                            })
                          }
                          sx={{
                            background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
                            color: "#ffffff",
                            fontWeight: 800,
                            fontSize: "0.9rem",
                            px: 2.5,
                            py: 1,
                            borderRadius: 2.5,
                            boxShadow: "0 4px 14px rgba(13, 148, 136, 0.35)",
                            "&:hover": {
                              background: "linear-gradient(135deg, #0f766e 0%, #115e59 100%)",
                            },
                          }}
                        >
                          Disburse &amp; Activate Loan
                        </Button>
                      )}

                      {canDeleteLoans && (
                        <Button
                          variant="outlined"
                          startIcon={<IconTrash size={18} />}
                          disabled={actionLoading}
                          onClick={() => setDeleteDialogOpen(true)}
                          sx={{
                            borderColor: "#fca5a5",
                            color: "#dc2626",
                            fontWeight: 800,
                            fontSize: "0.9rem",
                            px: 2,
                            py: 1,
                            borderRadius: 2.5,
                            "&:hover": {
                              borderColor: "#dc2626",
                              bgcolor: "#fef2f2",
                            },
                          }}
                        >
                          Cancel / Delete
                        </Button>
                      )}
                    </>
                  )}

                  {/* If Active: Record Repayment / Pay Loan & Option to close */}
                  {isActive && (
                    <>
                      <Button
                        variant="contained"
                        startIcon={<IconCash size={18} />}
                        disabled={actionLoading}
                        onClick={() => {
                          setPaymentAmount("");
                          setPaymentDialogOpen(true);
                        }}
                        sx={{
                          background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                          color: "#ffffff",
                          fontWeight: 800,
                          fontSize: "0.9rem",
                          px: 2.5,
                          py: 1,
                          borderRadius: 2.5,
                          boxShadow: "0 4px 14px rgba(37, 99, 235, 0.35)",
                          "&:hover": {
                            background: "linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)",
                          },
                        }}
                      >
                        Record Repayment
                      </Button>

                      {canDisburseLoans && (
                        <Tooltip
                          title={
                            Number(loan.outstanding_balance || 0) > 0.01
                              ? `Loan has an active balance of ${formatCurrency(
                                  loan.outstanding_balance
                                )}. Balance must be settled to Ksh 0.00 via repayments before closing.`
                              : "Mark this loan as fully settled and closed."
                          }
                          arrow
                        >
                          <span>
                            <Button
                              variant="outlined"
                              startIcon={<IconCertificate size={18} />}
                              disabled={
                                actionLoading ||
                                Number(loan.outstanding_balance || 0) > 0.01
                              }
                              onClick={() => {
                                if (Number(loan.outstanding_balance || 0) > 0.01) {
                                  setSnackbar({
                                    open: true,
                                    message: `Cannot close loan: Outstanding balance is ${formatCurrency(
                                      loan.outstanding_balance
                                    )}. Please record repayments first.`,
                                    severity: "warning",
                                  });
                                  return;
                                }
                                handleUpdateStatus("closed", {
                                  outstanding_balance: "0.00",
                                });
                              }}
                              sx={{
                                borderColor: "#059669",
                                color: "#059669",
                                fontWeight: 800,
                                fontSize: "0.9rem",
                                px: 2.5,
                                py: 1,
                                borderRadius: 2.5,
                                "&:hover": {
                                  borderColor: "#047857",
                                  bgcolor: "#ecfdf5",
                                },
                                "&.Mui-disabled": {
                                  borderColor: "#cbd5e1",
                                  color: "#94a3b8",
                                },
                              }}
                            >
                              Mark as Fully Repaid
                            </Button>
                          </span>
                        </Tooltip>
                      )}
                    </>
                  )}

                  {/* If Rejected: Option to delete record */}
                  {isRejected && canDeleteLoans && (
                    <Button
                      variant="outlined"
                      startIcon={<IconTrash size={18} />}
                      disabled={actionLoading}
                      onClick={() => setDeleteDialogOpen(true)}
                      sx={{
                        borderColor: "#fca5a5",
                        color: "#dc2626",
                        fontWeight: 800,
                        fontSize: "0.9rem",
                        px: 2.5,
                        py: 1,
                        borderRadius: 2.5,
                        "&:hover": {
                          borderColor: "#dc2626",
                          bgcolor: "#fef2f2",
                        },
                      }}
                    >
                      Delete Application
                    </Button>
                  )}
                </>
              )}
            </Stack>
          </Stack>
        </Paper>

        {/* Financial KPI Summary Cards */}
        <Grid container spacing={2.5}>
          {/* 1. Principal Amount */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: "1px solid #e2e8f0",
                borderLeft: "5px solid #059669",
                bgcolor: "#ffffff",
                boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                    Principal Amount
                  </Typography>
                  <Typography variant="h6" fontWeight={900} sx={{ color: "#0f172a", mt: 0.5, fontFamily: "monospace" }}>
                    {formatCurrency(loan.principal_amount)}
                  </Typography>
                </Box>
                <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: "#ecfdf5", color: "#059669" }}>
                  <IconCoins size={24} />
                </Box>
              </Stack>
            </Paper>
          </Grid>

          {/* 2. Outstanding Balance */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: "1px solid #e2e8f0",
                borderLeft: "5px solid #2563eb",
                bgcolor: "#ffffff",
                boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                    Outstanding Balance
                  </Typography>
                  <Typography variant="h6" fontWeight={900} sx={{ color: Number(loan.outstanding_balance) > 0 ? "#1e3a8a" : "#059669", mt: 0.5, fontFamily: "monospace" }}>
                    {formatCurrency(loan.outstanding_balance)}
                  </Typography>
                </Box>
                <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: "#eff6ff", color: "#2563eb" }}>
                  <IconReceipt size={24} />
                </Box>
              </Stack>
            </Paper>
          </Grid>

          {/* 3. Deposit Paid */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: "1px solid #e2e8f0",
                borderLeft: "5px solid #0d9488",
                bgcolor: "#ffffff",
                boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                    Deposit Down-Payment
                  </Typography>
                  <Typography variant="h6" fontWeight={900} sx={{ color: "#0f172a", mt: 0.5, fontFamily: "monospace" }}>
                    {formatCurrency(loan.deposit_paid_amount)}
                  </Typography>
                </Box>
                <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: "#f0fdfa", color: "#0d9488" }}>
                  <IconCash size={24} />
                </Box>
              </Stack>
            </Paper>
          </Grid>

          {/* 4. Security Valuation */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: "1px solid #e2e8f0",
                borderLeft: "5px solid #d97706",
                bgcolor: "#ffffff",
                boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                    Collateral Valuation
                  </Typography>
                  <Typography variant="h6" fontWeight={900} sx={{ color: "#0f172a", mt: 0.5, fontFamily: "monospace" }}>
                    {loan.security_provided_value ? formatCurrency(loan.security_provided_value) : "Unsecured / Personal"}
                  </Typography>
                </Box>
                <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: "#fffbeb", color: "#d97706" }}>
                  <IconShieldCheck size={24} />
                </Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        {/* Section 1: Loan Terms & Schedule */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3.5 },
            borderRadius: 3.5,
            border: "1px solid #e2e8f0",
            borderLeft: "6px solid #059669",
            bgcolor: "#ffffff",
            boxShadow: "0 4px 20px -4px rgba(5, 150, 105, 0.08)",
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" mb={3} pb={2} borderBottom="1px solid #f1f5f9">
            <Box
              sx={{
                width: 44,
                height: 44,
                bgcolor: "#ecfdf5",
                color: "#059669",
                borderRadius: 2.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(5, 150, 105, 0.15)",
              }}
            >
              <IconCoins size={24} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={900} sx={{ color: "#0f172a", fontSize: "1.15rem" }}>
                1. Loan Facility &amp; Amortization Terms
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
                Credit structure, product class, principal, and disbursement timetable
              </Typography>
            </Box>
          </Stack>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                Loan Reference Number
              </Typography>
              <Typography sx={{ fontWeight: 900, color: "#065f46", fontFamily: "monospace", fontSize: "1.05rem", mt: 0.3 }}>
                {loan.loan_number}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                Product Tier ID
              </Typography>
              <Typography sx={{ fontWeight: 800, color: "#1e293b", fontSize: "1rem", mt: 0.3 }}>
                Loan Product #{loan.loan_product_id}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                Principal Approved
              </Typography>
              <Typography sx={{ fontWeight: 900, color: "#0f172a", fontFamily: "monospace", fontSize: "1.05rem", mt: 0.3 }}>
                {formatCurrency(loan.principal_amount)}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                Application Date
              </Typography>
              <Typography sx={{ fontWeight: 700, color: "#334155", mt: 0.3 }}>
                {formatDate(loan.application_date)}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                Disbursement Date
              </Typography>
              <Typography sx={{ fontWeight: 700, color: "#334155", mt: 0.3 }}>
                {formatDate(loan.disbursement_date)}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                Current Outstanding Balance
              </Typography>
              <Typography sx={{ fontWeight: 900, color: Number(loan.outstanding_balance) > 0 ? "#2563eb" : "#059669", fontFamily: "monospace", fontSize: "1.05rem", mt: 0.3 }}>
                {formatCurrency(loan.outstanding_balance)}
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Section 2: Borrower & Guarantor Information */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3.5 },
            borderRadius: 3.5,
            border: "1px solid #e2e8f0",
            borderLeft: "6px solid #0d9488",
            bgcolor: "#ffffff",
            boxShadow: "0 4px 20px -4px rgba(13, 148, 136, 0.08)",
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" mb={3} pb={2} borderBottom="1px solid #f1f5f9">
            <Box
              sx={{
                width: 44,
                height: 44,
                bgcolor: "#f0fdfa",
                color: "#0d9488",
                borderRadius: 2.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(13, 148, 136, 0.15)",
              }}
            >
              <IconUser size={24} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={900} sx={{ color: "#0f172a", fontSize: "1.15rem" }}>
                2. Borrower Member &amp; Endorsing Guarantor
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
                Linked membership files, KYC credentials, and guarantor endorsements
              </Typography>
            </Box>
          </Stack>

          <Grid container spacing={3}>
            {/* Borrower Card */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  border: "1px solid #99f6e4",
                  bgcolor: "#f0fdfa",
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                  <Typography variant="caption" sx={{ color: "#0f766e", fontWeight: 800, textTransform: "uppercase" }}>
                    BORROWER MEMBER PROFILE
                  </Typography>
                  <Button
                    size="small"
                    variant="contained"
                    color="primary"
                    endIcon={<IconExternalLink size={14} />}
                    onClick={() => router.push(`/members/${loan.member_id}`)}
                    sx={{
                      fontWeight: 800,
                      borderRadius: 2,
                      fontSize: "0.75rem",
                      bgcolor: "#0d9488",
                      color: "#ffffff",
                      "&:hover": { bgcolor: "#0f766e" },
                    }}
                  >
                    View Dossier
                  </Button>
                </Stack>

                {borrowerMember ? (
                  <Stack spacing={1}>
                    <Typography variant="h6" fontWeight={900} color="#0f172a">
                      {borrowerMember.first_name} {borrowerMember.other_names}
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                      <Chip
                        label={`No: ${borrowerMember.membership_number}`}
                        size="small"
                        sx={{ fontWeight: 800, fontFamily: "monospace", bgcolor: "#ccfbf1", color: "#0f766e" }}
                      />
                      <Chip
                        label={`Phone: ${borrowerMember.phone_number}`}
                        size="small"
                        sx={{ fontWeight: 700, bgcolor: "#ffffff", color: "#0f766e", border: "1px solid #99f6e4" }}
                      />
                      {borrowerMember.national_id && (
                        <Chip
                          label={`ID: ${borrowerMember.national_id}`}
                          size="small"
                          sx={{ fontWeight: 700, bgcolor: "#ffffff", color: "#0f766e", border: "1px solid #99f6e4" }}
                        />
                      )}
                    </Stack>
                  </Stack>
                ) : (
                  <Typography variant="body2" fontWeight={800} color="#0f766e">
                    Member Account #{loan.member_id}
                  </Typography>
                )}
              </Paper>
            </Grid>

            {/* Guarantor Card */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  border: "1px solid #bfdbfe",
                  bgcolor: "#eff6ff",
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                  <Typography variant="caption" sx={{ color: "#1d4ed8", fontWeight: 800, textTransform: "uppercase" }}>
                    ENDORSING GUARANTOR PROFILE
                  </Typography>
                  {loan.guarantor_member_id && (
                    <Button
                      size="small"
                      variant="contained"
                      endIcon={<IconExternalLink size={14} />}
                      onClick={() => router.push(`/members/${loan.guarantor_member_id}`)}
                      sx={{
                        fontWeight: 800,
                        borderRadius: 2,
                        fontSize: "0.75rem",
                        bgcolor: "#2563eb",
                        color: "#ffffff",
                        "&:hover": { bgcolor: "#1d4ed8" },
                      }}
                    >
                      View Guarantor
                    </Button>
                  )}
                </Stack>

                {guarantorMember ? (
                  <Stack spacing={1}>
                    <Typography variant="h6" fontWeight={900} color="#0f172a">
                      {guarantorMember.first_name} {guarantorMember.other_names}
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                      <Chip
                        label={`No: ${guarantorMember.membership_number}`}
                        size="small"
                        sx={{ fontWeight: 800, fontFamily: "monospace", bgcolor: "#dbeafe", color: "#1e40af" }}
                      />
                      <Chip
                        label={`Phone: ${guarantorMember.phone_number}`}
                        size="small"
                        sx={{ fontWeight: 700, bgcolor: "#ffffff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}
                      />
                      {guarantorMember.national_id && (
                        <Chip
                          label={`ID: ${guarantorMember.national_id}`}
                          size="small"
                          sx={{ fontWeight: 700, bgcolor: "#ffffff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}
                        />
                      )}
                    </Stack>
                  </Stack>
                ) : guarantorRecord ? (
                  <Stack spacing={1}>
                    <Typography variant="h6" fontWeight={900} color="#0f172a">
                      {guarantorRecord.first_name} {guarantorRecord.other_names}
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                      <Chip
                        label={`Phone: ${guarantorRecord.phone_number}`}
                        size="small"
                        sx={{ fontWeight: 700, bgcolor: "#ffffff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}
                      />
                      {guarantorRecord.national_id && (
                        <Chip
                          label={`ID: ${guarantorRecord.national_id}`}
                          size="small"
                          sx={{ fontWeight: 700, bgcolor: "#ffffff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}
                        />
                      )}
                      {guarantorRecord.relationship && (
                        <Chip
                          label={`Relation: ${guarantorRecord.relationship}`}
                          size="small"
                          sx={{ fontWeight: 700, bgcolor: "#dbeafe", color: "#1e40af" }}
                        />
                      )}
                    </Stack>
                  </Stack>
                ) : loan.guarantor_name ? (
                  <Stack spacing={1}>
                    <Typography variant="h6" fontWeight={900} color="#0f172a">
                      {loan.guarantor_name}
                    </Typography>
                    {loan.guarantor_phone && (
                      <Typography variant="body2" fontWeight={700} color="#1d4ed8">
                        Phone: {loan.guarantor_phone}
                      </Typography>
                    )}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="#64748b" fontWeight={700}>
                    No Guarantor Assigned (Unsecured / Personal Credit)
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Paper>

        {/* Section 3: Collateral & Security Particulars */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3.5 },
            borderRadius: 3.5,
            border: "1px solid #e2e8f0",
            borderLeft: "6px solid #2563eb",
            bgcolor: "#ffffff",
            boxShadow: "0 4px 20px -4px rgba(37, 99, 235, 0.08)",
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" mb={3} pb={2} borderBottom="1px solid #f1f5f9">
            <Box
              sx={{
                width: 44,
                height: 44,
                bgcolor: "#eff6ff",
                color: "#2563eb",
                borderRadius: 2.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(37, 99, 235, 0.15)",
              }}
            >
              <IconShieldCheck size={24} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={900} sx={{ color: "#0f172a", fontSize: "1.15rem" }}>
                3. Collateral Security &amp; Asset Particulars
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
                Pledged securities, asset valuation records, and upfront down-payments
              </Typography>
            </Box>
          </Stack>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                Collateral Appraisal Value
              </Typography>
              <Typography sx={{ fontWeight: 900, color: "#1e3a8a", fontFamily: "monospace", fontSize: "1.05rem", mt: 0.3 }}>
                {loan.security_provided_value ? formatCurrency(loan.security_provided_value) : "Not Specified / Zero Value"}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                Upfront Deposit Down-Payment
              </Typography>
              <Typography sx={{ fontWeight: 900, color: "#065f46", fontFamily: "monospace", fontSize: "1.05rem", mt: 0.3 }}>
                {formatCurrency(loan.deposit_paid_amount)}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                Security Notes &amp; Asset Particulars
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  mt: 0.8,
                  borderRadius: 2.5,
                  bgcolor: "#f8fafc",
                  borderColor: "#e2e8f0",
                }}
              >
                <Typography variant="body2" sx={{ color: loan.security_provided_notes ? "#1e293b" : "#64748b", fontStyle: loan.security_provided_notes ? "normal" : "italic", fontWeight: 600 }}>
                  {loan.security_provided_notes || "No additional security notes or chattel documents recorded for this facility."}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Paper>

        {/* Section 4: System Governance & Audit Trail */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3.5 },
            borderRadius: 3.5,
            border: "1px solid #e2e8f0",
            borderLeft: "6px solid #6366f1",
            bgcolor: "#ffffff",
            boxShadow: "0 4px 20px -4px rgba(99, 102, 241, 0.08)",
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" mb={3} pb={2} borderBottom="1px solid #f1f5f9">
            <Box
              sx={{
                width: 44,
                height: 44,
                bgcolor: "#eef2ff",
                color: "#6366f1",
                borderRadius: 2.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(99, 102, 241, 0.15)",
              }}
            >
              <IconFileText size={24} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={900} sx={{ color: "#0f172a", fontSize: "1.15rem" }}>
                4. Governance &amp; Audit Trail
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
                System timestamps, engine reference records, and immutable audit logs
              </Typography>
            </Box>
          </Stack>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                Credit Application Logged At
              </Typography>
              <Typography sx={{ fontWeight: 700, color: "#334155", mt: 0.3 }}>
                {formatDate(loan.created_at)}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                Credit Facility Database Key
              </Typography>
              <Typography sx={{ fontWeight: 800, color: "#6366f1", fontFamily: "monospace", mt: 0.3 }}>
                RECORD-ID #{loan.id}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Stack>

      {/* Confirmation Modal for Delete Loan */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: { borderRadius: 3, p: 1 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: "#dc2626" }}>
          Delete Loan Application
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "#334155", fontWeight: 500 }}>
            Are you sure you want to permanently delete loan application <strong>{loan.loan_number}</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            sx={{ fontWeight: 700, color: "#64748b" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteLoan}
            variant="contained"
            disabled={actionLoading}
            sx={{
              bgcolor: "#dc2626",
              color: "#ffffff",
              fontWeight: 800,
              borderRadius: 2,
              "&:hover": { bgcolor: "#b91c1c" },
            }}
          >
            Confirm Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Record Repayment Modal Dialog */}
      <Dialog
        open={paymentDialogOpen}
        onClose={() => !paymentSubmitting && setPaymentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3.5, p: 1 },
        }}
      >
        <form onSubmit={handleRecordPaymentSubmit}>
          <DialogTitle sx={{ fontWeight: 900, color: "#0f172a", pb: 1 }}>
            Record Loan Repayment
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ color: "#64748b", mb: 2.5, fontSize: "0.9rem" }}>
              Posting repayment for credit facility <strong>{loan.loan_number}</strong>. This updates the borrower's outstanding balance immediately on the Loan Engine.
            </DialogContentText>

            <Paper
              elevation={0}
              sx={{
                p: 2,
                mb: 3,
                bgcolor: "#f8fafc",
                borderRadius: 2.5,
                border: "1px solid #e2e8f0",
              }}
            >
              <Stack direction="row" justifyContent="space-between" mb={1}>
                <Typography variant="body2" color="text.secondary">
                  Current Outstanding Balance:
                </Typography>
                <Typography variant="body2" fontWeight={800} color="error.main">
                  KES {Number(loan.outstanding_balance || 0).toLocaleString()}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Borrower Member ID:
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  Member #{loan.member_id}
                </Typography>
              </Stack>
            </Paper>

            <Stack spacing={2.5}>
              <TextField
                fullWidth
                required
                type="number"
                label="Repayment Amount (KES) *"
                placeholder="e.g. 5000"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                disabled={paymentSubmitting}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">KES</InputAdornment>
                    ),
                  },
                }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              />

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    required
                    type="date"
                    label="Payment Date *"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    disabled={paymentSubmitting}
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    select
                    fullWidth
                    label="Payment Mode"
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    disabled={paymentSubmitting}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                  >
                    <MenuItem value="MPESA">M-Pesa</MenuItem>
                    <MenuItem value="BANK">Bank Transfer</MenuItem>
                    <MenuItem value="CASH">Cash Deposit</MenuItem>
                    <MenuItem value="CHEQUE">Cheque</MenuItem>
                  </TextField>
                </Grid>
              </Grid>

              {paymentMode === "MPESA" && (
                <TextField
                  fullWidth
                  label="M-Pesa Transaction Reference"
                  placeholder="e.g. QHX78291KL"
                  value={paymentMpesaRef}
                  onChange={(e) => setPaymentMpesaRef(e.target.value)}
                  disabled={paymentSubmitting}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                />
              )}

              <TextField
                fullWidth
                multiline
                rows={2}
                label="Payment Notes / Remarks"
                placeholder="Optional remarks or installment details..."
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                disabled={paymentSubmitting}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              />
            </Stack>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
            <Button
              onClick={() => setPaymentDialogOpen(false)}
              disabled={paymentSubmitting}
              sx={{ fontWeight: 700, color: "#64748b" }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={paymentSubmitting || !paymentAmount}
              startIcon={
                paymentSubmitting ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <IconCash size={18} />
                )
              }
              sx={{
                background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                color: "#ffffff",
                fontWeight: 800,
                borderRadius: 2,
                px: 3,
                py: 1,
              }}
            >
              {paymentSubmitting ? "Posting Repayment..." : "Post Repayment"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Action Notification Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4500}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: "100%", borderRadius: 2.5, fontWeight: 700 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
