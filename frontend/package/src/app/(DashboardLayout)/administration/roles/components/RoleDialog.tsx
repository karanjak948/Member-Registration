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
      setApiError("Unable to load permission catalogue. Please try again.");
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
        setApiError("Unable to save role definition.");
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
          borderRadius: 3.5,
          overflow: "hidden",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.25)",
        },
      }}
    >
      {/* Executive Indigo Header */}
      <DialogTitle
        sx={{
          p: 3,
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)",
          color: "#ffffff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              p: 1.25,
              borderRadius: 2.5,
              bgcolor: "rgba(255, 255, 255, 0.15)",
              color: "#a5b4fc",
              display: "flex",
              backdropFilter: "blur(6px)",
            }}
          >
            {isEdit ? <IconShieldLock size={28} /> : <IconShieldPlus size={28} />}
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={900} sx={{ color: "#ffffff", letterSpacing: "-0.5px" }}>
              {isEdit ? `Edit Role: ${role?.name}` : "Create New Authorization Role"}
            </Typography>
            <Typography variant="body2" sx={{ color: "#c7d2fe", fontWeight: 500, mt: 0.3 }}>
              Define the security tier, write policy description, and assign modular permissions
            </Typography>
          </Box>
        </Stack>

        {!loading && (
          <IconButton
            size="small"
            onClick={onClose}
            sx={{
              color: "#ffffff",
              bgcolor: "rgba(255, 255, 255, 0.15)",
              "&:hover": { bgcolor: "rgba(255, 255, 255, 0.25)" },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 2.5, md: 3.5 }, bgcolor: "#f8fafc" }}>
        {apiError && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2, fontWeight: 700 }} onClose={() => setApiError(null)}>
            {apiError}
          </Alert>
        )}

        <Stack spacing={3}>
          {/* General Details Card */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: "1px solid #e2e8f0",
              bgcolor: "#ffffff",
              boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 800, color: "#4338ca", letterSpacing: "0.5px", display: "block", mb: 2 }}>
              ROLE IDENTITY &amp; GENERAL SCOPE
            </Typography>

            <Stack spacing={2.5}>
              <TextField
                label="Role Name *"
                placeholder="e.g. Loan Underwriter, Operations Manager, Credit Officer"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={!!errors.name}
                helperText={errors.name || "Unique title for this organizational authorization role"}
                fullWidth
                required
                disabled={loading}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconShieldCheck size={18} style={{ color: "#4f46e5" }} />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: 2.5, fontWeight: 700 },
                  },
                }}
              />

              <TextField
                label="Role Description"
                placeholder="Describe operational responsibilities and permission boundaries..."
                multiline
                minRows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
                disabled={loading}
                helperText="Summary visible to administrators during user role assignment"
                slotProps={{
                  input: {
                    sx: { borderRadius: 2.5 },
                  },
                }}
              />
            </Stack>
          </Paper>

          {/* Permission Matrix Component */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: "1px solid #e2e8f0",
              bgcolor: "#ffffff",
              boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
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

      <DialogActions sx={{ p: 2.5, px: 3.5, gap: 1.5, bgcolor: "#ffffff" }}>
        <Button
          variant="outlined"
          onClick={onClose}
          disabled={loading}
          sx={{
            px: 3,
            py: 1,
            fontWeight: 800,
            borderRadius: 2.5,
            borderColor: "#cbd5e1",
            color: "#475569",
            "&:hover": { bgcolor: "#f1f5f9" },
          }}
        >
          Cancel
        </Button>

        <LoadingButton
          loading={loading}
          variant="contained"
          onClick={handleSubmit}
          startIcon={<IconDeviceFloppy size={18} />}
          sx={{
            px: 4,
            py: 1,
            fontWeight: 900,
            fontSize: "0.95rem",
            borderRadius: 2.5,
            background: "linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)",
            color: "#ffffff",
            boxShadow: "0 4px 14px rgba(79, 70, 229, 0.4)",
            "&:hover": {
              background: "linear-gradient(135deg, #4338ca 0%, #3730a3 100%)",
            },
          }}
        >
          {mode === "create" ? "Create Role" : "Save Changes"}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}