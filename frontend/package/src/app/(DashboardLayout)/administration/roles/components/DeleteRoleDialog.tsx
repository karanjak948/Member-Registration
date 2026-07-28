"use client";

import LoadingButton from "@mui/lab/LoadingButton";

import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";

import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

import { Role } from "@/types/role";

interface DeleteRoleDialogProps {
  open: boolean;
  role: Role | null;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export default function DeleteRoleDialog({
  open,
  role,
  loading = false,
  onClose,
  onConfirm,
}: DeleteRoleDialogProps) {
  if (!role) return null;

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        Delete Role
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3}>
          <DialogContentText>
            You are about to permanently delete the following role.
          </DialogContentText>

          <Alert
            severity="warning"
            icon={<WarningAmberRoundedIcon />}
          >
            This action cannot be undone.
          </Alert>

          <Stack spacing={1}>
            <Typography
              variant="caption"
              color="text.secondary"
            >
              Role Name
            </Typography>

            <Typography
              variant="h6"
              fontWeight={700}
            >
              {role.name}
            </Typography>
          </Stack>

          <Stack spacing={1}>
            <Typography
              variant="caption"
              color="text.secondary"
            >
              Description
            </Typography>

            <Typography>
              {role.description || "No description provided."}
            </Typography>
          </Stack>

          <Stack spacing={1}>
            <Typography
              variant="caption"
              color="text.secondary"
            >
              Permissions
            </Typography>

            <Typography>
              {role.permissions.length} assigned permission
              {role.permissions.length === 1 ? "" : "s"}
            </Typography>
          </Stack>

          {role.is_system_role && (
            <Alert severity="error">
              System roles are protected and cannot be deleted.
            </Alert>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </Button>

        <LoadingButton
          color="error"
          variant="contained"
          loading={loading}
          onClick={onConfirm}
          disabled={role.is_system_role}
        >
          Delete Role
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}