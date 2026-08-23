"use client";

import { useEffect, useState } from "react";
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
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import categoryService from "@/services/category.service";
import { MemberCategory } from "@/interfaces/category";
import {
  IconFolders,
  IconTag,
  IconFileText,
  IconDeviceFloppy,
  IconX,
} from "@tabler/icons-react";

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

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "code" ? value.toUpperCase() : value,
    }));
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setError("Category Name is required.");
      return;
    }

    if (!form.code.trim()) {
      setError("Category Code is required (e.g. NORMAL, SPECIAL, VIP).");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (category) {
        await categoryService.update(category.id, {
          name: form.name.trim(),
          code: form.code.trim().toUpperCase(),
          description: form.description.trim(),
        });
      } else {
        await categoryService.create({
          name: form.name.trim(),
          code: form.code.trim().toUpperCase(),
          description: form.description.trim(),
        });
      }

      await onSaved();
      onClose();
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.name?.[0] ||
          err?.response?.data?.code?.[0] ||
          "Unable to save member category."
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
      PaperProps={{
        sx: { borderRadius: 3, overflow: "hidden" },
      }}
    >
      {/* Header Banner */}
      <Box
        sx={{
          p: 3,
          background: "linear-gradient(135deg, #064e3b 0%, #047857 100%)",
          color: "#ffffff",
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{ p: 1, bgcolor: "rgba(255,255,255,0.18)", borderRadius: 2, display: "flex" }}>
              <IconFolders size={24} color="#6ee7b7" />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={800} color="#ffffff">
                {category ? "Edit Member Category" : "Create New Member Category"}
              </Typography>
              <Typography variant="caption" sx={{ color: "#a7f3d0" }}>
                {category
                  ? `Update classification rules for #${category.id}`
                  : "Define a new membership tier and acronym code"}
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </Box>

      <DialogContent sx={{ p: 3.5 }}>
        <Stack spacing={3} mt={1}>
          {error && (
            <Alert severity="error" sx={{ mb: 1 }}>
              {error}
            </Alert>
          )}

          <TextField
            label="Category Name"
            name="name"
            placeholder="e.g. Executive Member"
            fullWidth
            required
            value={form.name}
            onChange={handleChange}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <IconFolders size={18} style={{ color: "#064e3b" }} />
                  </InputAdornment>
                ),
              },
            }}
          />

          <TextField
            label="Category Code"
            name="code"
            placeholder="e.g. EXEC"
            fullWidth
            required
            value={form.code}
            onChange={handleChange}
            helperText="Short uppercase acronym identifier used in reporting and policies"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <IconTag size={18} style={{ color: "#064e3b" }} />
                  </InputAdornment>
                ),
              },
            }}
          />

          <TextField
            label="Description & Tier Rules"
            name="description"
            placeholder="Describe eligibility, loan multipliers, or special requirements for this tier..."
            fullWidth
            multiline
            minRows={3}
            value={form.description}
            onChange={handleChange}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start" sx={{ alignSelf: "flex-start", mt: 1.5 }}>
                    <IconFileText size={18} style={{ color: "#94a3b8" }} />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3.5, py: 2.5, bgcolor: "#f8fafc" }}>
        <Button
          disabled={loading}
          onClick={onClose}
          sx={{ color: "text.secondary", fontWeight: 600, textTransform: "none" }}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          disabled={loading}
          onClick={handleSave}
          startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <IconDeviceFloppy size={18} />}
          sx={{
            bgcolor: "#064e3b",
            color: "#ffffff",
            fontWeight: 700,
            px: 3,
            textTransform: "none",
            "&:hover": { bgcolor: "#047857" },
          }}
        >
          {loading ? "Saving..." : category ? "Update Category" : "Save Category"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}