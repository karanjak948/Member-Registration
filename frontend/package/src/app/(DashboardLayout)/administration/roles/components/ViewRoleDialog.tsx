"use client";

import { useMemo } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { Role } from "@/types/role";
import {
  IconShieldLock,
  IconKey,
  IconCalendar,
  IconClock,
  IconCheck,
} from "@tabler/icons-react";

interface ViewRoleDialogProps {
  open: boolean;
  role: Role | null;
  onClose: () => void;
}

export default function ViewRoleDialog({
  open,
  role,
  onClose,
}: ViewRoleDialogProps) {
  if (!role) return null;

  // Group permissions by module
  const groupedPermissions = useMemo(() => {
    const map: Record<string, typeof role.permissions> = {};
    (role.permissions || []).forEach((p) => {
      const rawModule = (p.module || "General").trim();
      const moduleName = rawModule.charAt(0).toUpperCase() + rawModule.slice(1).toLowerCase();
      if (!map[moduleName]) map[moduleName] = [];
      map[moduleName].push(p);
    });
    return map;
  }, [role.permissions]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ p: 2.5, fontWeight: 800, fontSize: "1.25rem" }}>
        Role Authorization Details
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        <Stack spacing={3}>
          {/* Executive Header Card */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              background: role.is_system_role
                ? "linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)"
                : "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0369a1 100%)",
              color: "#ffffff",
            }}
          >
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2}>
              <Box>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box sx={{ p: 1, bgcolor: "rgba(255,255,255,0.15)", borderRadius: 2, display: "flex" }}>
                    <IconShieldLock size={26} color="#a5b4fc" />
                  </Box>
                  <Typography variant="h5" fontWeight={800} sx={{ color: "#ffffff", letterSpacing: "-0.5px" }}>
                    {role.name}
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ color: "#cbd5e1", mt: 1 }}>
                  {role.description || "Custom organization authorization role."}
                </Typography>
              </Box>

              <Stack direction="row" spacing={1}>
                <Chip
                  label={role.is_system_role ? "System Core (Protected)" : "Custom Organization Role"}
                  size="small"
                  sx={{
                    bgcolor: role.is_system_role ? "#f59e0b" : "rgba(255,255,255,0.2)",
                    color: "#ffffff",
                    fontWeight: 700,
                  }}
                />
              </Stack>
            </Stack>
          </Paper>

          {/* Grouped Permissions Breakdown */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: (theme) => `1px solid ${theme.palette.divider}`,
              bgcolor: "background.paper",
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
              <Typography variant="subtitle1" fontWeight={700}>
                Assigned Granular Rights ({role.permissions?.length || 0})
              </Typography>
              <Chip
                icon={<IconKey size={14} style={{ color: "#2563eb" }} />}
                label={`${role.permissions?.length || 0} Rights Active`}
                size="small"
                sx={{ fontWeight: 700, bgcolor: "rgba(37, 99, 235, 0.1)", color: "primary.main" }}
              />
            </Stack>
            <Divider sx={{ mb: 2.5 }} />

            {Object.keys(groupedPermissions).length > 0 ? (
              <Stack spacing={2}>
                {Object.entries(groupedPermissions).map(([module, perms]) => (
                  <Box key={module} sx={{ p: 2, bgcolor: "#f8fafc", borderRadius: 2, border: "1px solid #e2e8f0" }}>
                    <Typography variant="caption" fontWeight={800} color="primary.main" sx={{ letterSpacing: 0.5, display: "block", mb: 1 }}>
                      {module.toUpperCase()} MODULE ({perms.length})
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {perms.map((permission) => (
                        <Chip
                          key={permission.id}
                          icon={<IconCheck size={14} style={{ color: "#059669" }} />}
                          label={permission.name}
                          size="small"
                          sx={{
                            bgcolor: "#ffffff",
                            border: "1px solid #cbd5e1",
                            fontWeight: 600,
                            color: "text.primary",
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No permissions assigned to this role.
              </Typography>
            )}
          </Paper>

          {/* Audit Timestamp Information */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 2,
              border: (theme) => `1px solid ${theme.palette.divider}`,
              bgcolor: "background.paper",
            }}
          >
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <IconCalendar size={18} color="#64748b" />
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>DATE CREATED</Typography>
                    <Typography variant="body2" fontWeight={600}>{new Date(role.created_at).toLocaleString()}</Typography>
                  </Box>
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <IconClock size={18} color="#64748b" />
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>LAST MODIFIED</Typography>
                    <Typography variant="body2" fontWeight={600}>{new Date(role.updated_at).toLocaleString()}</Typography>
                  </Box>
                </Stack>
              </Grid>
            </Grid>
          </Paper>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2.5 }}>
        <Button variant="contained" onClick={onClose} sx={{ px: 3, fontWeight: 700 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}