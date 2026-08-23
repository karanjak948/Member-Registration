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

import { MemberCategory } from "@/interfaces/category";
import {
  IconFolders,
  IconTag,
  IconFileText,
  IconCheck,
  IconEye,
  IconInfoCircle,
} from "@tabler/icons-react";

interface ViewCategoryDialogProps {
  open: boolean;
  category: MemberCategory | null;
  onClose: () => void;
  onEdit?: (category: MemberCategory) => void;
}

export default function ViewCategoryDialog({
  open,
  category,
  onClose,
}: ViewCategoryDialogProps) {
  if (!category) return null;

  const code = String(category.code || "").toUpperCase();
  let chipColor: { bg: string; color: string; border: string } = {
    bg: "#f0fdf4",
    color: "#065f46",
    border: "#bbf7d0",
  };

  if (code.includes("SPECIAL") || code.includes("VIP")) {
    chipColor = { bg: "#f0f9ff", color: "#0369a1", border: "#bae6fd" };
  } else if (code.includes("OTHER")) {
    chipColor = { bg: "#faf5ff", color: "#6d28d9", border: "#e9d5ff" };
  }

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
      {/* Read-Only View Header */}
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
                View Member Category
              </Typography>
              <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                Classification Tier Details • Category #{category.id}
              </Typography>
            </Box>
          </Stack>

          <Chip
            label={code}
            sx={{
              bgcolor: "rgba(255,255,255,0.15)",
              color: "#ffffff",
              fontWeight: 800,
              border: "1px solid rgba(255,255,255,0.25)",
            }}
          />
        </Stack>
      </Box>

      {/* Strictly Read-Only Content */}
      <DialogContent sx={{ p: 3.5 }}>
        <Stack spacing={2.5}>
          {/* Details Card */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 2.5,
              border: "1px solid #e2e8f0",
              bgcolor: "#f8fafc",
            }}
          >
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: 0.5 }}>
                    CATEGORY NAME
                  </Typography>
                  <Typography variant="subtitle1" fontWeight={800} color="#1e293b">
                    {category.name}
                  </Typography>
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: 0.5 }}>
                    SHORT CODE
                  </Typography>
                  <Box>
                    <Chip
                      label={category.code}
                      size="small"
                      sx={{
                        bgcolor: chipColor.bg,
                        color: chipColor.color,
                        border: "1px solid",
                        borderColor: chipColor.border,
                        fontWeight: 800,
                        fontSize: "0.8rem",
                      }}
                    />
                  </Box>
                </Stack>
              </Grid>
            </Grid>
          </Paper>

          {/* Description Section */}
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: 0.5, display: "block", mb: 1 }}>
              DESCRIPTION &amp; OPERATIONAL RULES
            </Typography>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2,
                border: "1px solid #e2e8f0",
                bgcolor: "#ffffff",
              }}
            >
              <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.6 }}>
                {category.description || "Default member category tier without special constraints."}
              </Typography>
            </Paper>
          </Box>

          {/* System Status Pill */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              border: "1px solid #dcfce7",
              bgcolor: "#f0fdf4",
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <Box sx={{ p: 0.8, bgcolor: "#059669", color: "#ffffff", borderRadius: "50%", display: "flex" }}>
              <IconCheck size={16} />
            </Box>
            <Box>
              <Typography variant="subtitle2" fontWeight={800} color="#065f46">
                Active Member Category
              </Typography>
              <Typography variant="caption" color="#047857">
                Eligible for new member registration and loan limit assignments
              </Typography>
            </Box>
          </Paper>
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
