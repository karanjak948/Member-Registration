"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Divider, Stack, Typography } from "@mui/material";
import { IconDeviceFloppy, IconRotateClockwise2, IconArrowLeft } from "@tabler/icons-react";
import { useFormContext } from "react-hook-form";
import { LoanProductCreate } from "@/interfaces/loanProduct";

interface FormActionsProps {
  loading?: boolean;
  mode?: "create" | "edit";
}

export default function FormActions({ loading = false, mode = "create" }: FormActionsProps) {
  const router = useRouter();
  const { reset } = useFormContext<LoanProductCreate>();

  return (
    <Card
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 3,
        border: "1px solid #e2e8f0",
        bgcolor: "#ffffff",
        boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.06)",
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={2}
      >
        <Button
          color="inherit"
          variant="text"
          startIcon={<IconArrowLeft size={18} />}
          onClick={() => router.push("/loan-products")}
          disabled={loading}
          sx={{
            fontWeight: 600,
            color: "#64748b",
            textTransform: "none",
            borderRadius: 2,
            "&:hover": { bgcolor: "#f1f5f9", color: "#0f172a" },
          }}
        >
          Cancel & Back to Catalog
        </Button>

        <Stack direction="row" spacing={1.5}>
          <Button
            color="inherit"
            variant="outlined"
            startIcon={<IconRotateClockwise2 size={18} />}
            onClick={() => reset()}
            disabled={loading}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              borderColor: "#cbd5e1",
              color: "#475569",
              "&:hover": { borderColor: "#94a3b8", bgcolor: "#f8fafc" },
            }}
          >
            Reset Fields
          </Button>

          <Button
            type="submit"
            variant="contained"
            loading={loading}
            startIcon={<IconDeviceFloppy size={18} />}
            sx={{
              background: "linear-gradient(135deg, #064e3b 0%, #047857 100%)",
              color: "#ffffff",
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 700,
              px: 3.5,
              py: 1.1,
              boxShadow: "0 4px 14px rgba(6, 78, 59, 0.28)",
              "&:hover": {
                background: "linear-gradient(135deg, #047857 0%, #059669 100%)",
              },
            }}
          >
            {mode === "edit" ? "Update Loan Product Tier" : "Publish Loan Product Tier"}
          </Button>
        </Stack>
      </Stack>
    </Card>
  );
}
