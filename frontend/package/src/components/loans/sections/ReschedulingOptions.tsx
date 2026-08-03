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

import { Controller, useFormContext } from "react-hook-form";

import { LoanProductCreate } from "@/interfaces/loanProduct";

import { FEE_TYPES, OFFSET_COVER_TYPES } from "@/constants/loan";

export default function ReschedulingOptions() {
  const { control, watch } = useFormContext<LoanProductCreate>();

  const allowsRescheduling = watch("allows_rescheduling");

  const allowsOffset = watch("allows_offset");

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={3}>
          <Typography variant="h6" fontWeight={600}>
            Rescheduling & Offset
          </Typography>

          <Grid container spacing={3}>
            {/* Allow Rescheduling */}

            <Grid size={{ xs: 12 }}>
              <Controller
                name="allows_rescheduling"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    label="Allow Loan Rescheduling"
                    control={
                      <Switch
                        checked={field.value}
                        onChange={(event) =>
                          field.onChange(event.target.checked)
                        }
                      />
                    }
                  />
                )}
              />
            </Grid>

            {/* Reschedule Fee Type */}

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="reschedule_fee_type"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    disabled={!allowsRescheduling}
                    label="Reschedule Fee Type"
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

            {/* Reschedule Fee Value */}

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="reschedule_fee_value"
                control={control}
                rules={{
                  min: {
                    value: 0,
                    message: "Fee cannot be negative.",
                  },
                }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    disabled={!allowsRescheduling}
                    label="Reschedule Fee Value"
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

            {/* Divider by spacing */}

            <Grid size={{ xs: 12 }}>
              <Controller
                name="allows_offset"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    label="Allow Loan Offset"
                    control={
                      <Switch
                        checked={field.value}
                        onChange={(event) =>
                          field.onChange(event.target.checked)
                        }
                      />
                    }
                  />
                )}
              />
            </Grid>

            {/* Offset Covers */}

            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name="offset_covers"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    disabled={!allowsOffset}
                    label="Offset Covers"
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

            {/* Offset Fee Type */}

            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name="offset_fee_type"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    disabled={!allowsOffset}
                    label="Offset Fee Type"
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

            {/* Offset Fee Value */}

            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name="offset_fee_value"
                control={control}
                rules={{
                  min: {
                    value: 0,
                    message: "Fee cannot be negative.",
                  },
                }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    disabled={!allowsOffset}
                    label="Offset Fee Value"
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
          </Grid>
        </Stack>
      </CardContent>
    </Card>
  );
}
