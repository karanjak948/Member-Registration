"use client";

import { useState } from "react";
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
  Typography,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import {
  IconRefresh,
  IconId,
  IconUser,
  IconPhone,
  IconCategory,
  IconCircleCheck,
  IconCheck,
} from "@tabler/icons-react";
import { Member } from "@/interfaces/member";
import useMemberWorkflow from "@/components/members/hooks/useMemberWorkflow";

interface CompleteRegistrationDialogProps {
  open: boolean;
  member: Member | null;
  loading?: boolean;
  error?: string;
  onClose: () => void;
  onSuccess?: () => void;
  onCompleteRegistration?: () => void | Promise<void>;
}

export default function CompleteRegistrationDialog({
  open,
  member,
  loading: externalLoading = false,
  error: externalError,
  onClose,
  onSuccess,
  onCompleteRegistration,
}: CompleteRegistrationDialogProps) {
  const [internalError, setInternalError] = useState("");
  const workflow = useMemberWorkflow();

  async function handleCompleteRegistration() {
    if (!member) return;

    try {
      setInternalError("");
      if (onCompleteRegistration) {
        await onCompleteRegistration();
      } else {
        await workflow.completeRegistration(member.id);
      }
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error) {
      console.error("Failed to complete registration:", error);
      setInternalError("Failed to complete registration. Please try again.");
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
          background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
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
          <IconRefresh size={26} stroke={2.5} />
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={900} sx={{ color: "#ffffff", letterSpacing: "-0.3px" }}>
            Complete Member Registration
          </Typography>
          <Typography variant="caption" sx={{ color: "#bfdbfe", fontWeight: 600 }}>
            Finalize onboarding workflow and transition approved applicant to active status
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
                borderLeft: "5px solid #2563eb",
                bgcolor: "#f8fafc",
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Member Overview
              </Typography>

              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600, display: "flex", alignItems: "center", gap: 0.5 }}>
                    <IconId size={14} /> Membership Number
                  </Typography>
                  <Typography sx={{ fontWeight: 900, color: "#1d4ed8", fontFamily: "monospace", fontSize: "1rem" }}>
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
                    {member.category_name || "Special Member"}
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
                        bgcolor: "#eff6ff",
                        color: "#2563eb",
                        border: "1px solid #bfdbfe",
                      }}
                    />
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
                    Account Status
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      size="small"
                      label={member.status}
                      sx={{
                        fontWeight: 800,
                        fontSize: "0.72rem",
                        bgcolor: member.status === "ACTIVE" ? "#ecfdf5" : "#fffbeb",
                        color: member.status === "ACTIVE" ? "#059669" : "#d97706",
                        border: `1px solid ${member.status === "ACTIVE" ? "#a7f3d0" : "#fde68a"}`,
                      }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          )}

          <Box
            sx={{
              p: 2,
              borderRadius: 2.5,
              bgcolor: "#eff6ff",
              border: "1px solid #bfdbfe",
              display: "flex",
              alignItems: "flex-start",
              gap: 1.5,
            }}
          >
            <IconCircleCheck size={20} color="#2563eb" style={{ marginTop: 2, flexShrink: 0 }} />
            <Typography variant="body2" sx={{ color: "#1e3a8a", fontWeight: 600, lineHeight: 1.5 }}>
              Completing registration will finalize this applicant&apos;s registration file and promote them to the <strong>ACTIVE</strong> membership stage, making them fully operational.
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
          onClick={handleCompleteRegistration}
          loading={isLoading}
          startIcon={<IconCheck size={18} />}
          sx={{
            bgcolor: "#2563eb",
            color: "#ffffff",
            fontWeight: 800,
            borderRadius: 2,
            px: 3.5,
            py: 1,
            boxShadow: "0 4px 14px rgba(37, 99, 235, 0.35)",
            "&:hover": { bgcolor: "#1d4ed8" },
          }}
        >
          Complete Registration
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}