"use client";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from "@mui/material";

import { OrganizationUser } from "@/types/user";

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

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        {isActivating ? "Activate User" : "Deactivate User"}
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ py: 3 }}>
        <Alert
          severity={isActivating ? "success" : "warning"}
          sx={{ mb: 3 }}
        >
          {isActivating
            ? "This user will regain access to the system."
            : "This user will no longer be able to sign in until their account is reactivated."}
        </Alert>

        <Stack spacing={2}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Full Name
            </Typography>

            <Typography fontWeight={600}>
              {`${user.first_name} ${user.last_name}`.trim()}
            </Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary">
              Username
            </Typography>

            <Typography>{user.username}</Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary">
              Email
            </Typography>

            <Typography>{user.email}</Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary">
              Role
            </Typography>

            <Typography>{user.role.name}</Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary">
              Current Status
            </Typography>

            <Box sx={{ mt: 1 }}>
              <Chip
                size="small"
                color={user.is_active ? "success" : "default"}
                label={user.is_active ? "Active" : "Inactive"}
              />
            </Box>
          </Box>
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2 }}>
        <Button
          variant="outlined"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          color={isActivating ? "success" : "warning"}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? (
            <CircularProgress size={20} color="inherit" />
          ) : isActivating ? (
            "Activate"
          ) : (
            "Deactivate"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}