"use client";

import {
  Alert,
  Box,
  Button,
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
  IconTrash,
  IconId,
  IconUser,
  IconPhone,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { Member } from "@/interfaces/member";

interface DeleteMemberDialogProps {
  open: boolean;
  member: Member | null;
  loading?: boolean;
  error?: string;
  onClose: () => void;
  onDelete: () => void | Promise<void>;
}

export default function DeleteMemberDialog({
  open,
  member,
  loading = false,
  error,
  onClose,
  onDelete,
}: DeleteMemberDialogProps) {
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
          background: "linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)",
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
          <IconTrash size={26} stroke={2.5} />
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={900} sx={{ color: "#ffffff", letterSpacing: "-0.3px" }}>
            Delete Member Account
          </Typography>
          <Typography variant="caption" sx={{ color: "#fecaca", fontWeight: 600 }}>
            Permanently remove member registration file from the SACCO database
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

          {member && (
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: "1px solid #e2e8f0",
                borderLeft: "5px solid #dc2626",
                bgcolor: "#f8fafc",
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Target Record Details
              </Typography>

              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600, display: "flex", alignItems: "center", gap: 0.5 }}>
                    <IconId size={14} /> Membership Number
                  </Typography>
                  <Typography sx={{ fontWeight: 900, color: "#b91c1c", fontFamily: "monospace", fontSize: "1rem" }}>
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
                    <IconPhone size={14} /> Phone Number
                  </Typography>
                  <Typography sx={{ fontWeight: 700, color: "#334155", fontFamily: "monospace" }}>
                    {member.phone_number}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          )}

          <Box
            sx={{
              p: 2,
              borderRadius: 2.5,
              bgcolor: "#fef2f2",
              border: "1px solid #fecaca",
              display: "flex",
              alignItems: "flex-start",
              gap: 1.5,
            }}
          >
            <IconAlertTriangle size={22} color="#dc2626" style={{ marginTop: 2, flexShrink: 0 }} />
            <Typography variant="body2" sx={{ color: "#991b1b", fontWeight: 600, lineHeight: 1.5 }}>
              Warning: This action is permanent and cannot be undone. All linked membership records will be purged.
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

        <LoadingButton
          variant="contained"
          onClick={onDelete}
          loading={loading}
          startIcon={<IconTrash size={18} />}
          sx={{
            bgcolor: "#dc2626",
            color: "#ffffff",
            fontWeight: 800,
            borderRadius: 2,
            px: 3.5,
            py: 1,
            boxShadow: "0 4px 14px rgba(220, 38, 38, 0.35)",
            "&:hover": { bgcolor: "#b91c1c" },
          }}
        >
          Delete Member
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}