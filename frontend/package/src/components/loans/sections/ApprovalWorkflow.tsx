"use client";

import {
  Card,
  CardContent,
  FormControlLabel,
  Grid,
  Stack,
  Switch,
  Typography,
} from "@mui/material";

import { Controller, useFormContext } from "react-hook-form";

import { LoanProductCreate } from "@/interfaces/loanProduct";

export default function ApprovalWorkflow() {
  const { control } = useFormContext<LoanProductCreate>();

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={3}>
          <Typography variant="h6" fontWeight={600}>
            Approval Workflow
          </Typography>

          <Grid container spacing={3}>
            {/* Requires Appraisal */}

            <Grid
              size={{
                xs: 12,
                md: 6,
              }}
            >
              <Controller
                name="requires_appraisal"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    label="Requires Appraisal"
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

            {/* Requires Board Approval */}

            <Grid
              size={{
                xs: 12,
                md: 6,
              }}
            >
              <Controller
                name="requires_board_approval"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    label="Requires Board Approval"
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
          </Grid>
        </Stack>
      </CardContent>
    </Card>
  );
}
