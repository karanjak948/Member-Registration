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

      // =============== FORMAT DATA FOR THE API ===============
      const payload = { ...data };

      // 1. Format Dates to simple YYYY-MM-DD
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
        // Remove null dates
        delete (payload as any).disbursement_date;
      }

      // 2. Remove null/empty optional fields
      if (payload.security_provided_value === null) {
        delete (payload as any).security_provided_value;
      }

      if (
        payload.security_provided_notes === null ||
        payload.security_provided_notes === ""
      ) {
        delete (payload as any).security_provided_notes;
      }

      // 3. Convert Deposit to String (Royal API expects "100.00", not 100 or null)
      if (payload.deposit_paid_amount !== null) {
        (payload as any).deposit_paid_amount = Number(
          payload.deposit_paid_amount,
        ).toFixed(2);
      } else {
        (payload as any).deposit_paid_amount = "0.00";
      }

      console.log(
        "Loan Payload (Formatted):",
        JSON.stringify(payload, null, 2),
      );

      await loanService.applyLoan(payload);

      methods.reset(defaultValues);

      setSnackbar({
        open: true,
        message: "Loan application submitted successfully!",
        severity: "success",
      });

      setTimeout(() => {
        router.push("/loans");
      }, 2000);
    } catch (error: any) {
      console.error("Failed to apply loan:", error);

      let errorMessage = "Failed to submit loan application. Please try again.";

      if (error.response?.status === 500) {
        errorMessage =
          error.response?.data?.detail ||
          "The Loan Service encountered an internal error.";
      } else if (error.response?.status === 400) {
        errorMessage =
          error.response?.data?.detail ||
          "Invalid loan application. Please check your inputs.";
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
        <Card>
          <CardContent>
            <Stack spacing={3}>
              <Typography variant="h5" fontWeight={700}>
                Apply Loan
              </Typography>

              {/* ✅ MUI v5/v6 Syntax: size={{ xs: 12, md: 6 }} */}
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name="member_id"
                    control={methods.control}
                    rules={{ validate: (v) => v > 0 || "Select a member" }}
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

                {requiresGuarantor && (
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                      name="guarantor_member_id"
                      control={methods.control}
                      rules={{ required: "Please select a guarantor." }}
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
                    rules={{ required: "Application date is required" }}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        fullWidth
                        type="date"
                        label="Application Date"
                        slotProps={{ inputLabel: { shrink: true } }}
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
                        slotProps={{ inputLabel: { shrink: true } }}
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
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </FormProvider>
  );
}
