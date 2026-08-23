"use client";

import { useEffect, useState } from "react";
import { useForm, Controller, ControllerRenderProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";

import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
  Alert,
  Snackbar,
  InputAdornment,
} from "@mui/material";

import roleService from "@/services/role.service";
import userService from "@/services/user.service";
import { Role } from "@/types/role";
import { UserFormProps } from "@/types/user-components";
import {
  IconAt,
  IconMail,
  IconUser,
  IconShieldLock,
  IconLock,
  IconCheck,
  IconDeviceFloppy,
} from "@tabler/icons-react";

// ============================================================
// SCHEMAS
// ============================================================

const createUserSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(150, "Username is too long")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores"
      ),
    email: z.string().email("Invalid email address"),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string().min(8, "Please confirm your password"),
    role_id: z.number().min(1, "Please select a role"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

const editUserSchema = z.object({
  username: z.string(),
  email: z.string().email("Invalid email address"),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  role_id: z.number().min(1, "Please select a role"),
});

// ============================================================
// TYPES
// ============================================================

interface UserFormData {
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role_id: number;
  password?: string;
  confirm_password?: string;
}

export default function UserForm({
  mode,
  user,
  onSuccess,
  onCancel,
}: UserFormProps) {
  const [loading, setLoading] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);
  const [error, setError] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  const schema = mode === "create" ? createUserSchema : editUserSchema;

  const {
    control,
    handleSubmit,
    formState: { errors },
    setError: setFieldError,
    reset,
  } = useForm<UserFormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      username: user?.username ?? "",
      email: user?.email ?? "",
      first_name: user?.first_name ?? "",
      last_name: user?.last_name ?? "",
      role_id: user?.role?.id ?? 0,
      ...(mode === "create"
        ? {
            password: "",
            confirm_password: "",
          }
        : {}),
    },
  });

  // Load Roles
  useEffect(() => {
    async function loadRoles() {
      try {
        setRolesLoading(true);
        const fetchedRoles = await roleService.getRoles();
        setRoles(Array.isArray(fetchedRoles) ? fetchedRoles : []);
      } catch (err) {
        console.error("Failed to load roles:", err);
      } finally {
        setRolesLoading(false);
      }
    }
    loadRoles();
  }, []);

  // Sync default values when user prop changes
  useEffect(() => {
    if (user && mode === "edit") {
      reset({
        username: user.username,
        email: user.email,
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        role_id: user.role?.id ?? 0,
      });
    }
  }, [user, mode, reset]);

  const onSubmit = async (data: UserFormData) => {
    try {
      setLoading(true);
      setError("");

      if (mode === "create") {
        await userService.createUser({
          username: data.username,
          email: data.email,
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          password: data.password!,
          confirm_password: data.confirm_password!,
          role_id: data.role_id,
        });
        setSnackbar({
          open: true,
          message: "User created successfully!",
          severity: "success",
        });
      } else if (user) {
        await userService.updateUser(user.id, {
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          email: data.email,
          role_id: data.role_id,
        });
        setSnackbar({
          open: true,
          message: "User updated successfully!",
          severity: "success",
        });
      }

      setTimeout(async () => {
        await onSuccess();
      }, 500);
    } catch (err: any) {
      console.error(err);
      if (axios.isAxiosError(err) && err.response?.data) {
        const errorData = err.response.data;
        if (typeof errorData === "object") {
          Object.keys(errorData).forEach((field) => {
            const message = Array.isArray(errorData[field])
              ? errorData[field][0]
              : errorData[field];
            if (field in data) {
              setFieldError(field as any, { message });
            } else {
              setError(message);
            }
          });
        } else {
          setError(err.response.data.detail || "An error occurred.");
        }
      } else {
        setError("Failed to process request. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fullName = user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username : "";

  return (
    <>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {/* User Context Banner when Editing */}
        {mode === "edit" && user && (
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              mb: 3,
              borderRadius: 2.5,
              bgcolor: "#f8fafc",
              border: "1px solid #e2e8f0",
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                sx={{
                  width: 50,
                  height: 50,
                  bgcolor: "primary.main",
                  fontWeight: 700,
                  fontSize: "1.2rem",
                }}
              >
                {(user.first_name || user.username).charAt(0).toUpperCase()}
              </Avatar>

              <Box flex={1}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Typography variant="subtitle1" fontWeight={800}>
                    {fullName}
                  </Typography>
                  <Chip
                    label={user.is_active ? "● Active Account" : "Inactive"}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.72rem",
                      bgcolor: user.is_active ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                      color: user.is_active ? "#059669" : "#dc2626",
                    }}
                  />
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  Account ID: #{user.id} • Username: @{user.username}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        )}

        <Grid container spacing={2.5}>
          {/* Username */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="username"
              control={control}
              render={({ field }: { field: ControllerRenderProps<UserFormData, "username"> }) => (
                <TextField
                  {...field}
                  fullWidth
                  required
                  label="Username"
                  placeholder="johndoe"
                  error={!!errors.username}
                  helperText={
                    errors.username?.message ||
                    (mode === "edit" ? "Unique system handle (immutable)" : undefined)
                  }
                  disabled={loading || mode === "edit"}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <IconAt size={18} style={{ color: "#94a3b8" }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              )}
            />
          </Grid>

          {/* Email */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="email"
              control={control}
              render={({ field }: { field: ControllerRenderProps<UserFormData, "email"> }) => (
                <TextField
                  {...field}
                  fullWidth
                  required
                  type="email"
                  label="Email Address"
                  placeholder="john@example.com"
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  disabled={loading}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <IconMail size={18} style={{ color: "#94a3b8" }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              )}
            />
          </Grid>

          {/* First Name */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="first_name"
              control={control}
              render={({ field }: { field: ControllerRenderProps<UserFormData, "first_name"> }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="First Name"
                  placeholder="Caroline"
                  error={!!errors.first_name}
                  helperText={errors.first_name?.message}
                  disabled={loading}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <IconUser size={18} style={{ color: "#94a3b8" }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              )}
            />
          </Grid>

          {/* Last Name */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="last_name"
              control={control}
              render={({ field }: { field: ControllerRenderProps<UserFormData, "last_name"> }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Last Name"
                  placeholder="Karanja"
                  error={!!errors.last_name}
                  helperText={errors.last_name?.message}
                  disabled={loading}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <IconUser size={18} style={{ color: "#94a3b8" }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              )}
            />
          </Grid>

          {/* Password fields (Create mode only) */}
          {mode === "create" && (
            <>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="password"
                  control={control}
                  render={({ field }: { field: ControllerRenderProps<UserFormData, "password"> }) => (
                    <TextField
                      {...field}
                      fullWidth
                      required
                      type="password"
                      label="Password"
                      placeholder="••••••••"
                      error={!!errors.password}
                      helperText={errors.password?.message}
                      disabled={loading}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <IconLock size={18} style={{ color: "#94a3b8" }} />
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="confirm_password"
                  control={control}
                  render={({ field }: { field: ControllerRenderProps<UserFormData, "confirm_password"> }) => (
                    <TextField
                      {...field}
                      fullWidth
                      required
                      type="password"
                      label="Confirm Password"
                      placeholder="••••••••"
                      error={!!errors.confirm_password}
                      helperText={errors.confirm_password?.message}
                      disabled={loading}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <IconLock size={18} style={{ color: "#94a3b8" }} />
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                  )}
                />
              </Grid>
            </>
          )}

          {/* Assigned Role */}
          <Grid size={{ xs: 12 }}>
            <Controller
              name="role_id"
              control={control}
              render={({ field }: { field: ControllerRenderProps<UserFormData, "role_id"> }) => (
                <TextField
                  select
                  fullWidth
                  required
                  label="Assigned Authorization Role"
                  value={rolesLoading ? 0 : (field.value ?? 0)}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  error={!!errors.role_id}
                  helperText={
                    errors.role_id?.message ||
                    "Assigning a role grants all permissions configured under that security tier"
                  }
                  disabled={loading || rolesLoading}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <IconShieldLock size={18} style={{ color: "#94a3b8" }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                >
                  <MenuItem value={0} disabled>
                    {rolesLoading ? "Loading roles..." : "Select an authorization role"}
                  </MenuItem>
                  {roles.map((role) => (
                    <MenuItem key={role.id} value={role.id} sx={{ py: 1.5 }}>
                      <Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography fontWeight={700} variant="body2">
                            {role.name}
                          </Typography>
                          {role.is_system_role && (
                            <Chip label="System Core" size="small" color="warning" sx={{ height: 20, fontSize: "0.68rem" }} />
                          )}
                        </Stack>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {role.description || "Configured organization role"}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>
        </Grid>

        {/* Actions */}
        <Box
          sx={{
            mt: 4,
            pt: 2.5,
            borderTop: "1px solid",
            borderColor: "divider",
            display: "flex",
            justifyContent: "flex-end",
            gap: 2,
          }}
        >
          <Button
            variant="outlined"
            onClick={onCancel}
            disabled={loading}
            sx={{ px: 3, fontWeight: 600, textTransform: "none" }}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="contained"
            disabled={loading || rolesLoading}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <IconDeviceFloppy size={18} />}
            sx={{
              px: 3.5,
              fontWeight: 700,
              textTransform: "none",
              bgcolor: "#2563eb",
              "&:hover": { bgcolor: "#1d4ed8" },
            }}
          >
            {loading ? "Saving..." : mode === "create" ? "Create Account" : "Save Changes"}
          </Button>
        </Box>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}