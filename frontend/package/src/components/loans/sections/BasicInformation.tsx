"use client";

import React from "react";
import {
  Box,
  Card,
  CardContent,
  Divider,
  Grid,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { IconBuildingBank, IconBarcode, IconTag, IconCalendar } from "@tabler/icons-react";
import { Controller, useFormContext } from "react-hook-form";
import { LoanProductCreate } from "@/interfaces/loanProduct";

export default function BasicInformation() {
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
      <Box sx={{ height: 4, bgcolor: "#047857" }} />
      <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
        <Stack spacing={3}>
          {/* Section Header */}
          <Stack direction="row" alignItems="center" spacing={1.75}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2.5,
                bgcolor: "#ecfdf5",
                color: "#047857",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(4, 120, 87, 0.12)",
              }}
            >
              <IconBuildingBank size={24} stroke={2} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700} color="#0f172a">
                Basic Information
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Unique identifier code, commercial naming, and tier activation date
              </Typography>
            </Box>
          </Stack>

          <Divider />

          <Grid container spacing={2.5}>
            {/* Product Code */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name="product_code"
                control={control}
                rules={{ required: "Product code is required." }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Product Code *"
                    placeholder="e.g. DEV-001, AST-001"
                    required
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message || "Unique identifier for this loan tier"}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <IconBarcode size={18} color="#64748b" />
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

            {/* Product Name */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Controller
                name="product_name"
                control={control}
                rules={{ required: "Product name is required." }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Product Name *"
                    placeholder="e.g. Asset Finance Loan, Development Loan"
                    required
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message || "Public-facing commercial loan product name"}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <IconTag size={18} color="#64748b" />
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

            {/* Effective Date */}
            <Grid size={{ xs: 12, md: 3 }}>
              <Controller
                name="effective_date"
                control={control}
                rules={{ required: "Effective date is required." }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    fullWidth
                    required
                    type="date"
                    label="Effective Date *"
                    slotProps={{
                      inputLabel: { shrink: true },
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <IconCalendar size={18} color="#64748b" />
                          </InputAdornment>
                        ),
                      },
                    }}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message || "Tier effective launch date"}
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