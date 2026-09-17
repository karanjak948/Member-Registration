"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
  Button,
  Alert,
  Autocomplete,
  InputAdornment,
  Chip,
  Avatar,
  Tooltip,
} from "@mui/material";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import { useMembers } from "@/hooks/useMembers";
import sharesService from "@/services/shares.service";
import { Member } from "@/interfaces/member";
import {
  IconCoins,
  IconUser,
  IconCreditCard,
  IconCalendarEvent,
  IconArrowLeft,
  IconDeviceFloppy,
  IconBuildingBank,
  IconCash,
  IconDeviceMobile,
  IconFileText,
  IconCheck,
  IconReceipt2,
  IconCertificate,
  IconShieldCheck,
  IconX,
  IconSparkles,
  IconAward,
  IconHash,
} from "@tabler/icons-react";

const KENYAN_BANKS = [
  "Family Bank",
  "Equity Bank",
  "KCB Bank",
  "Co-operative Bank",
  "ABSA Bank",
  "NCBA Bank",
  "Stanbic Bank",
  "Diamond Trust Bank (DTB)",
  "Standard Chartered",
  "I&M Bank",
  "Prime Bank",
  "Sidian Bank",
  "Postbank",
  "Other / M-Pesa Paybill",
];

function amountToWords(num: number): string {
  if (!num || isNaN(num) || num <= 0) return "Zero Kenya Shillings Only";
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const inWords = (n: number): string => {
    if (n === 0) return "";
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " and " + inWords(n % 100) : "");
    if (n < 1000000) return inWords(Math.floor(n / 1000)) + " Thousand" + (n % 1000 !== 0 ? " " + inWords(n % 1000) : "");
    if (n < 1000000000) return inWords(Math.floor(n / 1000000)) + " Million" + (n % 1000000 !== 0 ? " " + inWords(n % 1000000) : "");
    return n.toString();
  };

  const whole = Math.floor(num);
  const cents = Math.round((num - whole) * 100);
  let words = inWords(whole) + " Kenya Shillings";
  if (cents > 0) {
    words += " and " + inWords(cents) + " Cents";
  }
  return words + " Only";
}

