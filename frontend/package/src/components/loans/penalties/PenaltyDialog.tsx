"use client";

import { useEffect } from "react";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Stack,
  Switch,
  FormControlLabel,
  TextField,
} from "@mui/material";

import { Controller, useForm } from "react-hook-form";

import { LoanProductPenaltyCreate } from "@/interfaces/loanPenalty";

import { PENALTY_BASES, PENALTY_TRIGGERS } from "@/constants/loan";

interface PenaltyDialogProps {
  open: boolean;

  initialValue?: LoanProductPenaltyCreate;

  onClose: () => void;

  onSave: (penalty: LoanProductPenaltyCreate) => void;
}

const defaultValues: LoanProductPenaltyCreate = {
  penalty_name: "",
  trigger: "late_payment",
  basis: "principal",
  value: 0,
  is_active: true,
  ledger_account_name: "",
};

export default function PenaltyDialog({
  open,
  initialValue,
  onClose,
  onSave,
}: PenaltyDialogProps) {
  const { control, handleSubmit, reset } = useForm<LoanProductPenaltyCreate>({
    defaultValues,
  });

  useEffect(() => {
    if (open) {
      reset(initialValue ?? defaultValues);
    }
  }, [open, initialValue, reset]);

  function submit(data: LoanProductPenaltyCreate) {
    onSave(data);

    onClose();
  }

  return (
    <Dialog open={open} fullWidth maxWidth="md" onClose={onClose}>
      <DialogTitle>Loan Product Penalty</DialogTitle>

      <DialogContent>
        <Stack spacing={3} mt={1}>
          <Grid container spacing={3}>
            <Grid
              size={{
                xs: 12,
                md: 6,
              }}
            >
              <Controller
                name="penalty_name"
                control={control}
                rules={{
                  required: "Penalty name is required.",
                }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Penalty Name"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 6,
              }}
            >
              <Controller
                name="trigger"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select fullWidth label="Trigger">
                    {PENALTY_TRIGGERS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 6,
              }}
            >
              <Controller
                name="basis"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select fullWidth label="Penalty Basis">
                    {PENALTY_BASES.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 6,
              }}
            >
              <Controller
                name="value"
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
                    type="number"
                    label="Penalty Value"
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

            <Grid
              size={{
                xs: 12,
                md: 6,
              }}
            >
              <Controller
                name="ledger_account_name"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Ledger Account Name" />
                )}
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
              }}
            >
              <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    label="Active Penalty"
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
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>

        <Button variant="contained" onClick={handleSubmit(submit)}>
          Save Penalty
        </Button>
      </DialogActions>
    </Dialog>
  );
}
