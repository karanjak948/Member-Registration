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
} from "@mui/material";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import { useMembers } from "@/hooks/useMembers";
import savingsService from "@/services/savings.service";
import { Member } from "@/interfaces/member";
import {
  IconPigMoney,
  IconUser,
  IconCoins,
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
  IconHeartHandshake,
  IconShieldCheck,
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

const MONTHS = [
  { value: 1, label: "January (01)" },
  { value: 2, label: "February (02)" },
  { value: 3, label: "March (03)" },
  { value: 4, label: "April (04)" },
  { value: 5, label: "May (05)" },
  { value: 6, label: "June (06)" },
  { value: 7, label: "July (07)" },
  { value: 8, label: "August (08)" },
  { value: 9, label: "September (09)" },
  { value: 10, label: "October (10)" },
  { value: 11, label: "November (11)" },
  { value: 12, label: "December (12)" },
];

const YEARS = Array.from({ length: 15 }, (_, i) => 2024 + i);

// Helper to convert numbers to words for the receipt voucher
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

export default function NewSavingsPaymentPage() {
  const router = useRouter();
  const { members, loading: membersLoading } = useMembers();

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();
  const currentWeek = Math.min(5, Math.floor((today.getDate() - 1) / 7) + 1);

  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [formData, setFormData] = useState({
    document_no: `${Math.floor(100 + Math.random() * 900)}`,
    savings_type: "normal",
    amount: "",
    currency: "Kenya Shilling(KSH)",
    payment_mode: "mpesa",
    bank_name: "Family Bank",
    transaction_no: "",
    paid_on: todayStr,
    week: currentWeek,
    month: currentMonth,
    year: currentYear,
    paid_by: "",
    remarks: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const numericAmount = useMemo(() => {
    const val = parseFloat(formData.amount);
    return isNaN(val) ? 0 : val;
  }, [formData.amount]);

  const quickAmounts = [500, 1000, 2000, 5000, 10000];

  const handleQuickAmount = (amt: number) => {
    const current = parseFloat(formData.amount) || 0;
    setFormData((prev) => ({ ...prev, amount: (current + amt).toString() }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) {
      setErrorMsg("Please select a member to proceed.");
      return;
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      setErrorMsg("Please enter a valid deposit amount greater than zero.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      await savingsService.createPayment({
        member: selectedMember.id,
        document_no: formData.document_no || undefined,
        savings_type: formData.savings_type as any,
        transaction_type: "money_in",
        amount: Number(formData.amount),
        currency: formData.currency,
        payment_mode: formData.payment_mode as any,
        bank_name: formData.bank_name || undefined,
        transaction_no: formData.transaction_no || undefined,
        paid_on: formData.paid_on,
        week: Number(formData.week),
        month: Number(formData.month),
        year: Number(formData.year),
        paid_by: formData.paid_by || `${selectedMember.first_name} ${selectedMember.other_names}`.trim(),
        remarks: formData.remarks || `${formData.savings_type === "welfare" ? "Welfare" : "Normal"} savings contribution`,
      });

      setSuccessMsg("Savings payment successfully captured and posted to General Ledger!");
      setTimeout(() => {
        router.push("/savings");
      }, 1300);
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.detail ||
          err.response?.data?.error ||
          "Failed to record savings payment. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageContainer
      title="Savings Payment Entry - Royal SACCO"
      description="Executive Member Personal Account (MPA) deposit terminal with automated ledger posting"
    >
      <Box sx={{ p: { xs: 1.5, sm: 2.5 } }}>
        {/* Top Breadcrumb & Title Bar */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
          mb={3}
        >
          <Box>
            <Button
              component={Link}
              href="/savings"
              startIcon={<IconArrowLeft size={18} />}
              sx={{
                textTransform: "none",
                color: "#64748b",
                fontWeight: 700,
                fontSize: "0.85rem",
                p: 0,
                mb: 1,
                "&:hover": { color: "#0f172a", bgcolor: "transparent" },
              }}
            >
              Back to Savings Register
            </Button>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  p: 1.2,
                  borderRadius: 2.5,
                  bgcolor: "#064e3b",
                  color: "#34d399",
                  display: "flex",
                  boxShadow: "0 4px 12px rgba(6, 78, 59, 0.25)",
                }}
              >
                <IconPigMoney size={28} stroke={2.2} />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={900} color="#0f172a">
                  Savings Payment Entry
                </Typography>
                <Typography variant="body2" color="#64748b">
                  Member Personal Account (MPA) contribution &amp; automated double-entry ledger capture
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Chip
            icon={<IconShieldCheck size={16} color="#059669" />}
            label="MPA FINANCIAL TERMINAL ACTIVE"
            sx={{
              bgcolor: "#ecfdf5",
              color: "#065f46",
              fontWeight: 800,
              fontSize: "0.75rem",
              border: "1px solid #a7f3d0",
              letterSpacing: "0.5px",
            }}
          />
        </Stack>

        {errorMsg && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorMsg(null)}>
            {errorMsg}
          </Alert>
        )}
        {successMsg && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {successMsg}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* ======================================================== */}
          {/* LEFT COLUMN: PAYMENT ENTRY FORM (7 COLS)                 */}
          {/* ======================================================== */}
          <Grid size={{ xs: 12, lg: 7 }}>
            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                {/* CARD 1: MEMBER INFORMATION */}
                <Card
                  elevation={0}
                  sx={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 2.5,
                    bgcolor: "#ffffff",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                    overflow: "hidden",
                  }}
                >
                  <Box sx={{ px: 3, py: 2, bgcolor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    <Stack direction="row" spacing={1.2} alignItems="center">
                      <IconUser size={20} color="#059669" />
                      <Typography variant="subtitle1" fontWeight={800} color="#1e293b">
                        Step 1: Member Identification
                      </Typography>
                    </Stack>
                  </Box>

                  <CardContent sx={{ p: 3 }}>
                    <Grid container spacing={2.5}>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                          fullWidth
                          label="Document / Voucher No *"
                          required
                          value={formData.document_no}
                          onChange={(e) => setFormData({ ...formData, document_no: e.target.value })}
                          helperText="Unique receipt reference"
                          slotProps={{
                            input: {
                              startAdornment: (
                                <InputAdornment position="start">
                                  <IconReceipt2 size={16} color="#64748b" />
                                </InputAdornment>
                              ),
                            },
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 8 }}>
                        <Autocomplete
                          options={members}
                          loading={membersLoading}
                          value={selectedMember}
                          onChange={(_, value) => {
                            setSelectedMember(value);
                            if (value) {
                              setFormData((prev) => ({
                                ...prev,
                                paid_by: `${value.first_name} ${value.other_names}`.trim(),
                              }));
                            }
                          }}
                          getOptionLabel={(option) =>
                            `${option.membership_number} - ${option.first_name} ${option.other_names} (ID: ${option.national_id || "N/A"})`
                          }
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Select Member *"
                              required
                              placeholder="Search 1,000+ members by name, number, or phone..."
                              slotProps={{
                                input: {
                                  ...params.InputProps,
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
                    </Grid>

                    {/* Member Quick Preview Card */}
                    {selectedMember && (
                      <Box
                        sx={{
                          mt: 2.5,
                          p: 2,
                          bgcolor: "#f0fdf4",
                          border: "1px solid #bbf7d0",
                          borderRadius: 2,
                        }}
                      >
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
                          <Avatar
                            sx={{
                              width: 46,
                              height: 46,
                              bgcolor: "#059669",
                              fontWeight: 800,
                              fontSize: "1.1rem",
                              color: "#ffffff",
                            }}
                          >
                            {selectedMember.first_name?.[0]}
                            {selectedMember.other_names?.[0]}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography variant="subtitle1" fontWeight={800} color="#064e3b">
                                {selectedMember.first_name} {selectedMember.other_names}
                              </Typography>
                              <Chip
                                label={selectedMember.membership_number}
                                size="small"
                                sx={{ bgcolor: "#059669", color: "#ffffff", fontWeight: 800, fontSize: "0.72rem" }}
                              />
                            </Stack>
                            <Typography variant="caption" color="#047857">
                              National ID: <strong>{selectedMember.national_id || "N/A"}</strong> &bull; Phone:{" "}
                              <strong>{selectedMember.phone_number || "N/A"}</strong> &bull; Status:{" "}
                              <strong>{selectedMember.status || "ACTIVE"}</strong>
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>
                    )}
                  </CardContent>
                </Card>

                {/* CARD 2: SAVINGS TYPE & AMOUNT */}
                <Card
                  elevation={0}
                  sx={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 2.5,
                    bgcolor: "#ffffff",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                    overflow: "hidden",
                  }}
                >
                  <Box sx={{ px: 3, py: 2, bgcolor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    <Stack direction="row" spacing={1.2} alignItems="center">
                      <IconCoins size={20} color="#0284c7" />
                      <Typography variant="subtitle1" fontWeight={800} color="#1e293b">
                        Step 2: Contribution Particulars
                      </Typography>
                    </Stack>
                  </Box>

                  <CardContent sx={{ p: 3 }}>
                    {/* Visual Savings Type Toggle Cards */}
                    <Typography variant="caption" fontWeight={700} color="#64748b" textTransform="uppercase">
                      Select Savings Fund Category *
                    </Typography>
                    <Grid container spacing={2} sx={{ mt: 0.5, mb: 3 }}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Paper
                          onClick={() => setFormData({ ...formData, savings_type: "normal" })}
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            cursor: "pointer",
                            border: formData.savings_type === "normal" ? "2px solid #059669" : "1px solid #e2e8f0",
                            bgcolor: formData.savings_type === "normal" ? "#f0fdf4" : "#ffffff",
                            transition: "all 0.2s ease",
                            "&:hover": { borderColor: "#059669", bgcolor: "#f0fdf4" },
                          }}
                        >
                          <Stack direction="row" spacing={1.5} alignItems="flex-start">
                            <Box
                              sx={{
                                p: 1,
                                borderRadius: 1.5,
                                bgcolor: formData.savings_type === "normal" ? "#059669" : "#f1f5f9",
                                color: formData.savings_type === "normal" ? "#ffffff" : "#64748b",
                              }}
                            >
                              <IconPigMoney size={22} />
                            </Box>
                            <Box>
                              <Typography variant="subtitle2" fontWeight={800} color={formData.savings_type === "normal" ? "#064e3b" : "#1e293b"}>
                                Normal Savings
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Core deposit fund (Ledger Account 2010). Builds member loan eligibility multiplier.
                              </Typography>
                            </Box>
                          </Stack>
                        </Paper>
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Paper
                          onClick={() => setFormData({ ...formData, savings_type: "welfare" })}
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            cursor: "pointer",
                            border: formData.savings_type === "welfare" ? "2px solid #0284c7" : "1px solid #e2e8f0",
                            bgcolor: formData.savings_type === "welfare" ? "#eff6ff" : "#ffffff",
                            transition: "all 0.2s ease",
                            "&:hover": { borderColor: "#0284c7", bgcolor: "#eff6ff" },
                          }}
                        >
                          <Stack direction="row" spacing={1.5} alignItems="flex-start">
                            <Box
                              sx={{
                                p: 1,
                                borderRadius: 1.5,
                                bgcolor: formData.savings_type === "welfare" ? "#0284c7" : "#f1f5f9",
                                color: formData.savings_type === "welfare" ? "#ffffff" : "#64748b",
                              }}
                            >
                              <IconHeartHandshake size={22} />
                            </Box>
                            <Box>
                              <Typography variant="subtitle2" fontWeight={800} color={formData.savings_type === "welfare" ? "#1e40af" : "#1e293b"}>
                                Welfare Fund (Ksh)
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Benevolent &amp; emergency fund (Ledger Account 2020). Social member safety net.
                              </Typography>
                            </Box>
                          </Stack>
                        </Paper>
                      </Grid>
                    </Grid>

                    {/* Big Deposit Amount Input */}
                    <Grid container spacing={2.5}>
                      <Grid size={{ xs: 12, sm: 8 }}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Deposit Amount *"
                          required
                          value={formData.amount}
                          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                          slotProps={{
                            input: {
                              startAdornment: (
                                <InputAdornment position="start">
                                  <Typography variant="h6" fontWeight={800} color="#059669">
                                    KES
                                  </Typography>
                                </InputAdornment>
                              ),
                              sx: { fontSize: "1.2rem", fontWeight: 800 },
                            },
                          }}
                          helperText={
                            numericAmount > 0 ? (
                              <Typography component="span" variant="caption" fontWeight={700} color="#047857">
                                In words: {amountToWords(numericAmount)}
                              </Typography>
                            ) : (
                              "Enter contribution amount in Kenyan Shillings"
                            )
                          }
                        />

                        {/* Quick increment chips */}
                        <Stack direction="row" spacing={1} mt={1} flexWrap="wrap" useFlexGap>
                          <Typography variant="caption" color="text.secondary" sx={{ alignSelf: "center" }}>
                            Quick Add:
                          </Typography>
                          {quickAmounts.map((amt) => (
                            <Chip
                              key={amt}
                              label={`+${amt.toLocaleString()}`}
                              size="small"
                              onClick={() => handleQuickAmount(amt)}
                              sx={{
                                bgcolor: "#f1f5f9",
                                fontWeight: 700,
                                fontSize: "0.72rem",
                                cursor: "pointer",
                                "&:hover": { bgcolor: "#e2e8f0", color: "#059669" },
                              }}
                            />
                          ))}
                          <Chip
                            label="Clear"
                            size="small"
                            variant="outlined"
                            onClick={() => setFormData({ ...formData, amount: "" })}
                            sx={{ fontWeight: 600, fontSize: "0.72rem" }}
                          />
                        </Stack>
                      </Grid>

                      <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                          select
                          fullWidth
                          label="Currency *"
                          required
                          value={formData.currency}
                          onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                        >
                          <MenuItem value="Kenya Shilling(KSH)">Kenya Shilling (KSH)</MenuItem>
                          <MenuItem value="USD">US Dollar (USD)</MenuItem>
                          <MenuItem value="EUR">Euro (EUR)</MenuItem>
                        </TextField>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* CARD 3: PAYMENT CHANNEL & DATE */}
                <Card
                  elevation={0}
                  sx={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 2.5,
                    bgcolor: "#ffffff",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                    overflow: "hidden",
                  }}
                >
                  <Box sx={{ px: 3, py: 2, bgcolor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    <Stack direction="row" spacing={1.2} alignItems="center">
                      <IconCreditCard size={20} color="#7c3aed" />
                      <Typography variant="subtitle1" fontWeight={800} color="#1e293b">
                        Step 3: Payment Channel &amp; Execution
                      </Typography>
                    </Stack>
                  </Box>

                  <CardContent sx={{ p: 3 }}>
                    {/* Payment Mode Selector Buttons */}
                    <Typography variant="caption" fontWeight={700} color="#64748b" textTransform="uppercase">
                      Payment Mode *
                    </Typography>
                    <Grid container spacing={1.5} sx={{ mt: 0.5, mb: 2.5 }}>
                      {[
                        { id: "mpesa", label: "M-Pesa", icon: IconDeviceMobile, color: "#10b981" },
                        { id: "bank", label: "Bank Transfer", icon: IconBuildingBank, color: "#0284c7" },
                        { id: "cash", label: "Cash Desk", icon: IconCash, color: "#f59e0b" },
                        { id: "cheque", label: "Cheque", icon: IconFileText, color: "#8b5cf6" },
                      ].map((mode) => {
                        const isSelected = formData.payment_mode === mode.id;
                        const ModeIcon = mode.icon;
                        return (
                          <Grid size={{ xs: 6, sm: 3 }} key={mode.id}>
                            <Paper
                              onClick={() => setFormData({ ...formData, payment_mode: mode.id })}
                              sx={{
                                p: 1.5,
                                textAlign: "center",
                                cursor: "pointer",
                                borderRadius: 2,
                                border: isSelected ? `2px solid ${mode.color}` : "1px solid #e2e8f0",
                                bgcolor: isSelected ? "rgba(2, 132, 199, 0.05)" : "#ffffff",
                                transition: "all 0.2s ease",
                                "&:hover": { borderColor: mode.color },
                              }}
                            >
                              <ModeIcon size={24} color={mode.color} />
                              <Typography variant="body2" fontWeight={isSelected ? 800 : 600} mt={0.5}>
                                {mode.label}
                              </Typography>
                            </Paper>
                          </Grid>
                        );
                      })}
                    </Grid>

                    <Grid container spacing={2.5}>
                      {formData.payment_mode === "bank" && (
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            select
                            fullWidth
                            label="Receiving Bank *"
                            required
                            value={formData.bank_name}
                            onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                          >
                            {KENYAN_BANKS.map((b) => (
                              <MenuItem key={b} value={b}>
                                {b}
                              </MenuItem>
                            ))}
                          </TextField>
                        </Grid>
                      )}

                      <Grid size={{ xs: 12, sm: formData.payment_mode === "bank" ? 6 : 6 }}>
                        <TextField
                          fullWidth
                          label={
                            formData.payment_mode === "mpesa"
                              ? "M-Pesa Transaction Code *"
                              : "Transaction / Receipt Reference"
                          }
                          placeholder={formData.payment_mode === "mpesa" ? "e.g. QWE78945612" : "Reference code"}
                          value={formData.transaction_no}
                          onChange={(e) => setFormData({ ...formData, transaction_no: e.target.value })}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          type="date"
                          label="Payment Date *"
                          required
                          value={formData.paid_on}
                          onChange={(e) => setFormData({ ...formData, paid_on: e.target.value })}
                          slotProps={{ inputLabel: { shrink: true } }}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* CARD 4: CONTRIBUTION PERIOD & REMARKS */}
                <Card
                  elevation={0}
                  sx={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 2.5,
                    bgcolor: "#ffffff",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                    overflow: "hidden",
                  }}
                >
                  <Box sx={{ px: 3, py: 2, bgcolor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    <Stack direction="row" spacing={1.2} alignItems="center">
                      <IconCalendarEvent size={20} color="#d97706" />
                      <Typography variant="subtitle1" fontWeight={800} color="#1e293b">
                        Step 4: Contribution Period &amp; Narration
                      </Typography>
                    </Stack>
                  </Box>

                  <CardContent sx={{ p: 3 }}>
                    <Grid container spacing={2.5}>
                      <Grid size={{ xs: 4 }}>
                        <TextField
                          select
                          fullWidth
                          label="Week"
                          value={formData.week}
                          onChange={(e) => setFormData({ ...formData, week: Number(e.target.value) })}
                        >
                          {[1, 2, 3, 4, 5].map((w) => (
                            <MenuItem key={w} value={w}>
                              Week {w}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid size={{ xs: 4 }}>
                        <TextField
                          select
                          fullWidth
                          label="Month"
                          value={formData.month}
                          onChange={(e) => setFormData({ ...formData, month: Number(e.target.value) })}
                        >
                          {MONTHS.map((m) => (
                            <MenuItem key={m.value} value={m.value}>
                              {m.label}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid size={{ xs: 4 }}>
                        <TextField
                          select
                          fullWidth
                          label="Year"
                          value={formData.year}
                          onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                        >
                          {YEARS.map((y) => (
                            <MenuItem key={y} value={y}>
                              {y}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          label="Depositor Name (Paid By)"
                          placeholder="Name of person making deposit"
                          value={formData.paid_by}
                          onChange={(e) => setFormData({ ...formData, paid_by: e.target.value })}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          label="Remarks / Reference Note"
                          placeholder="Optional audit notes"
                          value={formData.remarks}
                          onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Submit and Cancel Actions */}
                <Stack direction="row" spacing={2} justifyContent="flex-end" pt={1}>
                  <Button
                    component={Link}
                    href="/savings"
                    variant="outlined"
                    sx={{
                      textTransform: "none",
                      fontWeight: 700,
                      px: 3,
                      py: 1.2,
                      borderColor: "#cbd5e1",
                      color: "#475569",
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={submitting}
                    startIcon={
                      submitting ? <CircularProgress size={18} color="inherit" /> : <IconDeviceFloppy size={20} />
                    }
                    sx={{
                      bgcolor: "#059669",
                      "&:hover": { bgcolor: "#047857" },
                      fontWeight: 800,
                      fontSize: "1rem",
                      textTransform: "none",
                      px: 4,
                      py: 1.2,
                      borderRadius: 2,
                      boxShadow: "0 4px 14px rgba(5, 150, 105, 0.35)",
                    }}
                  >
                    {submitting ? "Saving & Posting to Ledger..." : "Save Savings Payment"}
                  </Button>
                </Stack>
              </Stack>
            </form>
          </Grid>

          {/* ======================================================== */}
          {/* RIGHT COLUMN: LIVE OFFICIAL RECEIPT VOUCHER PREVIEW     */}
          {/* ======================================================== */}
          <Grid size={{ xs: 12, lg: 5 }}>
            <Box sx={{ position: "sticky", top: 85 }}>
              {/* Header Badge */}
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                <Typography variant="caption" fontWeight={800} color="#047857" letterSpacing={0.8} textTransform="uppercase">
                  Live Official Receipt Preview
                </Typography>
                <Chip
                  label="REAL-TIME SYNC"
                  size="small"
                  sx={{
                    bgcolor: "#ecfdf5",
                    color: "#059669",
                    fontWeight: 800,
                    fontSize: "0.68rem",
                    border: "1px solid #bbf7d0",
                  }}
                />
              </Stack>

              {/* Physical Receipt Slip Container */}
              <Paper
                elevation={4}
                sx={{
                  p: 3.5,
                  borderRadius: 3,
                  bgcolor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
                  position: "relative",
                  backgroundImage: "radial-gradient(#f8fafc 1px, transparent 1px)",
                  backgroundSize: "16px 16px",
                }}
              >
                {/* SACCO Header */}
                <Box textAlign="center" pb={2} borderBottom="2px solid #059669">
                  <Box
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 44,
                      height: 44,
                      borderRadius: 2.5,
                      bgcolor: "#064e3b",
                      color: "#34d399",
                      mb: 1,
                    }}
                  >
                    <IconBuildingBank size={28} stroke={2.2} />
                  </Box>
                  <Typography variant="h5" fontWeight={900} color="#064e3b" letterSpacing={0.5}>
                    ROYAL SACCO SOCIETY LTD
                  </Typography>
                </Box>

                {/* Voucher Title Strip */}
                <Box
                  sx={{
                    my: 2,
                    py: 0.8,
                    px: 2,
                    bgcolor: formData.savings_type === "welfare" ? "#eff6ff" : "#ecfdf5",
                    borderRadius: 1.5,
                    textAlign: "center",
                    border: formData.savings_type === "welfare" ? "1px solid #bfdbfe" : "1px solid #a7f3d0",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    fontWeight={900}
                    color={formData.savings_type === "welfare" ? "#1e40af" : "#065f46"}
                    letterSpacing={0.5}
                  >
                    OFFICIAL {formData.savings_type === "welfare" ? "WELFARE FUND" : "SAVINGS"} RECEIPT VOUCHER
                  </Typography>
                </Box>

                {/* Receipt Metadata Grid */}
                <Grid container spacing={1.5} sx={{ mb: 2, fontSize: "0.8rem" }}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      RECEIPT NO:
                    </Typography>
                    <Typography variant="body2" fontWeight={800} color="#0f172a">
                      SAV-{formData.document_no || "000"}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }} textAlign="right">
                    <Typography variant="caption" color="text.secondary">
                      TRANSACTION DATE:
                    </Typography>
                    <Typography variant="body2" fontWeight={800} color="#0f172a">
                      {formData.paid_on}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Divider sx={{ my: 0.5 }} />
                  </Grid>

                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      MEMBER NAME:
                    </Typography>
                    <Typography variant="body2" fontWeight={800} color="#0f172a">
                      {selectedMember ? `${selectedMember.first_name} ${selectedMember.other_names}` : "— Select Member —"}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }} textAlign="right">
                    <Typography variant="caption" color="text.secondary">
                      MEMBERSHIP NO:
                    </Typography>
                    <Typography variant="body2" fontWeight={800} color="#047857">
                      {selectedMember?.membership_number || "—"}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      NATIONAL ID:
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {selectedMember?.national_id || "—"}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }} textAlign="right">
                    <Typography variant="caption" color="text.secondary">
                      PERIOD:
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>
                      Week {formData.week}, Month {formData.month}/{formData.year}
                    </Typography>
                  </Grid>
                </Grid>

                {/* Payment Particulars Box */}
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    mb: 2,
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="caption" fontWeight={700} color="#475569">
                      PARTICULARS
                    </Typography>
                    <Typography variant="caption" fontWeight={700} color="#475569">
                      AMOUNT (KES)
                    </Typography>
                  </Stack>
                  <Divider sx={{ mb: 1.5 }} />

                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="subtitle2" fontWeight={800} color="#1e293b">
                        {formData.savings_type === "welfare" ? "Member Welfare Contribution" : "Normal Personal Savings Deposit"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Mode: <strong>{formData.payment_mode.toUpperCase()}</strong>
                        {formData.transaction_no ? ` &bull; Ref: ${formData.transaction_no}` : ""}
                      </Typography>
                    </Box>
                    <Typography variant="h6" fontWeight={900} color="#059669">
                      KES {numericAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </Typography>
                  </Stack>
                </Box>

                {/* Amount in Words */}
                <Box
                  sx={{
                    p: 1.5,
                    bgcolor: "#ecfdf5",
                    borderRadius: 1.5,
                    borderLeft: "4px solid #059669",
                    mb: 2.5,
                  }}
                >
                  <Typography variant="caption" color="#047857" fontWeight={700} display="block">
                    AMOUNT IN WORDS:
                  </Typography>
                  <Typography variant="body2" fontWeight={800} color="#065f46" fontStyle="italic">
                    {amountToWords(numericAmount)}
                  </Typography>
                </Box>

                {/* Ledger Posting Breakdown Badge */}
                <Box sx={{ mb: 2, p: 1.5, borderRadius: 1.5, bgcolor: "#f1f5f9", fontSize: "0.72rem" }}>
                  <Typography variant="caption" fontWeight={800} color="#475569" display="block" mb={0.5}>
                    AUTOMATED GENERAL LEDGER POSTING:
                  </Typography>
                  <Stack direction="row" justifyContent="space-between" color="#334155">
                    <span>Dr 1010 - Cash &amp; Bank Balances (Asset)</span>
                    <strong>+KES {numericAmount.toLocaleString()}</strong>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between" color="#334155">
                    <span>
                      Cr {formData.savings_type === "welfare" ? "2020 - Welfare Fund" : "2010 - Normal Savings"}{" "}
                      (Liability)
                    </span>
                    <strong>+KES {numericAmount.toLocaleString()}</strong>
                  </Stack>
                </Box>

                {/* Official Signatures & Seal */}
                <Stack direction="row" justifyContent="space-between" alignItems="flex-end" pt={1}>
                  <Box textAlign="center">
                    <Box sx={{ width: 120, borderBottom: "1px dashed #94a3b8", mb: 0.5 }} />
                    <Typography variant="caption" color="text.secondary" fontSize="0.68rem">
                      Authorized Cashier
                    </Typography>
                  </Box>

                  {/* Stamp Box */}
                  <Box
                    sx={{
                      width: 90,
                      height: 90,
                      borderRadius: "50%",
                      border: "2px dashed #059669",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#059669",
                      fontSize: "0.6rem",
                      fontWeight: 800,
                      textAlign: "center",
                      lineHeight: 1.1,
                      transform: "rotate(-8deg)",
                    }}
                  >
                    <span>ROYAL SACCO</span>
                    <span style={{ fontSize: "0.75rem" }}>★ ★ ★</span>
                    <span>AUDITED</span>
                  </Box>

                  <Box textAlign="center">
                    <Box sx={{ width: 120, borderBottom: "1px dashed #94a3b8", mb: 0.5 }} />
                    <Typography variant="caption" color="text.secondary" fontSize="0.68rem">
                      Member Signature
                    </Typography>
                  </Box>
                </Stack>

                <Typography
                  variant="caption"
                  color="#94a3b8"
                  display="block"
                  textAlign="center"
                  mt={2.5}
                  fontSize="0.65rem"
                >
                  This is an official system generated document &bull; Valid without physical alterations
                </Typography>
              </Paper>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  );
}