export default function NewSharesPaymentPage() {
  const router = useRouter();
  const { members, loading: membersLoading } = useMembers();

  const todayStr = new Date().toISOString().split("T")[0];
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();
  const currentWeek = Math.min(5, Math.floor((today.getDate() - 1) / 7) + 1);

  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [formData, setFormData] = useState({
    document_no: `${100000 + Math.floor(10 + Math.random() * 900)}`,
    share_type: "ordinary",
    number_of_shares: "10",
    share_price: "100",
    currency: "Kenya Shilling(KSH)",
    payment_mode: "mpesa",
    bank_name: "Family Bank",
    transaction_no: "",
    paid_on: todayStr,
    paid_by: "",
    remarks: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const totalCalculated = useMemo(() => {
    const qty = parseFloat(formData.number_of_shares) || 0;
    const price = parseFloat(formData.share_price) || 0;
    return qty * price;
  }, [formData.number_of_shares, formData.share_price]);

  const quickShareCounts = [5, 10, 20, 50, 100, 250, 500];

  const handleQuickShares = (count: number) => {
    setFormData((prev) => ({ ...prev, number_of_shares: count.toString() }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) {
      setErrorMsg("Please select a member to proceed.");
      return;
    }
    const numShares = parseFloat(formData.number_of_shares);
    const price = parseFloat(formData.share_price);
    if (!numShares || numShares <= 0) {
      setErrorMsg("Please enter a valid number of shares greater than zero.");
      return;
    }
    if (!price || price <= 0) {
      setErrorMsg("Please enter a valid share price greater than zero.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      await sharesService.createPayment({
        member: selectedMember.id,
        document_no: formData.document_no || undefined,
        share_type: formData.share_type as any,
        number_of_shares: numShares,
        share_price: price,
        total_amount: totalCalculated,
        currency: formData.currency,
        payment_mode: formData.payment_mode as any,
        bank_name: formData.bank_name || undefined,
        transaction_no: formData.transaction_no || undefined,
        paid_on: formData.paid_on,
        week: currentWeek,
        month: currentMonth,
        year: currentYear,
        paid_by: formData.paid_by || `${selectedMember.first_name} ${selectedMember.other_names}`.trim(),
        remarks: formData.remarks || `Share capital payment: ${numShares} ${formData.share_type} shares`,
      });

      setSuccessMsg("Share payment successfully recorded and posted to General Ledger (Account 3010)!");
      setTimeout(() => {
        router.push("/shares");
      }, 1200);
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.detail ||
          err.response?.data?.error ||
          "Failed to record share payment. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageContainer
      title="Create sharespayments - Royal SACCO"
      description="Member share capital contribution capture form with auto-balanced ledger entry"
    >
      <Box sx={{ p: { xs: 1.5, sm: 3 }, bgcolor: "#f8fafc", minHeight: "100vh" }}>
        {/* ============================================================ */}
        {/* EXECUTIVE HERO HEADER BANNER                                 */}
        {/* ============================================================ */}
        <Box
          sx={{
            mb: 3.5,
            p: { xs: 2.5, md: 3.5 },
            borderRadius: 3.5,
            background: "linear-gradient(135deg, #064E3B 0%, #065F46 45%, #0F172A 100%)",
            color: "#ffffff",
            boxShadow: "0 14px 34px -8px rgba(6, 78, 59, 0.4)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Decorative radial background light */}
          <Box
            sx={{
              position: "absolute",
              top: -60,
              right: -60,
              width: 240,
              height: 240,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(16, 185, 129, 0.28) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={{ xs: 2.5, md: 3 }}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
            position="relative"
            zIndex={1}
          >
            <Box sx={{ flex: 1 }}>
              <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
                <Box
                  sx={{
                    p: 0.9,
                    bgcolor: "rgba(255, 255, 255, 0.15)",
                    borderRadius: 2,
                    display: "flex",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(255, 255, 255, 0.25)",
                  }}
                >
                  <IconCoins size={24} color="#6ee7b7" />
                </Box>
                <Typography
                  variant="caption"
                  fontWeight={800}
                  sx={{ color: "#a7f3d0", letterSpacing: "1.2px", textTransform: "uppercase" }}
                >
                  ROYAL SACCO :: SHARE CAPITAL ISSUANCE
                </Typography>
              </Stack>

              <Typography
                variant="h3"
                fontWeight={800}
                sx={{
                  color: "#ffffff",
                  letterSpacing: "-0.5px",
                  fontSize: { xs: "1.6rem", md: "2.1rem" },
                  mb: 0.7,
                }}
              >
                Create sharespayments
              </Typography>

              <Typography
                variant="body2"
                sx={{ color: "#cbd5e1", maxWidth: 720, lineHeight: 1.6, mb: 2 }}
              >
                Issue and record member share capital contributions matching official SACCO specifications with automatic double-entry posting to General Ledger.
              </Typography>

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                  size="small"
                  icon={<IconShieldCheck size={14} style={{ color: "#ffffff" }} />}
                  label="GL Posting: DR 1010 / CR 3010"
                  sx={{ bgcolor: "#059669", color: "#ffffff", fontWeight: 700, border: "1px solid #34d399" }}
                />
                <Chip
                  size="small"
                  icon={<IconAward size={14} style={{ color: "#ffffff" }} />}
                  label="Share Certificate Generation"
                  sx={{ bgcolor: "rgba(255, 255, 255, 0.15)", color: "#fef08a", fontWeight: 700, border: "1px solid rgba(255,255,255,0.25)" }}
                />
                <Chip
                  size="small"
                  icon={<IconSparkles size={14} style={{ color: "#ffffff" }} />}
                  label="Instant Audit Validation"
                  sx={{ bgcolor: "rgba(255, 255, 255, 0.12)", color: "#e2e8f0", fontWeight: 600 }}
                />
              </Stack>
            </Box>

            <Button
              component={Link}
              href="/shares"
              variant="contained"
              size="medium"
              startIcon={<IconArrowLeft size={18} />}
              sx={{
                borderRadius: 2.5,
                bgcolor: "rgba(255, 255, 255, 0.15)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                color: "#ffffff",
                textTransform: "none",
                fontWeight: 700,
                px: 2.5,
                py: 1,
                "&:hover": {
                  bgcolor: "rgba(255, 255, 255, 0.25)",
                  transform: "translateY(-1px)",
                },
                transition: "all 0.2s ease",
              }}
            >
              Back to Shares Register
            </Button>
          </Stack>
        </Box>

        {errorMsg && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 3, fontWeight: 600 }} onClose={() => setErrorMsg(null)}>
            {errorMsg}
          </Alert>
        )}

        {successMsg && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: 3, fontWeight: 600 }}>
            {successMsg}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Main Form Fields */}
            <Grid size={{ xs: 12, lg: 8 }}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 3.5,
                  border: "1.5px solid #e2e8f0",
                  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
                  overflow: "hidden",
                  bgcolor: "#ffffff",
                }}
              >
                <Box
                  sx={{
                    p: 2.8,
                    background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                    borderBottom: "1.5px solid #e2e8f0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box>
                    <Typography variant="subtitle1" fontWeight={800} color="#0f172a">
                      Share Payment Details
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Enter the member share allocation below. Values are verified and balanced immediately.
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    label="Official Voucher Desk"
                    sx={{ bgcolor: "#ecfdf5", color: "#065f46", fontWeight: 700, border: "1px solid #a7f3d0" }}
                  />
                </Box>

                <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
                  <Grid container spacing={2.5}>
                    {/* Row 1: Document No, Member, Shares */}
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Typography variant="caption" fontWeight={800} color="#334155" textTransform="uppercase" letterSpacing={0.5} mb={0.8} display="block">
                        Document No <span style={{ color: "#ef4444" }}>*</span>
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        value={formData.document_no}
                        onChange={(e) => setFormData({ ...formData, document_no: e.target.value })}
                        required
                        slotProps={{
                          input: {
                            startAdornment: <InputAdornment position="start"><IconHash size={16} color="#3b82f6" /></InputAdornment>,
                            sx: {
                              fontFamily: "monospace",
                              fontWeight: 800,
                              color: "#1d4ed8",
                              bgcolor: "#eff6ff",
                              borderRadius: 2,
                              border: "1px solid #bfdbfe",
                            },
                          },
                        }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                      <Typography variant="caption" fontWeight={800} color="#334155" textTransform="uppercase" letterSpacing={0.5} mb={0.8} display="block">
                        Member <span style={{ color: "#ef4444" }}>*</span>
                      </Typography>
                      <Autocomplete
                        options={members}
                        loading={membersLoading}
                        getOptionLabel={(opt) =>
                          `${opt.membership_number ? `[${opt.membership_number}] ` : ""}${opt.first_name} ${opt.other_names}`.trim()
                        }
                        value={selectedMember}
                        onChange={(_, val) => {
                          setSelectedMember(val);
                          if (val && !formData.paid_by) {
                            setFormData((prev) => ({
                              ...prev,
                              paid_by: `${val.first_name} ${val.other_names}`.trim(),
                            }));
                          }
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            size="small"
                            placeholder="Search by name / member no"
                            required
                            slotProps={{
                              input: {
                                ...params.InputProps,
                                sx: { borderRadius: 2, bgcolor: "#ffffff", fontWeight: 600 },
                                endAdornment: (
                                  <>
                                    {membersLoading ? <CircularProgress color="inherit" size={18} /> : null}
                                    {params.InputProps.endAdornment}
                                  </>
                                ),
                              },
                            }}
                          />
                        )}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                      <Typography variant="caption" fontWeight={800} color="#334155" textTransform="uppercase" letterSpacing={0.5} mb={0.8} display="block">
                        Shares Type <span style={{ color: "#ef4444" }}>*</span>
                      </Typography>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        value={formData.share_type}
                        onChange={(e) => setFormData({ ...formData, share_type: e.target.value })}
                        required
                        slotProps={{
                          input: {
                            sx: { borderRadius: 2, bgcolor: "#ffffff", fontWeight: 600 },
                          },
                        }}
                      >
                        <MenuItem value="ordinary">Ordinary Shares (KES 100/share)</MenuItem>
                        <MenuItem value="preference">Preference Shares (KES 100/share)</MenuItem>
                        <MenuItem value="capital">Capital Shares (KES 500/share)</MenuItem>
                      </TextField>
                    </Grid>

                    {/* Row 2: No Of Shares, Shares Amount, Total */}
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Typography variant="caption" fontWeight={800} color="#334155" textTransform="uppercase" letterSpacing={0.5} mb={0.8} display="block">
                        No Of Shares <span style={{ color: "#ef4444" }}>*</span>
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        value={formData.number_of_shares}
                        onChange={(e) => setFormData({ ...formData, number_of_shares: e.target.value })}
                        required
                        slotProps={{
                          input: {
                            sx: { borderRadius: 2, bgcolor: "#ffffff", fontWeight: 700 },
                          },
                          htmlInput: { min: 1, step: 1 },
                        }}
                      />
                      <Stack direction="row" spacing={0.6} mt={1.2} flexWrap="wrap" useFlexGap>
                        {quickShareCounts.map((count) => (
                          <Chip
                            key={count}
                            size="small"
                            label={`${count} shs`}
                            onClick={() => handleQuickShares(count)}
                            sx={{
                              cursor: "pointer",
                              fontWeight: 700,
                              fontSize: "0.74rem",
                              height: 24,
                              borderRadius: 1.5,
                              bgcolor: formData.number_of_shares === count.toString() ? "#059669" : "#f1f5f9",
                              color: formData.number_of_shares === count.toString() ? "#ffffff" : "#475569",
                              border: formData.number_of_shares === count.toString() ? "1px solid #047857" : "1px solid #e2e8f0",
                              "&:hover": { bgcolor: "#e2e8f0" },
                              transition: "all 0.15s ease",
                            }}
                          />
                        ))}
                      </Stack>
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                      <Typography variant="caption" fontWeight={800} color="#334155" textTransform="uppercase" letterSpacing={0.5} mb={0.8} display="block">
                        Shares Amount (Unit Price) <span style={{ color: "#ef4444" }}>*</span>
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        value={formData.share_price}
                        onChange={(e) => setFormData({ ...formData, share_price: e.target.value })}
                        required
                        slotProps={{
                          input: {
                            startAdornment: (
                              <InputAdornment position="start">
                                <Typography variant="caption" fontWeight={800} color="#64748b">
                                  KES
                                </Typography>
                              </InputAdornment>
                            ),
                            sx: { borderRadius: 2, bgcolor: "#ffffff", fontWeight: 700 },
                          },
                          htmlInput: { min: 1, step: 1 },
                        }}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                        Nominal value per single share unit
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                      <Typography variant="caption" fontWeight={800} color="#059669" textTransform="uppercase" letterSpacing={0.5} mb={0.8} display="block">
                        Total Amount (KES) ★
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        value={totalCalculated.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        slotProps={{
                          input: {
                            readOnly: true,
                            startAdornment: (
                              <InputAdornment position="start">
                                <Typography variant="caption" fontWeight={900} color="#059669">
                                  KES
                                </Typography>
                              </InputAdornment>
                            ),
                            sx: {
                              background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
                              border: "1.5px solid #34d399",
                              fontWeight: 900,
                              color: "#047857",
                              fontSize: "1.1rem",
                              borderRadius: 2,
                            },
                          },
                        }}
                      />
                      <Typography variant="caption" color="#059669" sx={{ mt: 0.5, display: "block", fontWeight: 600 }}>
                        Calculated: {formData.number_of_shares || 0} shares × KES {formData.share_price || 0}
                      </Typography>
                    </Grid>

                    {/* Row 3: Payment Mode, Transaction No */}
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="caption" fontWeight={800} color="#334155" textTransform="uppercase" letterSpacing={0.5} mb={0.8} display="block">
                        Payment Mode <span style={{ color: "#ef4444" }}>*</span>
                      </Typography>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        value={formData.payment_mode}
                        onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
                        required
                        slotProps={{
                          input: {
                            sx: { borderRadius: 2, bgcolor: "#ffffff", fontWeight: 600 },
                          },
                        }}
                      >
                        <MenuItem value="mpesa">M-Pesa Mobile Money</MenuItem>
                        <MenuItem value="cash">Cash In Hand</MenuItem>
                        <MenuItem value="bank">Bank Transfer / EFT</MenuItem>
                        <MenuItem value="cheque">Cheque Deposit</MenuItem>
                      </TextField>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="caption" fontWeight={800} color="#334155" textTransform="uppercase" letterSpacing={0.5} mb={0.8} display="block">
                        Transaction Reference No
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="e.g. QK12345678 or Bank Slip No"
                        value={formData.transaction_no}
                        onChange={(e) => setFormData({ ...formData, transaction_no: e.target.value })}
                        slotProps={{
                          input: {
                            sx: { borderRadius: 2, bgcolor: "#ffffff", fontFamily: "monospace" },
                          },
                        }}
                      />
                    </Grid>

                    {/* Bank Name if applicable */}
                    {(formData.payment_mode === "bank" || formData.payment_mode === "cheque") && (
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="caption" fontWeight={800} color="#334155" textTransform="uppercase" letterSpacing={0.5} mb={0.8} display="block">
                          Bank Name
                        </Typography>
                        <TextField
                          select
                          fullWidth
                          size="small"
                          value={formData.bank_name}
                          onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                          slotProps={{
                            input: {
                              sx: { borderRadius: 2, bgcolor: "#ffffff" },
                            },
                          }}
                        >
                          {KENYAN_BANKS.map((b) => (
                            <MenuItem key={b} value={b}>
                              {b}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                    )}

                    {/* Row 4: Paid On */}
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="caption" fontWeight={800} color="#334155" textTransform="uppercase" letterSpacing={0.5} mb={0.8} display="block">
                        Paid On <span style={{ color: "#ef4444" }}>*</span>
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        type="date"
                        value={formData.paid_on}
                        onChange={(e) => setFormData({ ...formData, paid_on: e.target.value })}
                        required
                        slotProps={{
                          input: {
                            sx: { borderRadius: 2, bgcolor: "#ffffff" },
                          },
                        }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="caption" fontWeight={800} color="#334155" textTransform="uppercase" letterSpacing={0.5} mb={0.8} display="block">
                        Paid By (Depositor)
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Depositor / Member full name"
                        value={formData.paid_by}
                        onChange={(e) => setFormData({ ...formData, paid_by: e.target.value })}
                        slotProps={{
                          input: {
                            sx: { borderRadius: 2, bgcolor: "#ffffff" },
                          },
                        }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" fontWeight={800} color="#334155" textTransform="uppercase" letterSpacing={0.5} mb={0.8} display="block">
                        Remarks / Notes
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        multiline
                        rows={2}
                        placeholder="Optional administrative remarks or notes regarding this share purchase"
                        value={formData.remarks}
                        onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                        slotProps={{
                          input: {
                            sx: { borderRadius: 2, bgcolor: "#ffffff" },
                          },
                        }}
                      />
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 3 }} />

                  {/* Actions matching Screenshot 1: Cancel on left (red), Save on right (green) */}
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Button
                      component={Link}
                      href="/shares"
                      variant="outlined"
                      sx={{
                        color: "#dc2626",
                        borderColor: "#fca5a5",
                        bgcolor: "#fff1f2",
                        "&:hover": { bgcolor: "#fee2e2", borderColor: "#f87171" },
                        fontWeight: 700,
                        textTransform: "none",
                        borderRadius: 2.5,
                        px: 3.5,
                        py: 1,
                      }}
                    >
                      Cancel
                    </Button>

                    <Button
                      type="submit"
                      variant="contained"
                      disabled={submitting}
                      startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <IconDeviceFloppy size={20} />}
                      sx={{
                        background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                        boxShadow: "0 10px 24px -4px rgba(5, 150, 105, 0.45)",
                        color: "#ffffff",
                        fontWeight: 800,
                        textTransform: "none",
                        borderRadius: 2.5,
                        px: 4.5,
                        py: 1.2,
                        fontSize: "0.98rem",
                        "&:hover": {
                          background: "linear-gradient(135deg, #047857 0%, #065f46 100%)",
                          transform: "translateY(-1px)",
                        },
                        transition: "all 0.2s ease",
                      }}
                    >
                      {submitting ? "Posting Share Capital..." : "Save Share Payment"}
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Sidebar Summary & Live Receipt Voucher Preview */}
            <Grid size={{ xs: 12, lg: 4 }}>
              <Stack spacing={3}>
                {/* Member Preview Card */}
                {selectedMember ? (
                  <Card
                    elevation={0}
                    sx={{
                      borderRadius: 3.5,
                      border: "1.5px solid #bfdbfe",
                      background: "linear-gradient(180deg, #eff6ff 0%, #ffffff 100%)",
                      p: 2.8,
                      boxShadow: "0 8px 20px -4px rgba(37, 99, 235, 0.12)",
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="center" mb={1.8}>
                      <Avatar
                        sx={{
                          background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                          width: 48,
                          height: 48,
                          fontWeight: 800,
                          fontSize: "1.15rem",
                          boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
                        }}
                      >
                        {selectedMember.first_name?.[0]}
                        {selectedMember.other_names?.[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={800} color="#1e3a8a">
                          {selectedMember.first_name} {selectedMember.other_names}
                        </Typography>
                        <Typography variant="caption" fontWeight={700} color="#2563eb">
                          Member #{selectedMember.membership_number || "—"}
                        </Typography>
                      </Box>
                    </Stack>
                    <Divider sx={{ my: 1.5, borderColor: "#dbeafe" }} />
                    <Stack spacing={1} sx={{ fontSize: "0.84rem", color: "#1e40af" }}>
                      <Stack direction="row" justifyContent="space-between">
                        <span>Phone:</span>
                        <strong>{selectedMember.phone_number || "—"}</strong>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <span>National ID:</span>
                        <strong>{selectedMember.national_id || "—"}</strong>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <span>Category:</span>
                        <Chip
                          size="small"
                          label={selectedMember.category_name || "Active Shareholder"}
                          sx={{
                            height: 22,
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            bgcolor: "#dbeafe",
                            color: "#1d4ed8",
                          }}
                        />
                      </Stack>
                    </Stack>
                  </Card>
                ) : (
                  <Card
                    elevation={0}
                    sx={{
                      borderRadius: 3.5,
                      border: "1.5px dashed #cbd5e1",
                      bgcolor: "#ffffff",
                      p: 3,
                      textAlign: "center",
                    }}
                  >
                    <IconUser size={40} color="#94a3b8" style={{ margin: "0 auto 10px" }} />
                    <Typography variant="body2" fontWeight={700} color="#64748b">
                      No Member Selected
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Choose a member from the dropdown to preview profile and certificate
                    </Typography>
                  </Card>
                )}

                {/* Luxury Official Share Certificate Preview Card */}
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: 3.5,
                    border: "2px solid #10b981",
                    background: "linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%)",
                    p: 3,
                    boxShadow: "0 12px 30px -6px rgba(16, 185, 129, 0.2)",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <Stack direction="row" spacing={1.2} alignItems="center" mb={2}>
                    <Box sx={{ p: 0.8, borderRadius: 2, bgcolor: "#dcfce7", color: "#059669", display: "flex" }}>
                      <IconCertificate size={22} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={900} color="#065f46" textTransform="uppercase" letterSpacing={0.5}>
                        Official Share Certificate
                      </Typography>
                      <Typography variant="caption" color="#047857">
                        Royal SACCO Equity Registry
                      </Typography>
                    </Box>
                  </Stack>

                  <Box
                    sx={{
                      p: 2.2,
                      bgcolor: "#ffffff",
                      borderRadius: 2.5,
                      border: "1.5px dashed #bbf7d0",
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" mb={1.2}>
                      <Typography variant="caption" color="text.secondary">
                        Document No:
                      </Typography>
                      <Typography variant="caption" fontWeight={800} color="#1d4ed8" fontFamily="monospace">
                        #{formData.document_no}
                      </Typography>
                    </Stack>

                    <Stack direction="row" justifyContent="space-between" mb={1.2}>
                      <Typography variant="caption" color="text.secondary">
                        Share Classification:
                      </Typography>
                      <Typography variant="caption" fontWeight={800} color="#0f172a" sx={{ textTransform: "capitalize" }}>
                        {formData.share_type} Shares
                      </Typography>
                    </Stack>

                    <Stack direction="row" justifyContent="space-between" mb={1.2}>
                      <Typography variant="caption" color="text.secondary">
                        Volume of Shares:
                      </Typography>
                      <Typography variant="caption" fontWeight={800} color="#0f172a">
                        {formData.number_of_shares || 0} units @ KES {formData.share_price || 0}
                      </Typography>
                    </Stack>

                    <Stack direction="row" justifyContent="space-between" mb={1.2}>
                      <Typography variant="caption" color="text.secondary">
                        Payment Channel:
                      </Typography>
                      <Typography variant="caption" fontWeight={800} color="#059669" sx={{ textTransform: "uppercase" }}>
                        {formData.payment_mode}
                      </Typography>
                    </Stack>

                    <Divider sx={{ my: 1.5, borderColor: "#e2e8f0" }} />

                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" fontWeight={800} color="#0f172a">
                        Total Capital:
                      </Typography>
                      <Typography variant="h5" fontWeight={900} color="#059669">
                        KES {totalCalculated.toLocaleString("en-KE", { minimumFractionDigits: 2 })}
                      </Typography>
                    </Stack>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 1, display: "block", fontStyle: "italic", fontSize: "0.75rem" }}
                    >
                      {amountToWords(totalCalculated)}
                    </Typography>
                  </Box>
                </Paper>
              </Stack>
            </Grid>
          </Grid>
        </form>
      </Box>
    </PageContainer>
  );
}
