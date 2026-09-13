"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
  Typography,
  Box,
  Alert,
  CircularProgress,
  FormControlLabel,
  Switch,
  Chip,
  Paper,
  InputAdornment,
} from "@mui/material";
import {
  IconBuildingBank,
  IconHash,
  IconFileText,
  IconCheck,
  IconX,
  IconInfoCircle,
} from "@tabler/icons-react";
import loanService from "@/services/loan.service";

interface AddLedgerAccountDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (newAccount: any) => void;
}

const ACCOUNT_TYPES = [
  { value: "asset", label: "Asset", prefix: "1xxx", color: "primary", desc: "Cash, bank balances, loan receivables" },
  { value: "liability", label: "Liability", prefix: "2xxx", color: "warning", desc: "Member deposits, collateral suspense, payables" },
  { value: "equity", label: "Equity", prefix: "3xxx", color: "secondary", desc: "Share capital, retained earnings, statutory reserves" },
  { value: "revenue", label: "Revenue / Income", prefix: "4xxx", color: "success", desc: "Interest income, loan processing fees, penalties" },
  { value: "expense", label: "Expense", prefix: "5xxx", color: "error", desc: "Bank charges, write-offs, administrative expenses" },
];

export default function AddLedgerAccountDialog({
  open,
  onClose,
  onSuccess,
}: AddLedgerAccountDialogProps) {
  const [accountCode, setAccountCode] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountType, setAccountType] = useState("revenue");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReset = () => {
    setAccountCode("");
    setAccountName("");
    setAccountType("revenue");
    setDescription("");
    setIsActive(true);
    setError(null);
  };

  const handleCloseDialog = () => {
    if (submitting) return;
    handleReset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedCode = accountCode.trim();
    const trimmedName = accountName.trim();

    if (!trimmedCode) {
      setError("Please specify a unique account code (e.g. 1020, 4160).");
      return;
    }
    if (!trimmedName) {
      setError("Please enter a descriptive account name.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await loanService.createLedgerAccount({
        account_code: trimmedCode,
        account_name: trimmedName,
        account_type: accountType,
        description: description.trim(),
        is_active: isActive,
      });

      handleReset();
      onSuccess(created);
    } catch (err: any) {
      console.error("Failed to create ledger account:", err);
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.account_code?.[0] ||
        err?.response?.data?.detail ||
        err?.message ||
        "Failed to save ledger account. Ensure the account code is unique.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedTypeInfo = ACCOUNT_TYPES.find((t) => t.value === accountType);

  return (
    <Dialog
      open={open}
      onClose={handleCloseDialog}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3.5,
          p: 1,
          boxShadow: "0 20px 40px -15px rgba(0,0,0,0.15)",
        },
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2.5,
                bgcolor: "#ecfdf5",
                color: "#059669",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconBuildingBank size={24} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={800} sx={{ color: "#0f172a", lineHeight: 1.2 }}>
                Define New Ledger Account
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
                SACCO General Ledger &amp; Chart of Accounts Registry
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2.5}>
            {error && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <Paper
              elevation={0}
              sx={{
                p: 2,
                bgcolor: "#f8fafc",
                borderRadius: 2.5,
                border: "1px solid #e2e8f0",
              }}
            >
              <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={1}>
                RECOMMENDED NUMBERING CONVENTIONS:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                {ACCOUNT_TYPES.map((t) => (
                  <Chip
                    key={t.value}
                    label={`${t.prefix} ${t.label}`}
                    size="small"
                    variant={accountType === t.value ? "filled" : "outlined"}
                    color={accountType === t.value ? (t.color as any) : "default"}
                    onClick={() => setAccountType(t.value)}
                    sx={{
                      cursor: "pointer",
                      fontWeight: 700,
                      fontSize: "0.74rem",
                    }}
                  />
                ))}
              </Stack>
            </Paper>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                required
                fullWidth
                label="Account Code *"
                placeholder="e.g. 1020, 4160"
                value={accountCode}
                onChange={(e) => setAccountCode(e.target.value)}
                disabled={submitting}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconHash size={18} color="#94a3b8" />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              />

              <TextField
                select
                required
                fullWidth
                label="Account Type *"
                value={accountType}
                onChange={(e) => setAccountType(e.target.value)}
                disabled={submitting}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              >
                {ACCOUNT_TYPES.map((t) => (
                  <MenuItem key={t.value} value={t.value}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2" fontWeight={700}>
                        {t.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ({t.prefix})
                      </Typography>
                    </Stack>
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            {selectedTypeInfo && (
              <Typography variant="caption" sx={{ color: "#64748b", mt: -1.5, ml: 0.5 }}>
                <IconInfoCircle size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
                {selectedTypeInfo.desc}
              </Typography>
            )}

            <TextField
              required
              fullWidth
              label="Account Name *"
              placeholder="e.g. Cooperative Bank Operational A/C, Loan Insurance Reserve"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              disabled={submitting}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconFileText size={18} color="#94a3b8" />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />

            <TextField
              fullWidth
              multiline
              rows={2}
              label="Description / Purpose"
              placeholder="Brief description of transactions and journals recorded under this ledger account..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />

            <Box sx={{ p: 1.5, bgcolor: "#f1f5f9", borderRadius: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    color="success"
                    disabled={submitting}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={700} sx={{ color: "#1e293b" }}>
                      Active Status
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      When active, this account can be selected in journals and loan products
                    </Typography>
                  </Box>
                }
              />
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
          <Button
            variant="outlined"
            color="inherit"
            onClick={handleCloseDialog}
            disabled={submitting}
            startIcon={<IconX size={16} />}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 700,
              color: "#64748b",
            }}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <IconCheck size={16} />}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 800,
              px: 3,
              bgcolor: "#047857",
              "&:hover": { bgcolor: "#065f46" },
            }}
          >
            {submitting ? "Defining Account..." : "Save Ledger Account"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
