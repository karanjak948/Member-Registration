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
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { IconAlertTriangle, IconClock, IconAlertCircle, IconShieldExclamation } from "@tabler/icons-react";
import { Controller, useFormContext } from "react-hook-form";
import { LoanProductCreate } from "@/interfaces/loanProduct";

export default function ClassificationThresholds() {
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
      <Box sx={{ height: 4, bgcolor: "#ea580c" }} />
      <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
        <Stack spacing={3}>
          {/* Section Header */}
          <Stack direction="row" alignItems="center" spacing={1.75}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2.5,
                bgcolor: "#fff7ed",
                color: "#ea580c",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(234, 88, 12, 0.12)",
              }}
            >
              <IconAlertTriangle size={24} stroke={2} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700} color="#0f172a">
                Portfolio At Risk (PAR) Aging Classification
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Configure delinquency day thresholds for SASRA prudential loan loss provisioning
              </Typography>
            </Box>
          </Stack>

          <Divider />

          <Grid container spacing={2.5}>
            {/* Watchful */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 2.5,
                  border: "1px solid #fde68a",
                  bgcolor: "#fffbeb",
                  height: "100%",
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <IconClock size={18} color="#b45309" />
                    <Typography variant="subtitle2" fontWeight={700} color="#92400e">
                      Stage 1: Watchful
                    </Typography>
                  </Stack>
                  <Chip label="Special Mention" size="small" sx={{ bgcolor: "#fef3c7", color: "#92400e", fontWeight: 700, fontSize: "0.7rem" }} />
                </Stack>
                <Typography variant="caption" color="#b45309" sx={{ mb: 2, display: "block" }}>
                  Days past due before loan is flagged for early payment follow-up.
                </Typography>

                <Controller
                  name="watchful_after_days"
                  control={control}
                  rules={{
                    min: { value: 0, message: "Value cannot be negative." },
                  }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      size="small"
                      required
                      type="number"
                      label="Watchful After *"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      slotProps={{
                        htmlInput: { min: 0 },
                        input: {
                          endAdornment: (
                            <InputAdornment position="end">
                              <Typography variant="caption" fontWeight={600} color="text.secondary">
                                Days
                              </Typography>
                            </InputAdornment>
                          ),
                        },
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                          bgcolor: "#ffffff",
                        },
                      }}
                    />
                  )}
                />
              </Box>
            </Grid>

            {/* Non-Performing */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 2.5,
                  border: "1px solid #fed7aa",
                  bgcolor: "#fff7ed",
                  height: "100%",
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <IconAlertCircle size={18} color="#c2410c" />
                    <Typography variant="subtitle2" fontWeight={700} color="#9a3412">
                      Stage 2: Non-Performing
                    </Typography>
                  </Stack>
                  <Chip label="Substandard" size="small" sx={{ bgcolor: "#ffedd5", color: "#9a3412", fontWeight: 700, fontSize: "0.7rem" }} />
                </Stack>
                <Typography variant="caption" color="#c2410c" sx={{ mb: 2, display: "block" }}>
                  Days past due triggering legal notices and guarantor demand.
                </Typography>

                <Controller
                  name="non_performing_after_days"
                  control={control}
                  rules={{
                    min: { value: 0, message: "Value cannot be negative." },
                  }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      size="small"
                      required
                      type="number"
                      label="Non-Performing After *"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      slotProps={{
                        htmlInput: { min: 0 },
                        input: {
                          endAdornment: (
                            <InputAdornment position="end">
                              <Typography variant="caption" fontWeight={600} color="text.secondary">
                                Days
                              </Typography>
                            </InputAdornment>
                          ),
                        },
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                          bgcolor: "#ffffff",
                        },
                      }}
                    />
                  )}
                />
              </Box>
            </Grid>

            {/* Doubtful */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 2.5,
                  border: "1px solid #fecaca",
                  bgcolor: "#fef2f2",
                  height: "100%",
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <IconShieldExclamation size={18} color="#b91c1c" />
                    <Typography variant="subtitle2" fontWeight={700} color="#991b1b">
                      Stage 3: Doubtful
                    </Typography>
                  </Stack>
                  <Chip label="Loss / Default" size="small" sx={{ bgcolor: "#fee2e2", color: "#991b1b", fontWeight: 700, fontSize: "0.7rem" }} />
                </Stack>
                <Typography variant="caption" color="#b91c1c" sx={{ mb: 2, display: "block" }}>
                  Days past due requiring 100% provisioning and debt collection escalation.
                </Typography>

                <Controller
                  name="doubtful_after_days"
                  control={control}
                  rules={{
                    min: { value: 0, message: "Value cannot be negative." },
                  }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      size="small"
                      required
                      type="number"
                      label="Doubtful After *"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      slotProps={{
                        htmlInput: { min: 0 },
                        input: {
                          endAdornment: (
                            <InputAdornment position="end">
                              <Typography variant="caption" fontWeight={600} color="text.secondary">
                                Days
                              </Typography>
                            </InputAdornment>
                          ),
                        },
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                          bgcolor: "#ffffff",
                        },
                      }}
                    />
                  )}
                />
              </Box>
            </Grid>
          </Grid>
        </Stack>
      </CardContent>
    </Card>
  );
}
