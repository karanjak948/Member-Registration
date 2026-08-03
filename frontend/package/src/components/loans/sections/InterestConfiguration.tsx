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

import {
  Controller,
  useFormContext,
} from "react-hook-form";

import { LoanProductCreate } from "@/interfaces/loanProduct";

import {
  INTEREST_METHODS,
  INTEREST_PERIODS,
  REPAYMENT_FREQUENCIES,
} from "@/constants/loan";

export default function InterestConfiguration() {
  const { control } =
    useFormContext<LoanProductCreate>();

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={3}>
          <Typography
            variant="h6"
            fontWeight={600}
          >
            Interest Configuration
          </Typography>

          <Grid
            container
            spacing={3}
          >
            {/* Interest Method */}

            <Grid
              size={{
                xs: 12,
                md: 4,
              }}
            >
              <Controller
                name="interest_method"
                control={control}
                render={({
                  field,
                }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    label="Interest Method"
                  >
                    {INTEREST_METHODS.map(
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

            {/* Interest Rate */}

            <Grid
              size={{
                xs: 12,
                md: 2,
              }}
            >
              <Controller
                name="interest_rate"
                control={control}
                rules={{
                  min: {
                    value: 0,
                    message:
                      "Interest rate cannot be negative.",
                  },
                }}
                render={({
                  field,
                  fieldState,
                }) => (
                  <TextField
                    {...field}
                    fullWidth
                    required
                    type="number"
                    label="Interest Rate (%)"
                    error={
                      !!fieldState.error
                    }
                    helperText={
                      fieldState.error
                        ?.message
                    }
                    slotProps={{
                      htmlInput:
                        {
                          min: 0,
                          step: 0.01,
                        },
                    }}
                  />
                )}
              />
            </Grid>

            {/* Interest Period */}

            <Grid
              size={{
                xs: 12,
                md: 3,
              }}
            >
              <Controller
                name="interest_period"
                control={control}
                render={({
                  field,
                }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    label="Interest Period"
                  >
                    {INTEREST_PERIODS.map(
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

            {/* Repayment Frequency */}

            <Grid
              size={{
                xs: 12,
                md: 3,
              }}
            >
              <Controller
                name="repayment_frequency"
                control={control}
                render={({
                  field,
                }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    label="Repayment Frequency"
                  >
                    {REPAYMENT_FREQUENCIES.map(
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

            {/* Maximum Repayment Period */}

            <Grid
              size={{
                xs: 12,
                md: 3,
              }}
            >
              <Controller
                name="max_repayment_period"
                control={control}
                rules={{
                  min: {
                    value: 1,
                    message:
                      "Repayment period must be at least 1.",
                  },
                }}
                render={({
                  field,
                  fieldState,
                }) => (
                  <TextField
                    {...field}
                    required
                    fullWidth
                    type="number"
                    label="Maximum Repayment Period"
                    error={
                      !!fieldState.error
                    }
                    helperText={
                      fieldState.error
                        ?.message
                    }
                    slotProps={{
                      htmlInput:
                        {
                          min: 1,
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