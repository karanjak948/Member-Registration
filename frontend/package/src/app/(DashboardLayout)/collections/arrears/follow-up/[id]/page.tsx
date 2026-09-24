"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import {
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Stack,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Tooltip,
  IconButton,
  LinearProgress,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import ExportButton from "@/components/common/ExportButton";
import { ExportColumn } from "@/utils/exportGrid";
import {
  IconPhoneCall,
  IconMessage,
  IconCheck,
  IconArrowLeft,
  IconCalendar,
  IconUser,
  IconCash,
  IconClock,
  IconShieldCheck,
  IconSend,
  IconHistory,
  IconCopy,
  IconFileText,
  IconAlertTriangle,
} from "@tabler/icons-react";

interface ScheduleEntry {
  id: number;
  period_number: number;
  due_date: string;
  expected_amount: number;
  expected_principal: number;
  expected_interest: number;
  total_paid: number;
  total_due: number;
  is_paid: boolean;
  closing_balance?: number;
}

interface GuarantorRecord {
  id: number;
  guarantor_name: string;
  guarantor_phone: string;
  guarantor_membership_no: string;
  guarantee_amount: number;
  status: string;
}

interface LoanDetail {
  id: number;
  loan_number: string;
  member_id: number;
  member_name?: string;
  membership_number?: string;
  member_phone?: string;
  member_national_id?: string;
  product_name?: string;
  principal_amount: number;
  outstanding_balance: number;
  principal_balance: number;
  interest_balance: number;
  penalty_balance: number;
  status: string;
  days_overdue?: number;
  last_payment_date?: string;
  application_date?: string;
  disbursement_date?: string;
  maturity_date?: string;
  schedule_entries?: ScheduleEntry[];
  guarantors?: GuarantorRecord[];
}

interface FollowUpActivity {
  id: string;
  timestamp: string;
  officer: string;
  type: "call" | "sms" | "visit" | "ptp" | "note";
  outcome: string;
  notes: string;
  ptpDate?: string;
  ptpAmount?: number;
}

