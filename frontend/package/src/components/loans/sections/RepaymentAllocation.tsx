"use client";

import {
  Card,
  CardContent,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { Controller, useFormContext } from "react-hook-form";

import { LoanProductCreate } from "@/interfaces/loanProduct";

import { PENALTY_TYPES, ALLOCATION_ORDERS } from "@/constants/loan";

function RepaymentAllocation() {
  const { control } = useFormContext<LoanProductCreate>();

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={3}>
          <Typography variant="h6" fontWeight={600}>
            Repayment Allocation
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Configure how late payment penalties are calculated and how incoming
            repayments are allocated.
          </Typography>

          <Grid container spacing={3}>
            {/* Late Payment Penalty Type */}

            <Grid
              size={{
                xs: 12,
                md: 4,
              }}
            >
              <Controller
                name="late_payment_penalty_type"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    label="Late Payment Penalty Type"
                  >
                    {PENALTY_TYPES.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            {/* Late Payment Penalty Value */}

            <Grid
              size={{
                xs: 12,
                md: 4,
              }}
            >
              <Controller
                name="late_payment_penalty_value"
                control={control}
                rules={{
                  min: {
                    value: 0,
                    message: "Penalty value cannot be negative.",
                  },
                }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Late Payment Penalty Value"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
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

            {/* Allocation Order */}

            <Grid
              size={{
                xs: 12,
                md: 4,
              }}
            >
              <Controller
                name="allocation_order"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    label="Allocation Order"
                  >
                    {ALLOCATION_ORDERS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
          </Grid>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default RepaymentAllocation;
