"use client";

import React, { useState } from "react";

import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  IconButton,
  InputAdornment,
  Stack,
  Typography,
} from "@mui/material";

import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

import CustomTextField from "@/app/(DashboardLayout)/components/forms/theme-elements/CustomTextField";

interface LoginType {
  title?: string;
  subtitle?: React.ReactNode;
  subtext?: React.ReactNode;
}

const AuthLogin = ({ title, subtitle, subtext }: LoginType) => {
  const router = useRouter();

  const [username, setUsername] = useState("");

  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) {
      return;
    }

    const normalizedUsername = username.trim();

    if (!normalizedUsername) {
      setError("Username is required.");
      return;
    }

    if (!password) {
      setError("Password is required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        username: normalizedUsername,
        password,
        redirect: false,
      });

      if (!result) {
        setError("Unable to sign in. Please try again.");
        return;
      }

      if (result.error) {
        setError("Invalid username or password.");
        return;
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("Login failed:", err);

      setError("Unable to sign in. Please try again.");
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

      <Box component="form" onSubmit={handleLogin} noValidate>
        <Stack spacing={3}>
          <Box>
            <Typography
              variant="subtitle1"
              fontWeight={600}
              mb="5px"
              component="label"
              htmlFor="username"
            >
              Username
            </Typography>

            <CustomTextField
              id="username"
              fullWidth
              autoComplete="username"
              value={username}
              disabled={loading}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setUsername(event.target.value);

                if (error) {
                  setError("");
                }
              }}
            />
          </Box>

          <Box>
            <Typography
              variant="subtitle1"
              fontWeight={600}
              mb="5px"
              component="label"
              htmlFor="password"
            >
              Password
            </Typography>

            <CustomTextField
              id="password"
              fullWidth
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              disabled={loading}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setPassword(event.target.value);

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
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      onClick={() => setShowPassword((previous) => !previous)}
                      disabled={loading}
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
          </Box>

          {error && <Alert severity="error">{error}</Alert>}

          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            spacing={2}
          >
            <FormGroup>
              <FormControlLabel
                control={<Checkbox defaultChecked />}
                label="Remember this device"
              />
            </FormGroup>

            <Typography
              component={Link}
              href="/authentication/forgot-password"
              color="primary"
              sx={{
                textDecoration: "none",
              }}
            >
              Forgot Password?
            </Typography>
          </Stack>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
          >
            {loading ? "Signing In..." : "Sign In"}
          </Button>
        </Stack>
      </Box>

      {subtitle}
    </>
  );
};

export default AuthLogin;
