"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  LinearProgress,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CloseIcon from "@mui/icons-material/Close";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

import api from "@/services/api";

interface PasswordForm {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

interface PasswordErrors {
  current_password?: string;
  new_password?: string;
  confirm_password?: string;
}

interface PasswordVisibility {
  current: boolean;
  new: boolean;
  confirm: boolean;
}

export default function ChangePasswordPage() {
  const router = useRouter();

  const [form, setForm] = useState<PasswordForm>({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [errors, setErrors] = useState<PasswordErrors>({});

  const [visibility, setVisibility] = useState<PasswordVisibility>({
    current: false,
    new: false,
    confirm: false,
  });

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState(false);

  const requirements = useMemo(() => {
    const password = form.new_password;

    return {
      length: password.length >= 8,

      uppercase: /[A-Z]/.test(password),

      lowercase: /[a-z]/.test(password),

      number: /\d/.test(password),

      special: /[^A-Za-z0-9]/.test(password),
    };
  }, [form.new_password]);

  const strength = useMemo(() => {
    const passed = Object.values(requirements).filter(Boolean).length;

    if (form.new_password.length === 0) {
      return {
        score: 0,
        label: "Not entered",
        color: "inherit" as const,
      };
    }

    if (passed <= 2) {
      return {
        score: 25,
        label: "Weak",
        color: "error" as const,
      };
    }

    if (passed === 3) {
      return {
        score: 50,
        label: "Fair",
        color: "warning" as const,
      };
    }

    if (passed === 4) {
      return {
        score: 75,
        label: "Good",
        color: "info" as const,
      };
    }

    return {
      score: 100,
      label: "Strong",
      color: "success" as const,
    };
  }, [form.new_password, requirements]);

  const passwordsMatch =
    form.confirm_password.length > 0 &&
    form.new_password === form.confirm_password;

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: undefined,
    }));

