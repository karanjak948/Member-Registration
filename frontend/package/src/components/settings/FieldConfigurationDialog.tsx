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
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

import { FieldConfiguration } from "@/interfaces/fieldConfiguration";
import { MemberCategory } from "@/interfaces/category";
import fieldConfigurationService from "@/services/fieldConfiguration.service";
import {
  IconAdjustmentsHorizontal,
  IconDeviceFloppy,
  IconFolders,
  IconTag,
  IconSortAscending,
} from "@tabler/icons-react";

interface FieldConfigurationDialogProps {
  open: boolean;
  fieldConfig: FieldConfiguration | null;
  categories: MemberCategory[];
  defaultCategoryId?: number;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}

const COMMON_SUGGESTED_FIELDS = [
  { field_name: "national_id", display_name: "National ID / Passport Number" },
  { field_name: "kra_pin", display_name: "KRA PIN Number" },
  { field_name: "passport_photo", display_name: "Member Passport Photo" },
  { field_name: "id_front_image", display_name: "National ID Front Scan" },
  { field_name: "id_back_image", display_name: "National ID Back Scan" },
  { field_name: "date_of_birth", display_name: "Date of Birth" },
  { field_name: "gender", display_name: "Gender / Sex" },
  { field_name: "marital_status", display_name: "Marital Status" },
  { field_name: "occupation", display_name: "Occupation / Profession" },
  { field_name: "monthly_income", display_name: "Monthly Net Income (KES)" },
  { field_name: "employer_name", display_name: "Employer / Business Name" },
  { field_name: "physical_address", display_name: "Residential Physical Address" },
  { field_name: "county", display_name: "County of Residence" },
  { field_name: "sub_county", display_name: "Sub-County / Area" },
  { field_name: "postal_address", display_name: "Postal Address & Code" },
  { field_name: "next_of_kin_name", display_name: "Next of Kin Full Name" },
  { field_name: "next_of_kin_phone", display_name: "Next of Kin Phone Number" },
  { field_name: "next_of_kin_relation", display_name: "Next of Kin Relationship" },
  { field_name: "bank_account_number", display_name: "Bank Account Number" },
  { field_name: "bank_name", display_name: "Bank Name & Branch" },
];

