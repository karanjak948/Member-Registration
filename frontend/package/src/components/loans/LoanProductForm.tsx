"use client";

import { useState } from "react";

import { Box, Card, CardContent, Stack, Typography } from "@mui/material";

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
  productCode?: string;
}

export default function LoanProductForm({
  mode = "create",
  initialValues,
  productCode,
}: LoanProductFormProps) {
  const methods = useForm<LoanProductCreate>({
    defaultValues: initialValues ?? defaultValues,
    mode: "onBlur",
  });

  const [loading, setLoading] = useState(false);

  async function onSubmit(data: LoanProductCreate) {
    try {
      setLoading(true);

      console.log("Submitting Loan Product");
      console.log("Mode:", mode);
      console.log("Product Code:", productCode);
      console.log("Payload:", data);

      if (mode === "edit") {
        if (!productCode) {
          throw new Error("Missing product code.");
        }

        await loanProductService.update(productCode, data);
      } else {
        await loanProductService.create(data);

        methods.reset(defaultValues);
      }
    } catch (error) {
      console.error(
        `Failed to ${mode === "edit" ? "update" : "create"} loan product:`,
        error,
      );
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
    </FormProvider>
  );
}