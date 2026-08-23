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
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import { FieldConfiguration } from "@/interfaces/fieldConfiguration";
import fieldConfigurationService from "@/services/fieldConfiguration.service";
import { IconAlertTriangle, IconTrash } from "@tabler/icons-react";

interface DeleteFieldConfigurationDialogProps {
  open: boolean;
  fieldConfig: FieldConfiguration | null;
  onClose: () => void;
  onDeleted: () => void | Promise<void>;
}

export default function DeleteFieldConfigurationDialog({
  open,
  fieldConfig,
  onClose,
  onDeleted,
}: DeleteFieldConfigurationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    if (!fieldConfig) return;

    try {
      setLoading(true);
      setError("");
      await fieldConfigurationService.delete(fieldConfig.id);
      await onDeleted();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.detail ||
          "Unable to delete this field configuration rule."
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
              Delete Field Rule
            </Typography>
            <Typography variant="caption" color="#b91c1c">
              Remove validation requirement policy
            </Typography>
          </Box>
        </Stack>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Are you sure you want to permanently delete this registration field rule?
        </Typography>

        {fieldConfig && (
          <Paper elevation={0} sx={{ p: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={800} color="#1e293b">
              {fieldConfig.display_name}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Identifier: <code>{fieldConfig.field_name}</code>
            </Typography>
            <Typography variant="caption" color="#047857" fontWeight={700} display="block">
              Category: {fieldConfig.category_name || `Category #${fieldConfig.category}`}
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
          {loading ? "Deleting..." : "Delete Rule"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
