"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Divider,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";

import { UserDialogProps } from "@/types/user-components";

import UserForm from "./UserForm";

export default function UserDialog({
  open,
  mode,
  user,
  onClose,
  onSuccess,
}: UserDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      {/* ----------------------------------------- */}
      {/* HEADER */}
      {/* ----------------------------------------- */}

      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          py: 2,
        }}
      >
        {mode === "create" ? "Create User" : "Edit User"}
        <IconButton size="small" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      {/* ----------------------------------------- */}
      {/* CONTENT */}
      {/* ----------------------------------------- */}

      <DialogContent sx={{ py: 3 }}>
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