    setError("");
  }

  function toggleVisibility(field: "current" | "new" | "confirm") {
    setVisibility((previous) => ({
      ...previous,
      [field]: !previous[field],
    }));
  }

  function validateForm() {
    const nextErrors: PasswordErrors = {};

    if (!form.current_password) {
      nextErrors.current_password = "Current password is required.";
    }

    if (!form.new_password) {
      nextErrors.new_password = "New password is required.";
    } else if (form.new_password.length < 8) {
      nextErrors.new_password = "Password must contain at least 8 characters.";
    } else if (
      !requirements.uppercase ||
      !requirements.lowercase ||
      !requirements.number ||
      !requirements.special
    ) {
      nextErrors.new_password =
        "Password does not meet all security requirements.";
    } else if (form.new_password === form.current_password) {
      nextErrors.new_password =
        "New password must be different from your current password.";
    }

    if (!form.confirm_password) {
      nextErrors.confirm_password = "Please confirm your new password.";
    } else if (form.new_password !== form.confirm_password) {
      nextErrors.confirm_password = "Passwords do not match.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  function getBackendError(value: unknown): string | undefined {
    if (!value) {
      return undefined;
    }

    if (Array.isArray(value)) {
      return value.length > 0 ? String(value[0]) : undefined;
    }

    return String(value);
  }

  async function handleSubmit(e?: FormEvent<HTMLFormElement>) {
    e?.preventDefault();

    if (loading) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.post("/auth/change-password/", {
        current_password: form.current_password,

        new_password: form.new_password,

        confirm_password: form.confirm_password,
      });

      setForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });

      setErrors({});

      setVisibility({
        current: false,
        new: false,
        confirm: false,
      });

      setSuccess(true);

      setTimeout(() => {
        router.push("/profile");
        router.refresh();
      }, 1500);
    } catch (err: any) {
      console.error("Password update failed:", err);

      const data = err?.response?.data;

      if (data && typeof data === "object") {
        const backendErrors: PasswordErrors = {
          current_password: getBackendError(data.current_password),

          new_password: getBackendError(data.new_password),

          confirm_password: getBackendError(data.confirm_password),
        };

        setErrors(backendErrors);

        setError(
          getBackendError(data.detail) ??
            getBackendError(data.non_field_errors) ??
            "Unable to update your password. Check the information below.",
        );
      } else {
        setError("Unable to update your password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  const passwordAdornment = (
    visible: boolean,
    onToggle: () => void,
    label: string,
  ) => (
    <InputAdornment position="end">
      <IconButton
        edge="end"
        onClick={onToggle}
        onMouseDown={(e) => e.preventDefault()}
        aria-label={label}
      >
        {visible ? <VisibilityOffIcon /> : <VisibilityIcon />}
      </IconButton>
    </InputAdornment>
  );

  const Requirement = ({
    passed,
    children,
  }: {
    passed: boolean;
    children: React.ReactNode;
  }) => (
    <Stack direction="row" spacing={1} alignItems="center">
      {passed ? (
        <CheckCircleOutlineIcon color="success" fontSize="small" />
      ) : (
        <CloseIcon color="disabled" fontSize="small" />
      )}

      <Typography
        variant="body2"
        color={passed ? "text.primary" : "text.secondary"}
      >
        {children}
      </Typography>
    </Stack>
  );

  return (
    <Container maxWidth="md">
      <Stack direction="row" spacing={2} alignItems="center" mb={1}>
        <IconButton
          onClick={() => router.push("/profile")}
          aria-label="Back to profile"
        >
          <ArrowBackIcon />
        </IconButton>

        <Typography variant="h4" fontWeight={700}>
          Change Password
        </Typography>
      </Stack>

      <Typography
        variant="body1"
        color="text.secondary"
        mb={4}
        sx={{
          ml: {
            xs: 0,
            sm: 7,
          },
        }}
      >
        Update your account password and keep your login credentials secure.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent
          sx={{
            p: {
              xs: 2.5,
              sm: 4,
            },
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: 2,
                bgcolor: "primary.main",
                color: "primary.contrastText",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <LockOutlinedIcon />
            </Box>

            <Box>
              <Typography variant="h6" fontWeight={700}>
                Password Security
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Enter your current password before choosing a new one.
              </Typography>
            </Box>
          </Stack>

          <Divider sx={{ my: 3 }} />

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  required
                  type={visibility.current ? "text" : "password"}
                  label="Current Password"
                  name="current_password"
                  value={form.current_password}
                  onChange={handleChange}
                  error={!!errors.current_password}
                  helperText={
                    errors.current_password ??
                    "Enter the password you currently use to sign in."
                  }
                  disabled={loading}
                  autoComplete="current-password"
                  slotProps={{
                    input: {
                      endAdornment: passwordAdornment(
                        visibility.current,
                        () => toggleVisibility("current"),
                        visibility.current
                          ? "Hide current password"
                          : "Show current password",
                      ),
                    },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  required
                  type={visibility.new ? "text" : "password"}
                  label="New Password"
                  name="new_password"
                  value={form.new_password}
                  onChange={handleChange}
                  error={!!errors.new_password}
                  helperText={
                    errors.new_password ??
                    "Choose a strong password you have not used for this account."
                  }
                  disabled={loading}
                  autoComplete="new-password"
                  slotProps={{
                    input: {
                      endAdornment: passwordAdornment(
                        visibility.new,
                        () => toggleVisibility("new"),
                        visibility.new
                          ? "Hide new password"
                          : "Show new password",
                      ),
                    },
                  }}
                />
              </Grid>

              {form.new_password && (
                <Grid size={{ xs: 12 }}>
                  <Box
                    sx={{
                      p: 2.5,
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 2,
                      bgcolor: "background.default",
                    }}
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      mb={1}
                    >
                      <Typography variant="subtitle2" fontWeight={700}>
                        Password Strength
                      </Typography>

                      <Chip
                        size="small"
                        label={strength.label}
                        color={
                          strength.color === "inherit"
                            ? "default"
                            : strength.color
                        }
                        variant={strength.score === 0 ? "outlined" : "filled"}
                      />
                    </Stack>

                    <LinearProgress
                      variant="determinate"
                      value={strength.score}
                      color={
                        strength.color === "inherit"
                          ? "primary"
                          : strength.color
                      }
                      sx={{
                        height: 7,
                        borderRadius: 10,
                        mb: 2.5,
                      }}
                    />

                    <Grid container spacing={1.5}>
                      <Grid
                        size={{
                          xs: 12,
                          sm: 6,
                        }}
                      >
                        <Requirement passed={requirements.length}>
                          At least 8 characters
                        </Requirement>
                      </Grid>

                      <Grid
                        size={{
                          xs: 12,
                          sm: 6,
                        }}
                      >
                        <Requirement passed={requirements.uppercase}>
                          One uppercase letter
                        </Requirement>
                      </Grid>

                      <Grid
                        size={{
                          xs: 12,
                          sm: 6,
                        }}
                      >
                        <Requirement passed={requirements.lowercase}>
                          One lowercase letter
                        </Requirement>
                      </Grid>

                      <Grid
                        size={{
                          xs: 12,
                          sm: 6,
                        }}
                      >
                        <Requirement passed={requirements.number}>
                          One number
                        </Requirement>
                      </Grid>

                      <Grid
                        size={{
                          xs: 12,
                          sm: 6,
                        }}
                      >
                        <Requirement passed={requirements.special}>
                          One special character
                        </Requirement>
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>
              )}

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  required
                  type={visibility.confirm ? "text" : "password"}
                  label="Confirm New Password"
                  name="confirm_password"
                  value={form.confirm_password}
                  onChange={handleChange}
                  error={
                    !!errors.confirm_password ||
                    (form.confirm_password.length > 0 && !passwordsMatch)
                  }
                  helperText={
                    errors.confirm_password ??
                    (form.confirm_password.length > 0
                      ? passwordsMatch
                        ? "Passwords match."
                        : "Passwords do not match."
                      : "Enter the new password again to confirm it.")
                  }
                  disabled={loading}
                  autoComplete="new-password"
                  slotProps={{
                    input: {
                      endAdornment: passwordAdornment(
                        visibility.confirm,
                        () => toggleVisibility("confirm"),
                        visibility.confirm
                          ? "Hide confirmation password"
                          : "Show confirmation password",
                      ),
                    },
                  }}
                />
              </Grid>
            </Grid>

            <Alert severity="info" sx={{ mt: 3 }}>
              After changing your password, use the new password the next time
              you sign in. Do not reuse a password from another account.
            </Alert>

            <Divider sx={{ my: 4 }} />

            <Stack
              direction={{
                xs: "column-reverse",
                sm: "row",
              }}
              justifyContent="space-between"
              spacing={2}
            >
              <Button
                variant="outlined"
                disabled={loading}
                onClick={() => router.push("/profile")}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant="contained"
                disabled={
                  loading ||
                  !form.current_password ||
                  !form.new_password ||
                  !form.confirm_password
                }
                startIcon={loading ? undefined : <SaveOutlinedIcon />}
                sx={{
                  minWidth: 180,
                }}
              >
                {loading ? (
                  <CircularProgress size={22} color="inherit" />
                ) : (
                  "Update Password"
                )}
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>

      <Snackbar
        open={success}
        autoHideDuration={2500}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        onClose={() => setSuccess(false)}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => setSuccess(false)}
        >
          Password updated successfully.
        </Alert>
      </Snackbar>
    </Container>
  );
}
