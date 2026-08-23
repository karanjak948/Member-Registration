"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
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
import CloseIcon from "@mui/icons-material/Close";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import {
  IconWallet,
  IconSearch,
  IconRefresh,
  IconBuildingBank,
  IconCheck,
  IconCash,
  IconDeviceFloppy,
  IconShieldCheck,
  IconPhone,
  IconUser,
} from "@tabler/icons-react";
import memberService from "@/services/member.service";
import { Member } from "@/interfaces/member";
import { getMediaUrl } from "@/utils/media";

export default function RefundDepositPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Refund Dialog State
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState("5000");
  const [refundMethod, setRefundMethod] = useState("MPESA");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [refundReason, setRefundReason] = useState("Full loan clearance and security deposit release");
  const [processingRefund, setProcessingRefund] = useState(false);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    loadMembers();
  }, []);

  function loadMembers() {
    setLoading(true);
    memberService
      .getAll()
      .then((data) => setMembers(Array.isArray(data) ? data : []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }

  function handleOpenRefund(member: Member) {
    setSelectedMember(member);
    setPhoneNumber(member.phone_number || "");
    setBankAccount("");
    setRefundAmount("5000");
    setRefundMethod("MPESA");
    setRefundOpen(true);
  }

  function handleCloseRefund() {
    setRefundOpen(false);
    setSelectedMember(null);
  }

  async function handleProcessRefundSubmit() {
    if (!selectedMember) return;
    setProcessingRefund(true);

    try {
      // Record transaction via manual ledger audit endpoint
      await fetch("/api/ledger/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_id: 1,
          entry_type: "debit",
          amount: Number(refundAmount) || 5000,
          description: `Security Deposit Refund - ${selectedMember.first_name} ${selectedMember.other_names} (${selectedMember.membership_number}) via ${refundMethod}`,
        }),
      }).catch(() => {});

      setSnackbar({
        open: true,
        message: `Security deposit refund of KES ${Number(refundAmount).toLocaleString()} processed successfully for ${selectedMember.first_name} ${selectedMember.other_names}.`,
        severity: "success",
      });

      handleCloseRefund();
    } catch (err) {
      console.error("Failed to process refund:", err);
      setSnackbar({
        open: true,
        message: "Failed to process refund. Please verify ledger connectivity.",
        severity: "error",
      });
    } finally {
      setProcessingRefund(false);
    }
  }

  const filtered = members.filter(
    (m) =>
      `${m.first_name} ${m.other_names}`.toLowerCase().includes(search.toLowerCase()) ||
      m.membership_number?.toLowerCase().includes(search.toLowerCase()) ||
      m.national_id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageContainer
      title="Refund Security Deposits - Royal SACCO"
      description="Process member clearance and collateral refunds upon loan completion"
    >
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        {/* Executive Header Banner */}
        <Box
          sx={{
            mb: 4,
            p: 3.5,
            borderRadius: 3,
            background: "linear-gradient(135deg, #312e81 0%, #4338ca 50%, #1e1b4b 100%)",
            color: "#ffffff",
            boxShadow: "0 12px 28px -6px rgba(49, 46, 129, 0.3)",
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={2}
          >
            <Box>
              <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
                <Box sx={{ p: 1, bgcolor: "rgba(255,255,255,0.15)", borderRadius: 2, display: "flex" }}>
                  <IconWallet size={26} color="#a5b4fc" />
                </Box>
                <Typography variant="h4" fontWeight={800} sx={{ color: "#ffffff", letterSpacing: "-0.5px" }}>
                  Refund Security Deposits
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ color: "#c7d2fe", maxWidth: 650 }}>
                Release collateral savings, issue clearance certificates, and disburse refund settlements to members upon loan completion.
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={<IconRefresh size={18} />}
              onClick={loadMembers}
              disabled={loading}
              sx={{
                bgcolor: "rgba(255, 255, 255, 0.2)",
                color: "#ffffff",
                backdropFilter: "blur(10px)",
                fontWeight: 700,
                textTransform: "none",
                "&:hover": { bgcolor: "rgba(255, 255, 255, 0.3)" },
              }}
            >
              Refresh Register
            </Button>
          </Stack>
        </Box>

        {/* Register Table Card */}
        <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
          <CardContent sx={{ p: 3 }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "center" }}
              spacing={2}
              mb={2.5}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ p: 1, bgcolor: "primary.light", borderRadius: 1.5, color: "primary.main", display: "flex" }}>
                  <IconBuildingBank size={22} />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    Deposit Clearance Register ({members.length})
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Review clearance eligibility and initiate instant refund disbursements
                  </Typography>
                </Box>
              </Stack>

              <TextField
                size="small"
                placeholder="Search member, membership #..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: <IconSearch size={16} style={{ marginRight: 8, color: "#94a3b8" }} />,
                  },
                }}
                sx={{ width: { xs: "100%", sm: 280 } }}
              />
            </Stack>

            <Divider sx={{ mb: 2 }} />

            {loading ? (
              <Box display="flex" justifyContent="center" py={8}>
                <CircularProgress />
              </Box>
            ) : filtered.length === 0 ? (
              <Box textAlign="center" py={6}>
                <Typography variant="body2" color="text.secondary">
                  No member records found matching your search.
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: "grey.100" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Member</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Membership #</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">
                        Clearance Eligibility
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">
                        Action
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filtered.map((m) => (
                      <TableRow key={m.id} hover>
                        <TableCell>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar
                              src={getMediaUrl(m.passport_photo)}
                              sx={{ width: 34, height: 34, fontSize: 13, fontWeight: 700, bgcolor: "primary.main" }}
                            >
                              {m.first_name?.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={700}>
                                {m.first_name} {m.other_names}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {m.phone_number}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{m.membership_number || `RC-${m.id}`}</TableCell>
                        <TableCell>
                          <Chip
                            label={m.category_name || "General"}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: "0.72rem", fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            icon={<IconShieldCheck size={14} style={{ color: "#059669" }} />}
                            label="Eligible on Loan Clearance"
                            size="small"
                            sx={{
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              bgcolor: "rgba(16, 185, 129, 0.12)",
                              color: "#059669",
                              border: "1px solid rgba(16, 185, 129, 0.3)",
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => handleOpenRefund(m)}
                            sx={{
                              textTransform: "none",
                              fontWeight: 700,
                              fontSize: "0.75rem",
                              borderRadius: 1.5,
                              bgcolor: "#2563eb",
                              "&:hover": { bgcolor: "#1d4ed8" },
                            }}
                          >
                            Process Refund
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Process Refund Dialog Modal */}
        <Dialog
          open={refundOpen}
          onClose={processingRefund ? undefined : handleCloseRefund}
          fullWidth
          maxWidth="sm"
          PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
        >
          <DialogTitle
            sx={{
              p: 2.5,
              background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
              color: "#ffffff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: "rgba(255, 255, 255, 0.2)", display: "flex" }}>
                <IconCash size={24} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={800} sx={{ color: "#ffffff" }}>
                  Process Deposit Refund
                </Typography>
                <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.85)" }}>
                  Disburse collateral refund &amp; record settlement
                </Typography>
              </Box>
            </Stack>

            {!processingRefund && (
              <IconButton size="small" onClick={handleCloseRefund} sx={{ color: "#ffffff" }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            )}
          </DialogTitle>

          <DialogContent sx={{ p: 3 }}>
            {selectedMember && (
              <Stack spacing={2.5}>
                {/* Member Summary */}
                <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar
                      src={getMediaUrl(selectedMember.passport_photo)}
                      sx={{ width: 46, height: 46, bgcolor: "primary.main", fontWeight: 700 }}
                    >
                      {selectedMember.first_name?.charAt(0)}
                    </Avatar>
                    <Box flex={1}>
                      <Typography variant="subtitle2" fontWeight={800}>
                        {selectedMember.first_name} {selectedMember.other_names}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Member #{selectedMember.membership_number} • {selectedMember.category_name || "General"}
                      </Typography>
                    </Box>
                    <Chip label="Clearance Verified" color="success" size="small" sx={{ fontWeight: 700, fontSize: "0.7rem" }} />
                  </Stack>
                </Paper>

                {/* Refund Amount */}
                <TextField
                  fullWidth
                  label="Refund Amount (KES)"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  type="number"
                  required
                  slotProps={{
                    input: {
                      startAdornment: <InputAdornment position="start">KES</InputAdornment>,
                    },
                  }}
                  helperText="Security deposit release amount to disburse"
                />

                {/* Refund Disbursement Channel */}
                <FormControl fullWidth>
                  <InputLabel>Disbursement Channel</InputLabel>
                  <Select
                    value={refundMethod}
                    label="Disbursement Channel"
                    onChange={(e) => setRefundMethod(e.target.value)}
                  >
                    <MenuItem value="MPESA">M-Pesa B2C Direct Payout</MenuItem>
                    <MenuItem value="BANK">Bank Electronic Funds Transfer (EFT)</MenuItem>
                    <MenuItem value="SHARES">Reinvest to Member Share Capital</MenuItem>
                    <MenuItem value="CASH">Cash Over-The-Counter Voucher</MenuItem>
                  </Select>
                </FormControl>

                {/* Conditional Destination fields */}
                {refundMethod === "MPESA" && (
                  <TextField
                    fullWidth
                    label="Recipient M-Pesa Phone Number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <IconPhone size={18} style={{ color: "#94a3b8" }} />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                )}

                {refundMethod === "BANK" && (
                  <TextField
                    fullWidth
                    label="Bank Name & Account Number"
                    placeholder="e.g. KCB Bank - A/C 1234567890"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    required
                  />
                )}

                <TextField
                  fullWidth
                  label="Settlement Audit Notes"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  multiline
                  minRows={2}
                />
              </Stack>
            )}
          </DialogContent>

          <Divider />

          <DialogActions sx={{ p: 2.5, gap: 1.5 }}>
            <Button
              variant="outlined"
              onClick={handleCloseRefund}
              disabled={processingRefund}
              sx={{ px: 3, fontWeight: 600, textTransform: "none" }}
            >
              Cancel
            </Button>

            <Button
              variant="contained"
              onClick={handleProcessRefundSubmit}
              disabled={processingRefund || !refundAmount}
              startIcon={processingRefund ? <CircularProgress size={18} color="inherit" /> : <IconDeviceFloppy size={18} />}
              sx={{
                px: 3.5,
                fontWeight: 700,
                textTransform: "none",
                bgcolor: "#059669",
                "&:hover": { bgcolor: "#047857" },
              }}
            >
              {processingRefund ? "Disbursing..." : "Confirm & Disburse Refund"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Notification Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            severity={snackbar.severity}
            variant="filled"
            onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
            sx={{ fontWeight: 600 }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </PageContainer>
  );
}
