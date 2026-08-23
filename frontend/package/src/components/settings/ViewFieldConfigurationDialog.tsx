"use client";

import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import { FieldConfiguration } from "@/interfaces/fieldConfiguration";
import {
  IconAdjustmentsHorizontal,
  IconEye,
  IconCheck,
  IconX,
  IconAlertCircle,
  IconTag,
  IconFolders,
  IconSortAscending,
} from "@tabler/icons-react";

interface ViewFieldConfigurationDialogProps {
  open: boolean;
  fieldConfig: FieldConfiguration | null;
  onClose: () => void;
}

export default function ViewFieldConfigurationDialog({
  open,
  fieldConfig,
  onClose,
}: ViewFieldConfigurationDialogProps) {
  if (!fieldConfig) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
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
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          color: "#ffffff",
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{ p: 1, bgcolor: "rgba(255,255,255,0.15)", borderRadius: 2, display: "flex" }}>
              <IconEye size={24} color="#38bdf8" />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={800} color="#ffffff">
                View Field Rule Details
              </Typography>
              <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                Field Policy ID • #{fieldConfig.id}
              </Typography>
            </Box>
          </Stack>

          <Chip
            label={fieldConfig.is_required ? "MANDATORY" : "OPTIONAL"}
            sx={{
              bgcolor: fieldConfig.is_required ? "#fee2e2" : "#f1f5f9",
              color: fieldConfig.is_required ? "#dc2626" : "#475569",
              fontWeight: 800,
              fontSize: "0.75rem",
            }}
          />
        </Stack>
      </Box>

      <DialogContent sx={{ p: 3.5 }}>
        <Stack spacing={2.5}>
          {/* Main Info Paper */}
          <Paper elevation={0} sx={{ p: 2.5, bgcolor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 2.5 }}>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: 0.5 }}>
                  DISPLAY LABEL (UI)
                </Typography>
                <Typography variant="subtitle1" fontWeight={800} color="#1e293b" sx={{ mt: 0.5 }}>
                  {fieldConfig.display_name}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: 0.5 }}>
                  SYSTEM IDENTIFIER
                </Typography>
                <Typography variant="body2" fontWeight={700} color="#0284c7" sx={{ mt: 0.5, fontFamily: "monospace" }}>
                  {fieldConfig.field_name}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: 0.5 }}>
                  TARGET MEMBERSHIP CATEGORY
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={fieldConfig.category_name || `Category #${fieldConfig.category}`}
                    size="small"
                    sx={{ bgcolor: "#f0fdf4", color: "#065f46", fontWeight: 800, border: "1px solid #bbf7d0" }}
                  />
                </Box>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: 0.5 }}>
                  DISPLAY ORDER SEQUENCE
                </Typography>
                <Typography variant="body2" fontWeight={800} color="#1e293b" sx={{ mt: 0.5 }}>
                  Position #{fieldConfig.display_order}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Policy Flags Grid */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 4 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  textAlign: "center",
                  border: "1px solid",
                  borderColor: fieldConfig.is_visible ? "#bbf7d0" : "#fee2e2",
                  bgcolor: fieldConfig.is_visible ? "#f0fdf4" : "#fef2f2",
                  borderRadius: 2,
                }}
              >
                <Typography variant="caption" fontWeight={700} color="text.secondary">
                  VISIBILITY
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={800}
                  color={fieldConfig.is_visible ? "#065f46" : "#dc2626"}
                  sx={{ mt: 0.5 }}
                >
                  {fieldConfig.is_visible ? "VISIBLE" : "HIDDEN"}
                </Typography>
              </Paper>
            </Grid>

            <Grid size={{ xs: 4 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  textAlign: "center",
                  border: "1px solid",
                  borderColor: fieldConfig.is_required ? "#fecaca" : "#e2e8f0",
                  bgcolor: fieldConfig.is_required ? "#fff1f2" : "#f8fafc",
                  borderRadius: 2,
                }}
              >
                <Typography variant="caption" fontWeight={700} color="text.secondary">
                  VALIDATION
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={800}
                  color={fieldConfig.is_required ? "#dc2626" : "#475569"}
                  sx={{ mt: 0.5 }}
                >
                  {fieldConfig.is_required ? "MANDATORY" : "OPTIONAL"}
                </Typography>
              </Paper>
            </Grid>

            <Grid size={{ xs: 4 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  textAlign: "center",
                  border: "1px solid",
                  borderColor: fieldConfig.is_enabled ? "#bae6fd" : "#fee2e2",
                  bgcolor: fieldConfig.is_enabled ? "#f0f9ff" : "#fef2f2",
                  borderRadius: 2,
                }}
              >
                <Typography variant="caption" fontWeight={700} color="text.secondary">
                  STATUS
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={800}
                  color={fieldConfig.is_enabled ? "#0369a1" : "#dc2626"}
                  sx={{ mt: 0.5 }}
                >
                  {fieldConfig.is_enabled ? "ENABLED" : "DISABLED"}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3.5, py: 2.5, bgcolor: "#f8fafc" }}>
        <Button
          variant="contained"
          onClick={onClose}
          sx={{
            bgcolor: "#334155",
            color: "#ffffff",
            fontWeight: 700,
            px: 3.5,
            textTransform: "none",
            "&:hover": { bgcolor: "#1e293b" },
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
