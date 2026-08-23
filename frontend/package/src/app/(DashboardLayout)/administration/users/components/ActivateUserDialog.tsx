"use client";

import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { OrganizationUser } from "@/types/user";
import {
  IconUserOff,
  IconUserCheck,
  IconAlertTriangle,
  IconShieldCheck,
  IconMail,
  IconAt,
} from "@tabler/icons-react";

interface ActivateUserDialogProps {
  open: boolean;
  user: OrganizationUser | null;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ActivateUserDialog({
  open,
  user,
  loading = false,
  onClose,
  onConfirm,
}: ActivateUserDialogProps) {
  if (!user) return null;

  const isActivating = !user.is_active;
  const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username;

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: "hidden",
        },
      }}
    >
      {/* Executive Header */}
      <DialogTitle
        sx={{
          p: 2.5,
          background: isActivating
            ? "linear-gradient(135deg, #065f46 0%, #059669 100%)"
            : "linear-gradient(135deg, #9a3412 0%, #ea580c 100%)",
          color: "#ffffff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              bgcolor: "rgba(255, 255, 255, 0.2)",
              display: "flex",
            }}
          >
            {isActivating ? <IconUserCheck size={24} /> : <IconUserOff size={24} />}
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ color: "#ffffff", letterSpacing: "-0.3px" }}>
              {isActivating ? "Reactivate Staff Account" : "Deactivate Staff Account"}
            </Typography>
            <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.85)" }}>
              {isActivating
                ? "Restore login authorization and application privileges"
                : "Temporarily revoke login authorization for this account"}
            </Typography>
          </Box>
        </Stack>

        {!loading && (
          <IconButton size="small" onClick={onClose} sx={{ color: "#ffffff" }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Stack spacing={2.5}>
          {/* User Preview Card */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 2.5,
              bgcolor: "#f8fafc",
              border: "1px solid #e2e8f0",
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                sx={{
                  width: 52,
                  height: 52,
                  bgcolor: isActivating ? "success.main" : "warning.main",
                  fontWeight: 800,
                  fontSize: "1.2rem",
                }}
              >
                {(user.first_name || user.username).charAt(0).toUpperCase()}
              </Avatar>

              <Box flex={1}>
                <Typography variant="subtitle1" fontWeight={800}>
                  {fullName}
                </Typography>

                <Stack direction="row" spacing={1.5} alignItems="center" mt={0.3} flexWrap="wrap">
                  <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <IconAt size={14} /> @{user.username}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <IconMail size={14} /> {user.email}
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={1} mt={1}>
                  <Chip
                    label={user.role?.name || "Staff"}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 700, fontSize: "0.72rem" }}
                  />
                  <Chip
                    label={user.is_active ? "Currently Active" : "Currently Inactive"}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.72rem",
                      bgcolor: user.is_active ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                      color: user.is_active ? "#059669" : "#dc2626",
                    }}
                  />
                </Stack>
              </Box>
            </Stack>
          </Paper>

          {/* Security Impact Notice */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: isActivating ? "rgba(16, 185, 129, 0.08)" : "rgba(245, 158, 11, 0.08)",
              border: `1px solid ${isActivating ? "rgba(16, 185, 129, 0.3)" : "rgba(245, 158, 11, 0.3)"}`,
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              <Box sx={{ color: isActivating ? "#059669" : "#d97706", mt: 0.2 }}>
                {isActivating ? <IconShieldCheck size={22} /> : <IconAlertTriangle size={22} />}
              </Box>
              <Box>
                <Typography variant="body2" fontWeight={700} color={isActivating ? "#065f46" : "#92400e"}>
                  {isActivating ? "Account Reactivation Notice" : "Security Deactivation Impact"}
                </Typography>
                <Typography variant="caption" color={isActivating ? "#047857" : "#b45309"} sx={{ display: "block", mt: 0.3, lineHeight: 1.5 }}>
                  {isActivating
                    ? "Upon confirmation, this user will immediately be able to authenticate and access organizational workflows based on their assigned role."
                    : "This user will immediately be locked out of active sessions and will not be able to log in until an administrator reactivates their account."}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2.5, gap: 1.5 }}>
        <Button
          variant="outlined"
          onClick={onClose}
          disabled={loading}
          sx={{ px: 3, fontWeight: 600, textTransform: "none" }}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={onConfirm}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={18} color="inherit" /> : undefined}
          sx={{
            px: 3.5,
            fontWeight: 700,
            textTransform: "none",
            bgcolor: isActivating ? "#059669" : "#ea580c",
            "&:hover": {
              bgcolor: isActivating ? "#047857" : "#c2410c",
            },
          }}
        >
          {loading ? "Updating..." : isActivating ? "Confirm Reactivate" : "Confirm Deactivate"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}