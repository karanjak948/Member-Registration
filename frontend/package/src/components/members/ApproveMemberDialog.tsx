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
  IconCheck,
  IconId,
  IconUser,
  IconPhone,
  IconCategory,
  IconCircleCheck,
  IconShieldCheck,
} from "@tabler/icons-react";
import { Member } from "@/interfaces/member";
import useMemberWorkflow from "@/components/members/hooks/useMemberWorkflow";

interface ApproveMemberDialogProps {
  open: boolean;
  member: Member | null;
  loading?: boolean;
  error?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ApproveMemberDialog({
  open,
  member,
  loading: externalLoading = false,
  error: externalError,
  onClose,
  onSuccess,
}: ApproveMemberDialogProps) {
  const [remarks, setRemarks] = useState("");
  const [internalError, setInternalError] = useState("");
  const workflow = useMemberWorkflow();

  useEffect(() => {
    if (open) {
      setRemarks("");
      setInternalError("");
    }
  }, [open]);

  async function handleApprove() {
    if (!member) return;

    try {
      setInternalError("");
      await workflow.approve(member.id, remarks);
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error) {
      console.error("Failed to approve member:", error);
      setInternalError("Failed to approve member. Please try again.");
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
          background: "linear-gradient(135deg, #064e3b 0%, #059669 100%)",
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
          <IconShieldCheck size={26} stroke={2.5} />
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={900} sx={{ color: "#ffffff", letterSpacing: "-0.3px" }}>
            Approve Member Registration
          </Typography>
          <Typography variant="caption" sx={{ color: "#a7f3d0", fontWeight: 600 }}>
            Approve this member applicant to proceed to account activation &amp; onboarding completion
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
                borderLeft: "5px solid #059669",
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
                  <Typography sx={{ fontWeight: 900, color: "#065f46", fontFamily: "monospace", fontSize: "1rem" }}>
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

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
                    Registration Stage
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      size="small"
                      label={member.registration_stage?.replace(/_/g, " ")}
                      sx={{
                        fontWeight: 800,
                        fontSize: "0.72rem",
                        bgcolor: "#fef3c7",
                        color: "#d97706",
                        border: "1px solid #fde68a",
                      }}
                    />
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
                    Current Status
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      size="small"
                      label={member.status}
                      sx={{
                        fontWeight: 800,
                        fontSize: "0.72rem",
                        bgcolor: "#f1f5f9",
                        color: "#475569",
                        border: "1px solid #cbd5e1",
                      }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          )}

          {/* Remarks Field */}
          <Box>
            <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.8, color: "#1e293b" }}>
              Approval Governance Remarks / Notes
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={2.5}
              placeholder="e.g. KYC documents verified against registry. Approved for full onboarding."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              disabled={isLoading}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2.5,
                  bgcolor: "#f8fafc",
                  "& fieldset": { borderColor: "#cbd5e1" },
                  "&:hover fieldset": { borderColor: "#059669" },
                  "&.Mui-focused fieldset": { borderColor: "#059669", borderWidth: 2 },
                },
              }}
            />
          </Box>

          <Box
            sx={{
              p: 2,
              borderRadius: 2.5,
              bgcolor: "#f0fdf4",
              border: "1px solid #bbf7d0",
              display: "flex",
              alignItems: "flex-start",
              gap: 1.5,
            }}
          >
            <IconCircleCheck size={20} color="#059669" style={{ marginTop: 2, flexShrink: 0 }} />
            <Typography variant="body2" sx={{ color: "#065f46", fontWeight: 600, lineHeight: 1.5 }}>
              Approving this applicant marks their registration KYC as verified and advances them to the <strong>APPROVED</strong> stage.
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
          onClick={handleApprove}
          loading={isLoading}
          startIcon={<IconCheck size={18} />}
          sx={{
            bgcolor: "#059669",
            color: "#ffffff",
            fontWeight: 800,
            borderRadius: 2,
            px: 3.5,
            py: 1,
            boxShadow: "0 4px 14px rgba(5, 150, 105, 0.35)",
            "&:hover": { bgcolor: "#047857" },
          }}
        >
          Approve Member
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}