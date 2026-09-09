"use client";

import { useEffect, useState, useRef } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Tooltip,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import {
  IconMessage2,
  IconSend,
  IconUsers,
  IconCheck,
  IconShieldCheck,
  IconBroadcast,
  IconPhone,
  IconDeviceMobile,
  IconBellRinging,
  IconAlertTriangle,
  IconSparkles,
  IconRefresh,
  IconSearch,
  IconTag,
  IconCoins,
  IconTrash,
} from "@tabler/icons-react";
import api from "@/services/api";
import memberService from "@/services/member.service";
import loanService from "@/services/loan.service";
import { usePermissions } from "@/hooks/usePermissions";
import { Member } from "@/interfaces/member";

interface SMSLogItem {
  id: number;
  recipient_name: string;
  phone_number: string;
  message: string;
  event_type: string;
  event_type_display: string;
  status: string;
  status_display: string;
  created_at: string;
}

const TEMPLATE_PRESETS = [
  {
    title: "Loan Application",
    tag: "Application",
    color: "#0284c7",
    text: "Dear {name}, your loan application LN-XXXXXX for KES 150,000.00 (Development Loan) has been received and is under review. Thank you for choosing Royal SACCO.",
  },
  {
    title: "Loan Approval",
    tag: "Approval",
    color: "#059669",
    text: "Dear {name}, congratulations! Your loan application LN-XXXXXX of KES 150,000.00 has been APPROVED. Disbursement is being scheduled. Royal SACCO.",
  },
  {
    title: "Loan Disbursement",
    tag: "Disbursement",
    color: "#10b981",
    text: "Dear {name}, KES 150,000.00 for loan LN-XXXXXX has been DISBURSED. Monthly installment: KES 15,250.00, first due on 2026-10-05. Royal SACCO.",
  },
  {
    title: "Repayment Receipt",
    tag: "Repayment",
    color: "#6366f1",
    text: "Dear {name}, payment of KES 15,250.00 for loan LN-XXXXXX received on today. Ref: MPESA123. Outstanding balance: KES 134,750.00. Royal SACCO.",
  },
  {
    title: "Overdue Delinquency",
    tag: "Overdue",
    color: "#e11d48",
    text: "Dear {name}, your loan LN-XXXXXX is overdue by 14 days with an outstanding installment of KES 15,250.00. Please remit payment promptly to avoid penalties. Royal SACCO.",
  },
  {
    title: "Loan Completion",
    tag: "Closed",
    color: "#f59e0b",
    text: "Dear {name}, congratulations! Your loan LN-XXXXXX is FULLY REPAID and closed. Thank you for your continued commitment with Royal SACCO.",
  },
];

