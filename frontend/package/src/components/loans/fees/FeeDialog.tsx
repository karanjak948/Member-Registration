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

import { LoanProductFeeCreate } from "@/interfaces/loanFee";

import { FEE_TYPES, FEE_BASES } from "@/constants/loan";

interface FeeDialogProps {
  open: boolean;

  initialValue?: LoanProductFeeCreate;

  onClose: () => void;

  onSave: (fee: LoanProductFeeCreate) => void;
}

const defaultValues: LoanProductFeeCreate = {
  fee_name: "",
  fee_type: "fixed",
  fee_value: 0,
  fee_basis: "loan_amount",
  charge_stage: "application",
  affects_principal: false,
  show_in_statement: true,
  ledger_account_name: "",
};

export default function FeeDialog({
  open,
  initialValue,
  onClose,
  onSave,
}: FeeDialogProps) {
  const { control, handleSubmit, reset } = useForm<LoanProductFeeCreate>({
    defaultValues,
  });

  useEffect(() => {
    if (open) {
      reset(initialValue ?? defaultValues);
    }
  }, [open, initialValue, reset]);

  function submit(data: LoanProductFeeCreate) {
    onSave(data);

    onClose();
  }

  return (
    <Dialog open={open} fullWidth maxWidth="md" onClose={onClose}>
      <DialogTitle>Loan Product Fee</DialogTitle>

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
                name="fee_name"
                control={control}
                rules={{
                  required: "Fee name is required.",
                }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Fee Name"
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
                name="fee_type"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select fullWidth label="Fee Type">
                    {FEE_TYPES.map((option) => (
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
                name="fee_value"
                control={control}
                rules={{
                  min: {
                    value: 0,
                    message: "Fee value cannot be negative.",
                  },
                }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Fee Value"
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
                name="fee_basis"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select fullWidth label="Fee Basis">
                    {FEE_BASES.map((option) => (
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
                name="charge_stage"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select fullWidth label="Charge Stage">
                    <MenuItem value="application">Application</MenuItem>
                    <MenuItem value="approval">Approval</MenuItem>
                    <MenuItem value="disbursement">Disbursement</MenuItem>
                    <MenuItem value="repayment">Repayment</MenuItem>
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
                name="affects_principal"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    label="Affects Principal"
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

            <Grid
              size={{
                xs: 12,
                md: 6,
              }}
            >
              <Controller
                name="show_in_statement"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    label="Show in Statement"
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

            <Grid
              size={{
                xs: 12,
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
          </Grid>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>

        <Button variant="contained" onClick={handleSubmit(submit)}>
          Save Fee
        </Button>
      </DialogActions>
    </Dialog>
  );
}
