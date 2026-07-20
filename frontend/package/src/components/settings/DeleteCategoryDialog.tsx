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

import categoryService from "@/services/category.service";
import { MemberCategory } from "@/interfaces/category";

interface DeleteCategoryDialogProps {
  open: boolean;

  category: MemberCategory | null;

  onClose: () => void;

  onDeleted: () => void | Promise<void>;
}

export default function DeleteCategoryDialog({
  open,
  category,
  onClose,
  onDeleted,
}: DeleteCategoryDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!category) return;

    try {
      setLoading(true);

      await categoryService.delete(category.id);

      await onDeleted();

      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        Delete Member Category
      </DialogTitle>

      <DialogContent>
        <DialogContentText>
          Are you sure you want to permanently delete this
          category?
        </DialogContentText>

        {category && (
          <>
            <br />

            <strong>{category.name}</strong>

            <br />

            Code: {category.code}
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