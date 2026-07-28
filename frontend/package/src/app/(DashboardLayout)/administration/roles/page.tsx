"use client";

import { useCallback, useEffect, useState } from "react";

import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Paper,
  Snackbar,
} from "@mui/material";

import RoleToolbar from "./components/RoleToolbar";
import RoleDataGrid from "./components/RoleDataGrid";
import RoleDialog from "./components/RoleDialog";
import ViewRoleDialog from "./components/ViewRoleDialog";
import DeleteRoleDialog from "./components/DeleteRoleDialog";

import roleService from "@/services/role.service";

import { Role } from "@/types/role";

export default function RolesPage() {
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

      setRoles(response);
    } catch (err: any) {
      console.error(err);

      setError(
        err?.response?.data?.detail ??
          "Unable to load organization roles."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const closeDialogs = () => {
    setCreateDialogOpen(false);
    setEditDialogOpen(false);
    setViewDialogOpen(false);
    setDeleteDialogOpen(false);
    setSelectedRole(null);
  };

  const showSuccess = (message: string) => {
    setSnackbar({
      open: true,
      severity: "success",
      message,
    });
  };

  const showError = (message: string) => {
    setSnackbar({
      open: true,
      severity: "error",
      message,
    });
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

      closeDialogs();

      await loadRoles();

      showSuccess("Role deleted successfully.");
    } catch (err: any) {
      console.error(err);

      showError(
        err?.response?.data?.detail ??
          "Unable to delete role."
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCreateSuccess = async () => {
    closeDialogs();
    await loadRoles();
    showSuccess("Role created successfully.");
  };

  const handleEditSuccess = async () => {
    closeDialogs();
    await loadRoles();
    showSuccess("Role updated successfully.");
  };

  return (
    <Container maxWidth={false}>
      <Box display="flex" flexDirection="column" gap={3}>
        <RoleToolbar
          loading={loading}
          onCreate={handleCreate}
          onRefresh={loadRoles}
        />

        {error && (
          <Alert severity="error">
            {error}
          </Alert>
        )}

        <Paper elevation={0}>
          {loading ? (
            <Box
              height={500}
              display="flex"
              justifyContent="center"
              alignItems="center"
            >
              <CircularProgress />
            </Box>
          ) : (
            <RoleDataGrid
              roles={roles}
              loading={loading}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </Paper>

        {/* Create Role */}
        <RoleDialog
          open={createDialogOpen}
          mode="create"
          onClose={closeDialogs}
          onSuccess={handleCreateSuccess}
        />

        {/* Edit Role */}
        <RoleDialog
          open={editDialogOpen}
          mode="edit"
          role={selectedRole}
          onClose={closeDialogs}
          onSuccess={handleEditSuccess}
        />

        {/* View Role */}
        <ViewRoleDialog
          open={viewDialogOpen}
          role={selectedRole}
          onClose={closeDialogs}
        />

        {/* Delete Role */}
        <DeleteRoleDialog
          open={deleteDialogOpen}
          role={selectedRole}
          loading={deleteLoading}
          onClose={closeDialogs}
          onConfirm={handleDeleteConfirm}
        />

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() =>
            setSnackbar((prev) => ({
              ...prev,
              open: false,
            }))
          }
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
        >
          <Alert
            severity={snackbar.severity}
            variant="filled"
            elevation={6}
            onClose={() =>
              setSnackbar((prev) => ({
                ...prev,
                open: false,
              }))
            }
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
}