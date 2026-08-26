"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  LinearProgress,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  IconArrowLeft,
  IconLock,
  IconCheck,
  IconX,
  IconEye,
  IconEyeOff,
  IconDeviceFloppy,
  IconShieldLock,
  IconKey,
  IconShieldCheck,
  IconAlertCircle,
  IconUser,
  IconBuildingBank,
} from "@tabler/icons-react";

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
        label: "Awaiting Input",
        color: "inherit" as const,
        barColor: "#e2e8f0",
      };
    }

    if (passed <= 2) {
      return {
        score: 25,
        label: "Weak",
        color: "error" as const,
        barColor: "#ef4444",
      };
    }

    if (passed === 3) {
      return {
        score: 50,
        label: "Fair",
        color: "warning" as const,
        barColor: "#f59e0b",
      };
    }

    if (passed === 4) {
      return {
        score: 75,
        label: "Good",
        color: "info" as const,
        barColor: "#0284c7",
      };
    }

    return {
      score: 100,
      label: "Strong & Secure",
      color: "success" as const,
      barColor: "#059669",
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
    if (!value) return undefined;
    if (Array.isArray(value)) {
      return value.length > 0 ? String(value[0]) : undefined;
    }
    return String(value);
  }

  async function handleSubmit(e?: FormEvent<HTMLFormElement>) {
    e?.preventDefault();
    if (loading) return;
    if (!validateForm()) return;

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
            "Unable to update your password. Check the requirements below."
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
    label: string
  ) => (
    <InputAdornment position="end">
      <IconButton
        edge="end"
        onClick={onToggle}
        onMouseDown={(e) => e.preventDefault()}
        aria-label={label}
        sx={{ color: "#64748b" }}
      >
        {visible ? <IconEyeOff size={18} /> : <IconEye size={18} />}
      </IconButton>
    </InputAdornment>
  );

  const RequirementItem = ({
    passed,
    label,
  }: {
    passed: boolean;
    label: string;
  }) => (
    <Box
      sx={{
        p: 1.2,
        borderRadius: 2,
        bgcolor: passed ? "#f0fdf4" : "#f8fafc",
        border: `1px solid ${passed ? "#bbf7d0" : "#e2e8f0"}`,
        display: "flex",
        alignItems: "center",
        gap: 1.2,
        transition: "all 0.2s ease",
      }}
    >
      <Box
        sx={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          bgcolor: passed ? "#ecfdf5" : "#e2e8f0",
          color: passed ? "#059669" : "#94a3b8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {passed ? <IconCheck size={13} stroke={3} /> : <IconX size={13} stroke={2.5} />}
      </Box>
      <Typography
        variant="caption"
        sx={{
          fontWeight: passed ? 800 : 600,
          color: passed ? "#065f46" : "#64748b",
        }}
      >
        {label}
      </Typography>
    </Box>
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 1, mb: 6 }}>
      {/* ------------------------------------------------------------- */}
      {/* Header Banner */}
      {/* ------------------------------------------------------------- */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3.5 },
          mb: 4,
          borderRadius: 3.5,
          background: "linear-gradient(135deg, #064e3b 0%, #047857 60%, #059669 100%)",
          color: "#ffffff",
          boxShadow: "0 10px 28px rgba(6, 78, 59, 0.22)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <IconButton
            onClick={() => router.push("/profile")}
            aria-label="Back to profile"
            sx={{
              bgcolor: "rgba(255, 255, 255, 0.15)",
              color: "#ffffff",
              borderRadius: 2.5,
              "&:hover": { bgcolor: "rgba(255, 255, 255, 0.25)" },
            }}
          >
            <IconArrowLeft size={22} />
          </IconButton>

          <Box>
            <Typography variant="h5" fontWeight={900} sx={{ color: "#ffffff", letterSpacing: "-0.4px" }}>
              Change Account Password
            </Typography>
            <Typography variant="caption" sx={{ color: "#d1fae5", fontWeight: 600 }}>
              Strengthen credential protection and refresh your login authentication
            </Typography>
          </Box>
        </Stack>

        <Chip
          icon={<IconShieldLock size={16} color="#ffffff" />}
          label="Security Vault"
          size="small"
          sx={{
            bgcolor: "rgba(255, 255, 255, 0.2)",
            color: "#ffffff",
            fontWeight: 800,
            borderRadius: 2,
          }}
        />
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2.5, fontWeight: 700 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2-Column Responsive Layout */}
      {/* ------------------------------------------------------------- */}
      <Grid container spacing={3}>
        {/* LEFT COLUMN: Security Policy & Requirements Checklist */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={3}>
            {/* Password Policy Card */}
            <Paper
              elevation={0}
              sx={{
                p: 3.5,
                borderRadius: 3,
                border: "1px solid #e2e8f0",
                bgcolor: "#ffffff",
                boxShadow: "0 4px 16px rgba(15, 23, 42, 0.04)",
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: 2,
                    bgcolor: "#ecfdf5",
                    color: "#059669",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconShieldCheck size={22} />
                </Box>
                <Box>
                  <Typography variant="subtitle1" fontWeight={800} color="#0f172a">
                    Security Requirements
                  </Typography>
                  <Typography variant="caption" color="#64748b" fontWeight={600}>
                    Mandatory password complexity
                  </Typography>
                </Box>
              </Stack>

              <Divider sx={{ my: 2 }} />

              {/* Requirements Checklist */}
              <Stack spacing={1.2}>
                <RequirementItem
                  passed={requirements.length}
                  label="Minimum 8 characters in length"
                />
                <RequirementItem
                  passed={requirements.uppercase}
                  label="At least 1 uppercase letter (A-Z)"
                />
                <RequirementItem
                  passed={requirements.lowercase}
                  label="At least 1 lowercase letter (a-z)"
                />
                <RequirementItem
                  passed={requirements.number}
                  label="At least 1 numerical digit (0-9)"
                />
                <RequirementItem
                  passed={requirements.special}
                  label="At least 1 special symbol (!@#$%^&*)"
                />
              </Stack>

              {/* Password Matching Live Indicator */}
              {form.confirm_password && (
                <Box
                  sx={{
                    mt: 2.5,
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: passwordsMatch ? "#f0fdf4" : "#fef2f2",
                    border: `1px solid ${passwordsMatch ? "#bbf7d0" : "#fecaca"}`,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  {passwordsMatch ? (
                    <IconCheck size={16} color="#059669" stroke={3} />
                  ) : (
                    <IconX size={16} color="#dc2626" stroke={3} />
                  )}
                  <Typography
                    variant="caption"
                    fontWeight={800}
                    color={passwordsMatch ? "#065f46" : "#991b1b"}
                  >
                    {passwordsMatch
                      ? "Confirmation passwords match"
                      : "Passwords do not match"}
                  </Typography>
                </Box>
              )}
            </Paper>

            {/* Quick Best Practice Card */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                border: "1px solid #bbf7d0",
                bgcolor: "#f0fdf4",
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <IconAlertCircle size={20} color="#059669" style={{ marginTop: 2, flexShrink: 0 }} />
                <Box>
                  <Typography variant="subtitle2" fontWeight={800} color="#065f46">
                    Security Recommendation
                  </Typography>
                  <Typography variant="caption" color="#047857" fontWeight={600} sx={{ display: "block", mt: 0.5, lineHeight: 1.5 }}>
                    Never share your Royal SACCO login credentials with third parties. Use a unique password not shared with any external personal accounts.
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Stack>
        </Grid>

        {/* RIGHT COLUMN: Password Update Form */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 4.5 },
              borderRadius: 3,
              border: "1px solid #e2e8f0",
              bgcolor: "#ffffff",
              boxShadow: "0 4px 16px rgba(15, 23, 42, 0.04)",
            }}
          >
            <Typography variant="h6" fontWeight={800} color="#0f172a">
              Enter Credential Details
            </Typography>
            <Typography variant="caption" color="#64748b" fontWeight={600}>
              Verify your current password to authorize setting the new credentials
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Grid container spacing={3}>
                {/* Current Password */}
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
                      errors.current_password ?? "Enter the existing password you currently use to sign in."
                    }
                    disabled={loading}
                    autoComplete="current-password"
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <IconKey size={18} color="#64748b" />
                          </InputAdornment>
                        ),
                        endAdornment: passwordAdornment(
                          visibility.current,
                          () => toggleVisibility("current"),
                          visibility.current ? "Hide password" : "Show password"
                        ),
                      },
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2.5,
                        bgcolor: "#f8fafc",
                        "&:hover fieldset": { borderColor: "#059669" },
                        "&.Mui-focused fieldset": { borderColor: "#059669" },
                      },
                    }}
                  />
                </Grid>

                {/* New Password */}
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
                      errors.new_password ?? "Choose a robust passphrase fulfilling the policy on the left."
                    }
                    disabled={loading}
                    autoComplete="new-password"
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <IconLock size={18} color="#64748b" />
                          </InputAdornment>
                        ),
                        endAdornment: passwordAdornment(
                          visibility.new,
                          () => toggleVisibility("new"),
                          visibility.new ? "Hide new password" : "Show new password"
                        ),
                      },
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2.5,
                        bgcolor: "#f8fafc",
                        "&:hover fieldset": { borderColor: "#059669" },
                        "&.Mui-focused fieldset": { borderColor: "#059669" },
                      },
                    }}
                  />
                </Grid>

                {/* Live Password Strength Meter */}
                {form.new_password && (
                  <Grid size={{ xs: 12 }}>
                    <Box
                      sx={{
                        p: 2.5,
                        borderRadius: 2.5,
                        bgcolor: "#f8fafc",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.2}>
                        <Typography variant="caption" fontWeight={800} color="#334155" textTransform="uppercase">
                          Calculated Strength
                        </Typography>

                        <Chip
                          size="small"
                          label={strength.label}
                          color={strength.color === "inherit" ? "default" : strength.color}
                          sx={{ fontWeight: 800, fontSize: "0.72rem", borderRadius: 1.5 }}
                        />
                      </Stack>

                      <LinearProgress
                        variant="determinate"
                        value={strength.score}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: "#e2e8f0",
                          "& .MuiLinearProgress-bar": {
                            bgcolor: strength.barColor,
                            borderRadius: 4,
                          },
                        }}
                      />
                    </Box>
                  </Grid>
                )}

                {/* Confirm New Password */}
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
                        : "Re-enter the new password to confirm.")
                    }
                    disabled={loading}
                    autoComplete="new-password"
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <IconLock size={18} color="#64748b" />
                          </InputAdornment>
                        ),
                        endAdornment: passwordAdornment(
                          visibility.confirm,
                          () => toggleVisibility("confirm"),
                          visibility.confirm ? "Hide confirmation" : "Show confirmation"
                        ),
                      },
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2.5,
                        bgcolor: "#f8fafc",
                        "&:hover fieldset": { borderColor: "#059669" },
                        "&.Mui-focused fieldset": { borderColor: "#059669" },
                      },
                    }}
                  />
                </Grid>
              </Grid>

              <Alert severity="info" sx={{ mt: 3.5, borderRadius: 2.5, fontWeight: 600 }}>
                After updating your password, you will use the new password on your next login session.
              </Alert>

              <Divider sx={{ my: 4 }} />

              <Stack
                direction={{ xs: "column-reverse", sm: "row" }}
                justifyContent="space-between"
                alignItems="center"
                spacing={2}
              >
                <Button
                  variant="outlined"
                  disabled={loading}
                  onClick={() => router.push("/profile")}
                  sx={{
                    fontWeight: 800,
                    borderRadius: 2,
                    px: 3,
                    borderColor: "#cbd5e1",
                    color: "#475569",
                  }}
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
                  startIcon={loading ? undefined : <IconDeviceFloppy size={18} />}
                  sx={{
                    bgcolor: "#059669",
                    color: "#ffffff",
                    fontWeight: 800,
                    borderRadius: 2,
                    px: 4,
                    py: 1.1,
                    boxShadow: "0 4px 14px rgba(5, 150, 105, 0.35)",
                    "&:hover": { bgcolor: "#047857" },
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
          </Paper>
        </Grid>
      </Grid>

      {/* Success Snackbar */}
      <Snackbar
        open={success}
        autoHideDuration={2500}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        onClose={() => setSuccess(false)}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => setSuccess(false)}
          sx={{ borderRadius: 2, fontWeight: 700 }}
        >
          Password updated successfully! Redirecting...
        </Alert>
      </Snackbar>
    </Container>
  );
}
