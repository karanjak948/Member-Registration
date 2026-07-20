"use client";

import React, {
  MouseEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  signOut,
  useSession,
} from "next-auth/react";

import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";

import {
  IconSettings,
  IconUser,
} from "@tabler/icons-react";

import api from "@/services/api";

interface CurrentUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  profile_photo: string | null;
  is_staff?: boolean;
  is_superuser?: boolean;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000";

function buildPhotoUrl(
  photo?: string | null
) {
  if (!photo) {
    return "";
  }

  if (
    photo.startsWith("http://") ||
    photo.startsWith("https://") ||
    photo.startsWith("blob:")
  ) {
    return photo;
  }

  const baseUrl =
    API_BASE_URL.endsWith("/api")
      ? API_BASE_URL.slice(0, -4)
      : API_BASE_URL.replace(/\/$/, "");

  return photo.startsWith("/")
    ? `${baseUrl}${photo}`
    : `${baseUrl}/${photo}`;
}

export default function Profile() {
  const {
    data: session,
    status,
  } = useSession();

  const [anchorEl, setAnchorEl] =
    useState<HTMLElement | null>(null);

  const [currentUser, setCurrentUser] =
    useState<CurrentUser | null>(null);

  const [loadingUser, setLoadingUser] =
    useState(false);

  /*
   * Load the authoritative user profile
   * directly from Django.
   *
   * This ensures username, names, email and
   * profile photo match the Profile page.
   */
  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    let mounted = true;

    async function loadCurrentUser() {
      try {
        setLoadingUser(true);

        const response =
          await api.get<CurrentUser>(
            "/auth/me/"
          );

        if (mounted) {
          setCurrentUser(response.data);
        }
      } catch (error) {
        console.error(
          "Unable to load header profile:",
          error
        );
      } finally {
        if (mounted) {
          setLoadingUser(false);
        }
      }
    }

    loadCurrentUser();

    return () => {
      mounted = false;
    };
  }, [status]);

  /*
   * Prefer first + last name when available.
   *
   * If they are empty, use the actual Django
   * username instead of displaying "User".
   */
  const displayName = useMemo(() => {
    const fullName = [
      currentUser?.first_name,
      currentUser?.last_name,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    return (
      fullName ||
      currentUser?.username ||
      session?.user?.name ||
      "User"
    );
  }, [
    currentUser,
    session?.user?.name,
  ]);

  /*
   * Username is kept separately because it
   * may be useful to display even when the
   * user has a full name.
   */
  const username =
    currentUser?.username ||
    session?.user?.name ||
    "";

  const email =
    currentUser?.email ||
    session?.user?.email ||
    "";

  const photoUrl = buildPhotoUrl(
    currentUser?.profile_photo ||
      session?.user?.image
  );

  const fallbackInitial =
    (
      currentUser?.first_name ||
      username ||
      displayName ||
      "U"
    )
      .charAt(0)
      .toUpperCase();

  function handleOpen(
    event: MouseEvent<HTMLElement>
  ) {
    setAnchorEl(event.currentTarget);
  }

  function handleClose() {
    setAnchorEl(null);
  }

  async function handleLogout() {
    handleClose();

    await signOut({
      callbackUrl:
        "/authentication/login",
    });
  }

  return (
    <Box>
      {/* Top-right avatar */}
      <IconButton
        size="small"
        aria-label="Open account menu"
        aria-controls={
          anchorEl
            ? "profile-menu"
            : undefined
        }
        aria-haspopup="true"
        aria-expanded={
          anchorEl ? "true" : undefined
        }
        onClick={handleOpen}
        sx={{
          p: 0.5,

          border: "2px solid",

          borderColor: anchorEl
            ? "primary.main"
            : "transparent",

          transition: "0.2s ease",
        }}
      >
        {loadingUser ? (
          <Box
            sx={{
              width: 38,
              height: 38,

              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CircularProgress size={22} />
          </Box>
        ) : (
          <Avatar
            src={photoUrl || undefined}
            alt={displayName}
            sx={{
              width: 38,
              height: 38,

              bgcolor: "primary.main",

              fontWeight: 700,
            }}
          >
            {!photoUrl &&
              fallbackInitial}
          </Avatar>
        )}
      </IconButton>

      {/* Profile dropdown */}
      <Menu
        id="profile-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        keepMounted
        anchorOrigin={{
          horizontal: "right",
          vertical: "bottom",
        }}
        transformOrigin={{
          horizontal: "right",
          vertical: "top",
        }}
        slotProps={{
          paper: {
            sx: {
              width: 300,

              mt: 1.5,

              borderRadius: 2,

              boxShadow:
                "0 8px 30px rgba(0,0,0,0.12)",
            },
          },
        }}
      >
        {/* User summary */}
        <Box
          px={2.5}
          py={2.5}
        >
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
          >
            <Avatar
              src={photoUrl || undefined}
              alt={displayName}
              sx={{
                width: 52,
                height: 52,

                bgcolor: "primary.main",

                fontWeight: 700,
                fontSize: 20,
              }}
            >
              {!photoUrl &&
                fallbackInitial}
            </Avatar>

            <Box
              sx={{
                minWidth: 0,
                flex: 1,
              }}
            >
              <Typography
                fontWeight={700}
                noWrap
              >
                {displayName}
              </Typography>

              {username &&
                username !== displayName && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    noWrap
                  >
                    @{username}
                  </Typography>
                )}

              <Typography
                variant="body2"
                color="text.secondary"
                noWrap
              >
                {email ||
                  "No email available"}
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Divider />

        {/* My Profile */}
        <MenuItem
          component={Link}
          href="/profile"
          onClick={handleClose}
          sx={{
            py: 1.25,
          }}
        >
          <ListItemIcon>
            <IconUser
              width={20}
              height={20}
            />
          </ListItemIcon>

          <ListItemText
            primary="My Profile"
            secondary="View and edit profile"
          />
        </MenuItem>

        {/* Account Settings */}
        <MenuItem
          component={Link}
          href="/settings"
          onClick={handleClose}
          sx={{
            py: 1.25,
          }}
        >
          <ListItemIcon>
            <IconSettings
              width={20}
              height={20}
            />
          </ListItemIcon>

          <ListItemText
            primary="Account Settings"
            secondary="Manage preferences"
          />
        </MenuItem>

        <Divider />

        {/* Logout */}
        <Box
          px={2}
          py={1.5}
        >
          <Button
            variant="outlined"
            color="primary"
            fullWidth
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Box>
      </Menu>
    </Box>
  );
}