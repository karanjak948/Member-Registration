"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import RoleDataGrid from "./components/RoleDataGrid";
import RoleDialog from "./components/RoleDialog";
import ViewRoleDialog from "./components/ViewRoleDialog";
import DeleteRoleDialog from "./components/DeleteRoleDialog";
import roleService from "@/services/role.service";
import { Role } from "@/types/role";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/constants/permissions";
import {
  IconUserShield,
  IconPlus,
  IconRefresh,
  IconShieldLock,
  IconKey,
  IconShieldCheck,
} from "@tabler/icons-react";

export default function RolesPage() {
  const { permissions, isSuperuser } = usePermissions();
  const canManageRoles = isSuperuser || permissions.includes(PERMISSIONS.MANAGE_ROLES);

  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    severity: "success" as "success" | "error",
    message: "",
  });

  const loadRoles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await roleService.getRoles();
      setRoles(Array.isArray(response) ? response : []);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.detail ?? "Unable to load organization roles.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canManageRoles) {
      setLoading(false);
      return;
    }
    loadRoles();
  }, [canManageRoles, loadRoles]);

  const metrics = useMemo(() => {
    const totalRoles = roles.length;
    const systemRoles = roles.filter((r) => r.is_system_role).length;
    const customRoles = totalRoles - systemRoles;
    const maxPermissions = roles.reduce((max, r) => Math.max(max, r.permissions?.length || 0), 10);
    return { totalRoles, systemRoles, customRoles, maxPermissions };
  }, [roles]);

  const closeDialogs = () => {
    setCreateDialogOpen(false);
    setEditDialogOpen(false);
    setViewDialogOpen(false);
    setDeleteDialogOpen(false);
    setSelectedRole(null);
  };

  const showSuccess = (message: string) => {
    setSnackbar({ open: true, severity: "success", message });
  };

  const showError = (message: string) => {
    setSnackbar({ open: true, severity: "error", message });
  };

  const handleCreate = () => {
    setSelectedRole(null);
    setCreateDialogOpen(true);
  };

  const handleView = (role: Role) => {
    setSelectedRole(role);
    setViewDialogOpen(true);
  };

  const handleEdit = (role: Role) => {
    setSelectedRole(role);
    setEditDialogOpen(true);
  };

  const handleDelete = (role: Role) => {
    setSelectedRole(role);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedRole) return;
    try {
      setDeleteLoading(true);
      await roleService.deleteRole(selectedRole.id);
      showSuccess(`Role "${selectedRole.name}" deleted successfully.`);
      closeDialogs();
      await loadRoles();
    } catch (err: any) {
      console.error(err);
      showError(err?.response?.data?.detail ?? "Failed to delete role.");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!canManageRoles) {
    return (
      <PageContainer title="Access Denied - Royal SACCO" description="Permission Required">
        <Box sx={{ p: 3 }}>
          <Alert severity="error">
            You do not have administrative permission to manage organization roles.
          </Alert>
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Role Management - Royal SACCO" description="Manage organization roles, security tiers, and granular permissions">
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        {/* Executive Hero Banner */}
        <Box
          sx={{
            mb: 4,
            p: 3.5,
            borderRadius: 3,
            background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)",
            color: "#ffffff",
            boxShadow: "0 12px 28px -6px rgba(30, 27, 75, 0.3)",
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={2}
          >
            <Box>
              <Stack direction="row" spacing={1.5} alignItems="center" mb={0.5}>
                <Box sx={{ p: 1, bgcolor: "rgba(255,255,255,0.15)", borderRadius: 2, display: "flex" }}>
                  <IconShieldLock size={28} color="#a5b4fc" />
                </Box>
                <Typography variant="h4" fontWeight={800} sx={{ color: "#ffffff", letterSpacing: "-0.5px" }}>
                  Role &amp; Permission Management
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ color: "#c7d2fe" }}>
                Define security tiers, assign authorization policies, and control role-based access control (RBAC)
              </Typography>
            </Box>

            {/* Quick Actions */}
            <Stack direction="row" spacing={1.5}>
              <Button
                variant="contained"
                startIcon={<IconPlus size={18} />}
                onClick={handleCreate}
                sx={{
                  bgcolor: "#4f46e5",
                  color: "#ffffff",
                  fontWeight: 700,
                  textTransform: "none",
                  boxShadow: "0 4px 12px rgba(79, 70, 229, 0.4)",
                  "&:hover": { bgcolor: "#4338ca" },
                }}
              >
                + New Role
              </Button>
              <IconButton
                onClick={loadRoles}
                disabled={loading}
                sx={{
                  bgcolor: "rgba(255,255,255,0.15)",
                  color: "#ffffff",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.25)" },
                }}
              >
                <IconRefresh size={18} />
              </IconButton>
            </Stack>
          </Stack>
        </Box>

        {/* KPI Metric Cards */}
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>CONFIGURED ROLES</Typography>
                    <Typography variant="h4" fontWeight={800} color="primary.main" mt={0.5}>
                      {metrics.totalRoles} Active Roles
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {metrics.customRoles} Custom Organization Roles
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.5, bgcolor: "primary.light", color: "primary.main", borderRadius: 2 }}>
                    <IconUserShield size={28} />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>SYSTEM CORE ROLES</Typography>
                    <Typography variant="h4" fontWeight={800} color="warning.main" mt={0.5}>
                      {metrics.systemRoles} Protected
                    </Typography>
                    <Typography variant="caption" color="warning.dark" fontWeight={700}>
                      Owner (Immutable System Role)
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.5, bgcolor: "warning.light", color: "warning.main", borderRadius: 2 }}>
                    <IconShieldCheck size={28} />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>GLOBAL PERMISSIONS</Typography>
                    <Typography variant="h4" fontWeight={800} color="success.main" mt={0.5}>
                      {metrics.maxPermissions} Granular Rights
                    </Typography>
                    <Typography variant="caption" color="success.dark" fontWeight={700}>
                      Full Module Authorization
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.5, bgcolor: "success.light", color: "success.main", borderRadius: 2 }}>
                    <IconKey size={28} />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Roles Table Card */}
        <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Security Roles &amp; Permission Allocation ({roles.length})
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Manage role definitions, view policy breakdowns, and assign permissions
                </Typography>
              </Box>
            </Stack>

            <Divider sx={{ mb: 2 }} />

            <RoleDataGrid
              roles={roles}
              loading={loading}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </CardContent>
        </Card>
      </Box>

      {/* Dialogs */}
      <RoleDialog
        open={createDialogOpen}
        mode="create"
        onClose={closeDialogs}
        onSuccess={async () => {
          showSuccess("Role created successfully.");
          closeDialogs();
          await loadRoles();
        }}
      />

      <RoleDialog
        open={editDialogOpen}
        mode="edit"
        role={selectedRole}
        onClose={closeDialogs}
        onSuccess={async () => {
          showSuccess("Role updated successfully.");
          closeDialogs();
          await loadRoles();
        }}
      />

      <ViewRoleDialog
        open={viewDialogOpen}
        role={selectedRole}
        onClose={closeDialogs}
      />

      <DeleteRoleDialog
        open={deleteDialogOpen}
        role={selectedRole}
        loading={deleteLoading}
        onClose={closeDialogs}
        onConfirm={handleDeleteConfirm}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </PageContainer>
  );
}