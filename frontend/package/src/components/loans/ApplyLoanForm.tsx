"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  CardContent,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
  Snackbar,
  Alert,
  Box,
  Paper,
  InputAdornment,
  Chip,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";
import {
  IconCoins,
  IconUser,
  IconBuildingBank,
  IconCalendar,
  IconShieldCheck,
  IconFileText,
  IconClock,
  IconCash,
  IconArrowLeft,
  IconSend,
} from "@tabler/icons-react";
import { LoanCreate } from "@/interfaces/loan";
import loanService from "@/services/loan.service";
import { useMembers } from "@/hooks/useMembers";
import { useLoanProducts } from "@/hooks/useLoanProducts";

const today = new Date().toISOString().split("T")[0];

const defaultValues: LoanCreate = {
  member_id: 0,
  loan_product_id: 0,
  guarantor_member_id: null,
  principal_amount: 0,
  application_date: today,
  disbursement_date: null,
  num_periods: null,
  security_provided_value: null,
  security_provided_notes: null,
  deposit_paid_amount: null,
};

export default function ApplyLoanForm() {
  const router = useRouter();
  const methods = useForm<LoanCreate>({
    defaultValues,
    mode: "onBlur",
  });

  const { members } = useMembers();
  const { products } = useLoanProducts();

  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  const selectedLoanProductId = useWatch({
    control: methods.control,
    name: "loan_product_id",
  });

  const selectedMemberId = useWatch({
    control: methods.control,
    name: "member_id",
  });

  const selectedProduct = products.find(
    (product) => product.id === Number(selectedLoanProductId),
  );

  const selectedMember = members.find(
    (m) => m.id === Number(selectedMemberId),
  );

  const selectedGuarantorId = useWatch({
    control: methods.control,
    name: "guarantor_member_id",
  });

  const selectedGuarantor = members.find(
    (m) => m.id === Number(selectedGuarantorId),
  );

  const requiresGuarantor = selectedProduct?.requires_guarantor ?? false;

  useEffect(() => {
    if (!requiresGuarantor) {
      methods.setValue("guarantor_member_id", null);
    }
  }, [requiresGuarantor, methods]);

  async function onSubmit(data: LoanCreate) {
    try {
      setLoading(true);

      const payload = { ...data };

      if (selectedMember) {
        const fullName = [selectedMember.first_name, selectedMember.other_names].filter(Boolean).join(" ");
        (payload as any).member_name = fullName || `Member #${selectedMember.id}`;
        (payload as any).member_phone = selectedMember.phone_number || "0700000000";
      }

      if (selectedGuarantor) {
        const guarantorFullName = [selectedGuarantor.first_name, selectedGuarantor.other_names].filter(Boolean).join(" ");
        (payload as any).guarantor_name = guarantorFullName || `Guarantor #${selectedGuarantor.id}`;
        (payload as any).guarantor_phone = selectedGuarantor.phone_number || "0700000000";
      }

      if (payload.application_date) {
        payload.application_date = new Date(payload.application_date)
          .toISOString()
          .split("T")[0];
      }

      if (payload.disbursement_date) {
        payload.disbursement_date = new Date(payload.disbursement_date)
          .toISOString()
          .split("T")[0];
      } else {
        delete (payload as any).disbursement_date;
      }

      if (payload.security_provided_value === null) {
        delete (payload as any).security_provided_value;
      }

      if (
        payload.security_provided_notes === null ||
        payload.security_provided_notes === ""
      ) {
        delete (payload as any).security_provided_notes;
      }

      if (payload.deposit_paid_amount !== null) {
        (payload as any).deposit_paid_amount = Number(
          payload.deposit_paid_amount,
        ).toFixed(2);
      } else {
        (payload as any).deposit_paid_amount = "0.00";
      }

      await loanService.applyLoan(payload);

      methods.reset(defaultValues);

      setSnackbar({
        open: true,
        message: "Loan application submitted successfully to the SACCO Registry!",
        severity: "success",
      });

      setTimeout(() => {
        router.push("/loans");
      }, 1800);
    } catch (error: any) {
      console.error("Failed to apply loan:", error);

      let errorMessage = "Failed to submit loan application. Please verify your inputs.";

      if (error.response?.status === 500) {
        errorMessage =
          error.response?.data?.detail ||
          "The Loan Core Service encountered an internal error.";
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <Stack spacing={3.5}>
          {/* Module 1: Applicant & Loan Product Selection */}
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
                <IconBuildingBank size={24} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={900} sx={{ color: "#0f172a", fontSize: "1.15rem" }}>
                  1. Member Applicant &amp; Credit Product
                </Typography>
                <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
                  Select the registered SACCO borrower and desired credit facility
                </Typography>
              </Box>
            </Stack>

            <Grid container spacing={3}>
              {/* Member Selection */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.8, color: "#1e293b" }}>
                  Applicant Member <span style={{ color: "#e11d48" }}>*</span>
                </Typography>
                <Controller
                  name="member_id"
                  control={methods.control}
                  rules={{ validate: (v) => v > 0 || "Select a borrower member" }}
                  render={({ field, fieldState }) => (
                    <TextField
                      select
                      fullWidth
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <IconUser size={18} style={{ color: "#059669" }} />
                            </InputAdornment>
                          ),
                          sx: {
                            borderRadius: 2,
                            fontWeight: 600,
                            "& .MuiOutlinedInput-notchedOutline": { borderColor: "#cbd5e1" },
                            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#059669" },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#059669", borderWidth: 2 },
                          },
                        },
                      }}
                    >
                      <MenuItem value={0}>-- Select Member Applicant --</MenuItem>
                      {members.map((member) => (
                        <MenuItem key={member.id} value={member.id}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <span style={{ fontWeight: 800 }}>{member.first_name} {member.other_names}</span>
                            <span style={{ color: "#64748b", fontFamily: "monospace", fontSize: "0.82rem" }}>({member.membership_number})</span>
                          </Stack>
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>

              {/* Loan Product Selection */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.8, color: "#1e293b" }}>
                  Loan Product Tier <span style={{ color: "#e11d48" }}>*</span>
                </Typography>
                <Controller
                  name="loan_product_id"
                  control={methods.control}
                  rules={{ validate: (v) => v > 0 || "Select a loan product" }}
                  render={({ field, fieldState }) => (
                    <TextField
                      select
                      fullWidth
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <IconCoins size={18} style={{ color: "#059669" }} />
                            </InputAdornment>
                          ),
                          sx: {
                            borderRadius: 2,
                            fontWeight: 600,
                            "& .MuiOutlinedInput-notchedOutline": { borderColor: "#cbd5e1" },
                            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#059669" },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#059669", borderWidth: 2 },
                          },
                        },
                      }}
                    >
                      <MenuItem value={0}>-- Select Loan Product --</MenuItem>
                      {products.map((product) => (
                        <MenuItem key={product.id} value={product.id}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <span style={{ fontWeight: 800 }}>{product.product_name}</span>
                            {product.interest_rate && (
                              <Chip
                                size="small"
                                label={`${product.interest_rate}% p.a.`}
                                sx={{ height: 18, fontSize: "0.7rem", fontWeight: 800, bgcolor: "#ecfdf5", color: "#065f46" }}
                              />
                            )}
                          </Stack>
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Module 2: Principal Amount & Repayment Timeline */}
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
                <IconCash size={24} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={900} sx={{ color: "#0f172a", fontSize: "1.15rem" }}>
                  2. Loan Principal &amp; Amortization Terms
                </Typography>
                <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
                  Credit amount, repayment duration, and disbursement schedule
                </Typography>
              </Box>
            </Stack>

            <Grid container spacing={3}>
              {/* Principal Amount */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.8, color: "#1e293b" }}>
                  Principal Loan Amount (KES) <span style={{ color: "#e11d48" }}>*</span>
                </Typography>
                <Controller
                  name="principal_amount"
                  control={methods.control}
                  rules={{ min: { value: 1, message: "Principal amount must be greater than zero." } }}
                  render={({ field, fieldState }) => (
                    <TextField
                      fullWidth
                      type="number"
                      placeholder="e.g. 50000"
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <span style={{ fontWeight: 900, color: "#0d9488" }}>KES</span>
                            </InputAdornment>
                          ),
                          sx: {
                            borderRadius: 2,
                            fontWeight: 800,
                            fontFamily: "monospace",
                            "& .MuiOutlinedInput-notchedOutline": { borderColor: "#cbd5e1" },
                            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#0d9488" },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#0d9488", borderWidth: 2 },
                          },
                        },
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Repayment Periods */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.8, color: "#1e293b" }}>
                  Repayment Duration (Months / Periods)
                </Typography>
                <Controller
                  name="num_periods"
                  control={methods.control}
                  render={({ field }) => (
                    <TextField
                      fullWidth
                      type="number"
                      placeholder="e.g. 12 or 24"
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <IconClock size={18} style={{ color: "#0d9488" }} />
                            </InputAdornment>
                          ),
                          sx: {
                            borderRadius: 2,
                            fontWeight: 700,
                            "& .MuiOutlinedInput-notchedOutline": { borderColor: "#cbd5e1" },
                            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#0d9488" },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#0d9488", borderWidth: 2 },
                          },
                        },
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Application Date */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.8, color: "#1e293b" }}>
                  Application Date <span style={{ color: "#e11d48" }}>*</span>
                </Typography>
                <Controller
                  name="application_date"
                  control={methods.control}
                  rules={{ required: "Application date is required" }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="date"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <IconCalendar size={18} style={{ color: "#0d9488" }} />
                            </InputAdornment>
                          ),
                          sx: {
                            borderRadius: 2,
                            fontWeight: 600,
                            "& .MuiOutlinedInput-notchedOutline": { borderColor: "#cbd5e1" },
                            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#0d9488" },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#0d9488", borderWidth: 2 },
                          },
                        },
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Disbursement Date */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.8, color: "#1e293b" }}>
                  Expected Disbursement Date
                </Typography>
                <Controller
                  name="disbursement_date"
                  control={methods.control}
                  render={({ field }) => (
                    <TextField
                      fullWidth
                      type="date"
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <IconCalendar size={18} style={{ color: "#0d9488" }} />
                            </InputAdornment>
                          ),
                          sx: {
                            borderRadius: 2,
                            fontWeight: 600,
                            "& .MuiOutlinedInput-notchedOutline": { borderColor: "#cbd5e1" },
                            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#0d9488" },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#0d9488", borderWidth: 2 },
                          },
                        },
                      }}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Module 3: Security & Guarantor */}
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
                  3. Collateral Security &amp; Endorsement
                </Typography>
                <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
                  Guarantor endorsements, security appraisal value, and deposit down-payment
                </Typography>
              </Box>
            </Stack>

            <Grid container spacing={3}>
              {requiresGuarantor && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.8, color: "#1e293b" }}>
                    Guarantor Member <span style={{ color: "#e11d48" }}>*</span>
                  </Typography>
                  <Controller
                    name="guarantor_member_id"
                    control={methods.control}
                    rules={{ required: "Please select an endorsing guarantor member." }}
                    render={({ field, fieldState }) => (
                      <TextField
                        select
                        fullWidth
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                        slotProps={{
                          input: {
                            startAdornment: (
                              <InputAdornment position="start">
                                <IconUser size={18} style={{ color: "#2563eb" }} />
                              </InputAdornment>
                            ),
                            sx: {
                              borderRadius: 2,
                              fontWeight: 600,
                              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#cbd5e1" },
                              "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#2563eb" },
                              "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#2563eb", borderWidth: 2 },
                            },
                          },
                        }}
                      >
                        <MenuItem value="">-- Select Endorsing Guarantor --</MenuItem>
                        {members
                          .filter((m) => m.id !== methods.getValues("member_id"))
                          .map((member) => (
                            <MenuItem key={member.id} value={member.id}>
                              {member.first_name} {member.other_names} ({member.membership_number})
                            </MenuItem>
                          ))}
                      </TextField>
                    )}
                  />
                </Grid>
              )}

              {/* Security Value */}
              <Grid size={{ xs: 12, md: requiresGuarantor ? 6 : 6 }}>
                <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.8, color: "#1e293b" }}>
                  Collateral Valuation (KES)
                </Typography>
                <Controller
                  name="security_provided_value"
                  control={methods.control}
                  render={({ field }) => (
                    <TextField
                      fullWidth
                      type="number"
                      placeholder="e.g. 100000"
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <span style={{ fontWeight: 900, color: "#2563eb" }}>KES</span>
                            </InputAdornment>
                          ),
                          sx: {
                            borderRadius: 2,
                            fontWeight: 700,
                            fontFamily: "monospace",
                            "& .MuiOutlinedInput-notchedOutline": { borderColor: "#cbd5e1" },
                            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#2563eb" },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#2563eb", borderWidth: 2 },
                          },
                        },
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Deposit Paid */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.8, color: "#1e293b" }}>
                  Upfront Deposit Paid (KES)
                </Typography>
                <Controller
                  name="deposit_paid_amount"
                  control={methods.control}
                  render={({ field }) => (
                    <TextField
                      fullWidth
                      type="number"
                      placeholder="e.g. 5000"
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <span style={{ fontWeight: 900, color: "#2563eb" }}>KES</span>
                            </InputAdornment>
                          ),
                          sx: {
                            borderRadius: 2,
                            fontWeight: 700,
                            fontFamily: "monospace",
                            "& .MuiOutlinedInput-notchedOutline": { borderColor: "#cbd5e1" },
                            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#2563eb" },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#2563eb", borderWidth: 2 },
                          },
                        },
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Security Notes */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.8, color: "#1e293b" }}>
                  Security Notes &amp; Asset Logbook Details
                </Typography>
                <Controller
                  name="security_provided_notes"
                  control={methods.control}
                  render={({ field }) => (
                    <TextField
                      fullWidth
                      multiline
                      rows={2.5}
                      placeholder="Specify logbook numbers, title deed references, or chattel mortgage security particulars."
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                          "& fieldset": { borderColor: "#cbd5e1" },
                          "&:hover fieldset": { borderColor: "#2563eb" },
                          "&.Mui-focused fieldset": { borderColor: "#2563eb", borderWidth: 2 },
                        },
                      }}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Action Bar */}
          <Box
            sx={{
              p: 2.5,
              borderRadius: 3,
              bgcolor: "#ffffff",
              border: "1px solid #e2e8f0",
              boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Button
              variant="outlined"
              startIcon={<IconArrowLeft size={18} />}
              onClick={() => router.push("/loans")}
              disabled={loading}
              sx={{
                fontWeight: 800,
                borderRadius: 2,
                px: 3,
                py: 1.1,
                borderColor: "#cbd5e1",
                color: "#475569",
              }}
            >
              Back to Loans
            </Button>

            <LoadingButton
              type="submit"
              variant="contained"
              loading={loading}
              startIcon={<IconSend size={18} />}
              sx={{
                bgcolor: "#059669",
                color: "#ffffff",
                fontWeight: 800,
                borderRadius: 2,
                px: 4,
                py: 1.1,
                boxShadow: "0 4px 16px rgba(5, 150, 105, 0.35)",
                "&:hover": { bgcolor: "#047857" },
              }}
            >
              Submit Loan Application
            </LoadingButton>
          </Box>
        </Stack>
      </form>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          sx={{ borderRadius: 2.5, fontWeight: 700 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </FormProvider>
  );
}
