"use client";

import { useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import {
  IconUserCheck,
  IconCircleCheck,
  IconAlertTriangle,
  IconUsers,
} from "@tabler/icons-react";
import { Member } from "@/interfaces/member";
import memberService from "@/services/member.service";

interface BulkActivateMembersDialogProps {
  open: boolean;
  selectedMembers: Member[];
  onClose: () => void;
  onSuccess: (count: number, skippedCount: number) => void;
}

export default function BulkActivateMembersDialog({
  open,
  selectedMembers,
  onClose,
  onSuccess,
}: BulkActivateMembersDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const eligibleMembers = selectedMembers.filter(
    (m) =>
      (m.registration_stage === "APPROVED" || m.registration_stage === "ACTIVE") &&
      m.status !== "ACTIVE",
  );

  const ineligibleMembers = selectedMembers.filter(
    (m) =>
      m.registration_stage !== "APPROVED" && m.registration_stage !== "ACTIVE",
  );

  const alreadyActiveMembers = selectedMembers.filter(
    (m) => m.status === "ACTIVE",
  );

  async function handleBulkActivate() {
    if (selectedMembers.length === 0) return;

    setLoading(true);
    setError("");

    try {
      const memberIds = selectedMembers.map((m) => m.id);
      const result = await memberService.bulkActivate(memberIds);

      const activatedCount = result.activated_count;
      const skippedCount = (result.skipped?.length || 0) + alreadyActiveMembers.length;

      onSuccess(activatedCount, skippedCount);
      onClose();
    } catch (err: any) {
      console.error("Bulk activation failed:", err);
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Failed to bulk activate selected members. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      fullWidth
      maxWidth="sm"
      onClose={loading ? undefined : onClose}
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
          <IconUserCheck size={26} stroke={2.5} />
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={900} sx={{ color: "#ffffff", letterSpacing: "-0.3px" }}>
            Bulk Activate Members
          </Typography>
          <Typography variant="caption" sx={{ color: "#a7f3d0", fontWeight: 600 }}>
            Activate accounts for multiple selected members simultaneously
          </Typography>
        </Box>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        <Stack spacing={2.5}>
          {error && (
            <Alert severity="error" sx={{ borderRadius: 2.5, fontWeight: 700 }}>
              {error}
            </Alert>
          )}

          {/* Selection Overview Summary Card */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: "1px solid #e2e8f0",
              bgcolor: "#f8fafc",
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: 2,
                    bgcolor: "#ecfdf5",
                    color: "#059669",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconUsers size={20} />
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight={800} color="#0f172a">
                    {selectedMembers.length} Members Selected
                  </Typography>
                  <Typography variant="caption" color="#64748b" fontWeight={600}>
                    {eligibleMembers.length} ready for activation
                  </Typography>
                </Box>
              </Stack>

              <Chip
                label={`${eligibleMembers.length} to Activate`}
                color="success"
                size="small"
                sx={{ fontWeight: 800, borderRadius: 2 }}
              />
            </Stack>

            {/* List Preview */}
            <Divider sx={{ my: 2 }} />
            <Typography variant="caption" sx={{ fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Selected Members Preview
            </Typography>

            <Box
              sx={{
                maxHeight: 180,
                overflowY: "auto",
                mt: 1,
                pr: 0.5,
                display: "flex",
                flexDirection: "column",
                gap: 1,
              }}
            >
              {selectedMembers.map((member) => {
                const isReady =
                  (member.registration_stage === "APPROVED" ||
                    member.registration_stage === "ACTIVE") &&
                  member.status !== "ACTIVE";
                const isAlreadyActive = member.status === "ACTIVE";

                return (
                  <Box
                    key={member.id}
                    sx={{
                      p: 1.2,
                      borderRadius: 2,
                      bgcolor: "#ffffff",
                      border: "1px solid #e2e8f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Stack direction="row" spacing={1.2} alignItems="center" sx={{ minWidth: 0 }}>
                      <Avatar
                        sx={{
                          width: 28,
                          height: 28,
                          fontSize: "0.75rem",
                          fontWeight: 800,
                          bgcolor: "#064e3b",
                        }}
                      >
                        {member.first_name?.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={700} color="#0f172a" noWrap>
                          {member.first_name} {member.other_names}
                        </Typography>
                        <Typography variant="caption" color="#64748b" fontFamily="monospace">
                          {member.membership_number || "Pending ID"}
                        </Typography>
                      </Box>
                    </Stack>

                    <Chip
                      size="small"
                      label={
                        isReady
                          ? "Ready"
                          : isAlreadyActive
                            ? "Already Active"
                            : "Pending Approval"
                      }
                      sx={{
                        fontWeight: 800,
                        fontSize: "0.7rem",
                        bgcolor: isReady ? "#ecfdf5" : isAlreadyActive ? "#f1f5f9" : "#fffbeb",
                        color: isReady ? "#059669" : isAlreadyActive ? "#64748b" : "#b45309",
                        border: `1px solid ${
                          isReady ? "#a7f3d0" : isAlreadyActive ? "#cbd5e1" : "#fde68a"
                        }`,
                        borderRadius: 1.5,
                      }}
                    />
                  </Box>
                );
              })}
            </Box>
          </Paper>

          {/* Warnings for Ineligible Members */}
          {ineligibleMembers.length > 0 && (
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
              <Typography variant="caption" sx={{ color: "#92400e", fontWeight: 600, lineHeight: 1.5 }}>
                <strong>{ineligibleMembers.length}</strong> selected member(s) are still in data capture or pending approval stage and will be automatically skipped during activation.
              </Typography>
            </Box>
          )}

          {/* Confirmation Info Box */}
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
              Proceeding will set the status of eligible members to <strong>ACTIVE</strong>, enable full operational services, and write audit trail records for each member.
            </Typography>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2.5, bgcolor: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
        <Button
          variant="outlined"
          onClick={onClose}
          disabled={loading}
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

        <Button
          variant="contained"
          onClick={handleBulkActivate}
          loading={loading}
          disabled={eligibleMembers.length === 0 && alreadyActiveMembers.length === 0}
          startIcon={<IconUserCheck size={18} />}
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
          Activate {eligibleMembers.length} {eligibleMembers.length === 1 ? "Member" : "Members"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
