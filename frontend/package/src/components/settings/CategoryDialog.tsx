"use client";

import { useEffect, useState } from "react";

import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";

import categoryService from "@/services/category.service";
import { MemberCategory } from "@/interfaces/category";

interface CategoryDialogProps {
  open: boolean;

  category: MemberCategory | null;

  onClose: () => void;

  onSaved: () => void | Promise<void>;
}

export default function CategoryDialog({
  open,
  category,
  onClose,
  onSaved,
}: CategoryDialogProps) {
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
  });

  useEffect(() => {
    if (category) {
      setForm({
        name: category.name,
        code: category.code,
        description: category.description ?? "",
      });
    } else {
      setForm({
        name: "",
        code: "",
        description: "",
      });
    }

    setError("");
  }, [category, open]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setError("Category name is required.");
      return;
    }

    if (!form.code.trim()) {
      setError("Category code is required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (category) {
        await categoryService.update(
          category.id,
          form
        );
      } else {
        await categoryService.create(form);
      }

      await onSaved();
      onClose();
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ??
          "Unable to save category."
      );
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
        {category
          ? "Edit Member Category"
          : "Create Member Category"}
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} mt={1}>
          <TextField
            label="Category Name"
            name="name"
            fullWidth
            required
            value={form.name}
            onChange={handleChange}
          />

          <TextField
            label="Category Code"
            name="code"
            fullWidth
            required
            value={form.code}
            onChange={handleChange}
          />

          <TextField
            label="Description"
            name="description"
            fullWidth
            multiline
            minRows={3}
            value={form.description}
            onChange={handleChange}
          />

          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button
          disabled={loading}
          onClick={onClose}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          disabled={loading}
          onClick={handleSave}
        >
          {loading ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}