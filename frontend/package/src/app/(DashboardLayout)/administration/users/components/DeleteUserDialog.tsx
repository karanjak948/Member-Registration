"use client";

import { useState } from "react";
import axios from "axios";

import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";

import userService from "@/services/user.service";

import { DeleteUserDialogProps } from "@/types/user-components";

export default function DeleteUserDialog({
  open,
  user,
  onClose,
  onSuccess,
}: DeleteUserDialogProps) {
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  if (!user) {
    return null;
  }

  const actionLabel = user.is_active ? "Deactivate" : "Activate";

  const handleConfirm = async () => {
    try {
      setLoading(true);
      setError("");

      if (user.is_active) {
        await userService.deactivateUser(user.id);
      } else {
        await userService.activateUser(user.id);
      }

      await onSuccess();

      onClose();
    } catch (error: unknown) {
      console.error(error);

      if (axios.isAxiosError(error)) {
        const detail = error.response?.data?.detail;

        setError(detail ?? `Unable to ${actionLabel.toLowerCase()} user.`);
      } else {
        setError(`Unable to ${actionLabel.toLowerCase()} user.`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>{actionLabel} User</DialogTitle>

      <DialogContent>
        <Typography>
          {user.is_active
            ? `Are you sure you want to deactivate "${user.first_name} ${user.last_name}"?`
            : `Do you want to activate "${user.first_name} ${user.last_name}" again?`}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          {user.is_active
            ? "The user will no longer be able to access the system until reactivated."
            : "The user will regain access immediately."}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mt: 3 }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>

        <Button
          variant="contained"
          color={user.is_active ? "warning" : "success"}
          onClick={handleConfirm}
          disabled={loading}
        >
          {loading ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            actionLabel
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