export default function FollowUpPage() {
  const { id } = useParams() as { id: string };
  const { data: session } = useSession();
  const router = useRouter();

  const [loan, setLoan] = useState<LoanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Follow-up interaction form state
  const [activityType, setActivityType] = useState<string>("call");
  const [outcome, setOutcome] = useState<string>("Promised to Pay (PTP)");
  const [notes, setNotes] = useState<string>("");
  const [ptpDate, setPtpDate] = useState<string>("");
  const [ptpAmount, setPtpAmount] = useState<string>("");
  const [activities, setActivities] = useState<FollowUpActivity[]>([]);

  // Dialog states
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [smsModalOpen, setSmsModalOpen] = useState(false);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [resolveNotes, setResolveNotes] = useState("");

  // SMS composer state
  const [smsTemplate, setSmsTemplate] = useState<string>("reminder");
  const [smsMessage, setSmsMessage] = useState<string>("");
  const [sendingSms, setSendingSms] = useState(false);
  const [smsError, setSmsError] = useState<string | null>(null);
  const [smsSuccess, setSmsSuccess] = useState<string | null>(null);

  // Toast notification
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: "success" | "error" | "info" }>({
    open: false,
    message: "",
    severity: "info",
  });

  const [copiedPhone, setCopiedPhone] = useState(false);

  useEffect(() => {
    fetchLoan();
    loadStoredActivities();
  }, [id]);

  const fetchLoan = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/loans/${id}`);
      if (!res.ok) {
        throw new Error(`Failed to load loan: HTTP ${res.status}`);
      }
      const data = await res.json();
      setLoan(data);
    } catch (e: any) {
      console.error(e);
      setError("Unable to load loan details. Please check your network connection or verify the loan ID.");
    } finally {
      setLoading(false);
    }
  };

  const loadStoredActivities = () => {
    try {
      const raw = localStorage.getItem(`followup_logs_${id}`);
      if (raw) {
        setActivities(JSON.parse(raw));
      } else {
        // Initial mock activities for demonstration
        setActivities([
          {
            id: "act-1",
            timestamp: new Date(Date.now() - 86400000 * 2).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" }),
            officer: "Credit Officer",
            type: "sms",
            outcome: "Automated Reminder",
            notes: "Monthly installment reminder dispatched via Royal SACCO Gateway.",
          },
        ]);
      }
    } catch (e) {
      console.error("Failed to load activities from storage:", e);
    }
  };

  const saveActivityLog = (newAct: FollowUpActivity) => {
    const updated = [newAct, ...activities];
    setActivities(updated);
    try {
      localStorage.setItem(`followup_logs_${id}`, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save activity log:", e);
    }
  };

  // Pre-fill SMS templates based on borrower and loan
  useEffect(() => {
    if (!loan) return;
    const memberName = loan.member_name || "Valued Member";
    const loanNo = loan.loan_number;
    const dueAmount = Number(loan.outstanding_balance || 0).toLocaleString();

    if (smsTemplate === "reminder") {
      setSmsMessage(
        `Dear ${memberName}, this is a gentle reminder that your Royal SACCO loan ${loanNo} has a pending balance of KES ${dueAmount}. Kindly remit via Paybill 400200, Account: ${loanNo}. Inquiries: 0722000000.`
      );
    } else if (smsTemplate === "watchlist") {
      setSmsMessage(
        `URGENT: Dear ${memberName}, your loan ${loanNo} is ${loan.days_overdue || 14} days overdue with outstanding KES ${dueAmount}. Please regularize your account within 48 hours to avoid penalty charges.`
      );
    } else if (smsTemplate === "guarantor") {
      setSmsMessage(
        `FINAL DEMAND: Dear ${memberName}, loan ${loanNo} remains in arrears. Failure to clear KES ${dueAmount} by Friday will result in notification of your guarantors and credit listing.`
      );
    }
  }, [smsTemplate, loan]);

  const handleCopyPhone = () => {
    if (loan?.member_phone) {
      navigator.clipboard.writeText(loan.member_phone);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
      setToast({ open: true, message: "Phone number copied to clipboard", severity: "info" });
    }
  };

  const handleLogFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim() && outcome !== "Promised to Pay (PTP)") {
      setToast({ open: true, message: "Please provide detailed notes for this interaction.", severity: "error" });
      return;
    }

    const newActivity: FollowUpActivity = {
      id: `act-${Date.now()}`,
      timestamp: new Date().toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" }),
      officer: session?.user?.name || "Credit Officer",
      type: activityType as any,
      outcome,
      notes: notes.trim(),
      ptpDate: ptpDate || undefined,
      ptpAmount: ptpAmount ? Number(ptpAmount) : undefined,
    };

    saveActivityLog(newActivity);
    setNotes("");
    setPtpDate("");
    setPtpAmount("");
    setToast({ open: true, message: "Follow-up interaction recorded successfully!", severity: "success" });
  };

  const handleSendSms = async () => {
    if (!loan?.member_phone) {
      setToast({ open: true, message: "Member does not have a valid phone number recorded.", severity: "error" });
      return;
    }
    if (!smsMessage.trim()) {
      setToast({ open: true, message: "SMS message text cannot be empty.", severity: "error" });
      return;
    }

    setSendingSms(true);
    setSmsError(null);
    setSmsSuccess(null);
    try {
      const res = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone_number: loan.member_phone,
          message: smsMessage.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSmsSuccess("SMS dispatched successfully to borrower!");
        setToast({ open: true, message: "SMS dispatched successfully to borrower!", severity: "success" });
        saveActivityLog({
          id: `sms-${Date.now()}`,
          timestamp: new Date().toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" }),
          officer: session?.user?.name || "Credit Officer",
          type: "sms",
          outcome: `SMS Dispatched (${smsTemplate})`,
          notes: smsMessage.trim(),
        });
        setTimeout(() => setSmsModalOpen(false), 1500);
      } else {
        const errorMsg = data.error || data.detail || "SMS Gateway delivery failed.";
        setSmsError(errorMsg);
        setToast({
          open: true,
          message: errorMsg,
          severity: "error",
        });
        saveActivityLog({
          id: `sms-fail-${Date.now()}`,
          timestamp: new Date().toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" }),
          officer: session?.user?.name || "Credit Officer",
          type: "sms",
          outcome: "SMS Dispatch Failed",
          notes: `Attempted SMS: "${smsMessage.slice(0, 80)}...". Gateway rejected: ${errorMsg}`,
        });
      }
    } catch (e: any) {
      const errMsg = e.message || "Network error while sending SMS.";
      setSmsError(errMsg);
      setToast({ open: true, message: errMsg, severity: "error" });
    } finally {
      setSendingSms(false);
    }
  };

  const handleResolveArrears = () => {
    saveActivityLog({
      id: `res-${Date.now()}`,
      timestamp: new Date().toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" }),
      officer: session?.user?.name || "Credit Officer",
      type: "note",
      outcome: "Marked as Resolved / Restructured",
      notes: resolveNotes.trim() || "Account follow-up marked as resolved by credit officer.",
    });
    setResolveModalOpen(false);
    setToast({ open: true, message: "Arrears follow-up case updated and marked as resolved!", severity: "success" });
  };

  const getStatusBadge = (statusStr?: string) => {
    const s = statusStr?.toLowerCase();
    if (s === "active") return <Chip label="Active / Servicing" color="success" size="small" sx={{ fontWeight: 700 }} />;
    if (s === "watchful") return <Chip label="Watchlist (1-30d)" color="warning" size="small" sx={{ fontWeight: 700 }} />;
    if (s === "non_performing") return <Chip label="Non-Performing (31-90d)" color="error" size="small" sx={{ fontWeight: 700 }} />;
    if (s === "doubtful" || s === "defaulted")
      return <Chip label="Doubtful / Defaulted" sx={{ bgcolor: "#991b1b", color: "#fff", fontWeight: 700 }} size="small" />;
    return <Chip label={statusStr || "Active"} size="small" sx={{ fontWeight: 700 }} />;
  };

  if (loading) {
    return (
      <PageContainer title="Loading Follow-Up..." description="Fetching loan follow-up record">
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="50vh" gap={2}>
          <CircularProgress size={42} />
          <Typography variant="body1" color="text.secondary">
            Loading borrower credit profile and arrears history...
          </Typography>
        </Box>
      </PageContainer>
    );
  }

  if (error || !loan) {
    return (
      <PageContainer title="Loan Not Found" description="Loan record error">
        <Box sx={{ p: 4, maxWidth: 650, mx: "auto" }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error || "Loan account could not be found."}
          </Alert>
          <Button variant="contained" startIcon={<IconArrowLeft size={18} />} onClick={() => router.push("/collections/arrears")}>
            Return to Arrears Register
          </Button>
        </Box>
      </PageContainer>
    );
  }

  const unpaidEntries = (loan.schedule_entries || []).filter((s) => !s.is_paid);
  const totalArrears = unpaidEntries.reduce((acc, s) => acc + Number(s.total_due || 0), 0);
  const percentRepaid =
    loan.principal_amount > 0
      ? Math.min(100, Math.round(((loan.principal_amount - loan.principal_balance) / loan.principal_amount) * 100))
      : 0;

  const scheduleExportColumns: ExportColumn<ScheduleEntry>[] = [
    { header: "Period", accessor: (row) => row.period_number },
    { header: "Due Date", accessor: (row) => row.due_date },
    { header: "Expected Amount (KES)", accessor: (row) => Number(row.expected_amount || 0).toLocaleString() },
    { header: "Expected Principal (KES)", accessor: (row) => Number(row.expected_principal || 0).toLocaleString() },
    { header: "Expected Interest (KES)", accessor: (row) => Number(row.expected_interest || 0).toLocaleString() },
    { header: "Remaining Due (KES)", accessor: (row) => Number(row.total_due || 0).toLocaleString() },
    { header: "Status", accessor: (row) => (row.is_paid ? "Paid" : "Unpaid") },
  ];

  const activityExportColumns: ExportColumn<FollowUpActivity>[] = [
    { header: "Timestamp", accessor: (row) => row.timestamp },
    { header: "Officer", accessor: (row) => row.officer },
    { header: "Channel", accessor: (row) => row.type.toUpperCase() },
    { header: "Outcome", accessor: (row) => row.outcome },
    { header: "Promise Date", accessor: (row) => row.ptpDate || "-" },
    { header: "Promise Amount (KES)", accessor: (row) => (row.ptpAmount ? row.ptpAmount.toLocaleString() : "-") },
    { header: "Notes", accessor: (row) => row.notes },
  ];

  return (
    <PageContainer
      title={`Follow-Up: ${loan.loan_number} - Royal SACCO`}
      description="Borrower delinquency follow-up and collections recovery console"
    >
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        {/* Top Breadcrumb & Action Banner */}
        <Box
          sx={{
            mb: 3,
            p: 3,
            borderRadius: 3,
            background: "linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)",
            color: "#ffffff",
            boxShadow: "0 10px 25px -5px rgba(6, 78, 59, 0.3)",
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "center" }}
            spacing={2}
          >
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                <Button
                  size="small"
                  startIcon={<IconArrowLeft size={16} />}
                  onClick={() => router.push("/collections/arrears")}
                  sx={{
                    color: "#a7f3d0",
                    p: 0,
                    minWidth: "auto",
                    fontWeight: 600,
                    textTransform: "none",
                    "&:hover": { color: "#ffffff", bgcolor: "transparent" },
                  }}
                >
                  Arrears Management
                </Button>
                <Typography variant="caption" sx={{ color: "#6ee7b7" }}>
                  /
                </Typography>
                <Typography variant="caption" sx={{ color: "#ffffff", fontWeight: 700 }}>
                  Follow-Up Console
                </Typography>
              </Stack>

              <Stack direction="row" spacing={1.5} alignItems="center">
                <Typography variant="h4" fontWeight={800} sx={{ color: "#ffffff", letterSpacing: "-0.5px" }}>
                  {loan.loan_number}
                </Typography>
                {getStatusBadge(loan.status)}
              </Stack>

              <Typography variant="body2" sx={{ color: "#d1fae5", mt: 0.5 }}>
                Borrower: <strong>{loan.member_name || `Member #${loan.member_id}`}</strong> (
                {loan.membership_number ? `No. ${loan.membership_number}` : `ID: ${loan.member_id}`}) • Facility:{" "}
                {loan.product_name || "Loan Product"}
              </Typography>
            </Box>

            {/* Quick Action Button Group */}
            <Stack direction="row" spacing={1.5} flexWrap="wrap">
              <Button
                variant="contained"
                startIcon={<IconPhoneCall size={18} />}
                onClick={() => setCallModalOpen(true)}
                sx={{
                  bgcolor: "#2563eb",
                  color: "#ffffff",
                  fontWeight: 700,
                  textTransform: "none",
                  "&:hover": { bgcolor: "#1d4ed8" },
                }}
              >
                Call Member
              </Button>

              <Button
                variant="contained"
                startIcon={<IconMessage size={18} />}
                onClick={() => setSmsModalOpen(true)}
                sx={{
                  bgcolor: "#0284c7",
                  color: "#ffffff",
                  fontWeight: 700,
                  textTransform: "none",
                  "&:hover": { bgcolor: "#0369a1" },
                }}
              >
                Send SMS
              </Button>

              <Button
                variant="contained"
                startIcon={<IconCash size={18} />}
                onClick={() => router.push(`/loans/${id}?action=repay`)}
                sx={{
                  bgcolor: "#10b981",
                  color: "#ffffff",
                  fontWeight: 700,
                  textTransform: "none",
                  "&:hover": { bgcolor: "#059669" },
                }}
              >
                Record Repayment
              </Button>

              <Button
                variant="outlined"
                startIcon={<IconCheck size={18} />}
                onClick={() => setResolveModalOpen(true)}
                sx={{
                  borderColor: "rgba(255,255,255,0.4)",
                  color: "#ffffff",
                  fontWeight: 600,
                  textTransform: "none",
                  "&:hover": { borderColor: "#ffffff", bgcolor: "rgba(255,255,255,0.1)" },
                }}
              >
                Resolve Case
              </Button>
            </Stack>
          </Stack>
        </Box>

        {/* 2-Column Responsive Dashboard */}
        <Grid container spacing={3}>
          {/* LEFT COLUMN: Borrower Info & Financial Breakdown */}
          <Grid size={{ xs: 12, lg: 7 }}>
            <Stack spacing={3}>
              {/* Card 1: Borrower Profile & Contact Information */}
              <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2.5 }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
                    <Box sx={{ p: 1, bgcolor: "#f0fdf4", color: "#16a34a", borderRadius: 1.5, display: "flex" }}>
                      <IconUser size={20} />
                    </Box>
                    <Typography variant="h6" fontWeight={700}>
                      Borrower &amp; Contact Details
                    </Typography>
                  </Stack>

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        FULL NAME
                      </Typography>
                      <Typography variant="body1" fontWeight={700} color="text.primary">
                        {loan.member_name || "-"}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        MEMBERSHIP NUMBER
                      </Typography>
                      <Typography variant="body1" fontWeight={700} color="text.primary">
                        {loan.membership_number || `Member #${loan.member_id}`}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        NATIONAL ID NUMBER
                      </Typography>
                      <Typography variant="body1" fontWeight={700} color="text.primary">
                        {loan.member_national_id || "Recorded in file"}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        PRIMARY PHONE
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center" mt={0.25}>
                        <Typography variant="body1" fontWeight={800} color="primary.main">
                          {loan.member_phone || "No phone recorded"}
                        </Typography>
                        {loan.member_phone && (
                          <>
                            <Tooltip title={copiedPhone ? "Copied!" : "Copy Number"}>
                              <IconButton size="small" onClick={handleCopyPhone} sx={{ p: 0.5 }}>
                                <IconCopy size={14} />
                              </IconButton>
                            </Tooltip>
                            <Button
                              size="small"
                              component="a"
                              href={`tel:${loan.member_phone}`}
                              startIcon={<IconPhoneCall size={14} />}
                              variant="outlined"
                              color="primary"
                              sx={{ py: 0.2, px: 1, textTransform: "none", fontSize: "0.75rem", fontWeight: 700 }}
                            >
                              Call Now
                            </Button>
                          </>
                        )}
                      </Stack>
                    </Grid>
                  </Grid>

                  {/* Primary Guarantor Section */}
                  {loan.guarantors && loan.guarantors.length > 0 && (
                    <Box sx={{ mt: 2.5, p: 2, bgcolor: "#f8fafc", borderRadius: 2, border: "1px solid #e2e8f0" }}>
                      <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                        <IconShieldCheck size={18} color="#059669" />
                        <Typography variant="subtitle2" fontWeight={700}>
                          Active Guarantors ({loan.guarantors.length})
                        </Typography>
                      </Stack>
                      <Stack spacing={1}>
                        {loan.guarantors.map((g) => (
                          <Stack
                            key={g.id}
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            sx={{ fontSize: "0.85rem" }}
                          >
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {g.guarantor_name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Phone: {g.guarantor_phone || "N/A"}
                              </Typography>
                            </Box>
                            <Typography variant="body2" fontWeight={700} color="primary.main">
                              KES {Number(g.guarantee_amount || 0).toLocaleString()}
                            </Typography>
                          </Stack>
                        ))}
                      </Stack>
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* Card 2: Financial Exposure & Arrears Aging */}
              <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2.5 }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
                    <Box sx={{ p: 1, bgcolor: "#eff6ff", color: "#2563eb", borderRadius: 1.5, display: "flex" }}>
                      <IconCash size={20} />
                    </Box>
                    <Typography variant="h6" fontWeight={700}>
                      Exposure &amp; Delinquency Summary
                    </Typography>
                  </Stack>

                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Box sx={{ p: 1.5, bgcolor: "#f8fafc", borderRadius: 2, textAlign: "center" }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                          PRINCIPAL
                        </Typography>
                        <Typography variant="subtitle1" fontWeight={800} color="text.primary">
                          KES {Number(loan.principal_amount || 0).toLocaleString()}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Box sx={{ p: 1.5, bgcolor: "#f8fafc", borderRadius: 2, textAlign: "center" }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                          OUTSTANDING
                        </Typography>
                        <Typography variant="subtitle1" fontWeight={800} color="error.main">
                          KES {Number(loan.outstanding_balance || 0).toLocaleString()}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Box sx={{ p: 1.5, bgcolor: "#f8fafc", borderRadius: 2, textAlign: "center" }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                          ARREARS DUE
                        </Typography>
                        <Typography variant="subtitle1" fontWeight={800} sx={{ color: "#d97706" }}>
                          KES {totalArrears > 0 ? totalArrears.toLocaleString() : "0"}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Box sx={{ p: 1.5, bgcolor: "#f8fafc", borderRadius: 2, textAlign: "center" }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                          DAYS OVERDUE
                        </Typography>
                        <Typography
                          variant="subtitle1"
                          fontWeight={800}
                          sx={{
                            color: (loan.days_overdue || 0) > 30 ? "#dc2626" : (loan.days_overdue || 0) > 0 ? "#ea580c" : "#16a34a",
                          }}
                        >
                          {loan.days_overdue || 0} Days
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  {/* Repayment Progress */}
                  <Box sx={{ mb: 2 }}>
                    <Stack direction="row" justifyContent="space-between" mb={0.5}>
                      <Typography variant="caption" fontWeight={600} color="text.secondary">
                        Principal Repayment Progress
                      </Typography>
                      <Typography variant="caption" fontWeight={700} color="primary.main">
                        {percentRepaid}% Repaid
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={percentRepaid}
                      sx={{ height: 8, borderRadius: 4, bgcolor: "#e2e8f0" }}
                    />
                  </Box>

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="caption" color="text.secondary">
                        Disbursement Date:
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {loan.disbursement_date || "N/A"}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="caption" color="text.secondary">
                        Last Recorded Payment:
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {loan.last_payment_date || "No payment recorded yet"}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Card 3: Unpaid Repayment Schedule */}
              <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2.5 }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box sx={{ p: 1, bgcolor: "#fef3c7", color: "#d97706", borderRadius: 1.5, display: "flex" }}>
                        <IconCalendar size={20} />
                      </Box>
                      <Box>
                        <Typography variant="h6" fontWeight={700}>
                          Pending Installment Schedule
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {unpaidEntries.length} installments pending payment
                        </Typography>
                      </Box>
                    </Stack>
                    <ExportButton
                      data={unpaidEntries}
                      columns={scheduleExportColumns}
                      filename={`arrears_schedule_${loan.loan_number}`}
                      title={`Royal SACCO - Arrears Schedule (${loan.loan_number} - ${loan.member_name})`}
                      size="small"
                    />
                  </Stack>

                  {unpaidEntries.length === 0 ? (
                    <Alert severity="success" sx={{ mt: 1 }}>
                      All generated loan installments are currently marked as paid!
                    </Alert>
                  ) : (
                    <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, mt: 1 }}>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: "#f8fafc" }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Due Date</TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="right">
                              Expected
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="right">
                              Remaining Due
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="center">
                              Status
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {unpaidEntries.slice(0, 6).map((entry) => (
                            <TableRow key={entry.id} hover>
                              <TableCell sx={{ fontWeight: 700 }}>{entry.period_number}</TableCell>
                              <TableCell>{entry.due_date}</TableCell>
                              <TableCell align="right">KES {Number(entry.expected_amount || 0).toLocaleString()}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, color: "#dc2626" }}>
                                KES {Number(entry.total_due || 0).toLocaleString()}
                              </TableCell>
                              <TableCell align="center">
                                <Chip label="Unpaid" size="small" color="warning" sx={{ fontSize: "0.7rem", height: 20, fontWeight: 700 }} />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            </Stack>
          </Grid>

          {/* RIGHT COLUMN: Follow-Up Action Logger & Activity Timeline */}
          <Grid size={{ xs: 12, lg: 5 }}>
            <Stack spacing={3}>
              {/* Card 4: Log Follow-Up Interaction */}
              <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2.5 }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
                    <Box sx={{ p: 1, bgcolor: "#ede9fe", color: "#7c3aed", borderRadius: 1.5, display: "flex" }}>
                      <IconFileText size={20} />
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight={700}>
                        Log Recovery Interaction
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Record calls, commitments, and officer notes
                      </Typography>
                    </Box>
                  </Stack>

                  <form onSubmit={handleLogFollowUp}>
                    <Stack spacing={2}>
                      <TextField
                        select
                        size="small"
                        label="Channel / Interaction Type"
                        value={activityType}
                        onChange={(e) => setActivityType(e.target.value)}
                        fullWidth
                      >
                        <MenuItem value="call">Phone Call</MenuItem>
                        <MenuItem value="sms">SMS Alert / Notice</MenuItem>
                        <MenuItem value="visit">Physical Field Visit</MenuItem>
                        <MenuItem value="ptp">Promise to Pay (PTP)</MenuItem>
                        <MenuItem value="note">Internal Recovery Note</MenuItem>
                      </TextField>

                      <TextField
                        select
                        size="small"
                        label="Outcome / Status"
                        value={outcome}
                        onChange={(e) => setOutcome(e.target.value)}
                        fullWidth
                      >
                        <MenuItem value="Promised to Pay (PTP)">Promised to Pay (PTP)</MenuItem>
                        <MenuItem value="Call Answered - Promised Later">Call Answered - Follow up Later</MenuItem>
                        <MenuItem value="Unreachable / Switched Off">Unreachable / Switched Off</MenuItem>
                        <MenuItem value="Disputed Outstanding Balance">Disputed Balance</MenuItem>
                        <MenuItem value="Requested Payment Restructuring">Requested Restructure / Extension</MenuItem>
                        <MenuItem value="Guarantor Notified">Guarantor Notified</MenuItem>
                      </TextField>

                      {outcome === "Promised to Pay (PTP)" && (
                        <Grid container spacing={1.5}>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                              size="small"
                              type="date"
                              label="Promise Date"
                              InputLabelProps={{ shrink: true }}
                              value={ptpDate}
                              onChange={(e) => setPtpDate(e.target.value)}
                              fullWidth
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                              size="small"
                              type="number"
                              label="Promised Amount (KES)"
                              value={ptpAmount}
                              onChange={(e) => setPtpAmount(e.target.value)}
                              fullWidth
                            />
                          </Grid>
                        </Grid>
                      )}

                      <TextField
                        size="small"
                        multiline
                        rows={3}
                        label="Officer Notes / Interaction Details"
                        placeholder="Detail the borrower's response, reason for delinquency, or agreed next steps..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        fullWidth
                      />

                      <Button
                        type="submit"
                        variant="contained"
                        sx={{
                          bgcolor: "#0f766e",
                          color: "#ffffff",
                          fontWeight: 700,
                          textTransform: "none",
                          "&:hover": { bgcolor: "#115e59" },
                        }}
                      >
                        Save Follow-Up Entry
                      </Button>
                    </Stack>
                  </form>
                </CardContent>
              </Card>

              {/* Card 5: Follow-Up Activity & Communication Timeline */}
              <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2.5 }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box sx={{ p: 1, bgcolor: "#f1f5f9", color: "#475569", borderRadius: 1.5, display: "flex" }}>
                        <IconHistory size={20} />
                      </Box>
                      <Box>
                        <Typography variant="h6" fontWeight={700}>
                          Activity &amp; Contact Log
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {activities.length} interactions logged
                        </Typography>
                      </Box>
                    </Stack>
                    <ExportButton
                      data={activities}
                      columns={activityExportColumns}
                      filename={`followup_log_${loan.loan_number}`}
                      title={`Royal SACCO - Follow Up Log (${loan.loan_number})`}
                      size="small"
                    />
                  </Stack>

                  <Stack spacing={2}>
                    {activities.map((act) => (
                      <Box
                        key={act.id}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          position: "relative",
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                          <Chip
                            label={act.outcome}
                            size="small"
                            sx={{
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              bgcolor: act.type === "sms" ? "#e0f2fe" : act.type === "call" ? "#dbeafe" : "#fef3c7",
                              color: act.type === "sms" ? "#0369a1" : act.type === "call" ? "#1d4ed8" : "#92400e",
                            }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {act.timestamp}
                          </Typography>
                        </Stack>

                        {act.ptpAmount && act.ptpDate && (
                          <Typography variant="caption" display="block" fontWeight={700} color="success.main" mb={0.5}>
                            ★ Promised KES {act.ptpAmount.toLocaleString()} by {act.ptpDate}
                          </Typography>
                        )}

                        <Typography variant="body2" color="text.primary" sx={{ whiteSpace: "pre-wrap" }}>
                          {act.notes}
                        </Typography>

                        <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                          Logged by: {act.officer}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>

        {/* DIALOG 1: Call Member Modal */}
        <Dialog open={callModalOpen} onClose={() => setCallModalOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>Direct Member Call</DialogTitle>
          <DialogContent>
            <Box textAlign="center" py={2}>
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  bgcolor: "#dbeafe",
                  color: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mx: "auto",
                  mb: 2,
                }}
              >
                <IconPhoneCall size={32} />
              </Box>
              <Typography variant="subtitle1" fontWeight={700}>
                {loan.member_name || "Borrower"}
              </Typography>
              <Typography variant="h5" fontWeight={800} color="primary.main" my={1}>
                {loan.member_phone || "No phone recorded"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Outstanding Balance: <strong>KES {Number(loan.outstanding_balance || 0).toLocaleString()}</strong>
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 0 }}>
            <Button onClick={() => setCallModalOpen(false)} color="inherit">
              Cancel
            </Button>
            {loan.member_phone && (
              <Button
                component="a"
                href={`tel:${loan.member_phone}`}
                variant="contained"
                color="primary"
                startIcon={<IconPhoneCall size={18} />}
                onClick={() => {
                  setCallModalOpen(false);
                  saveActivityLog({
                    id: `call-${Date.now()}`,
                    timestamp: new Date().toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" }),
                    officer: session?.user?.name || "Credit Officer",
                    type: "call",
                    outcome: "Phone Call Initiated",
                    notes: `Outbound call initiated to ${loan.member_phone}.`,
                  });
                }}
                sx={{ fontWeight: 700 }}
              >
                Dial Now
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* DIALOG 2: Send SMS Notification Modal */}
        <Dialog
          open={smsModalOpen}
          onClose={() => {
            setSmsModalOpen(false);
            setSmsError(null);
            setSmsSuccess(null);
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: 800 }}>Dispatch SMS Notification</DialogTitle>
          <DialogContent>
            <Stack spacing={2} mt={1}>
              {smsError && (
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700}>
                    SMS Gateway Delivery Error:
                  </Typography>
                  <Typography variant="body2">{smsError}</Typography>
                  {smsError.toLowerCase().includes("top up") && (
                    <Typography variant="caption" display="block" mt={0.5} sx={{ color: "#991b1b", fontWeight: 600 }}>
                      ℹ The Royal SACCO Bulk SMS account has run out of SMS units. Please purchase SMS credits from the Bulk SMS provider to dispatch live alerts.
                    </Typography>
                  )}
                </Alert>
              )}

              {smsSuccess && (
                <Alert severity="success" sx={{ borderRadius: 2 }}>
                  {smsSuccess}
                </Alert>
              )}

              <TextField
                select
                size="small"
                label="Select Notification Template"
                value={smsTemplate}
                onChange={(e) => {
                  setSmsTemplate(e.target.value);
                  setSmsError(null);
                }}
                fullWidth
              >
                <MenuItem value="reminder">Friendly Overdue Reminder</MenuItem>
                <MenuItem value="watchlist">Watchlist Urgent Notice (14–30 Days)</MenuItem>
                <MenuItem value="guarantor">Final Demand &amp; Guarantor Warning</MenuItem>
                <MenuItem value="custom">Custom Message</MenuItem>
              </TextField>

              <TextField
                size="small"
                label="Recipient Phone"
                value={loan.member_phone || ""}
                disabled
                fullWidth
              />

              <TextField
                size="small"
                multiline
                rows={4}
                label="SMS Message Body"
                value={smsMessage}
                onChange={(e) => setSmsMessage(e.target.value)}
                helperText={`${smsMessage.length} characters (approx. ${Math.ceil(smsMessage.length / 160)} SMS units)`}
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setSmsModalOpen(false)} color="inherit" disabled={sendingSms}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={sendingSms ? <CircularProgress size={16} color="inherit" /> : <IconSend size={18} />}
              onClick={handleSendSms}
              disabled={sendingSms || !smsMessage.trim()}
              sx={{ fontWeight: 700, bgcolor: "#0284c7", "&:hover": { bgcolor: "#0369a1" } }}
            >
              {sendingSms ? "Sending via Gateway..." : "Send SMS Alert"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* DIALOG 3: Mark as Resolved Modal */}
        <Dialog open={resolveModalOpen} onClose={() => setResolveModalOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontWeight: 800 }}>Mark Arrears as Resolved</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" mb={2} mt={1}>
              Record the agreement, settlement details, or payment receipt that resolves this follow-up case:
            </Typography>
            <TextField
              size="small"
              multiline
              rows={3}
              label="Resolution Summary"
              placeholder="e.g. Borrower verified M-Pesa transaction KES 6,000; payment allocated..."
              value={resolveNotes}
              onChange={(e) => setResolveNotes(e.target.value)}
              fullWidth
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setResolveModalOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button variant="contained" color="success" onClick={handleResolveArrears} sx={{ fontWeight: 700 }}>
              Confirm Resolution
            </Button>
          </DialogActions>
        </Dialog>

        {/* Global Toast Feedback */}
        <Snackbar
          open={toast.open}
          autoHideDuration={4000}
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert severity={toast.severity} onClose={() => setToast((prev) => ({ ...prev, open: false }))} sx={{ width: "100%" }}>
            {toast.message}
          </Alert>
        </Snackbar>
      </Box>
    </PageContainer>
  );
}
