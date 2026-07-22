"use client";

import React, { useState } from "react";

import { Alert, Box, Button, Stack } from "@mui/material";

import Link from "next/link";

import { useRouter } from "next/navigation";

import api from "@/services/api";

import CustomTextField from "@/app/(DashboardLayout)/components/forms/theme-elements/CustomTextField";

export default function AuthForgotPassword() {
  const router = useRouter();

  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) {
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Email address is required.");

      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.post("/auth/forgot-password/", {
        email: normalizedEmail,
      });

      /*
       * Store only temporary recovery context.
       *
       * sessionStorage is preferable to localStorage
       * here because the recovery state should not
       * persist indefinitely across browser sessions.
       */
      sessionStorage.setItem("password_reset_email", normalizedEmail);

      /*
       * Remove any stale authorization token left
       * from an earlier recovery attempt.
       */
      sessionStorage.removeItem("password_reset_token");

      router.push("/authentication/verify-reset-otp");
    } catch (err) {
      console.error("Password reset request failed:", err);

      setError(
        "Unable to process the password reset request. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Stack spacing={3}>
        <CustomTextField
          fullWidth
          required
          type="email"
          label="Email Address"
          autoComplete="email"
          value={email}
          disabled={loading}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            setEmail(event.target.value);

            if (error) {
              setError("");
            }
          }}
        />

        {error && <Alert severity="error">{error}</Alert>}

        <Button
          type="submit"
          fullWidth
          size="large"
          variant="contained"
          disabled={loading}
        >
          {loading ? "Sending Code..." : "Send Verification Code"}
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
