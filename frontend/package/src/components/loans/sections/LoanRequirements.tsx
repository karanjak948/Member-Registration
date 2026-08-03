"use client";

import {
  Card,
  CardContent,
  FormControlLabel,
  Grid,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

import {
  Controller,
  useFormContext,
} from "react-hook-form";

import { LoanProductCreate } from "@/interfaces/loanProduct";

import {
  DEPOSIT_TYPES,
  SECURITY_TYPES,
} from "@/constants/loan";

export default function LoanRequirements() {
  const {
    control,
    watch,
  } = useFormContext<LoanProductCreate>();

  const requiresSecurity = watch("requires_security");

  const requiresDeposit = watch("requires_deposit");

  const multipleOfSavings = watch("is_multiple_of_savings");

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={3}>
          <Typography
            variant="h6"
            fontWeight={600}
          >
            Loan Requirements
          </Typography>

          <Grid
            container
            spacing={3}
          >
            {/* Requires Guarantor */}

            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name="requires_guarantor"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.value}
                        onChange={(e) =>
                          field.onChange(
                            e.target.checked
                          )
                        }
                      />
                    }
                    label="Requires Guarantor"
                  />
                )}
              />
            </Grid>

            {/* Multiple Of Savings */}

            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name="is_multiple_of_savings"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.value}
                        onChange={(e) =>
                          field.onChange(
                            e.target.checked
                          )
                        }
                      />
                    }
                    label="Multiple of Savings"
                  />
                )}
              />
            </Grid>

            {/* Savings Multiplier */}

            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name="savings_multiplier"
                control={control}
                render={({
                  field,
                }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Savings Multiplier"
                    disabled={!multipleOfSavings}
                    slotProps={{
                      htmlInput: {
                        min: 0,
                        step: 0.01,
                      },
                    }}
                  />
                )}
              />
            </Grid>

            {/* Requires Security */}

            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name="requires_security"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.value}
                        onChange={(e) =>
                          field.onChange(
                            e.target.checked
                          )
                        }
                      />
                    }
                    label="Requires Security"
                  />
                )}
              />
            </Grid>

            {/* Security Type */}

            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name="security_type"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    label="Security Type"
                    disabled={!requiresSecurity}
                  >
                    {SECURITY_TYPES.map(
                      (
                        option
                      ) => (
                        <MenuItem
                          key={
                            option.value
                          }
                          value={
                            option.value
                          }
                        >
                          {
                            option.label
                          }
                        </MenuItem>
                      )
                    )}
                  </TextField>
                )}
              />
            </Grid>

            {/* Security Value */}

            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name="security_value"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Security Value"
                    disabled={!requiresSecurity}
                    slotProps={{
                      htmlInput: {
                        min: 0,
                        step: 0.01,
                      },
                    }}
                  />
                )}
              />
            </Grid>

            {/* Security Notes */}

            <Grid size={{ xs: 12 }}>
              <Controller
                name="security_notes"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    multiline
                    minRows={3}
                    label="Security Notes"
                    disabled={!requiresSecurity}
                  />
                )}
              />
            </Grid>

            {/* Requires Deposit */}

            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name="requires_deposit"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.value}
                        onChange={(e) =>
                          field.onChange(
                            e.target.checked
                          )
                        }
                      />
                    }
                    label="Requires Deposit"
                  />
                )}
              />
            </Grid>

            {/* Deposit Type */}

            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name="deposit_type"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    label="Deposit Type"
                    disabled={!requiresDeposit}
                  >
                    {DEPOSIT_TYPES.map(
                      (
                        option
                      ) => (
                        <MenuItem
                          key={
                            option.value
                          }
                          value={
                            option.value
                          }
                        >
                          {
                            option.label
                          }
                        </MenuItem>
                      )
                    )}
                  </TextField>
                )}
              />
            </Grid>

            {/* Deposit Value */}

            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name="deposit_value"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Deposit Value"
                    disabled={!requiresDeposit}
                    slotProps={{
                      htmlInput: {
                        min: 0,
                        step: 0.01,
                      },
                    }}
                  />
                )}
              />
            </Grid>
          </Grid>
        </Stack>
      </CardContent>
    </Card>
  );
}