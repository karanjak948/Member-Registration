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
  IconCalculator,
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
    severity: "success" | "error" | "warning" | "info";
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

  const watchedPrincipal = useWatch({
    control: methods.control,
    name: "principal_amount",
  });

  const watchedPeriods = useWatch({
    control: methods.control,
    name: "num_periods",
  });

  const [previewData, setPreviewData] = useState<{
    installment: number;
    totalInterest: number;
    totalPayable: number;
    fees: Array<{ fee_name: string; amount: string }>;
  } | null>(null);

  useEffect(() => {
    const principal = Number(watchedPrincipal || 0);
    if (!selectedProduct || principal <= 0) {
      setPreviewData(null);
      return;
    }

    const periods = Number(watchedPeriods) || selectedProduct.max_repayment_period || 12;
    const rate = Number(selectedProduct.interest_rate || 0);
    const method = selectedProduct.interest_method || "reducing_balance";
    const isYearly = selectedProduct.interest_period === "yearly";

    // Immediate calculation for zero-latency feedback
    const periodicRate = isYearly ? (rate / 100) / 12 : (rate / 100);
    let installment = 0;
    let totalInterest = 0;
    let totalPayable = 0;

    if (method === "reducing_balance" && periodicRate > 0) {
      const factor = Math.pow(1 + periodicRate, periods);
      installment = principal * (periodicRate * factor) / (factor - 1);
      totalPayable = installment * periods;
      totalInterest = totalPayable - principal;
    } else {
      // Flat rate formula
      totalInterest = principal * periodicRate * periods;
      totalPayable = principal + totalInterest;
      installment = totalPayable / periods;
    }

    setPreviewData({
      installment: Math.round(installment * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      totalPayable: Math.round(totalPayable * 100) / 100,
      fees: (selectedProduct.fees || []).map((f: any) => ({
        fee_name: f.fee_name,
        amount: f.fee_type === "percentage" ? String((principal * Number(f.fee_value) / 100).toFixed(2)) : String(Number(f.fee_value).toFixed(2)),
      })),
    });

    // Query engine preview for exact backend calculations
    const timer = setTimeout(() => {
      loanService
        .calculatePreview({
          principal,
          loan_product_id: selectedProduct.id,
          num_periods: periods,
        })
        .then((res) => {
          if (res) {
            setPreviewData({
              installment: Number(res.regular_installment),
              totalInterest: Number(res.total_interest),
              totalPayable: Number(res.total_payable),
              fees: res.fees || [],
            });
          }
        })
        .catch(() => {});
    }, 400);

    return () => clearTimeout(timer);
  }, [selectedProduct, watchedPrincipal, watchedPeriods]);

  useEffect(() => {
    if (!requiresGuarantor) {
      methods.setValue("guarantor_member_id", null);
    }
  }, [requiresGuarantor, methods]);

  const productMinAmount = selectedProduct?.min_amount ? Number(selectedProduct.min_amount) : 0;
  const productMaxAmount = selectedProduct?.max_amount ? Number(selectedProduct.max_amount) : null;
  const productMaxPeriods = selectedProduct?.max_repayment_period ? Number(selectedProduct.max_repayment_period) : null;

  const isBelowMin = Boolean(productMinAmount > 0 && watchedPrincipal && Number(watchedPrincipal) < productMinAmount);
  const isAboveMax = Boolean(productMaxAmount && watchedPrincipal && Number(watchedPrincipal) > productMaxAmount);
  const isExceedingPeriods = Boolean(productMaxPeriods && watchedPeriods && Number(watchedPeriods) > productMaxPeriods);

  async function onSubmit(data: LoanCreate) {
    try {
      if (!data.member_id) {
        console.warn("[Loan Application Guidance]: Please select an Applicant Member.");
        setSnackbar({
          open: true,
          message: "Please select an Applicant Member to proceed.",
          severity: "warning",
        });
        return;
      }

      if (!data.loan_product_id) {
        console.warn("[Loan Application Guidance]: Please select a Loan Product tier.");
        setSnackbar({
          open: true,
          message: "Please select a Loan Product tier to proceed.",
          severity: "warning",
        });
        return;
      }

      if (isBelowMin) {
        console.warn(
          `[Loan Application Policy]: Entered principal KES ${watchedPrincipal} is below the minimum required KES ${productMinAmount} for ${selectedProduct?.product_name}.`
        );
        setSnackbar({
          open: true,
          message: `Policy Requirement: Minimum loan amount for ${selectedProduct?.product_name} is KES ${productMinAmount.toLocaleString()}.`,
          severity: "warning",
        });
        return;
      }

      if (isAboveMax) {
        console.warn(
          `[Loan Application Policy]: Entered principal KES ${watchedPrincipal} exceeds maximum allowed KES ${productMaxAmount} for ${selectedProduct?.product_name}.`
        );
        setSnackbar({
          open: true,
          message: `Policy Requirement: Maximum allowed loan for ${selectedProduct?.product_name} is KES ${productMaxAmount?.toLocaleString()}.`,
          severity: "warning",
        });
        return;
      }

      if (isExceedingPeriods) {
        console.warn(
          `[Loan Application Policy]: Repayment periods (${watchedPeriods}) exceed product limit of ${productMaxPeriods}.`
        );
        setSnackbar({
          open: true,
          message: `Policy Requirement: Maximum repayment duration for ${selectedProduct?.product_name} is ${productMaxPeriods} periods.`,
          severity: "warning",
        });
        return;
      }

      setLoading(true);

      const payload: any = { ...data };

      // Map member and loan product IDs to match Django foreign keys
      const memberId = Number(data.member_id);
      const productId = Number(data.loan_product_id);

      payload.member = memberId;
      payload.member_id = memberId;
      payload.loan_product = productId;
      payload.loan_product_id = productId;
      payload.principal_amount = Number(data.principal_amount);
      payload.num_periods = Number(data.num_periods || 12);

      if (selectedMember) {
        const fullName = [selectedMember.first_name, selectedMember.other_names].filter(Boolean).join(" ");
        payload.member_name = fullName || `Member #${selectedMember.id}`;
        payload.member_phone = selectedMember.phone_number || "0700000000";
      }

      if (selectedGuarantor) {
        const guarantorFullName = [selectedGuarantor.first_name, selectedGuarantor.other_names].filter(Boolean).join(" ");
        payload.guarantor_name = guarantorFullName || `Guarantor #${selectedGuarantor.id}`;
        payload.guarantor_phone = selectedGuarantor.phone_number || "0700000000";
      }

      if (data.guarantor_member_id) {
        payload.guarantor_member_id = Number(data.guarantor_member_id);
        payload.guarantors_data = [
          {
            guarantor_member: Number(data.guarantor_member_id),
            guarantee_amount: Number(data.principal_amount),
            status: "accepted",
          },
        ];
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
        delete payload.disbursement_date;
      }

      if (payload.security_provided_value) {
        payload.security_provided_value = Number(payload.security_provided_value);
        payload.collaterals_data = [
          {
            asset_type: "COLLATERAL",
            asset_name: payload.security_provided_notes || "Security Collateral",
            estimated_value: Number(payload.security_provided_value),
            is_verified: false,
            notes: payload.security_provided_notes || "",
          },
        ];
      } else {
        delete payload.security_provided_value;
      }

      if (
        payload.security_provided_notes === null ||
        payload.security_provided_notes === ""
      ) {
        delete payload.security_provided_notes;
      }

      if (payload.deposit_paid_amount !== null && payload.deposit_paid_amount !== undefined) {
        payload.deposit_paid_amount = Number(
          payload.deposit_paid_amount,
        ).toFixed(2);
      } else {
        payload.deposit_paid_amount = "0.00";
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
      const isPolicyViolation = error.response?.status === 400;

      let errorMessage = "Failed to submit loan application. Please verify your inputs.";

      if (error.response?.data) {
        const d = error.response.data;
        if (typeof d === "string") {
          errorMessage = d;
        } else if (d.detail) {
          errorMessage = d.detail;
        } else if (d.error) {
          errorMessage = d.error;
        } else if (typeof d === "object") {
          const fieldErrors = Object.entries(d)
            .map(([field, err]: [string, any]) => {
              const msg = Array.isArray(err) ? err.join(", ") : String(err);
              const fieldName = field.replace(/_/g, " ");
              return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}: ${msg}`;
            })
            .join(" | ");
          if (fieldErrors) errorMessage = fieldErrors;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      if (isPolicyViolation) {
        console.warn("[Loan Application Policy Feedback]:", errorMessage);
      } else {
        console.error("Failed to apply loan:", error);
      }

      setSnackbar({
        open: true,
        message: isPolicyViolation ? `Policy Notice: ${errorMessage}` : errorMessage,
        severity: isPolicyViolation ? "warning" : "error",
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
                      placeholder={productMinAmount > 0 ? `e.g. ${productMinAmount}` : "e.g. 50000"}
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      error={!!fieldState.error || isBelowMin || isAboveMax}
                      helperText={
                        fieldState.error?.message ||
                        (isBelowMin
                          ? `⚠️ Minimum required amount for ${selectedProduct?.product_name || "this product"} is KES ${productMinAmount.toLocaleString()}`
                          : isAboveMax
                          ? `⚠️ Maximum allowed amount for ${selectedProduct?.product_name || "this product"} is KES ${productMaxAmount?.toLocaleString()}`
                          : productMinAmount > 0
                          ? `Allowed Range: KES ${productMinAmount.toLocaleString()}${productMaxAmount ? ` - KES ${productMaxAmount.toLocaleString()}` : " and above"}`
                          : "Enter desired principal loan amount")
                      }
                      slotProps={{
                        formHelperText: {
                          sx: {
                            color: isBelowMin || isAboveMax ? "#e11d48" : "#0d9488",
                            fontWeight: 700,
                          },
                        },
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
                            "& .MuiOutlinedInput-notchedOutline": {
                              borderColor: isBelowMin || isAboveMax ? "#fca5a5" : "#cbd5e1",
                            },
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                              borderColor: isBelowMin || isAboveMax ? "#e11d48" : "#0d9488",
                            },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                              borderColor: isBelowMin || isAboveMax ? "#e11d48" : "#0d9488",
                              borderWidth: 2,
                            },
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
                      placeholder={productMaxPeriods ? `Up to ${productMaxPeriods}` : "e.g. 12 or 24"}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                      error={isExceedingPeriods}
                      helperText={
                        isExceedingPeriods
                          ? `⚠️ Maximum allowed duration is ${productMaxPeriods} periods.`
                          : productMaxPeriods
                          ? `Allowed Duration: Up to ${productMaxPeriods} repayment periods`
                          : "Repayment duration in installments"
                      }
                      slotProps={{
                        formHelperText: {
                          sx: {
                            color: isExceedingPeriods ? "#e11d48" : "#64748b",
                            fontWeight: 600,
                          },
                        },
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <IconClock size={18} style={{ color: "#0d9488" }} />
                            </InputAdornment>
                          ),
                          sx: {
                            borderRadius: 2,
                            fontWeight: 700,
                            "& .MuiOutlinedInput-notchedOutline": {
                              borderColor: isExceedingPeriods ? "#fca5a5" : "#cbd5e1",
                            },
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                              borderColor: isExceedingPeriods ? "#e11d48" : "#0d9488",
                            },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                              borderColor: isExceedingPeriods ? "#e11d48" : "#0d9488",
                              borderWidth: 2,
                            },
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

              {/* Live Financial Amortization Summary Card */}
              {previewData && (
                <Grid size={{ xs: 12 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      mt: 1,
                      borderRadius: 3,
                      bgcolor: "#f0fdf4",
                      border: "1.5px dashed #10b981",
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center" mb={2} flexWrap="wrap" gap={1}>
                      <Box sx={{ p: 0.8, borderRadius: 1.5, bgcolor: "#dcfce7", color: "#059669", display: "flex", alignItems: "center" }}>
                        <IconCalculator size={20} />
                      </Box>
                      <Typography variant="subtitle1" fontWeight={900} color="#065f46">
                        Estimated Financial Amortization Summary ({selectedProduct?.product_name})
                      </Typography>
                      <Chip
                        size="small"
                        label={selectedProduct?.interest_method === "reducing_balance" ? "Reducing Balance" : "Flat Rate"}
                        sx={{ fontWeight: 800, bgcolor: "#bbf7d0", color: "#14532d", fontSize: "0.72rem" }}
                      />
                      <Chip
                        size="small"
                        label={`${selectedProduct?.interest_rate}% ${selectedProduct?.interest_period || "p.a."}`}
                        sx={{ fontWeight: 800, bgcolor: "#ecfdf5", color: "#047857", fontSize: "0.72rem" }}
                      />
                    </Stack>

                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Paper elevation={0} sx={{ p: 1.8, borderRadius: 2, bgcolor: "#ffffff", border: "1px solid #bbf7d0" }}>
                          <Typography variant="caption" sx={{ color: "#059669", fontWeight: 800, textTransform: "uppercase" }}>
                            Monthly Installment (EMI)
                          </Typography>
                          <Typography variant="h5" fontWeight={900} sx={{ color: "#064e3b", fontFamily: "monospace", mt: 0.5 }}>
                            KES {previewData.installment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#6b7280" }}>
                            Principal + Interest per period
                          </Typography>
                        </Paper>
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Paper elevation={0} sx={{ p: 1.8, borderRadius: 2, bgcolor: "#ffffff", border: "1px solid #bbf7d0" }}>
                          <Typography variant="caption" sx={{ color: "#0d9488", fontWeight: 800, textTransform: "uppercase" }}>
                            Total Interest
                          </Typography>
                          <Typography variant="h5" fontWeight={900} sx={{ color: "#0f766e", fontFamily: "monospace", mt: 0.5 }}>
                            KES {previewData.totalInterest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#6b7280" }}>
                            Accrued over {(watchedPeriods || selectedProduct?.max_repayment_period || 12)} months
                          </Typography>
                        </Paper>
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Paper elevation={0} sx={{ p: 1.8, borderRadius: 2, bgcolor: "#ffffff", border: "1px solid #bbf7d0" }}>
                          <Typography variant="caption" sx={{ color: "#2563eb", fontWeight: 800, textTransform: "uppercase" }}>
                            Total Repayable
                          </Typography>
                          <Typography variant="h5" fontWeight={900} sx={{ color: "#1d4ed8", fontFamily: "monospace", mt: 0.5 }}>
                            KES {previewData.totalPayable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#6b7280" }}>
                            Gross credit liability
                          </Typography>
                        </Paper>
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Paper elevation={0} sx={{ p: 1.8, borderRadius: 2, bgcolor: "#ffffff", border: "1px solid #bbf7d0" }}>
                          <Typography variant="caption" sx={{ color: "#d97706", fontWeight: 800, textTransform: "uppercase" }}>
                            Upfront Fees & Charges
                          </Typography>
                          <Typography variant="h6" fontWeight={900} sx={{ color: "#b45309", fontFamily: "monospace", mt: 0.5 }}>
                            {previewData.fees.length > 0
                              ? `KES ${previewData.fees.reduce((acc, f) => acc + Number(f.amount || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                              : "KES 0.00 (None)"}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#6b7280" }}>
                            {previewData.fees.length > 0 ? previewData.fees.map(f => f.fee_name).join(", ") : "No extra origination fees"}
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>

                    {/* Dynamic Policy Limit Alerts */}
                    {isBelowMin && (
                      <Alert
                        severity="warning"
                        variant="standard"
                        sx={{
                          mt: 2,
                          borderRadius: 2,
                          fontWeight: 700,
                          bgcolor: "#fffbeb",
                          color: "#92400e",
                          border: "1px solid #fde68a",
                        }}
                      >
                        <strong>Product Requirement:</strong> The entered principal of <strong>KES {Number(watchedPrincipal).toLocaleString()}</strong> is below the minimum threshold of <strong>KES {productMinAmount.toLocaleString()}</strong> for {selectedProduct?.product_name}. Please adjust the principal to at least KES {productMinAmount.toLocaleString()} to submit.
                      </Alert>
                    )}

                    {isAboveMax && (
                      <Alert
                        severity="warning"
                        variant="standard"
                        sx={{
                          mt: 2,
                          borderRadius: 2,
                          fontWeight: 700,
                          bgcolor: "#fffbeb",
                          color: "#92400e",
                          border: "1px solid #fde68a",
                        }}
                      >
                        <strong>Product Requirement:</strong> The entered principal of <strong>KES {Number(watchedPrincipal).toLocaleString()}</strong> exceeds the maximum allowed limit of <strong>KES {productMaxAmount?.toLocaleString()}</strong> for {selectedProduct?.product_name}.
                      </Alert>
                    )}

                    {isExceedingPeriods && (
                      <Alert
                        severity="warning"
                        variant="standard"
                        sx={{
                          mt: 2,
                          borderRadius: 2,
                          fontWeight: 700,
                          bgcolor: "#fffbeb",
                          color: "#92400e",
                          border: "1px solid #fde68a",
                        }}
                      >
                        <strong>Product Requirement:</strong> The selected duration of <strong>{watchedPeriods} periods</strong> exceeds the maximum allowed duration of <strong>{productMaxPeriods} periods</strong> for {selectedProduct?.product_name}.
                      </Alert>
                    )}
                  </Paper>
                </Grid>
              )}
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
