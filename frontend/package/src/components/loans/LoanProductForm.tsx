"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Alert, Box, Card, CardContent, Snackbar, Stack, Typography } from "@mui/material";

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
      const msg = error.response?.data?.detail || error.response?.data?.error || error.message || `Failed to ${mode === "edit" ? "update" : "create"} loan product.`;
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
      <Box component="form" onSubmit={methods.handleSubmit(onSubmit)}>
        <Card>
          <CardContent>
            <Stack spacing={3}>
              <Typography variant="h5" fontWeight={700}>
                {mode === "create" ? "Loan Product" : "Edit Loan Product"}
              </Typography>

              <BasicInformation />

              <InterestConfiguration />

              <LoanRequirements />

              <ApprovalWorkflow />

              <ClassificationThresholds />

              <RepaymentAllocation />

              <ReschedulingOptions />

              <ProductFeeTable />

              <DynamicPenaltyTable />

              <FormActions loading={loading} />
            </Stack>
          </CardContent>
        </Card>
      </Box>

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
          sx={{ borderRadius: 2.5, fontWeight: 700 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </FormProvider>
  );
}