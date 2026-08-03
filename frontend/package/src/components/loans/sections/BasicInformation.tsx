"use client";

import {
  Card,
  CardContent,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  Controller,
  useFormContext,
} from "react-hook-form";

import {
  LoanProductCreate,
} from "@/interfaces/loanProduct";

export default function BasicInformation() {
  const {
    control,
  } = useFormContext<LoanProductCreate>();

  return (
    <Card
      variant="outlined"
    >
      <CardContent>
        <Stack spacing={3}>
          <Typography
            variant="h6"
            fontWeight={600}
          >
            Basic Information
          </Typography>

          <Grid
            container
            spacing={3}
          >
            <Grid
              size={{
                xs: 12,
                md: 4,
              }}
            >
              <Controller
                name="product_code"
                control={control}
                rules={{
                  required:
                    "Product code is required.",
                }}
                render={({
                  field,
                  fieldState,
                }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Product Code"
                    placeholder="LP001"
                    required
                    error={
                      !!fieldState.error
                    }
                    helperText={
                      fieldState.error
                        ?.message
                    }
                  />
                )}
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 5,
              }}
            >
              <Controller
                name="product_name"
                control={control}
                rules={{
                  required:
                    "Product name is required.",
                }}
                render={({
                  field,
                  fieldState,
                }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Product Name"
                    placeholder="Development Loan"
                    required
                    error={
                      !!fieldState.error
                    }
                    helperText={
                      fieldState.error
                        ?.message
                    }
                  />
                )}
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 3,
              }}
            >
              <Controller
                name="effective_date"
                control={control}
                rules={{
                  required:
                    "Effective date is required.",
                }}
                render={({
                  field,
                  fieldState,
                }) => (
                  <TextField
                    {...field}
                    fullWidth
                    required
                    type="date"
                    label="Effective Date"
                    slotProps={{
                      inputLabel: {
                        shrink: true,
                      },
                    }}
                    error={
                      !!fieldState.error
                    }
                    helperText={
                      fieldState.error
                        ?.message
                    }
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