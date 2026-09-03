"use client";

import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import LoadingButton from "@mui/lab/LoadingButton";
import CloseIcon from "@mui/icons-material/Close";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { OrganizationUser } from "@/types/user";
import userService from "@/services/user.service";
import { IconKey, IconLock } from "@tabler/icons-react";

interface ResetPasswordDialogProps {
  open: boolean;
  user: OrganizationUser | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ResetPasswordDialog({
  open,
  user,
  onClose,
  onSuccess,
}: ResetPasswordDialogProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newPassword || newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!user?.id) return;

    try {
      setLoading(true);
      await userService.updateUser(user.id, { password: newPassword });
      setNewPassword("");
      setConfirmPassword("");
      onSuccess();
    } catch (err: any) {
      console.error(err);
      const errMsg =
        err?.response?.data?.password?.[0] ||
        err?.response?.data?.password ||
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Failed to reset password.";
      setError(typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: { borderRadius: 3, overflow: "hidden" },
      }}
    >
      <DialogTitle
        sx={{
          p: 2.5,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          bgcolor: "#f8fafc",
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              bgcolor: "rgba(245, 158, 11, 0.12)",
              color: "#d97706",
              display: "flex",
            }}
          >
            <IconKey size={24} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} color="text.primary">
              Reset User Password
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Update credentials for @{user?.username} ({user?.first_name} {user?.last_name})
            </Typography>
          </Box>
        </Stack>

        {!loading && (
          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </DialogTitle>

      <Divider />

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={2.5}>
            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              fullWidth
              type={showPassword ? "text" : "password"}
              label="New Password"
              placeholder="Enter new strong password..."
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={loading}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconLock size={18} style={{ color: "#94a3b8" }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <TextField
              fullWidth
              type={showPassword ? "text" : "password"}
              label="Confirm New Password"
              placeholder="Re-enter new password..."
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconLock size={18} style={{ color: "#94a3b8" }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Stack>
        </DialogContent>

        <Divider />

        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button variant="outlined" onClick={onClose} disabled={loading} sx={{ textTransform: "none", fontWeight: 700 }}>
            Cancel
          </Button>
          <LoadingButton
            type="submit"
            loading={loading}
            variant="contained"
            color="warning"
            sx={{ textTransform: "none", fontWeight: 800, px: 3 }}
          >
            Reset Password
          </LoadingButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}
