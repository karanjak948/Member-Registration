"use client";

import React, { useState } from "react";

import {
  Alert,
  Box,
  Button,
  IconButton,
  InputAdornment,
  Stack,
  Typography,
} from "@mui/material";

import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";

import { useRouter } from "next/navigation";

import api from "@/services/api";

import CustomTextField from "@/app/(DashboardLayout)/components/forms/theme-elements/CustomTextField";

interface RegisterType {
  title?: string;
  subtitle?: React.ReactNode;
  subtext?: React.ReactNode;
}

interface RegisterForm {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirm_password: string;
}

const initialForm: RegisterForm = {
  username: "",
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  confirm_password: "",
};

const AuthRegister = ({ title, subtitle, subtext }: RegisterType) => {
  const router = useRouter();

  const [form, setForm] = useState<RegisterForm>(initialForm);

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  }

  function extractApiError(err: any): string {
    const data = err?.response?.data;

    if (!data) {
      return "Unable to create the account. " + "Please try again.";
    }

    if (typeof data === "string") {
      return data;
    }

    if (data.detail) {
      return String(data.detail);
    }

    const firstError = Object.values(data)[0];

    if (Array.isArray(firstError)) {
      return String(firstError[0]);
    }

    if (firstError && typeof firstError === "object") {
      const nested = Object.values(firstError)[0];

      if (Array.isArray(nested)) {
        return String(nested[0]);
      }

      if (nested) {
        return String(nested);
      }
    }

    return (
      "Unable to create the account. " + "Please check the entered details."
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) {
      return;
    }

    if (!form.username.trim()) {
      setError("Username is required.");
      return;
    }

    if (!form.email.trim()) {
      setError("Email address is required.");
      return;
    }

    if (!form.password) {
      setError("Password is required.");
      return;
    }

    if (form.password !== form.confirm_password) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.post("/auth/register/", {
        username: form.username.trim(),

        first_name: form.first_name.trim(),

        last_name: form.last_name.trim(),

        email: form.email.trim().toLowerCase(),

        password: form.password,

        confirm_password: form.confirm_password,
      });

      router.push("/authentication/login?registered=1");
    } catch (err: any) {
      console.error("Registration failed:", err);

      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {title && (
        <Typography fontWeight={700} variant="h2" mb={1}>
          {title}
        </Typography>
      )}

      {subtext}

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack spacing={2.5}>
          <CustomTextField
            fullWidth
            required
            label="Username"
            name="username"
            autoComplete="username"
            value={form.username}
            onChange={handleChange}
            disabled={loading}
          />

          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            spacing={2}
          >
            <CustomTextField
              fullWidth
              label="First Name"
              name="first_name"
              autoComplete="given-name"
              value={form.first_name}
              onChange={handleChange}
              disabled={loading}
            />

            <CustomTextField
              fullWidth
              label="Last Name"
              name="last_name"
              autoComplete="family-name"
              value={form.last_name}
              onChange={handleChange}
              disabled={loading}
            />
          </Stack>

          <CustomTextField
            fullWidth
            required
            type="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            disabled={loading}
          />

          <CustomTextField
            fullWidth
            required
            label="Password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={form.password}
            onChange={handleChange}
            disabled={loading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    type="button"
                    edge="end"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
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
            label="Confirm Password"
            name="confirm_password"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            value={form.confirm_password}
            onChange={handleChange}
            disabled={loading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    type="button"
                    edge="end"
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
            color="primary"
            variant="contained"
            size="large"
            fullWidth
            type="submit"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </Button>
        </Stack>
      </Box>

      {subtitle}
    </>
  );
};

export default AuthRegister;
