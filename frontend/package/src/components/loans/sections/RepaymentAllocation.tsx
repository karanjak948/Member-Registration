"use client";

import React from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { IconArrowsSort, IconScale, IconReceiptRefund } from "@tabler/icons-react";
import { Controller, useFormContext } from "react-hook-form";
import { LoanProductCreate } from "@/interfaces/loanProduct";
import { PENALTY_TYPES, ALLOCATION_ORDERS } from "@/constants/loan";

export default function RepaymentAllocation() {
  const { control, watch } = useFormContext<LoanProductCreate>();

  const penaltyType = watch("late_payment_penalty_type");
  const allocationOrder = watch("allocation_order");

  const orderSteps = (allocationOrder || "penalty,interest,principal")
    .split(",")
    .map((s) => s.trim());

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
      <Box sx={{ height: 4, bgcolor: "#0d9488" }} />
      <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
        <Stack spacing={3}>
          {/* Section Header */}
          <Stack direction="row" alignItems="center" spacing={1.75}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2.5,
                bgcolor: "#ccfbf1",
                color: "#0f766e",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(13, 148, 136, 0.12)",
              }}
            >
              <IconArrowsSort size={24} stroke={2} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700} color="#0f172a">
                Repayment Allocation & Late Penalty Waterfall
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Payment application priority and automated delinquent penalty charges
              </Typography>
            </Box>
          </Stack>

          <Divider />

          {/* Waterfall preview strip */}
          <Box
            sx={{
              p: 2.5,
              borderRadius: 2.5,
              bgcolor: "#f0fdfa",
              border: "1px solid #99f6e4",
            }}
          >
            <Typography variant="caption" color="#0f766e" fontWeight={700} textTransform="uppercase" sx={{ display: "block", mb: 1 }}>
              Current Payment Application Sequence:
            </Typography>
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
              {orderSteps.map((step, idx) => (
                <Stack key={idx} direction="row" alignItems="center" spacing={1}>
                  <Chip
                    label={`${idx + 1}. ${step.toUpperCase()}`}
                    size="small"
                    sx={{
                      bgcolor: idx === 0 ? "#fee2e2" : idx === 1 ? "#fef3c7" : "#dcfce7",
                      color: idx === 0 ? "#991b1b" : idx === 1 ? "#92400e" : "#166534",
                      fontWeight: 800,
                      borderRadius: 1.5,
                      px: 0.5,
                    }}
                  />
                  {idx < orderSteps.length - 1 && (
                    <Typography variant="body2" color="#0f766e" fontWeight={700}>
                      &rarr;
                    </Typography>
                  )}
                </Stack>
              ))}
            </Stack>
          </Box>

          <Grid container spacing={2.5}>
            {/* Allocation Order */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name="allocation_order"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    label="Allocation Order *"
                    helperText="Priority hierarchy when payment is received"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        bgcolor: "#f8fafc",
                        "&:hover": { bgcolor: "#ffffff" },
                        "&.Mui-focused": { bgcolor: "#ffffff" },
                      },
                    }}
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

            {/* Late Payment Penalty Type */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name="late_payment_penalty_type"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    label="Late Payment Penalty Type *"
                    helperText="Method used to calculate penalty on overdue balance"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        bgcolor: "#f8fafc",
                        "&:hover": { bgcolor: "#ffffff" },
                        "&.Mui-focused": { bgcolor: "#ffffff" },
                      },
                    }}
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
            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name="late_payment_penalty_value"
                control={control}
                rules={{
                  min: { value: 0, message: "Penalty value cannot be negative." },
                }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Late Payment Penalty Value *"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message || "Amount or rate applied when overdue"}
                    slotProps={{
                      htmlInput: { min: 0, step: 0.01 },
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <Typography variant="caption" fontWeight={600} color="text.secondary">
                              {penaltyType === "percentage" ? "%" : "KES"}
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
