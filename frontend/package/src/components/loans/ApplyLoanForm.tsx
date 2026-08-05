"use client";

import { useState } from "react";

import {
  Button,
  Card,
  CardContent,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { Controller, FormProvider, useForm } from "react-hook-form";

import { LoanCreate } from "@/interfaces/loan";

import loanService from "@/services/loan.service";

import { useMembers } from "@/hooks/useMembers";
import { useLoanProducts } from "@/hooks/useLoanProducts";

const defaultValues: LoanCreate = {
  member_id: 0,

  loan_product_id: 0,

  guarantor_member_id: null,

  principal_amount: 0,

  application_date: "",

  disbursement_date: null,

  num_periods: 1,

  security_provided_value: null,

  security_provided_notes: "",

  deposit_paid_amount: null,
};

export default function ApplyLoanForm() {
  const methods = useForm<LoanCreate>({
    defaultValues,
    mode: "onBlur",
  });

  const { members } = useMembers();

  const { products } = useLoanProducts();

  const [loading, setLoading] = useState(false);

  async function onSubmit(data: LoanCreate) {
    try {
      setLoading(true);

      await loanService.applyLoan(data);

      methods.reset(defaultValues);

      console.log("Loan application submitted successfully.");
    } catch (error) {
      console.error("Failed to apply loan:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <FormProvider {...methods}>
      <Card>
        <CardContent>
          <Stack spacing={3}>
            <Typography variant="h5" fontWeight={700}>
              Apply Loan
            </Typography>

            <Grid container spacing={3}>
              {/* Member */}

              <Grid
                size={{
                  xs: 12,
                  md: 6,
                }}
              >
                <Controller
                  name="member_id"
                  control={methods.control}
                  rules={{
                    required: "Member is required.",
                  }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      select
                      fullWidth
                      label="Member"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    >
                      <MenuItem value={0}>-- Select Member --</MenuItem>

                      {members.map((member) => (
                        <MenuItem key={member.id} value={member.id}>
                          {member.first_name} {member.other_names}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>

              {/* Loan Product */}

              <Grid
                size={{
                  xs: 12,
                  md: 6,
                }}
              >
                <Controller
                  name="loan_product_id"
                  control={methods.control}
                  rules={{
                    required: "Loan Product is required.",
                  }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      select
                      fullWidth
                      label="Loan Product"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    >
                      <MenuItem value={0}>-- Select Loan Product --</MenuItem>

                      {products.map((product) => (
                        <MenuItem key={product.id} value={product.id}>
                          {product.product_name}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>

              {/* Guarantor */}

              <Grid
                size={{
                  xs: 12,
                  md: 6,
                }}
              >
                <Controller
                  name="guarantor_member_id"
                  control={methods.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      value={field.value ?? ""}
                      fullWidth
                      type="number"
                      label="Guarantor Member ID"
                    />
                  )}
                />
              </Grid>

              {/* Principal */}

              <Grid
                size={{
                  xs: 12,
                  md: 6,
                }}
              >
                <Controller
                  name="principal_amount"
                  control={methods.control}
                  rules={{
                    min: {
                      value: 1,
                      message: "Principal amount must be greater than zero.",
                    },
                  }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="number"
                      label="Principal Amount"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>

              {/* Application Date */}

              <Grid
                size={{
                  xs: 12,
                  md: 6,
                }}
              >
                <Controller
                  name="application_date"
                  control={methods.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="date"
                      label="Application Date"
                      slotProps={{
                        inputLabel: {
                          shrink: true,
                        },
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Disbursement Date */}

              <Grid
                size={{
                  xs: 12,
                  md: 6,
                }}
              >
                <Controller
                  name="disbursement_date"
                  control={methods.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      value={field.value ?? ""}
                      fullWidth
                      type="date"
                      label="Disbursement Date"
                      slotProps={{
                        inputLabel: {
                          shrink: true,
                        },
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Periods */}

              <Grid
                size={{
                  xs: 12,
                  md: 4,
                }}
              >
                <Controller
                  name="num_periods"
                  control={methods.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="number"
                      label="Repayment Periods"
                    />
                  )}
                />
              </Grid>

              {/* Security */}

              <Grid
                size={{
                  xs: 12,
                  md: 4,
                }}
              >
                <Controller
                  name="security_provided_value"
                  control={methods.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      value={field.value ?? ""}
                      fullWidth
                      type="number"
                      label="Security Value"
                    />
                  )}
                />
              </Grid>

              {/* Deposit */}

              <Grid
                size={{
                  xs: 12,
                  md: 4,
                }}
              >
                <Controller
                  name="deposit_paid_amount"
                  control={methods.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      value={field.value ?? ""}
                      fullWidth
                      type="number"
                      label="Deposit Paid"
                    />
                  )}
                />
              </Grid>

              {/* Notes */}

              <Grid
                size={{
                  xs: 12,
                }}
              >
                <Controller
                  name="security_provided_notes"
                  control={methods.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      multiline
                      minRows={3}
                      label="Security Notes"
                    />
                  )}
                />
              </Grid>
            </Grid>

            <Button
              variant="contained"
              disabled={loading}
              onClick={methods.handleSubmit(onSubmit)}
            >
              Apply Loan
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </FormProvider>
  );
}
