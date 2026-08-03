"use client";

import { Button, Divider, Stack } from "@mui/material";

import { LoadingButton } from "@mui/lab";

import SaveIcon from "@mui/icons-material/Save";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

import { useFormContext } from "react-hook-form";

import { LoanProductCreate } from "@/interfaces/loanProduct";

interface FormActionsProps {
  loading?: boolean;
}

export default function FormActions({ loading = false }: FormActionsProps) {
  const { reset } = useFormContext<LoanProductCreate>();

  return (
    <>
      <Divider />

      <Stack direction="row" justifyContent="flex-end" spacing={2}>
        <Button
          color="inherit"
          variant="outlined"
          startIcon={<RestartAltIcon />}
          onClick={() => reset()}
          disabled={loading}
        >
          Reset
        </Button>

        <LoadingButton
          type="submit"
          variant="contained"
          loading={loading}
          startIcon={<SaveIcon />}
        >
          Save Loan Product
        </LoadingButton>
      </Stack>
    </>
  );
}
