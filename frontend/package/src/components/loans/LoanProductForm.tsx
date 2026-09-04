"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import {
  IconArrowLeft,
  IconBuildingBank,
  IconSparkles,
} from "@tabler/icons-react";
import { FormProvider, useForm } from "react-hook-form";

import loanProductService from "@/services/loanProduct.service";
import { LoanProductCreate } from "@/interfaces/loanProduct";

import BasicInformation from "./sections/BasicInformation";
import InterestConfiguration from "./sections/InterestConfiguration";
import LoanRequirements from "./sections/LoanRequirements";
import ApprovalWorkflow from "./sections/ApprovalWorkflow";
import ClassificationThresholds from "./sections/ClassificationThresholds";
import RepaymentAllocation from "./sections/RepaymentAllocation";
import ReschedulingOptions from "./sections/ReschedulingOptions";

import ProductFeeTable from "./fees/ProductFeeTable";
import DynamicPenaltyTable from "./penalties/DynamicPenaltyTable";

import FormActions from "./sections/FormActions";

const defaultValues: LoanProductCreate = {
  product_code: "",
  product_name: "",
  effective_date: "",

  interest_method: "flat",
  interest_rate: 0,
  interest_period: "monthly",

  repayment_frequency: "monthly",
  max_repayment_period: 1,

  requires_guarantor: false,

  is_multiple_of_savings: false,
  savings_multiplier: 0,

  requires_security: false,
  security_type: "percentage",
  security_value: 0,
  security_notes: "",

  requires_deposit: false,
  deposit_type: "percentage",
  deposit_value: 0,

  late_payment_penalty_type: "percentage",
  late_payment_penalty_value: 0,

  requires_appraisal: false,
  requires_board_approval: false,

  watchful_after_days: 30,
  non_performing_after_days: 90,
  doubtful_after_days: 180,

  allows_rescheduling: false,
  reschedule_fee_type: "percentage",
  reschedule_fee_value: 0,

  allows_offset: false,
  offset_covers: "savings",
  offset_fee_type: "percentage",
  offset_fee_value: 0,

  allocation_order: "penalty,interest,principal",

  fees: [],
  penalties: [],
};

interface LoanProductFormProps {
  mode?: "create" | "edit";
  initialValues?: LoanProductCreate;
  productId?: number | string;
  productCode?: string;
}

export default function LoanProductForm({
  mode = "create",
  initialValues,
  productId,
  productCode,
}: LoanProductFormProps) {
  const methods = useForm<LoanProductCreate>({
    defaultValues: initialValues ?? defaultValues,
    mode: "onBlur",
  });

  const router = useRouter();
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

  async function onSubmit(data: LoanProductCreate) {
    try {
      setLoading(true);

      if (mode === "edit") {
        const targetId = productId ?? productCode;
        if (!targetId) {
          throw new Error("Missing product identifier.");
        }

        await loanProductService.update(targetId, data);
        setSnackbar({
          open: true,
          message: `Loan product '${data.product_name}' updated successfully!`,
          severity: "success",
        });
      } else {
        await loanProductService.create(data);
        methods.reset(defaultValues);
        setSnackbar({
          open: true,
          message: `Loan product '${data.product_name}' created successfully!`,
          severity: "success",
        });
      }

      setTimeout(() => {
        router.push("/loan-products");
      }, 1400);
    } catch (error: any) {
      console.error(
        `Failed to ${mode === "edit" ? "update" : "create"} loan product:`,
        error,
      );
      const msg =
        error.response?.data?.detail ||
        error.response?.data?.error ||
        error.message ||
        `Failed to ${mode === "edit" ? "update" : "create"} loan product.`;
      setSnackbar({
        open: true,
        message: msg,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <FormProvider {...methods}>
      <Box
        component="form"
        onSubmit={methods.handleSubmit(onSubmit)}
        sx={{ pb: 8 }}
      >
        {/* ========================================================================= */}
        {/* EXECUTIVE BANNER                                                          */}
        {/* ========================================================================= */}
        <Paper
          elevation={0}
          sx={{
            background: "linear-gradient(135deg, #064e3b 0%, #047857 55%, #059669 100%)",
            borderRadius: 3.5,
            p: { xs: 3, md: 4 },
            mb: 3.5,
            color: "#ffffff",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 12px 36px -8px rgba(6, 78, 59, 0.28)",
          }}
        >
          {/* Decorative glow */}
          <Box
            sx={{
              position: "absolute",
              top: -60,
              right: -60,
              width: 240,
              height: 240,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 70%)",
              pointerEvents: "none",
            }}
          />

          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={2}
            sx={{ mb: 2.5 }}
          >
            <Button
              variant="text"
              startIcon={<IconArrowLeft size={18} />}
              onClick={() => router.push("/loan-products")}
              sx={{
                color: "rgba(255,255,255,0.9)",
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.875rem",
                px: 1.5,
                py: 0.5,
                borderRadius: 2,
                background: "rgba(255,255,255,0.1)",
                backdropFilter: "blur(6px)",
                "&:hover": {
                  background: "rgba(255,255,255,0.2)",
                  color: "#ffffff",
                },
              }}
            >
              Back to Catalog
            </Button>

            <Chip
              icon={<IconSparkles size={16} color="#fbbf24" />}
              label={mode === "edit" ? "Edit Product Tier Mode" : "New Loan Product Tier"}
              sx={{
                bgcolor: "rgba(255, 255, 255, 0.18)",
                color: "#ffffff",
                fontWeight: 700,
                borderRadius: 2,
                backdropFilter: "blur(4px)",
              }}
            />
          </Stack>

          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              letterSpacing: "-0.5px",
              fontSize: { xs: "1.75rem", md: "2.25rem" },
              mb: 1,
            }}
          >
            {mode === "create" ? "Create Loan Product Tier" : `Edit Loan Product: ${initialValues?.product_name || productCode || ""}`}
          </Typography>

          <Typography
            variant="body2"
            sx={{ color: "rgba(255, 255, 255, 0.85)", fontSize: "0.95rem", maxWidth: 850 }}
          >
            Configure core financial architecture, interest calculation engines, underwriting eligibility criteria,
            PAR classification aging thresholds, repayment recovery waterfalls, and fee schedules.
          </Typography>
        </Paper>

        {/* ========================================================================= */}
        {/* FORM SECTIONS STACK                                                       */}
        {/* ========================================================================= */}
        <Stack spacing={3.5}>
          <BasicInformation />

          <InterestConfiguration />

          <LoanRequirements />

          <ApprovalWorkflow />

          <ClassificationThresholds />

          <RepaymentAllocation />

          <ReschedulingOptions />

          <ProductFeeTable />

          <DynamicPenaltyTable />

          <FormActions loading={loading} mode={mode} />
        </Stack>
      </Box>

      {/* Toast notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4500}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          sx={{ borderRadius: 2.5, fontWeight: 700, boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </FormProvider>
  );
}