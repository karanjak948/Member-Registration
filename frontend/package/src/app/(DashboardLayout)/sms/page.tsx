"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  MenuItem,
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
  Snackbar,
  Alert,
} from "@mui/material";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import { IconMessage2, IconSend, IconUsers } from "@tabler/icons-react";

export default function SMSPage() {
  const [recipientGroup, setRecipientGroup] = useState("all");
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" as "success" | "error" });
  const [sending, setSending] = useState(false);

  const [history, setHistory] = useState([
    {
      id: 1,
      recipient: "All Active Borrowers",
      message: "Dear Member, your weekly loan repayment of KES 2,500 is due on 2026-08-25. Paybill: 247247, Acc: Your Member #.",
      time: "2026-08-22 10:30 AM",
      status: "Delivered",
      recipientsCount: 543,
    },
    {
      id: 2,
      recipient: "Member: James Mwangi",
      message: "Dear James, payment of KES 2,500 for Loan #LN-001 has been received and credited to your account. Balance: KES 12,500.",
      time: "2026-08-22 09:15 AM",
      status: "Delivered",
      recipientsCount: 1,
    },
  ]);

  function handleSendSMS(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;

    setSending(true);
    setTimeout(() => {
      setSending(false);
      setToast({ open: true, message: "SMS blast sent successfully to recipients.", severity: "success" });
      setHistory([
        {
          id: Date.now(),
          recipient: recipientGroup === "all" ? "All Registered Members" : "Overdue Loan Accounts",
          message,
          time: "Just now",
          status: "Delivered",
          recipientsCount: recipientGroup === "all" ? 2453 : 48,
        },
        ...history,
      ]);
      setMessage("");
    }, 1000);
  }

  return (
    <PageContainer title="SMS Notification Center - Royal SACCO" description="Send repayment reminders and blast SMS notifications">
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" fontWeight={700} color="text.primary">
              SMS Notification Center
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Automated repayment reminders, payment confirmation receipts, and member blast SMS
            </Typography>
          </Box>
        </Stack>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ bgcolor: "primary.light", borderRadius: 2 }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="caption" color="primary.dark" fontWeight={700}>AVAILABLE SMS CREDITS</Typography>
                <Typography variant="h5" fontWeight={800} color="primary.dark" mt={0.5}>
                  1,587 SMS Units
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ bgcolor: "success.light", borderRadius: 2 }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="caption" color="success.dark" fontWeight={700}>SMS DELIVERY RATE</Typography>
                <Typography variant="h5" fontWeight={800} color="success.dark" mt={0.5}>
                  99.8% Success Rate
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ bgcolor: "info.light", borderRadius: 2 }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="caption" color="info.dark" fontWeight={700}>SENDER SENDER ID</Typography>
                <Typography variant="h5" fontWeight={800} color="info.dark" mt={0.5}>
                  ROYAL_SACCO
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
                  <Box sx={{ p: 1, bgcolor: "primary.light", borderRadius: 1.5, color: "primary.main", display: "flex" }}>
                    <IconSend size={22} />
                  </Box>
                  <Typography variant="h6" fontWeight={700}>
                    Compose SMS Broadcast
                  </Typography>
                </Stack>

                <Divider sx={{ mb: 2.5 }} />

                <form onSubmit={handleSendSMS}>
                  <Stack spacing={2.5}>
                    <TextField
                      select
                      fullWidth
                      label="Target Recipient Audience *"
                      value={recipientGroup}
                      onChange={(e) => setRecipientGroup(e.target.value)}
                    >
                      <MenuItem value="all">All Active Members (2,453)</MenuItem>
                      <MenuItem value="borrowers">Active Borrowers (543)</MenuItem>
                      <MenuItem value="overdue">Overdue / Arrears Accounts (48)</MenuItem>
                      <MenuItem value="due_this_week">Due Repayments This Week</MenuItem>
                    </TextField>

                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="Message Content *"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your message here... (e.g. Reminder: Sacco general meeting scheduled for Friday)"
                      helperText={`${message.length}/160 characters (1 SMS page)`}
                      required
                    />

                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      size="large"
                      disabled={sending || !message.trim()}
                      startIcon={<IconSend size={18} />}
                      sx={{ textTransform: "none", fontWeight: 700 }}
                    >
                      {sending ? "Sending SMS..." : "Send SMS Blast"}
                    </Button>
                  </Stack>
                </form>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 7 }}>
            <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, height: "100%" }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
                  <Box sx={{ p: 1, bgcolor: "success.light", borderRadius: 1.5, color: "success.main", display: "flex" }}>
                    <IconMessage2 size={22} />
                  </Box>
                  <Typography variant="h6" fontWeight={700}>
                    Recent SMS Logs &amp; Delivery History
                  </Typography>
                </Stack>

                <Divider sx={{ mb: 2 }} />

                <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: "grey.100" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Audience</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Message</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Sent At</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="center">Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {history.map((h) => (
                        <TableRow key={h.id} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{h.recipient}</TableCell>
                          <TableCell sx={{ fontSize: "0.75rem" }}>{h.message}</TableCell>
                          <TableCell sx={{ fontSize: "0.75rem", whiteSpace: "nowrap" }}>{h.time}</TableCell>
                          <TableCell align="center">
                            <Chip label={h.status} size="small" color="success" sx={{ fontSize: "0.7rem" }} />
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
        autoHideDuration={4000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert severity={toast.severity as any} onClose={() => setToast({ ...toast, open: false })}>
          {toast.message}
        </Alert>
      </Snackbar>
    </PageContainer>
  );
}
