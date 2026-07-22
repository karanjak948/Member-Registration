"use client";

import React, { useEffect, useState } from "react";

import {
  Alert,
  Box,
  Button,
  IconButton,
  InputAdornment,
  Stack,
} from "@mui/material";

import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";

import Link from "next/link";

import { useRouter } from "next/navigation";

import api from "@/services/api";

import CustomTextField from "@/app/(DashboardLayout)/components/forms/theme-elements/CustomTextField";

export default function AuthResetPassword() {
  const router = useRouter();

  const [resetToken, setResetToken] = useState("");

  const [newPassword, setNewPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState(false);

  /*
   * Retrieve the temporary authorization
   * created only after successful OTP
   * verification.
   */
  useEffect(() => {
    const storedToken = sessionStorage.getItem("password_reset_token");

    if (!storedToken) {
      router.replace("/authentication/forgot-password");

      return;
    }

    setResetToken(storedToken);
  }, [router]);

  function extractApiError(err: any): string {
    const data = err?.response?.data;

    if (!data) {
      return (
        "Unable to reset the password. " +
        "Your reset authorization may have expired."
      );
    }

    if (typeof data === "string") {
      return data;
    }

    if (data.detail) {
      return String(data.detail);
    }

    const tokenError = data?.reset_token?.[0];

    if (tokenError) {
      return String(tokenError);
    }

    const passwordError = data?.new_password?.[0];

    if (passwordError) {
      return String(passwordError);
    }

    const confirmError = data?.confirm_password?.[0];

    if (confirmError) {
      return String(confirmError);
    }

    const nonFieldError = data?.non_field_errors?.[0];

    if (nonFieldError) {
      return String(nonFieldError);
    }

    return (
      "Unable to reset the password. " +
      "Please request a new verification code."
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) {
      return;
    }

    if (!resetToken) {
      setError(
        "Your password reset authorization is missing. Please request a new verification code.",
      );

      return;
    }

    if (!newPassword) {
      setError("New password is required.");

      return;
    }

    if (!confirmPassword) {
      setError("Please confirm your new password.");

      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");

      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.post("/auth/reset-password/", {
        reset_token: resetToken,

        new_password: newPassword,

        confirm_password: confirmPassword,
      });

      /*
       * Recovery authorization must not survive
       * successful password reset.
       */
      sessionStorage.removeItem("password_reset_token");

      sessionStorage.removeItem("password_reset_email");

      setNewPassword("");
      setConfirmPassword("");

      setSuccess(true);
    } catch (err: any) {
      console.error("Password reset failed:", err);

      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <Stack spacing={3}>
        <Alert severity="success">
          Your password has been reset successfully. Sign in using your username
          and new password.
        </Alert>

        <Button
          component={Link}
          href="/authentication/login"
          fullWidth
          size="large"
          variant="contained"
        >
          Go To Sign In
        </Button>
      </Stack>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Stack spacing={3}>
        <CustomTextField
          fullWidth
          required
          label="New Password"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          value={newPassword}
          disabled={loading || !resetToken}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            setNewPassword(event.target.value);

            if (error) {
              setError("");
            }
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  type="button"
                  edge="end"
                  disabled={loading}
                  aria-label={
                    showPassword ? "Hide new password" : "Show new password"
                  }
                  onClick={() => setShowPassword((previous) => !previous)}
                >
                  {showPassword ? (
                    <VisibilityOffOutlinedIcon />
                  ) : (
                    <VisibilityOutlinedIcon />
                  )}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <CustomTextField
          fullWidth
          required
          label="Confirm New Password"
          type={showConfirmPassword ? "text" : "password"}
          autoComplete="new-password"
          value={confirmPassword}
          disabled={loading || !resetToken}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            setConfirmPassword(event.target.value);

            if (error) {
              setError("");
            }
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  type="button"
                  edge="end"
                  disabled={loading}
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirmed password"
                      : "Show confirmed password"
                  }
                  onClick={() =>
                    setShowConfirmPassword((previous) => !previous)
                  }
                >
                  {showConfirmPassword ? (
                    <VisibilityOffOutlinedIcon />
                  ) : (
                    <VisibilityOutlinedIcon />
                  )}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {error && <Alert severity="error">{error}</Alert>}

        <Button
          type="submit"
          fullWidth
          size="large"
          variant="contained"
          disabled={loading || !resetToken}
        >
          {loading ? "Resetting Password..." : "Reset Password"}
        </Button>

        <Button
          component={Link}
          href="/authentication/login"
          variant="text"
          fullWidth
          disabled={loading}
        >
          Back To Sign In
        </Button>
      </Stack>
    </Box>
  );
}
