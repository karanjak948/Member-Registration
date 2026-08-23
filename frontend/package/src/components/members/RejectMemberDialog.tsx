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
  IconX,
  IconId,
  IconUser,
  IconPhone,
  IconCategory,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { Member } from "@/interfaces/member";
import useMemberWorkflow from "@/components/members/hooks/useMemberWorkflow";

interface RejectMemberDialogProps {
  open: boolean;
  member: Member | null;
  loading?: boolean;
  error?: string;
  onClose: () => void;
  onSuccess?: () => void;
  onReject?: (remarks: string) => void | Promise<void>;
}

export default function RejectMemberDialog({
  open,
  member,
  loading: externalLoading = false,
  error: externalError,
  onClose,
  onSuccess,
  onReject,
}: RejectMemberDialogProps) {
  const [remarks, setRemarks] = useState("");
  const [internalError, setInternalError] = useState("");
  const workflow = useMemberWorkflow();

  useEffect(() => {
    if (open) {
      setRemarks("");
      setInternalError("");
    }
  }, [open]);

  async function handleReject() {
    if (!member) return;

    if (!remarks.trim()) {
      setInternalError("Please provide a specific reason for rejecting this member registration.");
      return;
    }

    try {
      setInternalError("");
      if (onReject) {
        await onReject(remarks);
      } else {
        await workflow.reject(member.id, remarks);
      }
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error) {
      console.error("Failed to reject member:", error);
      setInternalError("Failed to reject member. Please try again.");
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
          background: "linear-gradient(135deg, #881337 0%, #be123c 100%)",
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
          <IconX size={26} stroke={2.5} />
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={900} sx={{ color: "#ffffff", letterSpacing: "-0.3px" }}>
            Reject Member Registration
          </Typography>
          <Typography variant="caption" sx={{ color: "#fecdd3", fontWeight: 600 }}>
            Reject this member application and log the compliance or KYC rationale
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
                borderLeft: "5px solid #be123c",
                bgcolor: "#f8fafc",
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Applicant Details
              </Typography>

              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600, display: "flex", alignItems: "center", gap: 0.5 }}>
                    <IconId size={14} /> Membership Number
                  </Typography>
                  <Typography sx={{ fontWeight: 900, color: "#9f1239", fontFamily: "monospace", fontSize: "1rem" }}>
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
              Rejection Reason &amp; Compliance Notes <span style={{ color: "#be123c" }}>*</span>
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Provide specific reasons e.g. Invalid national ID documentation, unverified guarantor details, or duplicate record."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              disabled={isLoading}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2.5,
                  bgcolor: "#f8fafc",
                  "& fieldset": { borderColor: "#cbd5e1" },
                  "&:hover fieldset": { borderColor: "#be123c" },
                  "&.Mui-focused fieldset": { borderColor: "#be123c", borderWidth: 2 },
                },
              }}
            />
          </Box>

          <Box
            sx={{
              p: 2,
              borderRadius: 2.5,
              bgcolor: "#fff1f2",
              border: "1px solid #fecdd3",
              display: "flex",
              alignItems: "flex-start",
              gap: 1.5,
            }}
          >
            <IconAlertTriangle size={20} color="#be123c" style={{ marginTop: 2, flexShrink: 0 }} />
            <Typography variant="body2" sx={{ color: "#9f1239", fontWeight: 600, lineHeight: 1.5 }}>
              Rejecting this member will move them to the <strong>REJECTED</strong> stage and restrict all account operations. The reason entered above will be recorded in the audit trail.
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
          onClick={handleReject}
          loading={isLoading}
          startIcon={<IconX size={18} />}
          sx={{
            bgcolor: "#be123c",
            color: "#ffffff",
            fontWeight: 800,
            borderRadius: 2,
            px: 3.5,
            py: 1,
            boxShadow: "0 4px 14px rgba(190, 18, 60, 0.35)",
            "&:hover": { bgcolor: "#9f1239" },
          }}
        >
          Reject Member
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}