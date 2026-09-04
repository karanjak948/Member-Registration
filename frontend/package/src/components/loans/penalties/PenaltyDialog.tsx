"use client";

import React, { useEffect } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import { IconScale } from "@tabler/icons-react";
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
    <Dialog
      open={open}
      fullWidth
      maxWidth="md"
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3.5,
            p: 1,
            boxShadow: "0 20px 48px rgba(0,0,0,0.15)",
          },
        },
      }}
    >
      <DialogTitle sx={{ pb: 1.5 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2.5,
              bgcolor: "#fee2e2",
              color: "#dc2626",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconScale size={22} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700} color="#0f172a">
              {initialValue ? "Edit Loan Penalty Rule" : "Add Loan Penalty Rule"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Configure automated delinquency trigger, rate basis, and penalty ledger
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ py: 3 }}>
        <Stack spacing={2.5}>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="penalty_name"
                control={control}
                rules={{ required: "Penalty name is required." }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Penalty Name *"
                    placeholder="e.g. Overdue Installment Fine (5%)"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="trigger"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    label="Penalty Trigger *"
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                  >
                    {PENALTY_TRIGGERS.map((option) => (
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
                name="basis"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    label="Penalty Basis *"
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                  >
                    {PENALTY_BASES.map((option) => (
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
                name="value"
                control={control}
                rules={{
                  min: { value: 0, message: "Value cannot be negative." },
                }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Penalty Rate (%) *"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    slotProps={{
                      htmlInput: { min: 0, step: 0.01 },
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <Typography variant="caption" fontWeight={700} color="#dc2626">
                              %
                            </Typography>
                          </InputAdornment>
                        ),
                      },
                    }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="ledger_account_name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Ledger Account Name"
                    placeholder="e.g. Loan Penalty Income (4020)"
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: "#f8fafc", border: "1px solid #f1f5f9", height: "100%", display: "flex", alignItems: "center" }}>
                <Controller
                  name="is_active"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          color="error"
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2" fontWeight={700}>
                            Active Penalty Rule
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Enable automatic assessment on delinquent accounts
                          </Typography>
                        </Box>
                      }
                    />
                  )}
                />
              </Box>
            </Grid>
          </Grid>
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={onClose}
          sx={{
            color: "#64748b",
            fontWeight: 600,
            textTransform: "none",
            borderRadius: 2,
            px: 2,
          }}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={handleSubmit(submit)}
          sx={{
            bgcolor: "#dc2626",
            textTransform: "none",
            fontWeight: 700,
            borderRadius: 2,
            px: 3,
            "&:hover": { bgcolor: "#b91c1c" },
          }}
        >
          Save Penalty Rule
        </Button>
      </DialogActions>
    </Dialog>
  );
}
