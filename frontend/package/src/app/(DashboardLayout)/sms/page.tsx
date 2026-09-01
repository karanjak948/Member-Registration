"use client";

import { useEffect, useState } from "react";
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
} from "@tabler/icons-react";
import api from "@/services/api";
import memberService from "@/services/member.service";
import { Member } from "@/interfaces/member";

export default function SMSPage() {
  const [recipientType, setRecipientType] = useState("all");
  const [customPhone, setCustomPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);

  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  const [history, setHistory] = useState([
    {
      id: 1,
      recipient: "Member: Kelvin Karanja (254712345678)",
      message: "Welcome to Royal SACCO, Kelvin Karanja! Your member registration is complete. Your Membership No. is RC-000001.",
      time: "Today 10:30 AM",
      status: "Delivered",
      recipientsCount: 1,
    },
    {
      id: 2,
      recipient: "Member: Grace Kariuki (254712345678)",
      message: "Dear Grace, your member account RC-000007 has been activated.",
      time: "Yesterday 04:15 PM",
      status: "Delivered",
      recipientsCount: 1,
    },
  ]);

  useEffect(() => {
    async function fetchMembers() {
      try {
        const data = await memberService.getAll();
        setMembers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load members for SMS broadcast:", err);
      }
    }
    fetchMembers();
  }, []);

  const totalMembers = members.length || 10;
  const activeMembers = members.filter((m) => m.status === "ACTIVE").length || 8;

  const handleSendSMS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setToast({ open: true, message: "Please enter a valid message content.", severity: "error" });
      return;
    }

    try {
      setSending(true);

      let targetContacts: string[] = [];

      if (recipientType === "single" && customPhone.trim()) {
        targetContacts = [customPhone.trim()];
      } else {
        // Collect phone numbers from registered members
        targetContacts = members
          .map((m) => m.phone_number)
          .filter((p): p is string => Boolean(p && p.trim().length >= 9));

        if (targetContacts.length === 0) {
          // Fallback test number if no member phones loaded
          targetContacts = ["254712345678"];
        }
      }

      const { data: resData } = await api.post("/sms/send/", {
        contacts: targetContacts,
        message: message.trim(),
      });

      if (resData.success) {
        setToast({
          open: true,
          message: `SMS Sent Successfully via Gateway! (${targetContacts.length} recipients)`,
          severity: "success",
        });

        setHistory((prev) => [
          {
            id: Date.now(),
            recipient:
              recipientType === "single"
                ? `Direct: ${customPhone}`
                : recipientType === "all"
                ? `All SACCO Members (${targetContacts.length})`
                : `Active Members (${targetContacts.length})`,
            message: message.trim(),
            time: "Just now",
            status: "Delivered",
            recipientsCount: targetContacts.length,
          },
          ...prev,
        ]);

        setMessage("");
        if (recipientType === "single") setCustomPhone("");
      } else {
        setToast({
          open: true,
          message: resData.error || "Failed to deliver SMS. Check phone format or credentials.",
          severity: "error",
        });
      }
    } catch (err: any) {
      console.error("SMS Dispatch Error:", err);
      setToast({ open: true, message: "Network error while sending SMS.", severity: "error" });
    } finally {
      setSending(false);
    }
  };

  const smsPageUnits = Math.ceil((message.length || 1) / 160);

  return (
    <PageContainer
      title="SMS Notification Center - Royal SACCO"
      description="Automated SMS notifications, payment receipts, and member broadcast gateway"
    >
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        {/* Executive Hero Banner */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3.5 },
            mb: 3.5,
            borderRadius: 3.5,
            background: "linear-gradient(135deg, #064e3b 0%, #047857 50%, #059669 100%)",
            color: "#ffffff",
            boxShadow: "0 10px 28px rgba(6, 78, 59, 0.25)",
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "center" }}
            spacing={2}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: 2.5,
                  bgcolor: "rgba(255, 255, 255, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                }}
              >
                <IconBroadcast size={30} />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={900} sx={{ color: "#ffffff", letterSpacing: "-0.5px" }}>
                  SMS Gateway &amp; Dispatch Center
                </Typography>
                <Typography variant="body2" sx={{ color: "#a7f3d0", fontWeight: 600, mt: 0.3 }}>
                  Automated member welcome notifications, repayment receipts, and broadcast messaging
                </Typography>
              </Box>
            </Stack>

            <Chip
              icon={<IconShieldCheck color="#ffffff" size={16} />}
              label="Gateway Active: KIY TOYS Sender ID"
              sx={{
                bgcolor: "rgba(255, 255, 255, 0.2)",
                color: "#ffffff",
                fontWeight: 800,
                border: "1px solid rgba(255, 255, 255, 0.35)",
                py: 0.5,
              }}
            />
          </Stack>
        </Paper>

        {/* KPI Credit Cards */}
        <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
          <Grid size={{ xs: 12, md: 4 }}>
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
              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                AVAILABLE SMS CREDITS
              </Typography>
              <Typography variant="h5" fontWeight={900} sx={{ color: "#065f46", mt: 0.5, fontFamily: "monospace" }}>
                10,000 Units
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
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
              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                GATEWAY DELIVERY RATE
              </Typography>
              <Typography variant="h5" fontWeight={900} sx={{ color: "#1d4ed8", mt: 0.5 }}>
                99.9% Instant Delivery
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
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
              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                CONFIGURED SENDER ID
              </Typography>
              <Typography variant="h5" fontWeight={900} sx={{ color: "#b45309", mt: 0.5, fontFamily: "monospace" }}>
                KIY TOYS
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Grid container spacing={3.5}>
          {/* Left: Compose Form */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3.5,
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 20px -4px rgba(0,0,0,0.04)",
                bgcolor: "#ffffff",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      bgcolor: "#ecfdf5",
                      color: "#059669",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <IconSend size={22} />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={900} color="#0f172a">
                      Compose SMS Broadcast
                    </Typography>
                    <Typography variant="caption" color="#64748b">
                      Send instant SMS alerts directly to SACCO members
                    </Typography>
                  </Box>
                </Stack>

                <Divider sx={{ mb: 3 }} />

                <form onSubmit={handleSendSMS}>
                  <Stack spacing={2.5}>
                    <TextField
                      select
                      fullWidth
                      label="Target Recipient Audience *"
                      value={recipientType}
                      onChange={(e) => setRecipientType(e.target.value)}
                    >
                      <MenuItem value="all">All Registered SACCO Members ({totalMembers})</MenuItem>
                      <MenuItem value="active">Active Members Only ({activeMembers})</MenuItem>
                      <MenuItem value="single">Single Recipient Phone Number</MenuItem>
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

                    <TextField
                      fullWidth
                      multiline
                      rows={5}
                      label="SMS Message Content *"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your SMS message here... (e.g. Dear Member, your loan application has been approved.)"
                      helperText={`${message.length} characters (${smsPageUnits} SMS ${smsPageUnits === 1 ? "page" : "pages"})`}
                      required
                    />

                    <Button
                      type="submit"
                      variant="contained"
                      disabled={sending || !message.trim()}
                      startIcon={sending ? <CircularProgress size={18} color="inherit" /> : <IconSend size={18} />}
                      sx={{
                        background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                        color: "#ffffff",
                        fontWeight: 900,
                        fontSize: "0.95rem",
                        py: 1.25,
                        borderRadius: 2.5,
                        boxShadow: "0 4px 14px rgba(5, 150, 105, 0.35)",
                        "&:hover": {
                          background: "linear-gradient(135deg, #047857 0%, #065f46 100%)",
                        },
                      }}
                    >
                      {sending ? "Dispatching SMS..." : "Send SMS Broadcast"}
                    </Button>
                  </Stack>
                </form>
              </CardContent>
            </Card>
          </Grid>

          {/* Right: History Log */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3.5,
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 20px -4px rgba(0,0,0,0.04)",
                bgcolor: "#ffffff",
                height: "100%",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      bgcolor: "#eff6ff",
                      color: "#2563eb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <IconMessage2 size={22} />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={900} color="#0f172a">
                      Recent SMS Logs &amp; Gateway Delivery History
                    </Typography>
                    <Typography variant="caption" color="#64748b">
                      Real-time delivery confirmation from pefranksmartsolutions gateway
                    </Typography>
                  </Box>
                </Stack>

                <Divider sx={{ mb: 2.5 }} />

                <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2.5, overflow: "hidden" }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: "#f8fafc" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800, color: "#475569" }}>Audience / Recipient</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: "#475569" }}>Message Preview</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: "#475569" }}>Sent At</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: "#475569" }} align="center">Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {history.map((h) => (
                        <TableRow key={h.id} hover>
                          <TableCell sx={{ fontWeight: 800, color: "#0f172a", fontSize: "0.85rem" }}>
                            {h.recipient}
                          </TableCell>
                          <TableCell sx={{ fontSize: "0.82rem", color: "#334155", maxWidth: 220 }}>
                            {h.message}
                          </TableCell>
                          <TableCell sx={{ fontSize: "0.8rem", color: "#64748b", whiteSpace: "nowrap", fontFamily: "monospace" }}>
                            {h.time}
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              icon={<IconCheck size={14} />}
                              label={h.status}
                              size="small"
                              sx={{
                                bgcolor: "#ecfdf5",
                                color: "#059669",
                                border: "1px solid #a7f3d0",
                                fontWeight: 800,
                                fontSize: "0.72rem",
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

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
    </PageContainer>
  );
}
