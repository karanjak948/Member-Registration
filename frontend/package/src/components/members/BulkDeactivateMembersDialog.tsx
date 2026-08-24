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
  TextField,
  Typography,
} from "@mui/material";
import {
  IconUserX,
  IconAlertTriangle,
  IconUsers,
} from "@tabler/icons-react";
import { Member } from "@/interfaces/member";
import memberService from "@/services/member.service";

interface BulkDeactivateMembersDialogProps {
  open: boolean;
  selectedMembers: Member[];
  onClose: () => void;
  onSuccess: (count: number) => void;
}

export default function BulkDeactivateMembersDialog({
  open,
  selectedMembers,
  onClose,
  onSuccess,
}: BulkDeactivateMembersDialogProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const activeMembers = selectedMembers.filter((m) => m.status === "ACTIVE");

  function handleClose() {
    setReason("");
    setError("");
    onClose();
  }

  async function handleBulkDeactivate() {
    if (selectedMembers.length === 0) return;

    setLoading(true);
    setError("");

    try {
      const memberIds = selectedMembers.map((m) => m.id);
      const deactivationReason = reason.trim() || "Bulk deactivation by administrator";
      const result = await memberService.bulkDeactivate(memberIds, deactivationReason);

      onSuccess(result.deactivated_count);
      handleClose();
    } catch (err: any) {
      console.error("Bulk deactivation failed:", err);
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Failed to bulk deactivate selected members. Please try again.",
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
      onClose={loading ? undefined : handleClose}
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
          background: "linear-gradient(135deg, #78350f 0%, #b45309 50%, #d97706 100%)",
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
            Bulk Deactivate Member Accounts
          </Typography>
          <Typography variant="caption" sx={{ color: "#fef3c7", fontWeight: 600 }}>
            Temporarily suspend operational services for selected members
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

          {/* Overview Card */}
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
                    bgcolor: "#fffbeb",
                    color: "#d97706",
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
                    {activeMembers.length} currently Active
                  </Typography>
                </Box>
              </Stack>

              <Chip
                label={`${activeMembers.length} Active`}
                color="warning"
                size="small"
                sx={{ fontWeight: 800, borderRadius: 2 }}
              />
            </Stack>

            {/* List Preview */}
            <Divider sx={{ my: 2 }} />
            <Typography variant="caption" sx={{ fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Impacted Members Preview
            </Typography>

            <Box
              sx={{
                maxHeight: 160,
                overflowY: "auto",
                mt: 1,
                pr: 0.5,
                display: "flex",
                flexDirection: "column",
                gap: 1,
              }}
            >
              {selectedMembers.map((member) => (
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
                        bgcolor: "#78350f",
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
                    label={member.status}
                    sx={{
                      fontWeight: 800,
                      fontSize: "0.7rem",
                      bgcolor: member.status === "ACTIVE" ? "#ecfdf5" : "#fffbeb",
                      color: member.status === "ACTIVE" ? "#059669" : "#b45309",
                      border: `1px solid ${
                        member.status === "ACTIVE" ? "#a7f3d0" : "#fde68a"
                      }`,
                      borderRadius: 1.5,
                    }}
                  />
                </Box>
              ))}
            </Box>
          </Paper>

          {/* Reason Input Field */}
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 800, color: "#334155", display: "block", mb: 0.75 }}>
              Deactivation Reason <span style={{ color: "#64748b", fontWeight: 500 }}>(Optional)</span>
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Provide a specific rationale for this bulk deactivation (e.g. Annual audit review, prolonged inactivity, membership policy compliance)..."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError("");
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2.5,
                  bgcolor: "#ffffff",
                  "&:hover fieldset": { borderColor: "#b45309" },
                  "&.Mui-focused fieldset": { borderColor: "#d97706" },
                },
              }}
            />
          </Box>

          {/* Impact Warning Notice */}
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
              Deactivating these members will change their status to <strong>INACTIVE</strong>, immediately pausing active loan disbursements, ATM/Portal withdrawals, and new credit applications. Members can be reactivated individually or in bulk at any time.
            </Typography>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2.5, bgcolor: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
        <Button
          variant="outlined"
          onClick={handleClose}
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
          onClick={handleBulkDeactivate}
          loading={loading}
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
          Deactivate {selectedMembers.length} {selectedMembers.length === 1 ? "Member" : "Members"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