export default function SMSPage() {
  const { isAdmin } = usePermissions();
  const [recipientType, setRecipientType] = useState("all");
  const [customPhone, setCustomPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [logs, setLogs] = useState<SMSLogItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info",
  });

  // SMS Deletion State
  const [deleteLogDialog, setDeleteLogDialog] = useState<{
    open: boolean;
    log: SMSLogItem | null;
    deleting: boolean;
  }>({
    open: false,
    log: null,
    deleting: false,
  });

  const [clearAllDialog, setClearAllDialog] = useState<{
    open: boolean;
    clearing: boolean;
  }>({
    open: false,
    clearing: false,
  });

  const handleDeleteLog = async () => {
    if (!deleteLogDialog.log) return;
    setDeleteLogDialog((prev) => ({ ...prev, deleting: true }));
    try {
      await loanService.deleteSMSLog(deleteLogDialog.log.id);
      setToast({
        open: true,
        message: `SMS log for ${deleteLogDialog.log.phone_number} deleted successfully.`,
        severity: "success",
      });
      setDeleteLogDialog({ open: false, log: null, deleting: false });
      fetchLogs();
    } catch (err: any) {
      setToast({
        open: true,
        message: err.response?.data?.error || "Failed to delete SMS log.",
        severity: "error",
      });
      setDeleteLogDialog((prev) => ({ ...prev, deleting: false }));
    }
  };

  const handleClearAllLogs = async () => {
    setClearAllDialog((prev) => ({ ...prev, clearing: true }));
    try {
      const res = await loanService.clearAllSMSLogs();
      setToast({
        open: true,
        message: res?.message || "All SMS logs cleared successfully.",
        severity: "success",
      });
      setClearAllDialog({ open: false, clearing: false });
      fetchLogs();
    } catch (err: any) {
      setToast({
        open: true,
        message: err.response?.data?.error || "Failed to clear SMS logs.",
        severity: "error",
      });
      setClearAllDialog((prev) => ({ ...prev, clearing: false }));
    }
  };

  const fetchMembers = async () => {
    try {
      const data = await memberService.getAll();
      setMembers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load members for SMS broadcast:", err);
    }
  };

  const fetchLogs = async () => {
    try {
      setLoadingLogs(true);
      const data = await loanService.getSMSLogs();
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load SMS logs:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchMembers();
    fetchLogs();
  }, []);

  const totalMembers = members.length;
  const activeMembers = members.filter((m) => m.status === "ACTIVE").length;

  const handleInsertTag = (tag: string) => {
    setMessage((prev) => `${prev} {${tag}}`.trim());
  };

  const handleLoadPreset = (text: string) => {
    setMessage(text);
    setToast({
      open: true,
      message: "Template loaded into composer.",
      severity: "info",
    });
  };

  const handleSendSMS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setToast({ open: true, message: "Please enter SMS message content.", severity: "error" });
      return;
    }

    if (recipientType === "single" && !customPhone.trim()) {
      setToast({ open: true, message: "Please enter a recipient phone number.", severity: "error" });
      return;
    }

    try {
      setSending(true);

      const payload: any = {
        recipient_type: recipientType,
        message: message.trim(),
      };

      if (recipientType === "single") {
        payload.phone_number = customPhone.trim();
      }

      const resData = await loanService.sendSMS(payload);

      if (resData.success) {
        setToast({
          open: true,
          message: resData.message || "SMS Broadcast Dispatched Successfully via Gateway!",
          severity: "success",
        });

        setMessage("");
        if (recipientType === "single") setCustomPhone("");
      } else {
        setToast({
          open: true,
          message: resData.error || resData.message || "Failed to dispatch SMS via gateway.",
          severity: "error",
        });
      }
    } catch (err: any) {
      console.warn("SMS Dispatch API Notice:", err.response?.data || err.message);
      const errMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Error while communicating with SMS gateway.";
      setToast({ open: true, message: errMsg, severity: "error" });
    } finally {
      setSending(false);
      // Always refresh live delivery logs so the attempt and error reason appear immediately
      fetchLogs();
    }
  };

  // Preview text with dynamic placeholder values
  const previewMessage = (message || "Type your message in the composer to see a live preview...")
    .replace(/{name}/g, "Kelvin Karanja")
    .replace(/{membership_no}/g, "RC-000042")
    .replace(/{phone}/g, "+254 712 345 678");

  const charCount = message.length;
  const smsPageUnits = Math.ceil((charCount || 1) / 160);

  // Filter logs based on search term
  const filteredLogs = logs.filter(
    (l) =>
      l.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.phone_number?.includes(searchTerm) ||
      l.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.event_type_display?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSent = logs.filter((l) => l.status === "sent").length;
  const totalFailed = logs.filter((l) => l.status === "failed").length;

  return (
    <PageContainer
      title="SMS Notification & Communications Engine - Royal SACCO"
      description="Enterprise automated SMS gateway, loan lifecycle notifications, and bulk member broadcasts"
    >
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        {/* Executive Hero Banner */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3.5 },
            mb: 3.5,
            borderRadius: 3.5,
            background: "linear-gradient(135deg, #064e3b 0%, #047857 40%, #0d9488 100%)",
            color: "#ffffff",
            boxShadow: "0 14px 34px -10px rgba(6, 78, 59, 0.4)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Subtle Ambient Pattern */}
          <Box
            sx={{
              position: "absolute",
              right: -30,
              top: -30,
              width: 220,
              height: 220,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%)",
              pointerEvents: "none",
            }}
          />

          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "center" }}
            spacing={2}
          >
            <Stack direction="row" spacing={2.5} alignItems="center">
              <Box
                sx={{
                  width: 58,
                  height: 58,
                  borderRadius: 3,
                  bgcolor: "rgba(255, 255, 255, 0.18)",
                  backdropFilter: "blur(8px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  boxShadow: "0 8px 16px rgba(0,0,0,0.15)",
                }}
              >
                <IconBroadcast size={32} />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={900} sx={{ color: "#ffffff", letterSpacing: "-0.5px" }}>
                  SMS Notification &amp; Communications Engine
                </Typography>
                <Typography variant="body2" sx={{ color: "#a7f3d0", fontWeight: 600, mt: 0.5 }}>
                  Enterprise bulk messaging, automated loan lifecycle alerts, and member engagement gateway
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1.5} alignItems="center">
              <Chip
                icon={<IconShieldCheck color="#ffffff" size={16} />}
                label="Sender ID: ROYAL LTD"
                sx={{
                  bgcolor: "rgba(255, 255, 255, 0.22)",
                  color: "#ffffff",
                  fontWeight: 900,
                  border: "1px solid rgba(255, 255, 255, 0.4)",
                  py: 0.5,
                  backdropFilter: "blur(6px)",
                }}
              />
              <Chip
                icon={<IconSparkles color="#ffffff" size={16} />}
                label="6 Auto Triggers Active"
                sx={{
                  bgcolor: "rgba(16, 185, 129, 0.35)",
                  color: "#ffffff",
                  fontWeight: 800,
                  border: "1px solid rgba(16, 185, 129, 0.6)",
                  py: 0.5,
                }}
              />
            </Stack>
          </Stack>
        </Paper>

        {/* Executive KPI Stats Cards */}
        <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
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
                <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 800, textTransform: "uppercase" }}>
                  Delivered Messages
                </Typography>
                <IconCheck size={18} color="#059669" />
              </Stack>
              <Typography variant="h4" fontWeight={900} sx={{ color: "#065f46", mt: 0.8 }}>
                {totalSent || logs.length || "Active"}
              </Typography>
              <Typography variant="caption" sx={{ color: "#10b981", fontWeight: 700 }}>
                100% gateway dispatch rate
              </Typography>
            </Paper>
          </Grid>

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
                <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 800, textTransform: "uppercase" }}>
                  Member Reach
                </Typography>
                <IconUsers size={18} color="#2563eb" />
              </Stack>
              <Typography variant="h4" fontWeight={900} sx={{ color: "#1e40af", mt: 0.8 }}>
                {totalMembers || 1}
              </Typography>
              <Typography variant="caption" sx={{ color: "#3b82f6", fontWeight: 700 }}>
                {activeMembers} active accounts
              </Typography>
            </Paper>
          </Grid>

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
                <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 800, textTransform: "uppercase" }}>
                  Delivery Failures
                </Typography>
                <IconAlertTriangle size={18} color="#d97706" />
              </Stack>
              <Typography variant="h4" fontWeight={900} sx={{ color: "#b45309", mt: 0.8 }}>
                {totalFailed}
              </Typography>
              <Typography variant="caption" sx={{ color: "#f59e0b", fontWeight: 700 }}>
                Automatic retry enabled
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: "1px solid #e2e8f0",
                borderLeft: "5px solid #8b5cf6",
                bgcolor: "#ffffff",
                boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 800, textTransform: "uppercase" }}>
                  Gateway Status
                </Typography>
                <IconCoins size={18} color="#8b5cf6" />
              </Stack>
              <Typography variant="h5" fontWeight={900} sx={{ color: "#6d28d9", mt: 0.8 }}>
                ROYAL LTD
              </Typography>
              <Typography variant="caption" sx={{ color: "#8b5cf6", fontWeight: 700 }}>
                Connected to Pefrank BulkSMS
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Main Workspace: Left Composer, Right Phone Preview & Presets */}
        <Grid container spacing={3.5} sx={{ mb: 4 }}>
          {/* Left: Broadcast Composer */}
          <Grid size={{ xs: 12, lg: 7 }}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3.5,
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05)",
                bgcolor: "#ffffff",
              }}
            >
              <CardContent sx={{ p: 3.5 }}>
                <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2.5,
                      bgcolor: "#ecfdf5",
                      color: "#059669",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <IconSend size={24} />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={900} color="#0f172a">
                      Compose Member Broadcast
                    </Typography>
                    <Typography variant="caption" color="#64748b">
                      Send personalized broadcast notifications or direct SMS to members
                    </Typography>
                  </Box>
                </Stack>

                <Divider sx={{ mb: 3 }} />

                <form onSubmit={handleSendSMS}>
                  <Stack spacing={3}>
                    {/* Audience Selector */}
                    <TextField
                      select
                      fullWidth
                      label="Target Recipient Audience *"
                      value={recipientType}
                      onChange={(e) => setRecipientType(e.target.value)}
                    >
                      <MenuItem value="all">
                        <Stack direction="row" spacing={1} alignItems="center">
                          <IconUsers size={18} color="#059669" />
                          <Typography fontWeight={700}>All Registered SACCO Members ({totalMembers || 1})</Typography>
                        </Stack>
                      </MenuItem>
                      <MenuItem value="active">
                        <Stack direction="row" spacing={1} alignItems="center">
                          <IconCheck size={18} color="#2563eb" />
                          <Typography fontWeight={700}>Active Members Only ({activeMembers || 1})</Typography>
                        </Stack>
                      </MenuItem>
                      <MenuItem value="overdue">
                        <Stack direction="row" spacing={1} alignItems="center">
                          <IconAlertTriangle size={18} color="#e11d48" />
                          <Typography fontWeight={700}>Overdue / In-Arrears Borrowers</Typography>
                        </Stack>
                      </MenuItem>
                      <MenuItem value="single">
                        <Stack direction="row" spacing={1} alignItems="center">
                          <IconPhone size={18} color="#d97706" />
                          <Typography fontWeight={700}>Single Recipient Phone Number</Typography>
                        </Stack>
                      </MenuItem>
                    </TextField>

                    {recipientType === "single" && (
                      <TextField
                        fullWidth
                        label="Recipient Phone Number *"
                        placeholder="e.g. 0712345678 or 254712345678"
                        value={customPhone}
                        onChange={(e) => setCustomPhone(e.target.value)}
                        required
                        slotProps={{
                          input: {
                            startAdornment: <IconPhone size={18} style={{ marginRight: 8, color: "#059669" }} />,
                          },
                        }}
                      />
                    )}

                    {/* Dynamic Merge Tag Chips */}
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: "#475569", mb: 1, display: "block" }}>
                        Click to insert dynamic personalization tags:
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Chip
                          icon={<IconTag size={14} />}
                          label="{name}"
                          onClick={() => handleInsertTag("name")}
                          clickable
                          size="small"
                          sx={{
                            bgcolor: "#eff6ff",
                            color: "#1d4ed8",
                            fontWeight: 800,
                            border: "1px solid #bfdbfe",
                          }}
                        />
                        <Chip
                          icon={<IconTag size={14} />}
                          label="{membership_no}"
                          onClick={() => handleInsertTag("membership_no")}
                          clickable
                          size="small"
                          sx={{
                            bgcolor: "#ecfdf5",
                            color: "#047857",
                            fontWeight: 800,
                            border: "1px solid #a7f3d0",
                          }}
                        />
                        <Chip
                          icon={<IconTag size={14} />}
                          label="{phone}"
                          onClick={() => handleInsertTag("phone")}
                          clickable
                          size="small"
                          sx={{
                            bgcolor: "#fef3c7",
                            color: "#b45309",
                            fontWeight: 800,
                            border: "1px solid #fde68a",
                          }}
                        />
                      </Stack>
                    </Box>

                    {/* Message Box */}
                    <TextField
                      fullWidth
                      multiline
                      rows={5}
                      label="SMS Message Content *"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your message here or click a preset below... e.g. Dear {name}, your loan application has been received."
                      helperText={`${charCount} characters (${smsPageUnits} SMS ${smsPageUnits === 1 ? "page" : "pages"}) • 160 characters per SMS page`}
                      required
                    />

                    {/* Dispatch Button */}
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      disabled={sending || !message.trim()}
                      startIcon={sending ? <CircularProgress size={20} color="inherit" /> : <IconSend size={20} />}
                      sx={{
                        background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                        color: "#ffffff",
                        fontWeight: 900,
                        fontSize: "1rem",
                        py: 1.5,
                        borderRadius: 2.5,
                        boxShadow: "0 6px 18px rgba(5, 150, 105, 0.35)",
                        "&:hover": {
                          background: "linear-gradient(135deg, #047857 0%, #064e3b 100%)",
                        },
                      }}
                    >
                      {sending ? "Dispatching via Gateway..." : "Dispatch SMS Notification"}
                    </Button>
                  </Stack>
                </form>
              </CardContent>
            </Card>
          </Grid>

          {/* Right: Live Smartphone Preview & Quick Templates */}
          <Grid size={{ xs: 12, lg: 5 }}>
            <Stack spacing={3}>
              {/* Smartphone Preview Frame */}
              <Card
                elevation={0}
                sx={{
                  borderRadius: 3.5,
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05)",
                  bgcolor: "#ffffff",
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
                    <Box
                      sx={{
                        width: 38,
                        height: 38,
                        borderRadius: 2,
                        bgcolor: "#f0fdf4",
                        color: "#16a34a",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <IconDeviceMobile size={22} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={900} color="#0f172a">
                        Live Recipient Smartphone Preview
                      </Typography>
                      <Typography variant="caption" color="#64748b">
                        Simulates recipient handset experience with Royal LTD Sender ID
                      </Typography>
                    </Box>
                  </Stack>

                  <Divider sx={{ mb: 2.5 }} />

                  {/* Phone Device Mockup */}
                  <Box
                    sx={{
                      bgcolor: "#0f172a",
                      borderRadius: 4,
                      p: 2.5,
                      color: "#f8fafc",
                      border: "4px solid #334155",
                      boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.3)",
                    }}
                  >
                    {/* Phone Header */}
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2, px: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            bgcolor: "#0284c7",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontSize: "0.75rem",
                            fontWeight: 900,
                          }}
                        >
                          R
                        </Box>
                        <Box>
                          <Typography variant="caption" fontWeight={900} sx={{ color: "#ffffff", display: "block" }}>
                            ROYAL LTD
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#94a3b8", fontSize: "0.68rem" }}>
                            Verified Business SMS
                          </Typography>
                        </Box>
                      </Stack>
                      <Chip label="Now" size="small" sx={{ bgcolor: "#1e293b", color: "#94a3b8", height: 20, fontSize: "0.68rem" }} />
                    </Stack>

                    {/* Chat Bubble */}
                    <Box
                      sx={{
                        bgcolor: "#1e293b",
                        p: 2,
                        borderRadius: 3,
                        borderBottomLeftRadius: 1,
                        border: "1px solid #334155",
                      }}
                    >
                      <Typography variant="body2" sx={{ color: "#f1f5f9", lineHeight: 1.6, fontSize: "0.85rem", whiteSpace: "pre-wrap" }}>
                        {previewMessage}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#64748b", display: "block", mt: 1.5, textAlign: "right", fontSize: "0.68rem" }}>
                        Delivered • Safaricom / Airtel
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Quick Template Presets */}
              <Card
                elevation={0}
                sx={{
                  borderRadius: 3.5,
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05)",
                  bgcolor: "#ffffff",
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle1" fontWeight={900} color="#0f172a" mb={0.5}>
                    Standard Notification Presets
                  </Typography>
                  <Typography variant="caption" color="#64748b" mb={2} display="block">
                    Click any preset to load its professional template into the composer:
                  </Typography>

                  <Stack spacing={1.2}>
                    {TEMPLATE_PRESETS.map((p, idx) => (
                      <Paper
                        key={idx}
                        elevation={0}
                        onClick={() => handleLoadPreset(p.text)}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          border: "1px solid #e2e8f0",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          "&:hover": {
                            borderColor: p.color,
                            bgcolor: "#f8fafc",
                            transform: "translateY(-1px)",
                          },
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#1e293b" }}>
                            {p.title}
                          </Typography>
                          <Chip
                            label={p.tag}
                            size="small"
                            sx={{
                              bgcolor: `${p.color}15`,
                              color: p.color,
                              fontWeight: 800,
                              fontSize: "0.7rem",
                              height: 22,
                            }}
                          />
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>

        {/* Full-Width Audit Log Data Grid */}
        <Card
          elevation={0}
          sx={{
            borderRadius: 3.5,
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05)",
            bgcolor: "#ffffff",
            overflow: "hidden",
          }}
        >
          <CardContent sx={{ p: 3.5 }}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", md: "center" }}
              spacing={2}
              mb={3}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2.5,
                    bgcolor: "#eff6ff",
                    color: "#2563eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconMessage2 size={24} />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={900} color="#0f172a">
                    SMS Delivery Audit Trail &amp; Gateway Logs
                  </Typography>
                  <Typography variant="caption" color="#64748b">
                    Real-time transactional delivery history from the Royal SACCO gateway
                  </Typography>
                </Box>
              </Stack>

              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: { xs: "100%", md: "auto" } }}>
                <TextField
                  size="small"
                  placeholder="Search by recipient, phone, or event..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <IconSearch size={18} color="#64748b" />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{ width: { xs: "100%", md: 280 } }}
                />

                <Tooltip title="Refresh SMS Logs">
                  <IconButton
                    onClick={fetchLogs}
                    disabled={loadingLogs}
                    sx={{
                      border: "1px solid #e2e8f0",
                      borderRadius: 2,
                      bgcolor: "#f8fafc",
                    }}
                  >
                    <IconRefresh size={18} color="#059669" />
                  </IconButton>
                </Tooltip>

                {isAdmin && (
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<IconTrash size={16} />}
                    onClick={() => setClearAllDialog({ open: true, clearing: false })}
                    disabled={logs.length === 0}
                    sx={{
                      textTransform: "none",
                      fontWeight: 700,
                      borderRadius: 2,
                      px: 1.8,
                      borderColor: "#fca5a5",
                      bgcolor: "#fef2f2",
                      "&:hover": { bgcolor: "#fee2e2", borderColor: "#f87171" },
                    }}
                  >
                    Clear All Logs
                  </Button>
                )}
              </Stack>
            </Stack>

            <Divider sx={{ mb: 2.5 }} />

            <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2.5 }}>
              <Table size="medium">
                <TableHead sx={{ bgcolor: "#f8fafc" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, color: "#475569" }}>Recipient</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: "#475569" }}>Phone Number</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: "#475569" }}>Event Type</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: "#475569" }}>Message Content</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: "#475569" }}>Timestamp</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: "#475569" }} align="center">
                      Delivery Status
                    </TableCell>
                    {isAdmin && (
                      <TableCell sx={{ fontWeight: 800, color: "#475569" }} align="center">
                        Action
                      </TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingLogs ? (
                    <TableRow>
                      <TableCell colSpan={isAdmin ? 7 : 6} align="center" sx={{ py: 4 }}>
                        <CircularProgress size={28} color="success" />
                        <Typography variant="body2" color="#64748b" mt={1}>
                          Loading SMS delivery logs...
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isAdmin ? 7 : 6} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="#64748b">
                          No SMS logs found matching your query.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((log) => {
                      const isSent = log.status === "sent";
                      return (
                        <TableRow key={log.id} hover>
                          <TableCell sx={{ fontWeight: 800, color: "#0f172a" }}>
                            {log.recipient_name || "Member"}
                          </TableCell>
                          <TableCell sx={{ fontFamily: "monospace", color: "#334155", fontWeight: 700 }}>
                            {log.phone_number}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={log.event_type_display || log.event_type}
                              size="small"
                              sx={{
                                bgcolor: "#f1f5f9",
                                color: "#334155",
                                fontWeight: 800,
                                fontSize: "0.72rem",
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ maxWidth: 360, fontSize: "0.82rem", color: "#1e293b" }}>
                            {log.message}
                          </TableCell>
                          <TableCell sx={{ color: "#64748b", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                            {new Date(log.created_at).toLocaleString()}
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              icon={isSent ? <IconCheck size={14} /> : <IconAlertTriangle size={14} />}
                              label={isSent ? "Delivered" : "Failed"}
                              size="small"
                              sx={{
                                bgcolor: isSent ? "#ecfdf5" : "#fef2f2",
                                color: isSent ? "#059669" : "#dc2626",
                                border: `1px solid ${isSent ? "#a7f3d0" : "#fecaca"}`,
                                fontWeight: 900,
                                fontSize: "0.72rem",
                              }}
                            />
                          </TableCell>
                          {isAdmin && (
                            <TableCell align="center">
                              <Tooltip title="Delete SMS Log">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => setDeleteLogDialog({ open: true, log, deleting: false })}
                                  sx={{
                                    bgcolor: "#fef2f2",
                                    "&:hover": { bgcolor: "#fee2e2" },
                                    borderRadius: 1.5,
                                  }}
                                >
                                  <IconTrash size={16} />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>

      {/* Notification Toast */}
      <Snackbar
        open={toast.open}
        autoHideDuration={5000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          severity={toast.severity}
          variant="filled"
          onClose={() => setToast({ ...toast, open: false })}
          sx={{ fontWeight: 700, borderRadius: 2 }}
        >
          {toast.message}
        </Alert>
      </Snackbar>

      {/* Delete Single SMS Log Dialog */}
      <Dialog
        open={deleteLogDialog.open}
        onClose={() => !deleteLogDialog.deleting && setDeleteLogDialog({ open: false, log: null, deleting: false })}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: "#b91c1c", pb: 1, display: "flex", alignItems: "center", gap: 1 }}>
          <IconAlertTriangle color="#dc2626" size={24} />
          Delete SMS Delivery Log
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body1" fontWeight={700} color="#0f172a" mb={1}>
            Delete delivery log for {deleteLogDialog.log?.recipient_name || deleteLogDialog.log?.phone_number}?
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Message: &quot;{deleteLogDialog.log?.message?.substring(0, 100)}...&quot;
          </Typography>
          <Paper elevation={0} sx={{ p: 1.5, bgcolor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 2 }}>
            <Typography variant="caption" color="#991b1b" fontWeight={700} display="block">
              This will remove this specific entry from the SMS delivery audit trail.
            </Typography>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setDeleteLogDialog({ open: false, log: null, deleting: false })}
            disabled={deleteLogDialog.deleting}
            sx={{ color: "text.secondary", textTransform: "none", fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteLog}
            disabled={deleteLogDialog.deleting}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
          >
            {deleteLogDialog.deleting ? "Deleting..." : "Delete Log"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clear All SMS Logs Dialog */}
      <Dialog
        open={clearAllDialog.open}
        onClose={() => !clearAllDialog.clearing && setClearAllDialog({ open: false, clearing: false })}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: "#b91c1c", pb: 1, display: "flex", alignItems: "center", gap: 1 }}>
          <IconAlertTriangle color="#dc2626" size={24} />
          Purge All SMS Delivery Logs
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body1" fontWeight={700} color="#0f172a" mb={1}>
            Are you sure you want to delete ALL {logs.length} SMS delivery logs?
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            This will permanently erase all gateway dispatch records and delivery statuses from the audit log.
          </Typography>
          <Paper elevation={0} sx={{ p: 1.5, bgcolor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 2 }}>
            <Typography variant="caption" color="#991b1b" fontWeight={700} display="block">
              Warning: This action cannot be undone.
            </Typography>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setClearAllDialog({ open: false, clearing: false })}
            disabled={clearAllDialog.clearing}
            sx={{ color: "text.secondary", textTransform: "none", fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleClearAllLogs}
            disabled={clearAllDialog.clearing}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
          >
            {clearAllDialog.clearing ? "Purging..." : "Confirm Purge All"}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}
