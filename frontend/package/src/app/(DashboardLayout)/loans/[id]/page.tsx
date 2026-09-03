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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  IconButton,
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
  IconCalendarEvent,
  IconHistory,
  IconListCheck,
  IconUserCheck,
} from "@tabler/icons-react";
import loanService from "@/services/loan.service";
import memberService from "@/services/member.service";
import guarantorService from "@/services/guarantor.service";
import nextOfKinService from "@/services/nextOfKin.service";
import vehicleService from "@/services/vehicle.service";
import { Loan, LoanScheduleEntry, LoanRepayment } from "@/interfaces/loan";
import { Member } from "@/interfaces/member";
import { Guarantor } from "@/interfaces/guarantor";
import { NextOfKin } from "@/interfaces/nextOfKin";
import { Vehicle } from "@/interfaces/vehicle";
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
  const [borrowerNextOfKin, setBorrowerNextOfKin] = useState<NextOfKin[]>([]);
  const [borrowerVehicles, setBorrowerVehicles] = useState<Vehicle[]>([]);
  const [borrowerDialogOpen, setBorrowerDialogOpen] = useState(false);

  const [guarantorMember, setGuarantorMember] = useState<Member | null>(null);
  const [guarantorRecord, setGuarantorRecord] = useState<Guarantor | null>(null);
  const [guarantorNextOfKin, setGuarantorNextOfKin] = useState<NextOfKin[]>([]);
  const [guarantorVehicles, setGuarantorVehicles] = useState<Vehicle[]>([]);
  const [guarantorDialogOpen, setGuarantorDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Repayments State
  const [repayments, setRepayments] = useState<LoanRepayment[]>([]);
  const [loadingRepayments, setLoadingRepayments] = useState(false);

  // Workflow Dialog States
  const [appraiseDialogOpen, setAppraiseDialogOpen] = useState(false);
  const [appraisalNotes, setAppraisalNotes] = useState("");

  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState("");

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const [disburseDialogOpen, setDisburseDialogOpen] = useState(false);
  const [disbursementDate, setDisbursementDate] = useState(new Date().toISOString().split("T")[0]);

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

  const loadRepayments = async (loanId: number) => {
    try {
      setLoadingRepayments(true);
      const res = await fetch(`/api/loans/${loanId}/repayments`);
      if (res.ok) {
        const data = await res.json();
        setRepayments(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to load repayments:", err);
    } finally {
      setLoadingRepayments(false);
    }
  };

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
          loan: loan.id,
          payment_date: paymentDate,
          amount_paid: Number(paymentAmount),
          payment_method: paymentMode.toLowerCase(),
          transaction_reference: paymentMpesaRef || `TXN-${Date.now()}`,
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
        await loadRepayments(loan.id);
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
      loadRepayments(loanId);

      const borrowerId = data.member_id || (typeof data.member === "number" ? data.member : (data.member as any)?.id);
      if (borrowerId) {
        memberService.getById(borrowerId).then(setBorrowerMember).catch(() => null);
        nextOfKinService.getAllByMember(borrowerId).then(setBorrowerNextOfKin).catch(() => []);
        vehicleService.getAllByMember(borrowerId).then(setBorrowerVehicles).catch(() => []);
        guarantorService.getByMember(borrowerId).then((res) => {
          setGuarantorRecord(res);
          if (res?.guarantor_member) {
            memberService.getById(res.guarantor_member).then((gm) => {
              setGuarantorMember(gm);
              if (gm?.id) {
                nextOfKinService.getAllByMember(gm.id).then(setGuarantorNextOfKin).catch(() => []);
                vehicleService.getAllByMember(gm.id).then(setGuarantorVehicles).catch(() => []);
              }
            }).catch(() => null);
          }
        }).catch(() => null);
      }

      const primaryGuarantorId = data.guarantor_member_id || data.guarantors?.[0]?.guarantor_member || (data.guarantors?.[0] as any)?.guarantor_id;
      if (primaryGuarantorId) {
        memberService.getById(primaryGuarantorId).then((gm) => {
          setGuarantorMember(gm);
          if (gm?.id) {
            nextOfKinService.getAllByMember(gm.id).then(setGuarantorNextOfKin).catch(() => []);
            vehicleService.getAllByMember(gm.id).then(setGuarantorVehicles).catch(() => []);
          }
        }).catch(() => null);
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

  // Engine Lifecycle Actions
  const handleAppraise = async () => {
    if (!loan) return;
    try {
      setActionLoading(true);
      const updated = await loanService.appraise(loan.id, appraisalNotes);
      setLoan(updated);
      setAppraiseDialogOpen(false);
      setSnackbar({
        open: true,
        message: "Loan application successfully appraised.",
        severity: "success",
      });
      await loadLoan();
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.response?.data?.error || err.response?.data?.detail || "Failed to appraise loan.",
        severity: "error",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!loan) return;
    try {
      setActionLoading(true);
      const updated = await loanService.approve(loan.id, approvalNotes);
      setLoan(updated);
      setApproveDialogOpen(false);
      setSnackbar({
        open: true,
        message: "Loan application successfully approved and ready for disbursement!",
        severity: "success",
      });
      await loadLoan();
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.response?.data?.error || err.response?.data?.detail || "Failed to approve loan.",
        severity: "error",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!loan || !rejectionReason.trim()) {
      setSnackbar({
        open: true,
        message: "Please specify the rejection reason.",
        severity: "warning",
      });
      return;
    }
    try {
      setActionLoading(true);
      const updated = await loanService.reject(loan.id, rejectionReason);
      setLoan(updated);
      setRejectDialogOpen(false);
      setSnackbar({
        open: true,
        message: "Loan application has been rejected.",
        severity: "info",
      });
      await loadLoan();
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.response?.data?.error || err.response?.data?.detail || "Failed to reject loan.",
        severity: "error",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisburse = async () => {
    if (!loan) return;
    try {
      setActionLoading(true);
      const updated = await loanService.disburse(loan.id, disbursementDate);
      setLoan(updated);
      setDisburseDialogOpen(false);
      setSnackbar({
        open: true,
        message: "Loan facility disbursed successfully! Amortization schedule and ledger entries generated.",
        severity: "success",
      });
      await loadLoan();
      await loadRepayments(loan.id);
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.response?.data?.error || err.response?.data?.detail || "Failed to disburse loan.",
        severity: "error",
      });
    } finally {
      setActionLoading(false);
    }
  };

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
                  {/* If Pending: Appraise, Approve or Reject */}
                  {isPending && (
                    <>
                      {loan.status === "pending_application" && canApproveLoans && (
                        <Button
                          variant="contained"
                          startIcon={<IconListCheck size={18} />}
                          disabled={actionLoading}
                          onClick={() => {
                            setAppraisalNotes("");
                            setAppraiseDialogOpen(true);
                          }}
                          sx={{
                            background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                            color: "#ffffff",
                            fontWeight: 800,
                            fontSize: "0.9rem",
                            px: 2.5,
                            py: 1,
                            borderRadius: 2.5,
                            boxShadow: "0 4px 14px rgba(2, 132, 199, 0.35)",
                            "&:hover": { background: "linear-gradient(135deg, #0369a1 0%, #075985 100%)" },
                          }}
                        >
                          Appraise Application
                        </Button>
                      )}

                      {canApproveLoans && (
                        <Button
                          variant="contained"
                          startIcon={<IconCheck size={18} />}
                          disabled={actionLoading}
                          onClick={() => {
                            setApprovalNotes("");
                            setApproveDialogOpen(true);
                          }}
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
                          onClick={() => {
                            setRejectionReason("");
                            setRejectDialogOpen(true);
                          }}
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
                          onClick={() => {
                            setDisbursementDate(new Date().toISOString().split("T")[0]);
                            setDisburseDialogOpen(true);
                          }}
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

                      {canRejectLoans && (
                        <Button
                          variant="outlined"
                          startIcon={<IconX size={18} />}
                          disabled={actionLoading}
                          onClick={() => {
                            setRejectionReason("");
                            setRejectDialogOpen(true);
                          }}
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

        {/* Section 2: Amortization Repayment Schedule */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3.5 },
            borderRadius: 3.5,
            border: "1px solid #e2e8f0",
            borderLeft: "6px solid #10b981",
            bgcolor: "#ffffff",
            boxShadow: "0 4px 20px -4px rgba(16, 185, 129, 0.08)",
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" mb={3} pb={2} borderBottom="1px solid #f1f5f9" justifyContent="space-between" flexWrap="wrap" gap={1}>
            <Stack direction="row" spacing={1.5} alignItems="center">
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
                <IconCalendarEvent size={24} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={900} sx={{ color: "#0f172a", fontSize: "1.15rem" }}>
                  2. Amortization Repayment Schedule
                </Typography>
                <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
                  Generated installment timetable, principal/interest allocation, and payment progress
                </Typography>
              </Box>
            </Stack>

            {loan.schedule_entries && loan.schedule_entries.length > 0 && (
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  size="small"
                  label={`${loan.schedule_entries.filter((s) => s.is_paid).length} of ${loan.schedule_entries.length} Paid`}
                  sx={{ bgcolor: "#ecfdf5", color: "#047857", fontWeight: 800, border: "1px solid #a7f3d0" }}
                />
              </Stack>
            )}
          </Stack>

          {!loan.schedule_entries || loan.schedule_entries.length === 0 ? (
            <Box textAlign="center" py={4} bgcolor="#f8fafc" borderRadius={2.5} border="1px dashed #cbd5e1">
              <IconCalendar size={36} color="#94a3b8" />
              <Typography variant="body1" fontWeight={700} color="#475569" mt={1}>
                No Amortization Schedule Generated Yet
              </Typography>
              <Typography variant="body2" color="#64748b" maxWidth={500} mx="auto" mt={0.5}>
                {isApproved
                  ? "This loan has been approved. Clicking 'Disburse & Activate Loan' above will generate the official amortization schedule and post initial ledger entries."
                  : isPending
                  ? "The amortization schedule will be created upon credit approval and subsequent facility disbursement."
                  : "Amortization records are not available for this loan status."}
              </Typography>
            </Box>
          ) : (
            <TableContainer sx={{ maxHeight: 440, borderRadius: 2, border: "1px solid #e2e8f0" }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow sx={{ "& th": { bgcolor: "#f8fafc", fontWeight: 800, color: "#334155", py: 1.5 } }}>
                    <TableCell>#</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell align="right">Principal</TableCell>
                    <TableCell align="right">Interest</TableCell>
                    <TableCell align="right">Total Due</TableCell>
                    <TableCell align="right">Paid Amount</TableCell>
                    <TableCell align="right">Remaining Due</TableCell>
                    <TableCell align="right">Closing Balance</TableCell>
                    <TableCell align="center">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loan.schedule_entries.map((entry) => {
                    const isOverdue = !entry.is_paid && new Date(entry.due_date) < new Date();
                    return (
                      <TableRow
                        key={entry.id || entry.period_number}
                        hover
                        sx={{
                          bgcolor: entry.is_paid ? "#f0fdf4" : isOverdue ? "#fff1f2" : "inherit",
                          "&:hover": { bgcolor: entry.is_paid ? "#dcfce7" : isOverdue ? "#ffe4e6" : "#f1f5f9" },
                        }}
                      >
                        <TableCell sx={{ fontWeight: 800, color: "#475569" }}>{entry.period_number}</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: "#1e293b" }}>{formatDate(entry.due_date)}</TableCell>
                        <TableCell align="right" sx={{ fontFamily: "monospace", fontWeight: 700 }}>
                          {formatCurrency(entry.expected_principal)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: "monospace", fontWeight: 700, color: "#0d9488" }}>
                          {formatCurrency(entry.expected_interest)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: "monospace", fontWeight: 900, color: "#0f172a" }}>
                          {formatCurrency(entry.expected_amount)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: "monospace", fontWeight: 700, color: "#059669" }}>
                          {formatCurrency(entry.total_paid || 0)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: "monospace", fontWeight: 700, color: Number(entry.total_due || 0) > 0 ? "#e11d48" : "#059669" }}>
                          {formatCurrency(entry.total_due ?? entry.expected_amount)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: "monospace", fontWeight: 700, color: "#64748b" }}>
                          {formatCurrency(entry.closing_balance)}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            size="small"
                            label={entry.is_paid ? "Paid" : isOverdue ? "Overdue" : "Pending"}
                            sx={{
                              fontSize: "0.72rem",
                              fontWeight: 800,
                              bgcolor: entry.is_paid ? "#ecfdf5" : isOverdue ? "#fee2e2" : "#fef3c7",
                              color: entry.is_paid ? "#047857" : isOverdue ? "#991b1b" : "#92400e",
                              border: `1px solid ${entry.is_paid ? "#a7f3d0" : isOverdue ? "#fca5a5" : "#fde68a"}`,
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        {/* Section 3: Repayments History & Payment Ledger */}
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
          <Stack direction="row" spacing={1.5} alignItems="center" mb={3} pb={2} borderBottom="1px solid #f1f5f9" justifyContent="space-between" flexWrap="wrap" gap={1}>
            <Stack direction="row" spacing={1.5} alignItems="center">
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
                <IconHistory size={24} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={900} sx={{ color: "#0f172a", fontSize: "1.15rem" }}>
                  3. Repayments History &amp; Payment Ledger
                </Typography>
                <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
                  Posted member payments, transaction references, and waterfall allocation
                </Typography>
              </Box>
            </Stack>

            {isActive && (
              <Button
                variant="contained"
                size="small"
                startIcon={<IconCash size={16} />}
                onClick={() => {
                  setPaymentAmount("");
                  setPaymentDialogOpen(true);
                }}
                sx={{
                  bgcolor: "#2563eb",
                  fontWeight: 800,
                  borderRadius: 2,
                  "&:hover": { bgcolor: "#1d4ed8" },
                }}
              >
                Record Repayment
              </Button>
            )}
          </Stack>

          {repayments.length === 0 ? (
            <Box textAlign="center" py={4} bgcolor="#f8fafc" borderRadius={2.5} border="1px dashed #cbd5e1">
              <IconReceipt size={36} color="#94a3b8" />
              <Typography variant="body1" fontWeight={700} color="#475569" mt={1}>
                No Repayments Posted Yet
              </Typography>
              <Typography variant="body2" color="#64748b" maxWidth={500} mx="auto" mt={0.5}>
                {isActive
                  ? "Click 'Record Repayment' above or in the action bar to record an incoming payment for this credit facility."
                  : "Payments can be recorded once the facility has been disbursed and activated."}
              </Typography>
            </Box>
          ) : (
            <TableContainer sx={{ borderRadius: 2, border: "1px solid #e2e8f0" }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ "& th": { bgcolor: "#f8fafc", fontWeight: 800, color: "#334155", py: 1.5 } }}>
                    <TableCell>Receipt #</TableCell>
                    <TableCell>Payment Date</TableCell>
                    <TableCell>Mode</TableCell>
                    <TableCell>Reference</TableCell>
                    <TableCell align="right">Amount Paid</TableCell>
                    <TableCell align="right">Allocated Principal</TableCell>
                    <TableCell align="right">Allocated Interest</TableCell>
                    <TableCell align="right">Fees/Penalty</TableCell>
                    <TableCell>Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {repayments.map((r) => (
                    <TableRow key={r.id} hover>
                      <TableCell sx={{ fontWeight: 800, fontFamily: "monospace", color: "#2563eb" }}>
                        {r.repayment_number}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#334155" }}>{formatDate(r.payment_date)}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={r.payment_method?.toUpperCase()}
                          sx={{ fontWeight: 800, fontSize: "0.7rem", bgcolor: "#f1f5f9", color: "#334155" }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontFamily: "monospace", fontWeight: 700, color: "#475569" }}>
                        {r.transaction_reference}
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: "monospace", fontWeight: 900, color: "#059669" }}>
                        {formatCurrency(r.amount_paid)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: "monospace", fontWeight: 700 }}>
                        {formatCurrency(r.allocated_principal)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: "monospace", fontWeight: 700, color: "#0d9488" }}>
                        {formatCurrency(r.allocated_interest)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: "monospace", fontWeight: 700, color: "#d97706" }}>
                        {formatCurrency(Number(r.allocated_fees || 0) + Number(r.allocated_penalty || 0))}
                      </TableCell>
                      <TableCell sx={{ color: "#64748b", fontSize: "0.82rem" }}>
                        {r.notes || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        {/* Section 4: Borrower & Guarantor Information */}
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
                4. Borrower Member &amp; Endorsing Guarantor
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
                Linked membership files, KYC credentials, and guarantor endorsements
              </Typography>
            </Box>
          </Stack>

          <Grid container spacing={3}>
            {/* Borrower & Guarantor Section */}
            {(() => {
              const borrowerId = loan.member_id || (typeof loan.member === "number" ? loan.member : (loan.member as any)?.id) || borrowerMember?.id;
              const primaryGuarantor = loan.guarantors && loan.guarantors.length > 0 ? loan.guarantors[0] : null;
              const hasGuarantor = Boolean(guarantorMember || primaryGuarantor || guarantorRecord || loan.guarantor_name);
              const linkedMemberId = guarantorMember?.id || primaryGuarantor?.guarantor_member || (primaryGuarantor as any)?.guarantor_id || guarantorRecord?.guarantor_member || loan.guarantor_member_id;

              return (
                <>
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
                          disabled={!borrowerId && !loan.member_name}
                          endIcon={<IconExternalLink size={14} />}
                          onClick={() => setBorrowerDialogOpen(true)}
                          sx={{
                            fontWeight: 800,
                            borderRadius: 2,
                            fontSize: "0.75rem",
                            bgcolor: "#0d9488",
                            color: "#ffffff",
                            "&:hover": { bgcolor: "#0f766e" },
                            "&.Mui-disabled": { bgcolor: "#cbd5e1", color: "#64748b" },
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
                            {borrowerMember.phone_number && (
                              <Chip
                                label={`Phone: ${borrowerMember.phone_number}`}
                                size="small"
                                sx={{ fontWeight: 700, bgcolor: "#ffffff", color: "#0f766e", border: "1px solid #99f6e4" }}
                              />
                            )}
                            {borrowerMember.national_id && (
                              <Chip
                                label={`ID: ${borrowerMember.national_id}`}
                                size="small"
                                sx={{ fontWeight: 700, bgcolor: "#ffffff", color: "#0f766e", border: "1px solid #99f6e4" }}
                              />
                            )}
                          </Stack>
                        </Stack>
                      ) : loan.member_name ? (
                        <Stack spacing={1}>
                          <Typography variant="h6" fontWeight={900} color="#0f172a">
                            {loan.member_name}
                          </Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                            {loan.membership_number && (
                              <Chip
                                label={`No: ${loan.membership_number}`}
                                size="small"
                                sx={{ fontWeight: 800, fontFamily: "monospace", bgcolor: "#ccfbf1", color: "#0f766e" }}
                              />
                            )}
                            {loan.member_phone && (
                              <Chip
                                label={`Phone: ${loan.member_phone}`}
                                size="small"
                                sx={{ fontWeight: 700, bgcolor: "#ffffff", color: "#0f766e", border: "1px solid #99f6e4" }}
                              />
                            )}
                            {loan.member_national_id && (
                              <Chip
                                label={`ID: ${loan.member_national_id}`}
                                size="small"
                                sx={{ fontWeight: 700, bgcolor: "#ffffff", color: "#0f766e", border: "1px solid #99f6e4" }}
                              />
                            )}
                          </Stack>
                        </Stack>
                      ) : (
                        <Typography variant="body2" fontWeight={800} color="#0f766e">
                          Member Account #{borrowerId || "N/A"}
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
                        {hasGuarantor && (
                          <Button
                            size="small"
                            variant="contained"
                            endIcon={<IconExternalLink size={14} />}
                            onClick={() => setGuarantorDialogOpen(true)}
                            sx={{
                              fontWeight: 800,
                              borderRadius: 2,
                              fontSize: "0.75rem",
                              bgcolor: "#2563eb",
                              color: "#ffffff",
                              "&:hover": { bgcolor: "#1d4ed8" },
                            }}
                          >
                            View Dossier
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
                            {guarantorMember.phone_number && (
                              <Chip
                                label={`Phone: ${guarantorMember.phone_number}`}
                                size="small"
                                sx={{ fontWeight: 700, bgcolor: "#ffffff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}
                              />
                            )}
                            {guarantorMember.national_id && (
                              <Chip
                                label={`ID: ${guarantorMember.national_id}`}
                                size="small"
                                sx={{ fontWeight: 700, bgcolor: "#ffffff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}
                              />
                            )}
                            {primaryGuarantor?.guarantee_amount && (
                              <Chip
                                label={`Pledged: ${formatCurrency(primaryGuarantor.guarantee_amount)}`}
                                size="small"
                                sx={{ fontWeight: 800, bgcolor: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0" }}
                              />
                            )}
                          </Stack>
                        </Stack>
                      ) : primaryGuarantor ? (
                        <Stack spacing={1}>
                          <Typography variant="h6" fontWeight={900} color="#0f172a">
                            {primaryGuarantor.guarantor_name || `Guarantor #${primaryGuarantor.guarantor_member}`}
                          </Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                            {primaryGuarantor.guarantor_membership_no && (
                              <Chip
                                label={`No: ${primaryGuarantor.guarantor_membership_no}`}
                                size="small"
                                sx={{ fontWeight: 800, fontFamily: "monospace", bgcolor: "#dbeafe", color: "#1e40af" }}
                              />
                            )}
                            {primaryGuarantor.guarantor_phone && (
                              <Chip
                                label={`Phone: ${primaryGuarantor.guarantor_phone}`}
                                size="small"
                                sx={{ fontWeight: 700, bgcolor: "#ffffff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}
                              />
                            )}
                            {primaryGuarantor.guarantee_amount && (
                              <Chip
                                label={`Pledged: ${formatCurrency(primaryGuarantor.guarantee_amount)}`}
                                size="small"
                                sx={{ fontWeight: 800, bgcolor: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0" }}
                              />
                            )}
                            <Chip
                              label={`Status: ${primaryGuarantor.status?.toUpperCase() || "ACCEPTED"}`}
                              size="small"
                              sx={{ fontWeight: 800, bgcolor: "#f0fdf4", color: "#166534" }}
                            />
                          </Stack>
                        </Stack>
                      ) : guarantorRecord ? (
                        <Stack spacing={1}>
                          <Typography variant="h6" fontWeight={900} color="#0f172a">
                            {guarantorRecord.first_name} {guarantorRecord.other_names}
                          </Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                            {guarantorRecord.phone_number && (
                              <Chip
                                label={`Phone: ${guarantorRecord.phone_number}`}
                                size="small"
                                sx={{ fontWeight: 700, bgcolor: "#ffffff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}
                              />
                            )}
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
                </>
              );
            })()}
          </Grid>
        </Paper>

        {/* Section 5: Collateral & Security Particulars */}
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
                5. Collateral Security &amp; Asset Particulars
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

        {/* Section 6: System Governance & Audit Trail */}
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
                6. Governance &amp; Audit Trail
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

      {/* Appraisal Modal Dialog */}
      <Dialog
        open={appraiseDialogOpen}
        onClose={() => !actionLoading && setAppraiseDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3.5, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: "#0284c7" }}>
          Appraise Credit Application
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "#475569", mb: 2 }}>
            Complete credit appraisal review for application <strong>{loan.loan_number}</strong>. You may attach technical appraisal notes or credit score recommendations.
          </DialogContentText>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Appraisal Notes & Observations"
            placeholder="e.g. Credit score verified, debt-service ratio within 33% threshold..."
            value={appraisalNotes}
            onChange={(e) => setAppraisalNotes(e.target.value)}
            disabled={actionLoading}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setAppraiseDialogOpen(false)} disabled={actionLoading} sx={{ fontWeight: 700 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={actionLoading}
            onClick={handleAppraise}
            sx={{ bgcolor: "#0284c7", color: "#ffffff", fontWeight: 800, borderRadius: 2, "&:hover": { bgcolor: "#0369a1" } }}
          >
            {actionLoading ? "Saving..." : "Confirm Appraisal"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Approval Modal Dialog */}
      <Dialog
        open={approveDialogOpen}
        onClose={() => !actionLoading && setApproveDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3.5, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: "#059669" }}>
          Approve Loan Facility
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "#475569", mb: 2 }}>
            Grant formal credit committee approval for loan <strong>{loan.loan_number}</strong> of <strong>{formatCurrency(loan.principal_amount)}</strong>.
          </DialogContentText>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Approval Committee Notes (Optional)"
            placeholder="e.g. Approved per Credit Committee Resolution #24..."
            value={approvalNotes}
            onChange={(e) => setApprovalNotes(e.target.value)}
            disabled={actionLoading}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setApproveDialogOpen(false)} disabled={actionLoading} sx={{ fontWeight: 700 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={actionLoading}
            onClick={handleApprove}
            sx={{ bgcolor: "#059669", color: "#ffffff", fontWeight: 800, borderRadius: 2, "&:hover": { bgcolor: "#047857" } }}
          >
            {actionLoading ? "Approving..." : "Confirm Approval"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rejection Modal Dialog */}
      <Dialog
        open={rejectDialogOpen}
        onClose={() => !actionLoading && setRejectDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3.5, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: "#dc2626" }}>
          Reject Loan Application
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "#475569", mb: 2 }}>
            Provide the formal reason for rejecting loan application <strong>{loan.loan_number}</strong>. This will be recorded permanently in the credit audit trail.
          </DialogContentText>
          <TextField
            fullWidth
            required
            multiline
            rows={3}
            label="Rejection Reason *"
            placeholder="e.g. Insufficient collateral, guarantor declined endorsement, high debt-to-income..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            disabled={actionLoading}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setRejectDialogOpen(false)} disabled={actionLoading} sx={{ fontWeight: 700 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={actionLoading || !rejectionReason.trim()}
            onClick={handleReject}
            sx={{ bgcolor: "#dc2626", color: "#ffffff", fontWeight: 800, borderRadius: 2, "&:hover": { bgcolor: "#b91c1c" } }}
          >
            {actionLoading ? "Rejecting..." : "Confirm Rejection"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Disbursement Modal Dialog */}
      <Dialog
        open={disburseDialogOpen}
        onClose={() => !actionLoading && setDisburseDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3.5, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: "#0d9488" }}>
          Disburse &amp; Activate Loan Facility
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "#475569", mb: 2.5 }}>
            Disbursing loan <strong>{loan.loan_number}</strong> will:
            <br />• Generate the official periodic <strong>Amortization Schedule</strong>.
            <br />• Post the double-entry <strong>Disbursement Journal</strong> in the General Ledger.
            <br />• Transition status to <strong>Active Credit Facility</strong>.
          </DialogContentText>
          <TextField
            fullWidth
            required
            type="date"
            label="Disbursement Date *"
            value={disbursementDate}
            onChange={(e) => setDisbursementDate(e.target.value)}
            disabled={actionLoading}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDisburseDialogOpen(false)} disabled={actionLoading} sx={{ fontWeight: 700 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={actionLoading || !disbursementDate}
            onClick={handleDisburse}
            sx={{
              background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
              color: "#ffffff",
              fontWeight: 800,
              borderRadius: 2,
              px: 3,
            }}
          >
            {actionLoading ? "Processing Disbursement..." : "Confirm & Disburse Loan"}
          </Button>
        </DialogActions>
      </Dialog>

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

      {/* Borrower Member KYC Dossier Dialog (Read-Only) */}
      {(() => {
        const displayName = borrowerMember
          ? `${borrowerMember.first_name} ${borrowerMember.other_names}`
          : loan.member_name || "Borrower Member";
        const memNo = borrowerMember?.membership_number || loan.membership_number || "—";
        const phone = borrowerMember?.phone_number || loan.member_phone || "—";
        const nationalId = borrowerMember?.national_id || loan.member_national_id || "—";

        return (
          <Dialog
            open={borrowerDialogOpen}
            onClose={() => setBorrowerDialogOpen(false)}
            maxWidth="md"
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: 3.5,
                p: 1,
                boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25)",
              },
            }}
          >
            <DialogTitle sx={{ pb: 1 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2.5,
                      bgcolor: "#ccfbf1",
                      color: "#0f766e",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <IconUserCheck size={26} />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={900} color="#0f172a">
                      Borrower Member Dossier
                    </Typography>
                    <Typography variant="caption" color="#64748b" fontWeight={600}>
                      Confidential Member Profile, KYC Credentials & Registration File
                    </Typography>
                  </Box>
                </Stack>
                <IconButton size="small" onClick={() => setBorrowerDialogOpen(false)} sx={{ color: "#94a3b8" }}>
                  <IconX size={20} />
                </IconButton>
              </Stack>
            </DialogTitle>

            <DialogContent dividers sx={{ py: 3, maxHeight: "75vh" }}>
              <Stack spacing={3}>
                {/* Header Banner */}
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    bgcolor: "#f0fdfa",
                    border: "1px solid #99f6e4",
                  }}
                >
                  <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} gap={2}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box
                        sx={{
                          width: 52,
                          height: 52,
                          borderRadius: 3,
                          bgcolor: "#0d9488",
                          color: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 900,
                          fontSize: "1.25rem",
                        }}
                      >
                        {(displayName?.[0] || "M").toUpperCase()}
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: "#0f766e", fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5 }}>
                          PRIMARY APPLICANT & BORROWER
                        </Typography>
                        <Typography variant="h5" fontWeight={900} color="#0f172a">
                          {displayName}
                        </Typography>
                        <Typography variant="body2" color="#0f766e" fontWeight={700}>
                          {borrowerMember?.category_name || "SACCO Member"} • {borrowerMember?.organization_name || "Member Registration System"}
                        </Typography>
                      </Box>
                    </Stack>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <Chip
                        label={`No: ${memNo}`}
                        sx={{ fontWeight: 900, fontFamily: "monospace", bgcolor: "#ccfbf1", color: "#0f766e" }}
                      />
                      <Chip
                        label={borrowerMember?.status || "ACTIVE"}
                        sx={{ fontWeight: 800, bgcolor: "#dcfce7", color: "#166534" }}
                      />
                    </Stack>
                  </Stack>
                </Box>

                {/* Section 1: Personal KYC Details */}
                <Box>
                  <Typography variant="caption" fontWeight={800} color="#64748b" textTransform="uppercase" letterSpacing={0.5} mb={1.5} display="block">
                    1. Personal KYC Profile & Demographics
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Box sx={{ p: 1.75, borderRadius: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                        <Typography variant="caption" color="#64748b" fontWeight={700}>NATIONAL ID / PASSPORT</Typography>
                        <Typography variant="body1" fontWeight={800} color="#0f172a">
                          {nationalId}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Box sx={{ p: 1.75, borderRadius: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                        <Typography variant="caption" color="#64748b" fontWeight={700}>PHONE NUMBER</Typography>
                        <Typography variant="body1" fontWeight={800} color="#0f172a">
                          {phone}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Box sx={{ p: 1.75, borderRadius: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                        <Typography variant="caption" color="#64748b" fontWeight={700}>EMAIL ADDRESS</Typography>
                        <Typography variant="body1" fontWeight={800} color="#0f172a">
                          {borrowerMember?.email || "Not Provided"}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Box sx={{ p: 1.75, borderRadius: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                        <Typography variant="caption" color="#64748b" fontWeight={700}>PHYSICAL ADDRESS</Typography>
                        <Typography variant="body1" fontWeight={800} color="#0f172a">
                          {borrowerMember?.physical_address || "Not Specified"}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Box sx={{ p: 1.75, borderRadius: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                        <Typography variant="caption" color="#64748b" fontWeight={700}>OCCUPATION / TRADE</Typography>
                        <Typography variant="body1" fontWeight={800} color="#0f172a">
                          {borrowerMember?.occupation || "Self-Employed"}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Box sx={{ p: 1.75, borderRadius: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                        <Typography variant="caption" color="#64748b" fontWeight={700}>KRA PIN IDENTIFIER</Typography>
                        <Typography variant="body1" fontWeight={800} color="#0f172a">
                          {borrowerMember?.kra_pin || "—"}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>

                {/* Section 2: Membership Standing */}
                <Box>
                  <Typography variant="caption" fontWeight={800} color="#64748b" textTransform="uppercase" letterSpacing={0.5} mb={1.5} display="block">
                    2. SACCO Membership Standing & Verification
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Box sx={{ p: 1.75, borderRadius: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                        <Typography variant="caption" color="#64748b" fontWeight={700}>REGISTRATION STAGE</Typography>
                        <Typography variant="body2" fontWeight={800} color="#166534">
                          {borrowerMember?.registration_stage || "Completed & Active"}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Box sx={{ p: 1.75, borderRadius: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                        <Typography variant="caption" color="#64748b" fontWeight={700}>MEMBER SINCE</Typography>
                        <Typography variant="body2" fontWeight={800} color="#0f172a">
                          {borrowerMember?.created_at ? new Date(borrowerMember.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Active Member"}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Box sx={{ p: 1.75, borderRadius: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                        <Typography variant="caption" color="#64748b" fontWeight={700}>KYC VERIFIER</Typography>
                        <Typography variant="body2" fontWeight={800} color="#0f172a">
                          {borrowerMember?.approved_by_username || "SACCO Governance Admin"}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>

                {/* Section 3: Next of Kin */}
                <Box>
                  <Typography variant="caption" fontWeight={800} color="#64748b" textTransform="uppercase" letterSpacing={0.5} mb={1.5} display="block">
                    3. Next of Kin & Dependents
                  </Typography>
                  {borrowerNextOfKin.length > 0 ? (
                    <Grid container spacing={2}>
                      {borrowerNextOfKin.map((kin, idx) => (
                        <Grid size={{ xs: 12, sm: 6 }} key={kin.id || idx}>
                          <Box sx={{ p: 2, borderRadius: 2, bgcolor: "#fdf4ff", border: "1px solid #f5d0fe" }}>
                            <Typography variant="body1" fontWeight={800} color="#86198f">
                              {kin.first_name} {kin.other_names}
                            </Typography>
                            <Typography variant="caption" color="#701a75" fontWeight={600} display="block" mb={0.5}>
                              Relation: {kin.relationship} {kin.is_primary && "• Primary Beneficiary"}
                            </Typography>
                            <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5}>
                              {kin.phone_number && <Chip size="small" label={`Phone: ${kin.phone_number}`} sx={{ bgcolor: "#ffffff" }} />}
                              {kin.national_id && <Chip size="small" label={`ID: ${kin.national_id}`} sx={{ bgcolor: "#ffffff" }} />}
                            </Stack>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                      <Typography variant="body2" color="#64748b" fontWeight={600}>
                        No secondary Next of Kin records registered on this member's file.
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Section 4: Registered Vehicles */}
                {borrowerVehicles.length > 0 && (
                  <Box>
                    <Typography variant="caption" fontWeight={800} color="#64748b" textTransform="uppercase" letterSpacing={0.5} mb={1.5} display="block">
                      4. Registered Motor Vehicles & Security Assets
                    </Typography>
                    <Grid container spacing={2}>
                      {borrowerVehicles.map((veh, idx) => (
                        <Grid size={{ xs: 12, sm: 6 }} key={veh.id || idx}>
                          <Box sx={{ p: 2, borderRadius: 2, bgcolor: "#f0f9ff", border: "1px solid #bae6fd" }}>
                            <Typography variant="body1" fontWeight={900} color="#0369a1">
                              {veh.registration_number}
                            </Typography>
                            <Typography variant="body2" color="#0c4a6e" fontWeight={700}>
                              {veh.make} {veh.model} {veh.year ? `(${veh.year})` : ""} {veh.color ? `• ${veh.color}` : ""}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}

                {/* Section 5: Current Facility Reference */}
                <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: "#ecfdf5", border: "1px solid #a7f3d0" }}>
                  <Typography variant="caption" sx={{ color: "#047857", fontWeight: 800, textTransform: "uppercase" }}>
                    ACTIVE CREDIT FACILITY APPLICATION
                  </Typography>
                  <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} mt={1} gap={1}>
                    <Box>
                      <Typography variant="h6" fontWeight={900} color="#065f46">
                        {loan.loan_number} — {loan.product_name || "Credit Facility"}
                      </Typography>
                      <Typography variant="caption" color="#047857" fontWeight={600}>
                        Applied on {loan.application_date ? new Date(loan.application_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "N/A"}
                      </Typography>
                    </Box>
                    <Box textAlign={{ sm: "right" }}>
                      <Typography variant="caption" color="#047857" fontWeight={700}>PRINCIPAL AMOUNT</Typography>
                      <Typography variant="h5" fontWeight={900} color="#047857">
                        {formatCurrency(loan.principal_amount)}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 2.5, py: 2, justifyContent: "space-between", bgcolor: "#f8fafc" }}>
              <Typography variant="caption" color="#64748b" fontWeight={700}>
                CONFIDENTIAL SACCO BORROWER DOSSIER • VIEW-ONLY MODE
              </Typography>
              <Button
                variant="contained"
                onClick={() => setBorrowerDialogOpen(false)}
                sx={{
                  fontWeight: 800,
                  borderRadius: 2,
                  px: 3,
                  bgcolor: "#0d9488",
                  color: "#ffffff",
                  "&:hover": { bgcolor: "#0f766e" },
                }}
              >
                Close Dossier
              </Button>
            </DialogActions>
          </Dialog>
        );
      })()}

      {/* Endorsing Guarantor Dossier Dialog (Read-Only) */}
      {(() => {
        const primaryGuarantor = loan.guarantors && loan.guarantors.length > 0 ? loan.guarantors[0] : null;
        const linkedMemberId = guarantorMember?.id || primaryGuarantor?.guarantor_member || (primaryGuarantor as any)?.guarantor_id || guarantorRecord?.guarantor_member || loan.guarantor_member_id;
        const displayName = guarantorMember
          ? `${guarantorMember.first_name} ${guarantorMember.other_names}`
          : primaryGuarantor?.guarantor_name || (guarantorRecord ? `${guarantorRecord.first_name} ${guarantorRecord.other_names}` : loan.guarantor_name || "Assigned Guarantor");
        const displayPhone = guarantorMember?.phone_number || primaryGuarantor?.guarantor_phone || guarantorRecord?.phone_number || loan.guarantor_phone;
        const displayId = guarantorMember?.national_id || (primaryGuarantor as any)?.guarantor_national_id || guarantorRecord?.national_id;
        const displayMemNo = guarantorMember?.membership_number || primaryGuarantor?.guarantor_membership_no || guarantorRecord?.guarantor_number;
        const relation = guarantorRecord?.relationship || (linkedMemberId ? "SACCO Member Peer" : "Endorsing Co-Signer");

        return (
          <Dialog
            open={guarantorDialogOpen}
            onClose={() => setGuarantorDialogOpen(false)}
            maxWidth="md"
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: 3.5,
                p: 1,
                boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25)",
              },
            }}
          >
            <DialogTitle sx={{ pb: 1 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2.5,
                      bgcolor: "#dbeafe",
                      color: "#1d4ed8",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <IconShieldCheck size={26} />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={900} color="#0f172a">
                      Endorsing Guarantor Dossier
                    </Typography>
                    <Typography variant="caption" color="#64748b" fontWeight={600}>
                      Credit Underwriting Security, Legal Endorsement & Guarantor KYC Record
                    </Typography>
                  </Box>
                </Stack>
                <IconButton size="small" onClick={() => setGuarantorDialogOpen(false)} sx={{ color: "#94a3b8" }}>
                  <IconX size={20} />
                </IconButton>
              </Stack>
            </DialogTitle>

            <DialogContent dividers sx={{ py: 3, maxHeight: "75vh" }}>
              <Stack spacing={3}>
                {/* Header Badge Card */}
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    bgcolor: "#eff6ff",
                    border: "1px solid #bfdbfe",
                  }}
                >
                  <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} gap={2}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box
                        sx={{
                          width: 52,
                          height: 52,
                          borderRadius: 3,
                          bgcolor: "#2563eb",
                          color: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 900,
                          fontSize: "1.25rem",
                        }}
                      >
                        {(displayName?.[0] || "G").toUpperCase()}
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: "#1e40af", fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5 }}>
                          LEGAL ENDORSER & GUARANTOR
                        </Typography>
                        <Typography variant="h5" fontWeight={900} color="#1e3a8a">
                          {displayName}
                        </Typography>
                        <Typography variant="body2" color="#1d4ed8" fontWeight={700}>
                          {displayMemNo ? `SACCO Member #${displayMemNo}` : "External Co-Signer / Endorser"}
                        </Typography>
                      </Box>
                    </Stack>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <Chip
                        label={primaryGuarantor?.status?.toUpperCase() || (linkedMemberId ? "REGISTERED MEMBER" : "CO-SIGNER ENDORSER")}
                        sx={{
                          fontWeight: 900,
                          bgcolor: "#1d4ed8",
                          color: "#ffffff",
                          letterSpacing: 0.5,
                        }}
                      />
                    </Stack>
                  </Stack>
                </Box>

                {/* Section 1: Contact & Personal KYC Particulars */}
                <Box>
                  <Typography variant="caption" fontWeight={800} color="#64748b" textTransform="uppercase" letterSpacing={0.5} mb={1.5} display="block">
                    1. Endorser Contact & Personal KYC Particulars
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Box sx={{ p: 1.75, borderRadius: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                        <Typography variant="caption" color="#64748b" fontWeight={700}>PHONE NUMBER</Typography>
                        <Typography variant="body1" fontWeight={800} color="#0f172a">
                          {displayPhone || "Not Provided"}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Box sx={{ p: 1.75, borderRadius: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                        <Typography variant="caption" color="#64748b" fontWeight={700}>NATIONAL ID / PASSPORT</Typography>
                        <Typography variant="body1" fontWeight={800} color="#0f172a">
                          {displayId || "—"}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Box sx={{ p: 1.75, borderRadius: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                        <Typography variant="caption" color="#64748b" fontWeight={700}>RELATIONSHIP TO BORROWER</Typography>
                        <Typography variant="body1" fontWeight={800} color="#0f172a">
                          {relation}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Box sx={{ p: 1.75, borderRadius: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                        <Typography variant="caption" color="#64748b" fontWeight={700}>MEMBERSHIP STATUS</Typography>
                        <Typography variant="body1" fontWeight={800} color={displayMemNo ? "#1d4ed8" : "#64748b"}>
                          {displayMemNo ? `No: ${displayMemNo}` : "Non-Member Co-Signer"}
                        </Typography>
                      </Box>
                    </Grid>
                    {guarantorMember?.email && (
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Box sx={{ p: 1.75, borderRadius: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                          <Typography variant="caption" color="#64748b" fontWeight={700}>EMAIL ADDRESS</Typography>
                          <Typography variant="body1" fontWeight={800} color="#0f172a">
                            {guarantorMember.email}
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                    {guarantorMember?.physical_address && (
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Box sx={{ p: 1.75, borderRadius: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                          <Typography variant="caption" color="#64748b" fontWeight={700}>PHYSICAL RESIDENCE</Typography>
                          <Typography variant="body1" fontWeight={800} color="#0f172a">
                            {guarantorMember.physical_address}
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </Box>

                {/* Section 2: Guarantee Facility Obligation */}
                <Box sx={{ p: 2.5, borderRadius: 2.5, bgcolor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                  <Typography variant="caption" sx={{ color: "#166534", fontWeight: 800, textTransform: "uppercase" }}>
                    2. GUARANTEE COMMITMENT & UNDERWRITING OBLIGATION
                  </Typography>
                  <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} mt={1.5} gap={1}>
                    <Box>
                      <Typography variant="caption" color="#166534" fontWeight={600}>
                        Linked Credit Facility
                      </Typography>
                      <Typography variant="h6" fontWeight={900} color="#0f172a">
                        {loan.loan_number} ({loan.product_name || "Credit Facility"})
                      </Typography>
                      <Typography variant="caption" color="#166534" fontWeight={600}>
                        Total Facility Value: {formatCurrency(loan.principal_amount)}
                      </Typography>
                    </Box>
                    <Box textAlign={{ sm: "right" }}>
                      <Typography variant="caption" color="#166534" fontWeight={700}>
                        UNDERWRITTEN PLEDGE AMOUNT
                      </Typography>
                      <Typography variant="h5" fontWeight={900} color="#15803d">
                        {primaryGuarantor?.guarantee_amount ? formatCurrency(primaryGuarantor.guarantee_amount) : "Full Credit Coverage"}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                {/* Section 3: Borrower Endorsement Context */}
                <Box sx={{ p: 2, borderRadius: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                  <Typography variant="caption" color="#64748b" fontWeight={700} display="block" mb={0.5}>
                    3. PRIMARY BORROWER ENDORSED
                  </Typography>
                  <Typography variant="body1" fontWeight={800} color="#0f172a">
                    {borrowerMember ? `${borrowerMember.first_name} ${borrowerMember.other_names}` : loan.member_name}
                    {" "}
                    <span style={{ color: "#0f766e", fontWeight: 700 }}>
                      ({borrowerMember?.membership_number || loan.membership_number || "Member"})
                    </span>
                  </Typography>
                  <Typography variant="caption" color="#64748b" fontWeight={600}>
                    By underwriting this facility, the endorser accepts joint liability under SACCO Credit Policy bylaws.
                  </Typography>
                </Box>

                {/* Section 4: Guarantor's Registered Assets (if member) */}
                {guarantorVehicles.length > 0 && (
                  <Box>
                    <Typography variant="caption" fontWeight={800} color="#64748b" textTransform="uppercase" letterSpacing={0.5} mb={1.5} display="block">
                      4. Guarantor's Registered Chattels & Vehicles
                    </Typography>
                    <Grid container spacing={2}>
                      {guarantorVehicles.map((veh, idx) => (
                        <Grid size={{ xs: 12, sm: 6 }} key={veh.id || idx}>
                          <Box sx={{ p: 2, borderRadius: 2, bgcolor: "#f0f9ff", border: "1px solid #bae6fd" }}>
                            <Typography variant="body1" fontWeight={900} color="#0369a1">
                              {veh.registration_number}
                            </Typography>
                            <Typography variant="body2" color="#0c4a6e" fontWeight={700}>
                              {veh.make} {veh.model} {veh.year ? `(${veh.year})` : ""}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
              </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 2.5, py: 2, justifyContent: "space-between", bgcolor: "#f8fafc" }}>
              <Typography variant="caption" color="#64748b" fontWeight={700}>
                LEGAL SACCO GUARANTOR RECORD • VIEW-ONLY MODE
              </Typography>
              <Button
                variant="contained"
                onClick={() => setGuarantorDialogOpen(false)}
                sx={{
                  fontWeight: 800,
                  borderRadius: 2,
                  px: 3,
                  bgcolor: "#2563eb",
                  color: "#ffffff",
                  "&:hover": { bgcolor: "#1d4ed8" },
                }}
              >
                Close Dossier
              </Button>
            </DialogActions>
          </Dialog>
        );
      })()}

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
