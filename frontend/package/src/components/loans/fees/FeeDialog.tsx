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
import { IconReceiptTax, IconX, IconCheck } from "@tabler/icons-react";
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
  const { control, handleSubmit, reset, watch } = useForm<LoanProductFeeCreate>({
    defaultValues,
  });

  const feeType = watch("fee_type");

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
              bgcolor: "#eef2ff",
              color: "#6366f1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconReceiptTax size={22} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700} color="#0f172a">
              {initialValue ? "Edit Product Fee Schedule" : "Add Product Fee Schedule"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Specify fee calculation rules, deduction trigger, and accounting ledger
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
                name="fee_name"
                control={control}
                rules={{ required: "Fee name is required." }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Fee Name *"
                    placeholder="e.g. Loan Appraisal Fee, Insurance Levy"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="fee_type"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    label="Fee Type *"
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
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
                name="fee_value"
                control={control}
                rules={{
                  min: { value: 0, message: "Fee value cannot be negative." },
                }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Fee Value *"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    slotProps={{
                      htmlInput: { min: 0, step: 0.01 },
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <Typography variant="caption" fontWeight={700} color="#6366f1">
                              {feeType === "percentage" ? "%" : "KES"}
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
                name="fee_basis"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    label="Fee Basis *"
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                  >
                    {FEE_BASES.map((option) => (
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
                name="charge_stage"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    label="Charge Stage *"
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                  >
                    <MenuItem value="application">At Loan Application</MenuItem>
                    <MenuItem value="approval">At Credit Approval</MenuItem>
                    <MenuItem value="disbursement">At Fund Disbursement (Deducted)</MenuItem>
                    <MenuItem value="repayment">During Periodic Repayments</MenuItem>
                  </TextField>
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
                    placeholder="e.g. Processing Fee Income (4010)"
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: "#f8fafc", border: "1px solid #f1f5f9" }}>
                <Controller
                  name="affects_principal"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          color="primary"
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2" fontWeight={700}>
                            Affects Loan Principal
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Capitalize fee into total borrower debt
                          </Typography>
                        </Box>
                      }
                    />
                  )}
                />
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: "#f8fafc", border: "1px solid #f1f5f9" }}>
                <Controller
                  name="show_in_statement"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          color="success"
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2" fontWeight={700}>
                            Show in Member Statement
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Itemize fee in borrower loan schedule
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
            bgcolor: "#6366f1",
            textTransform: "none",
            fontWeight: 700,
            borderRadius: 2,
            px: 3,
            "&:hover": { bgcolor: "#4f46e5" },
          }}
        >
          Save Fee Schedule
        </Button>
      </DialogActions>
    </Dialog>
  );
}
