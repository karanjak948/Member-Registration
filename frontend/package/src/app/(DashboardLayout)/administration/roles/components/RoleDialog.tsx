"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import LoadingButton from "@mui/lab/LoadingButton";
import CloseIcon from "@mui/icons-material/Close";
import roleService from "@/services/role.service";
import PermissionSelector from "./PermissionSelector";
import { Permission, Role } from "@/types/role";
import {
  IconShieldLock,
  IconShieldPlus,
  IconShieldCheck,
  IconDeviceFloppy,
} from "@tabler/icons-react";

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

  const isEdit = mode === "edit";

  // Reset form when dialog opens
  useEffect(() => {
    if (!open) return;

    setErrors({ name: "" });
    setApiError(null);
    loadPermissions();

    if (mode === "edit" && role) {
      setName(role.name);
      setDescription(role.description ?? "");
      setSelectedPermissionIds(role.permissions.map((p) => p.id));
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
      setPermissions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load permissions:", error);
      setApiError("Unable to load permissions. Please try again.");
    } finally {
      setPermissionsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors = { name: "" };
    if (!name.trim()) {
      newErrors.name = "Role name is required.";
    }
    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setApiError(null);
    setLoading(true);

    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        permission_ids: selectedPermissionIds,
      };

      if (mode === "create") {
        await roleService.createRole(payload);
      } else if (role) {
        await roleService.updateRole(role.id, payload);
      }

      await onSuccess();
    } catch (error: any) {
      console.error("Role update failed:", error);
      const responseData = error?.response?.data;
      if (responseData && typeof responseData === "object") {
        if (responseData.name) {
          setErrors((prev) => ({
            ...prev,
            name: Array.isArray(responseData.name) ? responseData.name[0] : responseData.name,
          }));
        }
        setApiError(responseData.detail ?? JSON.stringify(responseData));
      } else {
        setApiError("Unable to save role.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="lg"
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: "hidden",
        },
      }}
    >
      {/* Executive Header */}
      <DialogTitle
        sx={{
          p: 2.5,
          bgcolor: isEdit ? "#f8fafc" : "#ffffff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              bgcolor: isEdit ? "rgba(79, 70, 229, 0.1)" : "rgba(16, 185, 129, 0.1)",
              color: isEdit ? "#4f46e5" : "#059669",
              display: "flex",
            }}
          >
            {isEdit ? <IconShieldLock size={26} /> : <IconShieldPlus size={26} />}
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} color="text.primary">
              {isEdit ? `Edit Role: ${role?.name}` : "Create New Authorization Role"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Define the security tier, write policy description, and assign modular permissions
            </Typography>
          </Box>
        </Stack>

        {!loading && (
          <IconButton size="small" onClick={onClose} sx={{ color: "text.secondary" }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ p: 3 }}>
        {apiError && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setApiError(null)}>
            {apiError}
          </Alert>
        )}

        <Stack spacing={3}>
          {/* Role Metadata Inputs */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2.5,
              border: "1px solid #e2e8f0",
              bgcolor: "#ffffff",
            }}
          >
            <Typography variant="subtitle2" fontWeight={700} color="text.secondary" mb={2}>
              ROLE GENERAL DETAILS
            </Typography>

            <Stack spacing={2.5}>
              <TextField
                label="Role Name"
                placeholder="e.g. Loan Underwriter, Operations Manager"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={!!errors.name}
                helperText={errors.name || "Unique identifier for this organizational role"}
                fullWidth
                required
                disabled={loading}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconShieldCheck size={18} style={{ color: "#94a3b8" }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <TextField
                label="Role Description"
                placeholder="Describe operational responsibilities and permission scope..."
                multiline
                minRows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
                disabled={loading}
                helperText="Clear summary visible to administrators during user role assignment"
              />
            </Stack>
          </Paper>

          {/* Granular Permissions Selector */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2.5,
              border: "1px solid #e2e8f0",
              bgcolor: "#ffffff",
            }}
          >
            <PermissionSelector
              permissions={permissions}
              loading={permissionsLoading}
              value={selectedPermissionIds}
              onChange={setSelectedPermissionIds}
            />
          </Paper>
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2.5, gap: 1.5 }}>
        <Button
          variant="outlined"
          onClick={onClose}
          disabled={loading}
          sx={{ px: 3, fontWeight: 600, textTransform: "none" }}
        >
          Cancel
        </Button>

        <LoadingButton
          loading={loading}
          variant="contained"
          onClick={handleSubmit}
          startIcon={<IconDeviceFloppy size={18} />}
          sx={{
            px: 3.5,
            fontWeight: 700,
            textTransform: "none",
            bgcolor: "#4f46e5",
            "&:hover": { bgcolor: "#4338ca" },
          }}
        >
          {mode === "create" ? "Create Role" : "Save Changes"}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}