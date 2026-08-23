"use client";

import { useMemo } from "react";
import {
  Avatar,
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
import { OrganizationUser } from "@/types/user";
import {
  IconUser,
  IconMail,
  IconAt,
  IconCalendar,
  IconClock,
  IconShieldLock,
  IconCheck,
} from "@tabler/icons-react";

interface ViewUserDialogProps {
  open: boolean;
  user: OrganizationUser | null;
  onClose: () => void;
}

export default function ViewUserDialog({
  open,
  user,
  onClose,
}: ViewUserDialogProps) {
  if (!user) return null;

  const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username;
  const isOwner = user.role?.name === "Owner";

  // Group permissions by module
  const groupedPermissions = useMemo(() => {
    const map: Record<string, typeof user.permissions> = {};
    (user.permissions || []).forEach((p) => {
      let rawModule = (p.module || "").trim();
      if (!rawModule) {
        if (p.code?.includes("member")) rawModule = "Members";
        else if (p.code?.includes("role")) rawModule = "Roles";
        else if (p.code?.includes("user")) rawModule = "Users";
        else rawModule = "General";
      }
      const moduleName = rawModule.charAt(0).toUpperCase() + rawModule.slice(1).toLowerCase();
      if (!map[moduleName]) map[moduleName] = [];
      map[moduleName].push(p);
    });
    return map;
  }, [user.permissions]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ p: 2.5, fontWeight: 800, fontSize: "1.25rem" }}>
        User Account Profile
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        <Stack spacing={3}>
          {/* Header Card */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              background: isOwner
                ? "linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)"
                : "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0d9488 100%)",
              color: "#ffffff",
            }}
          >
            <Stack direction={{ xs: "column", sm: "row" }} spacing={3} alignItems={{ xs: "flex-start", sm: "center" }}>
              <Avatar
                sx={{
                  width: 76,
                  height: 76,
                  bgcolor: "rgba(255, 255, 255, 0.2)",
                  color: "#ffffff",
                  fontSize: 28,
                  fontWeight: 800,
                  border: "2px solid rgba(255, 255, 255, 0.4)",
                }}
              >
                {(user.first_name || user.username).charAt(0).toUpperCase()}
              </Avatar>

              <Box flex={1}>
                <Typography variant="h5" fontWeight={800} sx={{ color: "#ffffff", letterSpacing: "-0.5px" }}>
                  {fullName}
                </Typography>
                <Typography variant="body2" sx={{ color: "#cbd5e1", mt: 0.2 }}>
                  @{user.username} • {user.email}
                </Typography>

                <Stack direction="row" spacing={1} mt={1.5} flexWrap="wrap">
                  <Chip
                    label={user.role?.name || "Staff"}
                    size="small"
                    sx={{
                      bgcolor: "rgba(255, 255, 255, 0.25)",
                      color: "#ffffff",
                      fontWeight: 700,
                      backdropFilter: "blur(10px)",
                    }}
                  />
                  <Chip
                    label={user.is_active ? "● Active Account" : "Inactive"}
                    size="small"
                    sx={{
                      bgcolor: user.is_active ? "#10b981" : "#ef4444",
                      color: "#ffffff",
                      fontWeight: 700,
                    }}
                  />
                  {user.role?.is_system_role && (
                    <Chip
                      label="System Core Role"
                      size="small"
                      sx={{
                        bgcolor: "#f59e0b",
                        color: "#ffffff",
                        fontWeight: 700,
                      }}
                    />
                  )}
                </Stack>
              </Box>
            </Stack>
          </Paper>

          {/* Account Details Grid */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: (theme) => `1px solid ${theme.palette.divider}`,
              bgcolor: "background.paper",
            }}
          >
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              Account Details
            </Typography>
            <Divider sx={{ mb: 2.5 }} />

            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <IconUser size={20} color="#64748b" />
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>FULL NAME</Typography>
                    <Typography variant="body2" fontWeight={700}>{user.first_name || "-"} {user.last_name || "-"}</Typography>
                  </Box>
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <IconAt size={20} color="#64748b" />
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>USERNAME</Typography>
                    <Typography variant="body2" fontWeight={700}>@{user.username}</Typography>
                  </Box>
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <IconMail size={20} color="#64748b" />
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>EMAIL ADDRESS</Typography>
                    <Typography variant="body2" fontWeight={700}>{user.email}</Typography>
                  </Box>
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <IconShieldLock size={20} color="#64748b" />
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>ROLE POLICY</Typography>
                    <Typography variant="body2" fontWeight={700}>{user.role?.name || "Standard Role"}</Typography>
                  </Box>
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <IconCalendar size={20} color="#64748b" />
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>DATE REGISTERED</Typography>
                    <Typography variant="body2" fontWeight={600}>{new Date(user.created_at).toLocaleString()}</Typography>
                  </Box>
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <IconClock size={20} color="#64748b" />
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>LAST UPDATED</Typography>
                    <Typography variant="body2" fontWeight={600}>{new Date(user.updated_at).toLocaleString()}</Typography>
                  </Box>
                </Stack>
              </Grid>
            </Grid>
          </Paper>

          {/* Grouped Permissions Matrix */}
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
                Effective Permissions ({user.permissions?.length || 0})
              </Typography>
              <Chip
                label={user.role?.name === "Owner" ? "Full Administrative Access" : "Restricted Operational Access"}
                size="small"
                color={user.role?.name === "Owner" ? "primary" : "default"}
                sx={{ fontWeight: 700 }}
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
                No individual permissions assigned.
              </Typography>
            )}
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
