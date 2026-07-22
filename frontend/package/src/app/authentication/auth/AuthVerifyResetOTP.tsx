"use client";

import React, { useEffect, useState } from "react";

import { Alert, Box, Button, Stack, Typography } from "@mui/material";

import Link from "next/link";

import { useRouter } from "next/navigation";

import api from "@/services/api";

import CustomTextField from "@/app/(DashboardLayout)/components/forms/theme-elements/CustomTextField";

const RESEND_SECONDS = 60;

export default function AuthVerifyResetOTP() {
  const router = useRouter();

  const [email, setEmail] = useState("");

  const [otp, setOtp] = useState("");

  const [loading, setLoading] = useState(false);

  const [resending, setResending] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [countdown, setCountdown] = useState(RESEND_SECONDS);

  /*
   * Recover the email captured during the
   * Forgot Password step.
   */
  useEffect(() => {
    const storedEmail = sessionStorage.getItem("password_reset_email");

    if (!storedEmail) {
      router.replace("/authentication/forgot-password");

      return;
    }

    setEmail(storedEmail);
  }, [router]);

  /*
   * Resend countdown.
   */
  useEffect(() => {
    if (countdown <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setCountdown((previous) => Math.max(previous - 1, 0));
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [countdown]);

  function extractApiError(err: any): string {
    const data = err?.response?.data;

    if (!data) {
      return "Unable to verify the code. " + "Please try again.";
    }

    if (typeof data === "string") {
      return data;
    }

    if (data.detail) {
      return String(data.detail);
    }

    const otpError = data?.otp?.[0];

    if (otpError) {
      return String(otpError);
    }

    const emailError = data?.email?.[0];

    if (emailError) {
      return String(emailError);
    }

    return "The verification code is invalid " + "or has expired.";
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading || !email) {
      return;
    }

    const normalizedOtp = otp.trim();

    if (!/^\d{6}$/.test(normalizedOtp)) {
      setError("Enter the 6-digit verification code sent to your email.");

      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await api.post("/auth/verify-reset-otp/", {
        email,
        otp: normalizedOtp,
      });

      const resetToken = response.data?.reset_token;

      if (!resetToken) {
        throw new Error("Reset authorization token was not returned.");
      }

      /*
       * The reset token is temporary recovery
       * authorization. Keep it in sessionStorage,
       * not in the URL.
       */
      sessionStorage.setItem("password_reset_token", resetToken);

      /*
       * The OTP itself should not persist after
       * successful verification.
       */
      setOtp("");

      router.push("/authentication/reset-password");
    } catch (err: any) {
      console.error("OTP verification failed:", err);

      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resending || countdown > 0 || !email) {
      return;
    }

    setResending(true);
    setError("");
    setSuccess("");

    try {
      await api.post("/auth/forgot-password/", {
        email,
      });

      /*
       * A newly issued OTP invalidates the
       * previous OTP on the backend.
       */
      setOtp("");

      sessionStorage.removeItem("password_reset_token");

      setCountdown(RESEND_SECONDS);

      setSuccess("A new verification code has been sent.");
    } catch (err) {
      console.error("OTP resend failed:", err);

      setError("Unable to resend the verification code. Please try again.");
    } finally {
      setResending(false);
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Stack spacing={3}>
        <Box>
          <Typography variant="body2" color="text.secondary">
            Enter the 6-digit verification code sent to
          </Typography>

          <Typography
            variant="subtitle2"
            fontWeight={600}
            sx={{
              wordBreak: "break-word",
            }}
          >
            {email || "your registered email address"}
          </Typography>
        </Box>

        <CustomTextField
          fullWidth
          required
          label="Verification Code"
          value={otp}
          disabled={loading || !email}
          inputProps={{
            inputMode: "numeric",

            maxLength: 6,

            pattern: "[0-9]*",

            autoComplete: "one-time-code",
          }}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            /*
             * Keep only digits and enforce
             * six characters client-side.
             */
            const value = event.target.value.replace(/\D/g, "").slice(0, 6);

            setOtp(value);

            if (error) {
              setError("");
            }

            if (success) {
              setSuccess("");
            }
          }}
        />

        {error && <Alert severity="error">{error}</Alert>}

        {success && <Alert severity="success">{success}</Alert>}

        <Button
          type="submit"
          fullWidth
          size="large"
          variant="contained"
          disabled={loading || !email || otp.length !== 6}
        >
          {loading ? "Verifying..." : "Verify Code"}
        </Button>

        <Button
          type="button"
          variant="text"
          fullWidth
          disabled={resending || countdown > 0 || !email}
          onClick={handleResend}
        >
          {resending
            ? "Sending..."
            : countdown > 0
              ? `Resend Code in ${countdown}s`
              : "Resend Code"}
        </Button>

        <Button
          component={Link}
          href="/authentication/forgot-password"
          variant="text"
          fullWidth
          disabled={loading || resending}
        >
          Use a Different Email
        </Button>

        <Button
          component={Link}
          href="/authentication/login"
          variant="text"
          fullWidth
          disabled={loading || resending}
        >
          Back To Sign In
        </Button>
      </Stack>
    </Box>
  );
}
