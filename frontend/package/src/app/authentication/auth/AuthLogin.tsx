"use client";

import React, { useState, ChangeEvent } from "react";
import {
  Alert,
  Box,
  Typography,
  FormGroup,
  FormControlLabel,
  Button,
  Stack,
  Checkbox,
} from "@mui/material";
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

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const handleLogin = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    setLoading(false);

    if (!result) {
      setError("Unable to login.");
      return;
    }

    if (result.error) {
      setError("Invalid username or password.");
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <>
      {title && (
        <Typography
          fontWeight={700}
          variant="h2"
          mb={1}
        >
          {title}
        </Typography>
      )}

      {subtext}

      <Box
        component="form"
        onSubmit={handleLogin}
      >
        <Stack spacing={3}>
          <Box>
            <Typography
              variant="subtitle1"
              fontWeight={600}
              mb="5px"
            >
              Username
            </Typography>

            <CustomTextField
              fullWidth
              value={username}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setUsername(e.target.value)
              }
            />
          </Box>

          <Box>
            <Typography
              variant="subtitle1"
              fontWeight={600}
              mb="5px"
            >
              Password
            </Typography>

            <CustomTextField
              fullWidth
              type="password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPassword(e.target.value)
              }
            />
          </Box>

          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}

          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <FormGroup>
              <FormControlLabel
                control={<Checkbox defaultChecked />}
                label="Remember this device"
              />
            </FormGroup>

            <Typography
              component={Link}
              href="/"
              color="primary"
              sx={{ textDecoration: "none" }}
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