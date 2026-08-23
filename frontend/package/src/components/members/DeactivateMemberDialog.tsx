"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import {
  IconUserX,
  IconId,
  IconUser,
  IconPhone,
  IconCategory,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { Member } from "@/interfaces/member";
import useMemberWorkflow from "@/components/members/hooks/useMemberWorkflow";

interface DeactivateMemberDialogProps {
  open: boolean;
  member: Member | null;
  loading?: boolean;
  error?: string;
  onClose: () => void;
  onSuccess?: () => void;
  onDeactivate?: (remarks: string) => void | Promise<void>;
}

export default function DeactivateMemberDialog({
  open,
  member,
  loading: externalLoading = false,
  error: externalError,
  onClose,
  onSuccess,
  onDeactivate,
}: DeactivateMemberDialogProps) {
  const [remarks, setRemarks] = useState("");
  const [internalError, setInternalError] = useState("");
  const workflow = useMemberWorkflow();

  useEffect(() => {
    if (open) {
      setRemarks("");
      setInternalError("");
    }
  }, [open]);

  async function handleDeactivate() {
    if (!member) return;

    if (!remarks.trim()) {
      setInternalError("Please provide a reason for deactivating this member account.");
      return;
    }

    try {
      setInternalError("");
      if (onDeactivate) {
        await onDeactivate(remarks);
      } else {
        await workflow.deactivate(member.id, remarks);
      }
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error) {
      console.error("Failed to deactivate member:", error);
      setInternalError("Failed to deactivate member. Please try again.");
    }
  }

  const displayError = externalError || internalError;
  const isLoading = workflow.loading || externalLoading;

  return (
    <Dialog
      open={open}
      fullWidth
      maxWidth="sm"
      onClose={isLoading ? undefined : onClose}
      PaperProps={{
        sx: {
          borderRadius: 3.5,
          boxShadow: "0 20px 40px -10px rgba(0,0,0,0.2)",
          overflow: "hidden",
        },
      }}
    >
      {/* Header Banner */}
      <Box
        sx={{
          px: 3,
          py: 2.5,
          background: "linear-gradient(135deg, #78350f 0%, #b45309 100%)",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Box
          sx={{
            width: 46,
            height: 46,
            borderRadius: 2.5,
            bgcolor: "rgba(255, 255, 255, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          <IconUserX size={26} stroke={2.5} />
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={900} sx={{ color: "#ffffff", letterSpacing: "-0.3px" }}>
            Deactivate Member Account
          </Typography>
          <Typography variant="caption" sx={{ color: "#fde68a", fontWeight: 600 }}>
            Temporarily suspend member account privileges and log administrative rationale
          </Typography>
        </Box>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        <Stack spacing={2.5}>
          {displayError && (
            <Alert severity="error" sx={{ borderRadius: 2.5, fontWeight: 700 }}>
              {displayError}
            </Alert>
          )}

          {member && (
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: "1px solid #e2e8f0",
                borderLeft: "5px solid #b45309",
                bgcolor: "#f8fafc",
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Member Information
              </Typography>

              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600, display: "flex", alignItems: "center", gap: 0.5 }}>
                    <IconId size={14} /> Membership Number
                  </Typography>
                  <Typography sx={{ fontWeight: 900, color: "#92400e", fontFamily: "monospace", fontSize: "1rem" }}>
                    {member.membership_number}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600, display: "flex", alignItems: "center", gap: 0.5 }}>
                    <IconUser size={14} /> Full Name
                  </Typography>
                  <Typography sx={{ fontWeight: 800, color: "#0f172a", fontSize: "1rem" }}>
                    {member.first_name} {member.other_names}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600, display: "flex", alignItems: "center", gap: 0.5 }}>
                    <IconCategory size={14} /> Category Tier
                  </Typography>
                  <Typography sx={{ fontWeight: 700, color: "#334155" }}>
                    {member.category_name || "Normal Member"}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600, display: "flex", alignItems: "center", gap: 0.5 }}>
                    <IconPhone size={14} /> Phone Number
                  </Typography>
                  <Typography sx={{ fontWeight: 700, color: "#334155", fontFamily: "monospace" }}>
                    {member.phone_number}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          )}

          {/* Reason Field */}
          <Box>
            <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.8, color: "#1e293b" }}>
              Deactivation Reason <span style={{ color: "#b45309" }}>*</span>
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={2.5}
              placeholder="e.g. Member requested temporary leave of absence, or compliance verification pending."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              disabled={isLoading}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2.5,
                  bgcolor: "#f8fafc",
                  "& fieldset": { borderColor: "#cbd5e1" },
                  "&:hover fieldset": { borderColor: "#b45309" },
                  "&.Mui-focused fieldset": { borderColor: "#b45309", borderWidth: 2 },
                },
              }}
            />
          </Box>

          <Box
            sx={{
              p: 2,
              borderRadius: 2.5,
              bgcolor: "#fffbeb",
              border: "1px solid #fde68a",
              display: "flex",
              alignItems: "flex-start",
              gap: 1.5,
            }}
          >
            <IconAlertTriangle size={20} color="#b45309" style={{ marginTop: 2, flexShrink: 0 }} />
            <Typography variant="body2" sx={{ color: "#92400e", fontWeight: 600, lineHeight: 1.5 }}>
              Deactivating this member will switch their status from <strong>ACTIVE</strong> to <strong>INACTIVE</strong>, pausing active loan disbursements and operations. The member can be reactivated anytime.
            </Typography>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2.5, bgcolor: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
        <Button
          variant="outlined"
          onClick={onClose}
          disabled={isLoading}
          sx={{
            fontWeight: 800,
            borderRadius: 2,
            px: 2.5,
            borderColor: "#cbd5e1",
            color: "#475569",
          }}
        >
          Cancel
        </Button>

        <LoadingButton
          variant="contained"
          onClick={handleDeactivate}
          loading={isLoading}
          startIcon={<IconUserX size={18} />}
          sx={{
            bgcolor: "#b45309",
            color: "#ffffff",
            fontWeight: 800,
            borderRadius: 2,
            px: 3.5,
            py: 1,
            boxShadow: "0 4px 14px rgba(180, 83, 9, 0.35)",
            "&:hover": { bgcolor: "#92400e" },
          }}
        >
          Deactivate Member
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}