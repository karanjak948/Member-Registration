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
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/constants/permissions";

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
  is_active: 1,
  status: 1,
  effective_date: "",

  interest_method: "flat",
  interest_rate: 0,
  interest_period: "monthly",

  repayment_frequency: "monthly",
  min_repayment_period: 1,
  max_repayment_period: 1,
  min_amount: 0,
  max_amount: null,

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
  const { isAdmin, can, loading: authLoading } = usePermissions();
  const canManage = isAdmin || can(PERMISSIONS.CREATE_LOAN_PRODUCTS) || can(PERMISSIONS.EDIT_LOAN_PRODUCTS);

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

  if (!authLoading && !canManage) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper
          elevation={0}
          sx={{
            p: 5,
            borderRadius: 3.5,
            border: "1px solid #fecdd3",
            bgcolor: "#fff1f2",
            textAlign: "center",
          }}
        >
          <Typography variant="h5" fontWeight={900} color="#9f1239" gutterBottom>
            Administrative Privileges Required
          </Typography>
          <Typography variant="body1" color="#475569" sx={{ mb: 3.5, maxWidth: 500, mx: "auto" }}>
            Only SACCO administrators or organization owners have permission to create or modify loan products and credit tiers.
          </Typography>
          <Button
            variant="contained"
            onClick={() => router.push("/loan-products")}
            sx={{
              bgcolor: "#059669",
              "&:hover": { bgcolor: "#047857" },
              borderRadius: 2.5,
              fontWeight: 800,
              px: 3,
              py: 1,
            }}
          >
            Return to Loan Products Catalog
          </Button>
        </Paper>
      </Container>
    );
  }

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
      const formatValidationErrors = (data: any): string => {
        if (!data) return "";
        if (typeof data === "string") return data;
        if (Array.isArray(data)) {
          return data
            .map((item) => formatValidationErrors(item))
            .filter(Boolean)
            .join(", ");
        }
        if (typeof data === "object") {
          return Object.entries(data)
            .map(([k, v]) => {
              const formattedVal = formatValidationErrors(v);
              if (!formattedVal) return "";
              if (k === "detail" || k === "error" || k === "non_field_errors") {
                return formattedVal;
              }
              return `${k.replace(/_/g, " ")}: ${formattedVal}`;
            })
            .filter(Boolean)
            .join(" | ");
        }
        return String(data);
      };

      let msg =
        error.response?.data?.detail ||
        error.response?.data?.error;

      if (!msg && error.response?.data) {
        msg = formatValidationErrors(error.response.data);
      }

      msg = msg || error.message || `Failed to ${mode === "edit" ? "update" : "create"} loan product.`;

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