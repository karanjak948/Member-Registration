"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { useSession } from "next-auth/react";
import Link from "next/link";

import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Typography,
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import LockResetIcon from "@mui/icons-material/LockReset";

import api from "@/services/api";

interface ProfileUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  profile_photo: string | null;
  is_staff: boolean;
  is_superuser: boolean;
}

export default function ProfilePage() {
  const {
    status: sessionStatus,
  } = useSession();

  const [user, setUser] =
    useState<ProfileUser | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadProfile = useCallback(
    async () => {
      setLoading(true);
      setError("");

      try {
        const response =
          await api.get<ProfileUser>(
            "/auth/me/"
          );

        setUser(response.data);
      } catch (error) {
        console.error(
          "Failed to load profile:",
          error
        );

        setError(
          "Unable to load your profile information."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (
      sessionStatus ===
      "authenticated"
    ) {
      loadProfile();
    }

    if (
      sessionStatus ===
      "unauthenticated"
    ) {
      setLoading(false);
    }
  }, [
    sessionStatus,
    loadProfile,
  ]);

  if (
    sessionStatus === "loading" ||
    loading
  ) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  const fullName = [
    user?.first_name,
    user?.last_name,
  ]
    .filter(Boolean)
    .join(" ");

  const displayName =
    fullName ||
    user?.username ||
    "User";

  const photoUrl =
    user?.profile_photo
      ? user.profile_photo.startsWith(
          "http"
        )
        ? user.profile_photo
        : `http://127.0.0.1:8000${user.profile_photo}`
      : undefined;

  const fallbackInitial =
    user?.first_name
      ?.charAt(0)
      .toUpperCase() ||
    user?.username
      ?.charAt(0)
      .toUpperCase() ||
    "U";

  return (
    <Container maxWidth="lg">
      <Typography
        variant="h4"
        gutterBottom
      >
        My Profile
      </Typography>

      <Typography
        variant="body1"
        color="text.secondary"
        mb={4}
      >
        View and manage your account
        information.
      </Typography>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={loadProfile}
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box
            display="flex"
            alignItems="center"
            gap={3}
            mb={4}
          >
            <Avatar
              src={photoUrl}
              alt={displayName}
              sx={{
                width: 100,
                height: 100,
                fontSize: 36,
                fontWeight: 700,
                bgcolor: "primary.main",
              }}
            >
              {!photoUrl &&
                fallbackInitial}
            </Avatar>

            <Box>
              <Typography
                variant="h5"
                fontWeight={600}
              >
                {displayName}
              </Typography>

              <Typography
                color="text.secondary"
              >
                {user?.email ||
                  "No email provided"}
              </Typography>

              {user?.username && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  @{user.username}
                </Typography>
              )}
            </Box>
          </Box>

          <Divider sx={{ mb: 4 }} />

          <Grid
            container
            spacing={3}
          >
            <Grid
              size={{
                xs: 12,
                md: 6,
              }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Full Name
              </Typography>

              <Typography variant="subtitle1">
                {fullName || "-"}
              </Typography>
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 6,
              }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Email Address
              </Typography>

              <Typography variant="subtitle1">
                {user?.email || "-"}
              </Typography>
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 6,
              }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Username
              </Typography>

              <Typography variant="subtitle1">
                {user?.username || "-"}
              </Typography>
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 6,
              }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Account Role
              </Typography>

              <Typography variant="subtitle1">
                {user?.is_superuser
                  ? "Administrator"
                  : user?.is_staff
                    ? "Staff"
                    : "User"}
              </Typography>
            </Grid>
          </Grid>

          <Box
            mt={5}
            display="flex"
            flexWrap="wrap"
            gap={2}
          >
            <Button
              component={Link}
              href="/profile/edit"
              variant="contained"
              startIcon={
                <EditIcon />
              }
            >
              Edit Profile
            </Button>

            <Button
              component={Link}
              href="/profile/change-password"
              variant="outlined"
              startIcon={
                <LockResetIcon />
              }
            >
              Change Password
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}