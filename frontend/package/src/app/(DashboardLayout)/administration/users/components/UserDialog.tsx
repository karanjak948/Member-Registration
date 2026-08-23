"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Divider,
  Stack,
  Box,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { UserDialogProps } from "@/types/user-components";
import UserForm from "./UserForm";
import { IconUserEdit, IconUserPlus } from "@tabler/icons-react";

export default function UserDialog({
  open,
  mode,
  user,
  onClose,
  onSuccess,
}: UserDialogProps) {
  const isEdit = mode === "edit";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: "hidden",
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          p: 2.5,
          bgcolor: isEdit ? "#f8fafc" : "#ffffff",
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
              bgcolor: isEdit ? "rgba(37, 99, 235, 0.1)" : "rgba(16, 185, 129, 0.1)",
              color: isEdit ? "primary.main" : "success.main",
              display: "flex",
            }}
          >
            {isEdit ? <IconUserEdit size={24} /> : <IconUserPlus size={24} />}
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} color="text.primary">
              {isEdit ? "Edit User Account" : "Create New User Account"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {isEdit
                ? "Update user profile details, email address, and assigned authorization role"
                : "Register a new staff account and assign organizational permissions"}
            </Typography>
          </Box>
        </Stack>

        <IconButton size="small" onClick={onClose} sx={{ color: "text.secondary" }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <Divider />

      {/* Form Content */}
      <DialogContent sx={{ p: 3 }}>
        <UserForm
          mode={mode}
          user={user}
          onCancel={onClose}
          onSuccess={onSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}