export default function FieldConfigurationDialog({
  open,
  fieldConfig,
  categories,
  defaultCategoryId,
  onClose,
  onSaved,
}: FieldConfigurationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<{
    category: number | "";
    field_name: string;
    display_name: string;
    is_visible: boolean;
    is_required: boolean;
    is_enabled: boolean;
    display_order: number;
  }>({
    category: defaultCategoryId || (categories[0]?.id ?? ""),
    field_name: "",
    display_name: "",
    is_visible: true,
    is_required: false,
    is_enabled: true,
    display_order: 0,
  });

  useEffect(() => {
    if (fieldConfig) {
      setForm({
        category: fieldConfig.category,
        field_name: fieldConfig.field_name,
        display_name: fieldConfig.display_name,
        is_visible: fieldConfig.is_visible,
        is_required: fieldConfig.is_required,
        is_enabled: fieldConfig.is_enabled,
        display_order: fieldConfig.display_order,
      });
    } else {
      setForm({
        category: defaultCategoryId || (categories[0]?.id ?? ""),
        field_name: "",
        display_name: "",
        is_visible: true,
        is_required: false,
        is_enabled: true,
        display_order: 0,
      });
    }
    setError("");
  }, [fieldConfig, categories, defaultCategoryId, open]);

  function handleSelectSuggestion(suggestion: { field_name: string; display_name: string }) {
    setForm((prev) => ({
      ...prev,
      field_name: suggestion.field_name,
      display_name: suggestion.display_name,
    }));
  }

  async function handleSave() {
    if (!form.category) {
      setError("Please select a Member Category.");
      return;
    }

    if (!form.field_name.trim()) {
      setError("Field identifier name is required.");
      return;
    }

    if (!form.display_name.trim()) {
      setError("Display label is required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (fieldConfig) {
        await fieldConfigurationService.update(fieldConfig.id, {
          category: Number(form.category),
          field_name: form.field_name.trim().toLowerCase().replace(/\s+/g, "_"),
          display_name: form.display_name.trim(),
          is_visible: form.is_visible,
          is_required: form.is_required,
          is_enabled: form.is_enabled,
          display_order: Number(form.display_order) || 0,
        });
      } else {
        await fieldConfigurationService.create({
          category: Number(form.category),
          field_name: form.field_name.trim().toLowerCase().replace(/\s+/g, "_"),
          display_name: form.display_name.trim(),
          is_visible: form.is_visible,
          is_required: form.is_required,
          is_enabled: form.is_enabled,
          display_order: Number(form.display_order) || 0,
        });
      }

      await onSaved();
      onClose();
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.non_field_errors?.[0] ||
          err?.response?.data?.field_name?.[0] ||
          "Unable to save field configuration."
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
      maxWidth="md"
      PaperProps={{
        sx: { borderRadius: 3, overflow: "hidden" },
      }}
    >
      {/* Executive Header Banner */}
      <Box
        sx={{
          p: 3,
          background: "linear-gradient(135deg, #064e3b 0%, #047857 100%)",
          color: "#ffffff",
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ p: 1, bgcolor: "rgba(255,255,255,0.18)", borderRadius: 2, display: "flex" }}>
            <IconAdjustmentsHorizontal size={26} color="#6ee7b7" />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} color="#ffffff">
              {fieldConfig ? "Edit Field Configuration Rule" : "Configure Registration Field Rule"}
            </Typography>
            <Typography variant="caption" sx={{ color: "#a7f3d0" }}>
              Define field requirement policies, visibility, and form sequence for membership registration
            </Typography>
          </Box>
        </Stack>
      </Box>

      <DialogContent sx={{ p: 3.5 }}>
        <Stack spacing={3}>
          {error && (
            <Alert severity="error" sx={{ mb: 1 }}>
              {error}
            </Alert>
          )}

          {/* Quick Suggestions (if creating new) */}
          {!fieldConfig && (
            <Box sx={{ p: 2, bgcolor: "#f8fafc", borderRadius: 2, border: "1px solid #e2e8f0" }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ display: "block", mb: 1 }}>
                QUICK FIELD TEMPLATES (CLICK TO AUTO-FILL)
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {COMMON_SUGGESTED_FIELDS.slice(0, 8).map((item) => (
                  <Button
                    key={item.field_name}
                    size="small"
                    variant="outlined"
                    onClick={() => handleSelectSuggestion(item)}
                    sx={{
                      fontSize: "0.75rem",
                      py: 0.2,
                      px: 1,
                      textTransform: "none",
                      borderColor: "#cbd5e1",
                      color: "#334155",
                      "&:hover": { borderColor: "#064e3b", color: "#064e3b", bgcolor: "#f0fdf4" },
                    }}
                  >
                    {item.display_name}
                  </Button>
                ))}
              </Box>
            </Box>
          )}

          <Grid container spacing={3}>
            {/* Category Select */}
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth required>
                <InputLabel>Membership Category</InputLabel>
                <Select
                  label="Membership Category"
                  value={form.category}
                  onChange={(e) => setForm((prev) => ({ ...prev, category: Number(e.target.value) }))}
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.name} ({cat.code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Display Order */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Display Order Sequence"
                placeholder="0"
                value={form.display_order}
                onChange={(e) => setForm((prev) => ({ ...prev, display_order: Number(e.target.value) }))}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconSortAscending size={18} style={{ color: "#064e3b" }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>

            {/* Display Name */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                required
                label="Field Display Label (UI)"
                placeholder="e.g. National ID Number"
                value={form.display_name}
                onChange={(e) => setForm((prev) => ({ ...prev, display_name: e.target.value }))}
                helperText="Label presented to SACCO officers and members on the form"
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
            </Grid>

            {/* Field System Name */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                required
                label="System Field Identifier"
                placeholder="e.g. national_id"
                value={form.field_name}
                onChange={(e) => setForm((prev) => ({ ...prev, field_name: e.target.value }))}
                helperText="Internal database variable name (lowercase, underscores)"
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 1 }} />

          {/* Validation & Policy Switches */}
          <Box sx={{ p: 2.5, bgcolor: "#f8fafc", borderRadius: 2.5, border: "1px solid #e2e8f0" }}>
            <Typography variant="subtitle2" fontWeight={800} color="#1e293b" mb={2}>
              Field Behavior &amp; Validation Rules
            </Typography>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.is_visible}
                      onChange={(e) => setForm((prev) => ({ ...prev, is_visible: e.target.checked }))}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={700}>
                        Visible in Form
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Render on registration
                      </Typography>
                    </Box>
                  }
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.is_required}
                      onChange={(e) => setForm((prev) => ({ ...prev, is_required: e.target.checked }))}
                      color="error"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={700}>
                        Mandatory / Required
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Must be filled to submit
                      </Typography>
                    </Box>
                  }
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.is_enabled}
                      onChange={(e) => setForm((prev) => ({ ...prev, is_enabled: e.target.checked }))}
                      color="success"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={700}>
                        Active &amp; Enabled
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Rule actively enforced
                      </Typography>
                    </Box>
                  }
                />
              </Grid>
            </Grid>
          </Box>
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3.5, py: 2.5, bgcolor: "#f8fafc" }}>
        <Button disabled={loading} onClick={onClose} sx={{ color: "text.secondary", fontWeight: 600, textTransform: "none" }}>
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
          {loading ? "Saving..." : fieldConfig ? "Update Field Rule" : "Save Field Rule"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
