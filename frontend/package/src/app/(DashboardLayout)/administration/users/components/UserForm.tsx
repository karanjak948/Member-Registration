"use client";

import { useEffect, useState } from "react";
import { useForm, Controller, ControllerRenderProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";

import {
  Box,
  Button,
  CircularProgress,
  Grid,
  MenuItem,
  TextField,
  Alert,
  Snackbar,
} from "@mui/material";

import roleService from "@/services/role.service";
import userService from "@/services/user.service";
import { Role } from "@/types/role";
import { UserFormProps } from "@/types/user-components";

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

// ============================================================
// COMPONENT
// ============================================================

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

  const schema =
    mode === "create" ? createUserSchema : editUserSchema;

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

  // ============================================================
  // LOAD ROLES
  // ============================================================

  useEffect(() => {
    async function loadRoles() {
      try {
        setRolesLoading(true);

        const data = await roleService.getRoles();

        setRoles(data);
      } catch (err) {
        console.error("Failed to load roles:", err);
        setError("Unable to load roles. Please refresh and try again.");
      } finally {
        setRolesLoading(false);
      }
    }
    loadRoles();
  }, []);

  // ============================================================
  // RESET FORM WHEN USER CHANGES
  // ============================================================

  useEffect(() => {
    if (mode === "edit" && user) {
      reset({
        username: user.username,
        email: user.email,
        first_name: user.first_name ?? "",
        last_name: user.last_name ?? "",
        role_id: user.role.id,
      });
    }
  }, [mode, user, reset]);

  // ============================================================
  // SUBMIT
  // ============================================================

  const onSubmit = async (data: UserFormData) => {
    setLoading(true);
    setError("");

    try {
      if (mode === "create") {
        // Create mode
        const payload = {
          username: data.username,
          email: data.email,
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          password: data.password!,
          confirm_password: data.confirm_password!,
          role_id: data.role_id,
        };

        await userService.createUser(payload);

        reset();

        setSnackbar({
          open: true,
          message: "User created successfully!",
          severity: "success",
        });
      } else {
        // Edit mode
        await userService.updateUser(user!.id, {
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

      await onSuccess();
    } catch (error: unknown) {
      console.error(`Failed to ${mode} user:`, error);

      // Handle field-specific errors from backend
      if (axios.isAxiosError(error)) {
        const responseData = error.response?.data;
        if (responseData && typeof responseData === "object") {
          if (responseData.username) {
            setFieldError("username", {
              type: "manual",
              message: Array.isArray(responseData.username)
                ? responseData.username[0]
                : responseData.username,
            });
          }
          if (responseData.email) {
            setFieldError("email", {
              type: "manual",
              message: Array.isArray(responseData.email)
                ? responseData.email[0]
                : responseData.email,
            });
          }
          if (responseData.role_id) {
            setFieldError("role_id", {
              type: "manual",
              message: Array.isArray(responseData.role_id)
                ? responseData.role_id[0]
                : responseData.role_id,
            });
          }
          if (responseData.detail) {
            setError(responseData.detail);
          } else {
            setError(`Unable to ${mode} user. Please check the form and try again.`);
          }
        } else {
          setError(`Unable to ${mode} user. Please try again.`);
        }
      } else {
        setError(`Unable to ${mode} user. Please try again.`);
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Username */}
          <Grid size={{ xs: 12, md: 6 }}>
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
                  helperText={errors.username?.message}
                  disabled={loading || mode === "edit"}
                  autoComplete="username"
                />
              )}
            />
          </Grid>

          {/* Email */}
          <Grid size={{ xs: 12, md: 6 }}>
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
                  autoComplete="email"
                />
              )}
            />
          </Grid>

          {/* First Name */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="first_name"
              control={control}
              render={({ field }: { field: ControllerRenderProps<UserFormData, "first_name"> }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="First Name"
                  placeholder="John"
                  error={!!errors.first_name}
                  helperText={errors.first_name?.message}
                  disabled={loading}
                  autoComplete="given-name"
                />
              )}
            />
          </Grid>

          {/* Last Name */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="last_name"
              control={control}
              render={({ field }: { field: ControllerRenderProps<UserFormData, "last_name"> }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Last Name"
                  placeholder="Doe"
                  error={!!errors.last_name}
                  helperText={errors.last_name?.message}
                  disabled={loading}
                  autoComplete="family-name"
                />
              )}
            />
          </Grid>

          {/* Password - Only show in create mode */}
          {mode === "create" && (
            <>
              <Grid size={{ xs: 12, md: 6 }}>
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
                      autoComplete="new-password"
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
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
                      autoComplete="new-password"
                    />
                  )}
                />
              </Grid>
            </>
          )}

          {/* Role */}
          <Grid size={{ xs: 12 }}>
            <Controller
              name="role_id"
              control={control}
              render={({ field }: { field: ControllerRenderProps<UserFormData, "role_id"> }) => (
                <TextField
                  select
                  fullWidth
                  required
                  label="Role"
                  value={rolesLoading ? 0 : (field.value ?? 0)}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  error={!!errors.role_id}
                  helperText={errors.role_id?.message}
                  disabled={loading || rolesLoading}
                  slotProps={{
                    select: {
                      displayEmpty: true,
                    },
                  }}
                >
                  <MenuItem value={0} disabled>
                    {rolesLoading ? "Loading roles..." : "Select a role"}
                  </MenuItem>
                  {roles.map((role) => (
                    <MenuItem key={role.id} value={role.id}>
                      {role.name}
                    </MenuItem>
                  ))}
                  {!rolesLoading && roles.length === 0 && (
                    <MenuItem value={0} disabled>
                      No roles available
                    </MenuItem>
                  )}
                </TextField>
              )}
            />
          </Grid>
        </Grid>

        {/* Actions */}
        <Box
          sx={{
            mt: 4,
            pt: 3,
            borderTop: "1px solid",
            borderColor: "divider",
            display: "flex",
            justifyContent: "flex-end",
            gap: 2,
          }}
        >
          <Button variant="outlined" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>

          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{ minWidth: 140 }}
          >
            {loading ? (
              <CircularProgress size={22} color="inherit" />
            ) : mode === "create" ? (
              "Create User"
            ) : (
              "Save Changes"
            )}
          </Button>
        </Box>
      </Box>

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
    </>
  );
}