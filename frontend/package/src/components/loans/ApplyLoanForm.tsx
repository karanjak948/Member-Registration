"use client";

import { useEffect, useState } from "react";

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

import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";

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
  const methods = useForm<LoanCreate>({
    defaultValues,
    mode: "onBlur",
  });

  const { members } = useMembers();
  const { products } = useLoanProducts();

  const [loading, setLoading] = useState(false);

  const selectedLoanProductId = useWatch({
    control: methods.control,
    name: "loan_product_id",
  });

  const selectedProduct = products.find(
    (product) => product.id === Number(selectedLoanProductId),
  );

  const requiresGuarantor = selectedProduct?.requires_guarantor ?? false;

  // Clear guarantor when not required
  useEffect(() => {
    if (!requiresGuarantor) {
      methods.setValue("guarantor_member_id", null);
    }
  }, [requiresGuarantor, methods]);

  async function onSubmit(data: LoanCreate) {
    try {
      setLoading(true);

      console.log("Loan Payload:", data);

      await loanService.applyLoan(data);

      methods.reset(defaultValues);

      console.log("Loan applied successfully.");
    } catch (error) {
      console.error("Failed to apply loan:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <Card>
          <CardContent>
            <Stack spacing={3}>
              <Typography variant="h5" fontWeight={700}>
                Apply Loan
              </Typography>

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name="member_id"
                    control={methods.control}
                    rules={{
                      validate: (v) => v > 0 || "Select a member",
                    }}
                    render={({ field, fieldState }) => (
                      <TextField
                        select
                        fullWidth
                        label="Member"
                        value={field.value}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                      >
                        <MenuItem value={0}>Select Member</MenuItem>

                        {members.map((member) => (
                          <MenuItem key={member.id} value={member.id}>
                            {member.first_name} {member.other_names}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name="loan_product_id"
                    control={methods.control}
                    rules={{
                      validate: (v) => v > 0 || "Select a loan product",
                    }}
                    render={({ field, fieldState }) => (
                      <TextField
                        select
                        fullWidth
                        label="Loan Product"
                        value={field.value}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                      >
                        <MenuItem value={0}>Select Loan Product</MenuItem>

                        {products.map((product) => (
                          <MenuItem key={product.id} value={product.id}>
                            {product.product_name}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  />
                </Grid>

                {/* Conditional Guarantor Field */}
                {requiresGuarantor && (
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                      name="guarantor_member_id"
                      control={methods.control}
                      rules={{
                        required: "Please select a guarantor.",
                      }}
                      render={({ field, fieldState }) => (
                        <TextField
                          {...field}
                          value={field.value ?? ""}
                          select
                          fullWidth
                          label="Guarantor"
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message}
                        >
                          <MenuItem value="">-- Select Guarantor --</MenuItem>

                          {members
                            .filter(
                              (member) =>
                                member.id !== methods.getValues("member_id"),
                            )
                            .map((member) => (
                              <MenuItem key={member.id} value={member.id}>
                                {member.first_name} {member.other_names}
                              </MenuItem>
                            ))}
                        </TextField>
                      )}
                    />
                  </Grid>
                )}

                <Grid size={{ xs: 12, md: 6 }}>
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
                        fullWidth
                        type="number"
                        label="Principal Amount"
                        value={field.value}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                      />
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name="application_date"
                    control={methods.control}
                    rules={{
                      required: "Application date is required",
                    }}
                    render={({ field, fieldState }) => (
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
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                      />
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name="disbursement_date"
                    control={methods.control}
                    render={({ field }) => (
                      <TextField
                        fullWidth
                        type="date"
                        label="Disbursement Date"
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                        slotProps={{
                          inputLabel: {
                            shrink: true,
                          },
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Controller
                    name="num_periods"
                    control={methods.control}
                    render={({ field }) => (
                      <TextField
                        fullWidth
                        type="number"
                        label="Repayment Periods"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? null
                              : Number(e.target.value),
                          )
                        }
                      />
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Controller
                    name="security_provided_value"
                    control={methods.control}
                    render={({ field }) => (
                      <TextField
                        fullWidth
                        type="number"
                        label="Security Value"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? null
                              : Number(e.target.value),
                          )
                        }
                      />
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Controller
                    name="deposit_paid_amount"
                    control={methods.control}
                    render={({ field }) => (
                      <TextField
                        fullWidth
                        type="number"
                        label="Deposit Paid"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? null
                              : Number(e.target.value),
                          )
                        }
                      />
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Controller
                    name="security_provided_notes"
                    control={methods.control}
                    render={({ field }) => (
                      <TextField
                        fullWidth
                        multiline
                        minRows={3}
                        label="Security Notes"
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    )}
                  />
                </Grid>
              </Grid>

              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? "Submitting..." : "Apply Loan"}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </form>
    </FormProvider>
  );
}
