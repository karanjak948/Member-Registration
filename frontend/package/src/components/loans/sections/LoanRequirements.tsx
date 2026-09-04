"use client";

import React from "react";
import {
  Box,
  Card,
  CardContent,
  Divider,
  FormControlLabel,
  Grid,
  InputAdornment,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import {
  IconShieldCheck,
  IconUsers,
  IconCoins,
  IconShieldLock,
  IconCash,
} from "@tabler/icons-react";
import { Controller, useFormContext } from "react-hook-form";
import { LoanProductCreate } from "@/interfaces/loanProduct";
import { DEPOSIT_TYPES, SECURITY_TYPES } from "@/constants/loan";

export default function LoanRequirements() {
  const { control, watch } = useFormContext<LoanProductCreate>();

  const requiresGuarantor = watch("requires_guarantor");
  const multipleOfSavings = watch("is_multiple_of_savings");
  const requiresSecurity = watch("requires_security");
  const requiresDeposit = watch("requires_deposit");
  const securityType = watch("security_type");
  const depositType = watch("deposit_type");

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
      <Box sx={{ height: 4, bgcolor: "#7c3aed" }} />
      <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
        <Stack spacing={3}>
          {/* Section Header */}
          <Stack direction="row" alignItems="center" spacing={1.75}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2.5,
                bgcolor: "#f5f3ff",
                color: "#7c3aed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(124, 58, 237, 0.12)",
              }}
            >
              <IconShieldCheck size={24} stroke={2} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700} color="#0f172a">
                Loan Requirements & Collateral Policy
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Guarantor rules, member savings multipliers, collateral requirements, and advance deposits
              </Typography>
            </Box>
          </Stack>

          <Divider />

          <Grid container spacing={3}>
            {/* POLICY 1: GUARANTOR REQUIREMENT */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 2.5,
                  border: `1px solid ${requiresGuarantor ? "#ddd6fe" : "#e2e8f0"}`,
                  bgcolor: requiresGuarantor ? "#f5f3ff" : "#f8fafc",
                  transition: "all 0.2s ease",
                  height: "100%",
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 2,
                        bgcolor: requiresGuarantor ? "#ede9fe" : "#f1f5f9",
                        color: requiresGuarantor ? "#7c3aed" : "#64748b",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <IconUsers size={20} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700} color="#0f172a">
                        Requires Guarantor
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Mandate active SACCO member guarantors
                      </Typography>
                    </Box>
                  </Stack>
                  <Controller
                    name="requires_guarantor"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        color="secondary"
                      />
                    )}
                  />
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: "block" }}>
                  {requiresGuarantor
                    ? "Applicants must provide registered SACCO guarantors whose deposits cover the loan exposure."
                    : "Loan applications under this tier can be approved without requiring member guarantors."}
                </Typography>
              </Box>
            </Grid>

            {/* POLICY 2: MULTIPLE OF SAVINGS */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 2.5,
                  border: `1px solid ${multipleOfSavings ? "#a7f3d0" : "#e2e8f0"}`,
                  bgcolor: multipleOfSavings ? "#ecfdf5" : "#f8fafc",
                  transition: "all 0.2s ease",
                  height: "100%",
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 2,
                        bgcolor: multipleOfSavings ? "#d1fae5" : "#f1f5f9",
                        color: multipleOfSavings ? "#059669" : "#64748b",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <IconCoins size={20} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700} color="#0f172a">
                        Multiple of Savings
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Cap loan amount based on member savings
                      </Typography>
                    </Box>
                  </Stack>
                  <Controller
                    name="is_multiple_of_savings"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        color="success"
                      />
                    )}
                  />
                </Stack>

                <Controller
                  name="savings_multiplier"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      size="small"
                      type="number"
                      label="Savings Multiplier (e.g. 3.0)"
                      disabled={!multipleOfSavings}
                      slotProps={{
                        htmlInput: { min: 0, step: 0.1 },
                        input: {
                          endAdornment: (
                            <InputAdornment position="end">
                              <Typography variant="caption" fontWeight={700} color={multipleOfSavings ? "#059669" : "text.secondary"}>
                                x Savings
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

            {/* POLICY 3: SECURITY / COLLATERAL */}
            <Grid size={{ xs: 12 }}>
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 2.5,
                  border: `1px solid ${requiresSecurity ? "#fde68a" : "#e2e8f0"}`,
                  bgcolor: requiresSecurity ? "#fffbeb" : "#f8fafc",
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
                        bgcolor: requiresSecurity ? "#fef3c7" : "#f1f5f9",
                        color: requiresSecurity ? "#d97706" : "#64748b",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <IconShieldLock size={20} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700} color="#0f172a">
                        Requires Collateral / Security
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Pledge of physical assets, logbooks, or land title deeds
                      </Typography>
                    </Box>
                  </Stack>
                  <Controller
                    name="requires_security"
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
                      name="security_type"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          select
                          fullWidth
                          size="small"
                          label="Security Type"
                          disabled={!requiresSecurity}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              borderRadius: 2,
                              bgcolor: "#ffffff",
                            },
                          }}
                        >
                          {SECURITY_TYPES.map((option) => (
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
                      name="security_value"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          size="small"
                          type="number"
                          label="Security Value"
                          disabled={!requiresSecurity}
                          slotProps={{
                            htmlInput: { min: 0, step: 0.01 },
                            input: {
                              endAdornment: (
                                <InputAdornment position="end">
                                  <Typography variant="caption" fontWeight={600} color="text.secondary">
                                    {securityType === "percentage" ? "% of Loan" : "KES"}
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

                  <Grid size={{ xs: 12, md: 4 }}>
                    <Controller
                      name="security_notes"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          size="small"
                          placeholder="e.g. Logbook in SACCO custody or title deed"
                          label="Security Notes / Guidelines"
                          disabled={!requiresSecurity}
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

            {/* POLICY 4: ADVANCE DEPOSIT */}
            <Grid size={{ xs: 12 }}>
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 2.5,
                  border: `1px solid ${requiresDeposit ? "#bfdbfe" : "#e2e8f0"}`,
                  bgcolor: requiresDeposit ? "#eff6ff" : "#f8fafc",
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
                        bgcolor: requiresDeposit ? "#dbeafe" : "#f1f5f9",
                        color: requiresDeposit ? "#2563eb" : "#64748b",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <IconCash size={20} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700} color="#0f172a">
                        Requires Advance Deposit
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Mandatory borrower cash commitment before disbursement
                      </Typography>
                    </Box>
                  </Stack>
                  <Controller
                    name="requires_deposit"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        color="primary"
                      />
                    )}
                  />
                </Stack>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                      name="deposit_type"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          select
                          fullWidth
                          size="small"
                          label="Deposit Type"
                          disabled={!requiresDeposit}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              borderRadius: 2,
                              bgcolor: "#ffffff",
                            },
                          }}
                        >
                          {DEPOSIT_TYPES.map((option) => (
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
                      name="deposit_value"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          size="small"
                          type="number"
                          label="Deposit Value"
                          disabled={!requiresDeposit}
                          slotProps={{
                            htmlInput: { min: 0, step: 0.01 },
                            input: {
                              endAdornment: (
                                <InputAdornment position="end">
                                  <Typography variant="caption" fontWeight={600} color="text.secondary">
                                    {depositType === "percentage" ? "% of Loan" : "KES"}
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