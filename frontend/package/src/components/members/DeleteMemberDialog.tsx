"use client";

import { useState } from "react";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";

import memberService from "@/services/member.service";

import { Member } from "@/interfaces/member";

interface DeleteMemberDialogProps {
  open: boolean;

  member: Member | null;

  onClose: () => void;

  onDeleted: () => void | Promise<void>;
}

export default function DeleteMemberDialog({
  open,
  member,
  onClose,
  onDeleted,
}: DeleteMemberDialogProps) {

  const [loading, setLoading] =
    useState(false);

  const handleDelete = async () => {

    if (!member) return;

    try {

      setLoading(true);

      await memberService.delete(member.id);

      await onDeleted();

      onClose();

    } finally {

      setLoading(false);

    }

  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        Delete Member
      </DialogTitle>

      <DialogContent>

        <DialogContentText>

          Are you sure you want to permanently delete this member?

        </DialogContentText>

        {member && (

          <>
            <br />

            <strong>

              {member.membership_number}

            </strong>

            <br />

            {member.first_name} {member.other_names}

          </>

        )}

      </DialogContent>

      <DialogActions>

        <Button
          disabled={loading}
          onClick={onClose}
        >
          Cancel
        </Button>

        <Button
          color="error"
          variant="contained"
          disabled={loading}
          onClick={handleDelete}
        >
          {loading ? "Deleting..." : "Delete"}
        </Button>

      </DialogActions>
    </Dialog>
  );
}