"use client";

import { useEffect, useState } from "react";

import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";

import LoadingButton from "@mui/lab/LoadingButton";

import roleService from "@/services/role.service";

import PermissionSelector from "./PermissionSelector";

import { Permission } from "@/types/role";
import { Role } from "@/types/role";

interface RoleDialogProps {
  open: boolean;
  mode: "create" | "edit";
  role?: Role | null;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

export default function RoleDialog({
  open,
  mode,
  role,
  onClose,
  onSuccess,
}: RoleDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);

  const [loading, setLoading] = useState(false);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [errors, setErrors] = useState({
    name: "",
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (!open) return;

    // Reset errors
    setErrors({ name: "" });
    setApiError(null);

    // Load permissions
    loadPermissions();

    // Populate form for edit mode
    if (mode === "edit" && role) {
      setName(role.name);
      setDescription(role.description ?? "");
      setSelectedPermissionIds(
        role.permissions.map((permission) => permission.id)
      );
    } else {
      setName("");
      setDescription("");
      setSelectedPermissionIds([]);
    }
  }, [open, mode, role]);

  const loadPermissions = async () => {
    try {
      setPermissionsLoading(true);
      const data = await roleService.getPermissions();
      setPermissions(data);
    } catch (error) {
      console.error("Failed to load permissions:", error);
      setApiError("Unable to load permissions. Please try again.");
    } finally {
      setPermissionsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors = {
      name: "",
    };

    if (!name.trim()) {
      newErrors.name = "Role name is required.";
    }

    setErrors(newErrors);

    return !Object.values(newErrors).some(Boolean);
  };

  const handleSubmit = async () => {
    // Validate form
    if (!validateForm()) {
      return;
    }

    setApiError(null);
    setLoading(true);

    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        permission_ids: selectedPermissionIds,
      };

      console.log("Payload:", payload);

      if (mode === "create") {
        await roleService.createRole(payload);
      } else if (role) {
        await roleService.updateRole(role.id, payload);
      }

      // Success - parent handles notification
      await onSuccess();
    } catch (error: any) {
      console.error("Role creation failed");
      console.log("Status:", error?.response?.status);
      console.log("Response:", error?.response?.data);

      const responseData = error?.response?.data;

      if (responseData && typeof responseData === "object") {
        if (responseData.name) {
          setErrors((prev) => ({
            ...prev,
            name: Array.isArray(responseData.name)
              ? responseData.name[0]
              : responseData.name,
          }));
        }

        setApiError(
          responseData.detail ??
          JSON.stringify(responseData)
        );
      } else {
        setApiError("Unable to save role.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Keyboard support: Ctrl+Enter to submit
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="lg"
      onKeyDown={handleKeyDown}
    >
      <DialogTitle>
        {mode === "create"
          ? "Create New Role"
          : `Edit Role: ${role?.name}`}
      </DialogTitle>

      <DialogContent dividers>
        <DialogContentText sx={{ mb: 3 }}>
          Define the role details and assign the permissions that users with
          this role will receive. This role will be available when managing
          organization users.
        </DialogContentText>

        {apiError && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setApiError(null)}>
            {apiError}
          </Alert>
        )}

        <Stack spacing={4}>
          <TextField
            label="Role Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={!!errors.name}
            helperText={errors.name}
            fullWidth
            required
            disabled={loading}
          />

          <TextField
            label="Description"
            multiline
            minRows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            disabled={loading}
            placeholder="Describe the purpose of this role..."
          />

          <PermissionSelector
            permissions={permissions}
            loading={permissionsLoading}
            value={selectedPermissionIds}
            onChange={setSelectedPermissionIds}
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>

        <LoadingButton
          loading={loading}
          variant="contained"
          onClick={handleSubmit}
          loadingPosition="start"
        >
          {mode === "create" ? "Create Role" : "Save Changes"}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}