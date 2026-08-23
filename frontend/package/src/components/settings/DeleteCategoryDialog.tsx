"use client";

import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import categoryService from "@/services/category.service";
import { MemberCategory } from "@/interfaces/category";
import { IconAlertTriangle, IconTrash } from "@tabler/icons-react";

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
  const [error, setError] = useState("");

  async function handleDelete() {
    if (!category) return;

    try {
      setLoading(true);
      setError("");
      await categoryService.delete(category.id);
      await onDeleted();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.detail ||
          "Unable to delete this category. It may be currently assigned to active SACCO members."
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
      maxWidth="xs"
      PaperProps={{
        sx: { borderRadius: 3, overflow: "hidden" },
      }}
    >
      <Box sx={{ p: 3, bgcolor: "#fef2f2", borderBottom: "1px solid #fee2e2" }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ p: 1, bgcolor: "#dc2626", color: "#ffffff", borderRadius: 2, display: "flex" }}>
            <IconAlertTriangle size={24} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} color="#991b1b">
              Delete Member Category
            </Typography>
            <Typography variant="caption" color="#b91c1c">
              This action cannot be undone
            </Typography>
          </Box>
        </Stack>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Are you sure you want to permanently remove this membership category tier?
        </Typography>

        {category && (
          <Paper elevation={0} sx={{ p: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={800} color="#1e293b">
              {category.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Code: <strong>{category.code}</strong> (ID: #{category.id})
            </Typography>
          </Paper>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2, bgcolor: "#f8fafc" }}>
        <Button disabled={loading} onClick={onClose} sx={{ color: "text.secondary", fontWeight: 600, textTransform: "none" }}>
          Cancel
        </Button>

        <Button
          color="error"
          variant="contained"
          disabled={loading}
          onClick={handleDelete}
          startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <IconTrash size={18} />}
          sx={{ fontWeight: 700, px: 2.5, textTransform: "none", bgcolor: "#dc2626", "&:hover": { bgcolor: "#b91c1c" } }}
        >
          {loading ? "Deleting..." : "Delete Category"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}