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
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { IconRefresh, IconArrowsExchange2, IconCoins } from "@tabler/icons-react";
import { Controller, useFormContext } from "react-hook-form";
import { LoanProductCreate } from "@/interfaces/loanProduct";
import { FEE_TYPES, OFFSET_COVER_TYPES } from "@/constants/loan";

export default function ReschedulingOptions() {
  const { control, watch } = useFormContext<LoanProductCreate>();

  const allowsRescheduling = watch("allows_rescheduling");
  const allowsOffset = watch("allows_offset");
  const rescheduleFeeType = watch("reschedule_fee_type");
  const offsetFeeType = watch("offset_fee_type");

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
      <Box sx={{ height: 4, bgcolor: "#0891b2" }} />
      <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
        <Stack spacing={3}>
          {/* Section Header */}
          <Stack direction="row" alignItems="center" spacing={1.75}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2.5,
                bgcolor: "#ecfeff",
                color: "#0891b2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(8, 145, 178, 0.12)",
              }}
            >
              <IconRefresh size={24} stroke={2} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700} color="#0f172a">
                Rescheduling & Offset Policy
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Loan restructuring provisions, tenor extension fees, and refinancing offset coverage
              </Typography>
            </Box>
          </Stack>

          <Divider />

          <Grid container spacing={3}>
            {/* POLICY 1: LOAN RESCHEDULING */}
            <Grid size={{ xs: 12 }}>
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 2.5,
                  border: `1px solid ${allowsRescheduling ? "#a5f3fc" : "#e2e8f0"}`,
                  bgcolor: allowsRescheduling ? "#ecfeff" : "#f8fafc",
                  transition: "all 0.2s ease",
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 2,
                        bgcolor: allowsRescheduling ? "#cffafe" : "#f1f5f9",
                        color: allowsRescheduling ? "#0891b2" : "#64748b",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <IconArrowsExchange2 size={20} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700} color="#0f172a">
                        Allow Loan Rescheduling
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Permit restructuring tenor or payment terms for distressed borrowers
                      </Typography>
                    </Box>
                  </Stack>
                  <Controller
                    name="allows_rescheduling"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        color="info"
                      />
                    )}
                  />
                </Stack>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                      name="reschedule_fee_type"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          select
                          fullWidth
                          size="small"
                          disabled={!allowsRescheduling}
                          label="Reschedule Fee Type"
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              borderRadius: 2,
                              bgcolor: "#ffffff",
                            },
                          }}
                        >
                          {FEE_TYPES.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </TextField>
                      )}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                      name="reschedule_fee_value"
                      control={control}
                      rules={{
                        min: { value: 0, message: "Fee cannot be negative." },
                      }}
                      render={({ field, fieldState }) => (
                        <TextField
                          {...field}
                          fullWidth
                          size="small"
                          type="number"
                          disabled={!allowsRescheduling}
                          label="Reschedule Fee Value"
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message}
                          slotProps={{
                            htmlInput: { min: 0, step: 0.01 },
                            input: {
                              endAdornment: (
                                <InputAdornment position="end">
                                  <Typography variant="caption" fontWeight={600} color="text.secondary">
                                    {rescheduleFeeType === "percentage" ? "%" : "KES"}
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
                  </Grid>
                </Grid>
              </Box>
            </Grid>

            {/* POLICY 2: LOAN OFFSET */}
            <Grid size={{ xs: 12 }}>
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 2.5,
                  border: `1px solid ${allowsOffset ? "#fed7aa" : "#e2e8f0"}`,
                  bgcolor: allowsOffset ? "#fff7ed" : "#f8fafc",
                  transition: "all 0.2s ease",
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 2,
                        bgcolor: allowsOffset ? "#ffedd5" : "#f1f5f9",
                        color: allowsOffset ? "#ea580c" : "#64748b",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <IconCoins size={20} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700} color="#0f172a">
                        Allow Loan Offset (Refinancing)
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Permit clearing existing loan balance using new disbursement or member savings
                      </Typography>
                    </Box>
                  </Stack>
                  <Controller
                    name="allows_offset"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        color="warning"
                      />
                    )}
                  />
                </Stack>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Controller
                      name="offset_covers"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          select
                          fullWidth
                          size="small"
                          disabled={!allowsOffset}
                          label="Offset Covers"
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              borderRadius: 2,
                              bgcolor: "#ffffff",
                            },
                          }}
                        >
                          {OFFSET_COVER_TYPES.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </TextField>
                      )}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <Controller
                      name="offset_fee_type"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          select
                          fullWidth
                          size="small"
                          disabled={!allowsOffset}
                          label="Offset Fee Type"
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              borderRadius: 2,
                              bgcolor: "#ffffff",
                            },
                          }}
                        >
                          {FEE_TYPES.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </TextField>
                      )}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <Controller
                      name="offset_fee_value"
                      control={control}
                      rules={{
                        min: { value: 0, message: "Fee cannot be negative." },
                      }}
                      render={({ field, fieldState }) => (
                        <TextField
                          {...field}
                          fullWidth
                          size="small"
                          type="number"
                          disabled={!allowsOffset}
                          label="Offset Fee Value"
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message}
                          slotProps={{
                            htmlInput: { min: 0, step: 0.01 },
                            input: {
                              endAdornment: (
                                <InputAdornment position="end">
                                  <Typography variant="caption" fontWeight={600} color="text.secondary">
                                    {offsetFeeType === "percentage" ? "%" : "KES"}
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
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </Stack>
      </CardContent>
    </Card>
  );
}
