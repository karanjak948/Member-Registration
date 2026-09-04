"use client";

import React from "react";
import {
  Box,
  Card,
  CardContent,
  Divider,
  Grid,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { IconPercentage, IconCalendarTime, IconArrowsExchange, IconClockPlay } from "@tabler/icons-react";
import { Controller, useFormContext } from "react-hook-form";
import { LoanProductCreate } from "@/interfaces/loanProduct";
import {
  INTEREST_METHODS,
  INTEREST_PERIODS,
  REPAYMENT_FREQUENCIES,
} from "@/constants/loan";

export default function InterestConfiguration() {
  const { control } = useFormContext<LoanProductCreate>();

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: "1px solid #e2e8f0",
        bgcolor: "#ffffff",
        boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.04)",
        overflow: "hidden",
      }}
    >
      <Box sx={{ height: 4, bgcolor: "#2563eb" }} />
      <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
        <Stack spacing={3}>
          {/* Section Header */}
          <Stack direction="row" alignItems="center" spacing={1.75}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2.5,
                bgcolor: "#eff6ff",
                color: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(37, 99, 235, 0.12)",
              }}
            >
              <IconPercentage size={24} stroke={2} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700} color="#0f172a">
                Interest Configuration
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Calculation engine algorithm, annual interest rate, and repayment duration
              </Typography>
            </Box>
          </Stack>

          <Divider />

          <Grid container spacing={2.5}>
            {/* Interest Method */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name="interest_method"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    label="Interest Method *"
                    helperText="Algorithm used to compute periodic interest"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        bgcolor: "#f8fafc",
                        "&:hover": { bgcolor: "#ffffff" },
                        "&.Mui-focused": { bgcolor: "#ffffff" },
                      },
                    }}
                  >
                    {INTEREST_METHODS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            {/* Interest Rate */}
            <Grid size={{ xs: 12, md: 2 }}>
              <Controller
                name="interest_rate"
                control={control}
                rules={{
                  min: {
                    value: 0,
                    message: "Interest rate cannot be negative.",
                  },
                }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    fullWidth
                    required
                    type="number"
                    label="Interest Rate (%) *"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message || "Annual rate %"}
                    slotProps={{
                      htmlInput: { min: 0, step: 0.01 },
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <Typography variant="caption" fontWeight={700} color="#2563eb">
                              %
                            </Typography>
                          </InputAdornment>
                        ),
                      },
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        bgcolor: "#f8fafc",
                        "&:hover": { bgcolor: "#ffffff" },
                        "&.Mui-focused": { bgcolor: "#ffffff" },
                      },
                    }}
                  />
                )}
              />
            </Grid>

            {/* Interest Period */}
            <Grid size={{ xs: 12, md: 3 }}>
              <Controller
                name="interest_period"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    label="Interest Period *"
                    helperText="Frequency of interest accrual"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        bgcolor: "#f8fafc",
                        "&:hover": { bgcolor: "#ffffff" },
                        "&.Mui-focused": { bgcolor: "#ffffff" },
                      },
                    }}
                  >
                    {INTEREST_PERIODS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            {/* Repayment Frequency */}
            <Grid size={{ xs: 12, md: 3 }}>
              <Controller
                name="repayment_frequency"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    label="Repayment Frequency *"
                    helperText="Billing / installment schedule"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        bgcolor: "#f8fafc",
                        "&:hover": { bgcolor: "#ffffff" },
                        "&.Mui-focused": { bgcolor: "#ffffff" },
                      },
                    }}
                  >
                    {REPAYMENT_FREQUENCIES.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            {/* Maximum Repayment Period */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name="max_repayment_period"
                control={control}
                rules={{
                  min: {
                    value: 1,
                    message: "Repayment period must be at least 1.",
                  },
                }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    required
                    fullWidth
                    type="number"
                    label="Maximum Repayment Period *"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message || "Upper limit on loan duration in periods"}
                    slotProps={{
                      htmlInput: { min: 1 },
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <Typography variant="caption" fontWeight={600} color="text.secondary">
                              Periods
                            </Typography>
                          </InputAdornment>
                        ),
                      },
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        bgcolor: "#f8fafc",
                        "&:hover": { bgcolor: "#ffffff" },
                        "&.Mui-focused": { bgcolor: "#ffffff" },
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