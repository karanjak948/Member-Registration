"use client";

import {
  Card,
  CardContent,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { Controller, useFormContext } from "react-hook-form";

import { LoanProductCreate } from "@/interfaces/loanProduct";

function ClassificationThresholds() {
  const { control } = useFormContext<LoanProductCreate>();

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={3}>
          <Typography variant="h6" fontWeight={600}>
            Classification Thresholds
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Configure the number of days after which a loan is classified as
            Watchful, Non-Performing, or Doubtful.
          </Typography>

          <Grid container spacing={3}>
            {/* Watchful */}

            <Grid
              size={{
                xs: 12,
                md: 4,
              }}
            >
              <Controller
                name="watchful_after_days"
                control={control}
                rules={{
                  min: {
                    value: 0,
                    message: "Value cannot be negative.",
                  },
                }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    fullWidth
                    required
                    type="number"
                    label="Watchful After (Days)"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    slotProps={{
                      htmlInput: {
                        min: 0,
                      },
                    }}
                  />
                )}
              />
            </Grid>

            {/* Non Performing */}

            <Grid
              size={{
                xs: 12,
                md: 4,
              }}
            >
              <Controller
                name="non_performing_after_days"
                control={control}
                rules={{
                  min: {
                    value: 0,
                    message: "Value cannot be negative.",
                  },
                }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    fullWidth
                    required
                    type="number"
                    label="Non-Performing After (Days)"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    slotProps={{
                      htmlInput: {
                        min: 0,
                      },
                    }}
                  />
                )}
              />
            </Grid>

            {/* Doubtful */}

            <Grid
              size={{
                xs: 12,
                md: 4,
              }}
            >
              <Controller
                name="doubtful_after_days"
                control={control}
                rules={{
                  min: {
                    value: 0,
                    message: "Value cannot be negative.",
                  },
                }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    fullWidth
                    required
                    type="number"
                    label="Doubtful After (Days)"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    slotProps={{
                      htmlInput: {
                        min: 0,
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

export default ClassificationThresholds;
