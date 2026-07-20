"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useSession } from "next-auth/react";

import {
  Avatar,
  Box,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import {
  IconCalendarEvent,
  IconCheck,
  IconClockHour4,
  IconShieldCheck,
  IconUser,
} from "@tabler/icons-react";

/* =========================================================
   API CONFIGURATION
========================================================= */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000/api";

/*
 * Convert:
 *
 * /media/profile_photos/photo.jpg
 *
 * into:
 *
 * http://127.0.0.1:8000/media/profile_photos/photo.jpg
 */
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

  const backendBaseUrl =
    API_BASE_URL.replace(
      /\/api\/?$/,
      ""
    ).replace(/\/$/, "");

  return photo.startsWith("/")
    ? `${backendBaseUrl}${photo}`
    : `${backendBaseUrl}/${photo}`;
}

/* =========================================================
   USER TYPE
========================================================= */

interface DashboardUser {
  id?: number;

  username?: string;

  email?: string | null;

  first_name?: string;

  last_name?: string;

  profile_photo?: string | null;

  is_staff?: boolean;

  is_superuser?: boolean;
}

/* =========================================================
   COMPONENT
========================================================= */

export default function DashboardHeader() {
  const {
    data: session,
    status: sessionStatus,
  } = useSession();

  const [currentUser, setCurrentUser] =
    useState<DashboardUser | null>(null);

  const [loadingUser, setLoadingUser] =
    useState(true);

  const [now, setNow] = useState(
    () => new Date()
  );

  /* =======================================================
     LIVE CLOCK
  ======================================================= */

  useEffect(() => {
    const timer = window.setInterval(
      () => {
        setNow(new Date());
      },
      60_000
    );

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  /* =======================================================
     LOAD AUTHENTICATED DJANGO USER

     Important:
     The dashboard now gets the same real user information
     used by the profile system instead of depending only
     on the basic NextAuth session.
  ======================================================= */

  useEffect(() => {
    if (
      sessionStatus === "loading"
    ) {
      return;
    }

    async function loadCurrentUser() {
      try {
        setLoadingUser(true);

        /*
         * Try to obtain the OAuth access token from
         * the NextAuth session.
         *
         * Depending on your auth configuration it may
         * be called accessToken or access_token.
         */
        const extendedSession =
          session as
            | (typeof session & {
                accessToken?: string;
                access_token?: string;
              })
            | null;

        const accessToken =
          extendedSession?.accessToken ??
          extendedSession?.access_token;

        const headers: HeadersInit = {
          Accept: "application/json",
        };

        if (accessToken) {
          headers.Authorization =
            `Bearer ${accessToken}`;
        }

        const response = await fetch(
          `${API_BASE_URL.replace(
            /\/$/,
            ""
          )}/auth/me/`,
          {
            method: "GET",

            headers,

            /*
             * This also supports authentication
             * implementations that use cookies.
             */
            credentials: "include",

            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            `Unable to load current user: ${response.status}`
          );
        }

        const user: DashboardUser =
          await response.json();

        setCurrentUser(user);
      } catch (error) {
        console.error(
          "Failed to load dashboard user:",
          error
        );

        /*
         * Do not break the dashboard.
         * Session data will be used as fallback.
         */
        setCurrentUser(null);
      } finally {
        setLoadingUser(false);
      }
    }

    loadCurrentUser();
  }, [session, sessionStatus]);

  /* =======================================================
     SESSION FALLBACK

     If /auth/me/ cannot be loaded, the dashboard still
     works using NextAuth session information.
  ======================================================= */

  type SessionUser = {
    name?: string | null;

    email?: string | null;

    image?: string | null;

    username?: string;

    first_name?: string;

    last_name?: string;

    profile_photo?: string | null;

    is_staff?: boolean;

    is_superuser?: boolean;
  };

  const sessionUser =
    session?.user as
      | SessionUser
      | undefined;

  /* =======================================================
     DISPLAY NAME
  ======================================================= */

  const displayName = useMemo(() => {
    /*
     * Prefer Django /auth/me/ data.
     */
    const backendFullName = [
      currentUser?.first_name,
      currentUser?.last_name,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    if (backendFullName) {
      return backendFullName;
    }

    /*
     * Then try session full name.
     */
    const sessionFullName = [
      sessionUser?.first_name,
      sessionUser?.last_name,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    if (sessionFullName) {
      return sessionFullName;
    }

    /*
     * Username fallbacks.
     */
    return (
      currentUser?.username ||
      sessionUser?.username ||
      sessionUser?.name ||
      "User"
    );
  }, [
    currentUser,
    sessionUser,
  ]);

  /* =======================================================
     USERNAME
  ======================================================= */

  const username =
    currentUser?.username ||
    sessionUser?.username ||
    sessionUser?.name ||
    "User";

  /* =======================================================
     EMAIL
  ======================================================= */

  const email =
    currentUser?.email ||
    sessionUser?.email ||
    "No email available";

  /* =======================================================
     PROFILE PHOTO

     Backend profile_photo has highest priority.
  ======================================================= */

  const rawPhoto =
    currentUser?.profile_photo ||
    sessionUser?.profile_photo ||
    sessionUser?.image ||
    "";

  const photoUrl =
    buildPhotoUrl(rawPhoto);

  const fallbackInitial =
    displayName
      .charAt(0)
      .toUpperCase() || "U";

  /* =======================================================
     ROLE
  ======================================================= */

  const isSuperuser =
    currentUser?.is_superuser ??
    sessionUser?.is_superuser ??
    false;

  const isStaff =
    currentUser?.is_staff ??
    sessionUser?.is_staff ??
    false;

  const role = isSuperuser
    ? "Administrator"
    : isStaff
      ? "Staff"
      : "User";

  /* =======================================================
     DATE / TIME
  ======================================================= */

  const currentDate = useMemo(() => {
    return new Intl.DateTimeFormat(
      "en-KE",
      {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    ).format(now);
  }, [now]);

  const currentTime = useMemo(() => {
    return new Intl.DateTimeFormat(
      "en-KE",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    ).format(now);
  }, [now]);

  /* =======================================================
     UI
  ======================================================= */

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 3,

        p: {
          xs: 2.5,
          md: 3,
        },

        borderRadius: 3,

        border: "1px solid",
        borderColor: "divider",

        background:
          "linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)",

        boxShadow:
          "0 4px 18px rgba(0,0,0,0.06)",
      }}
    >
      <Stack
        direction={{
          xs: "column",
          md: "row",
        }}
        spacing={{
          xs: 3,
          md: 4,
        }}
        alignItems={{
          xs: "stretch",
          md: "center",
        }}
        justifyContent="space-between"
      >
        {/* =================================================
            LEFT SIDE
        ================================================= */}

        <Box
          sx={{
            flex: 1,
            minWidth: 0,
          }}
        >
          <Typography
            variant="h4"
            fontWeight={700}
            sx={{
              mb: 0.5,
              lineHeight: 1.25,
            }}
          >
            Welcome back,{" "}

            <Box
              component="span"
              color="primary.main"
            >
              {displayName}
            </Box>
          </Typography>

          <Typography
            variant="subtitle1"
            fontWeight={600}
            color="text.secondary"
            sx={{
              mb: 0.5,
            }}
          >
            Member Registration
            Management System
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              maxWidth: 650,
              lineHeight: 1.6,
            }}
          >
            Monitor registrations,
            manage members, review
            reports and oversee system
            operations from one
            centralized dashboard.
          </Typography>

          <Stack
            direction="row"
            spacing={1}
            mt={2.5}
            flexWrap="wrap"
            useFlexGap
          >
            <Chip
              size="small"
              icon={
                <IconCalendarEvent
                  size={15}
                />
              }
              label={currentDate}
              color="primary"
              variant="outlined"
            />

            <Chip
              size="small"
              icon={
                <IconClockHour4
                  size={15}
                />
              }
              label={currentTime}
              color="info"
              variant="outlined"
            />

            <Chip
              size="small"
              icon={
                <IconShieldCheck
                  size={15}
                />
              }
              label="System Online"
              color="success"
            />
          </Stack>
        </Box>

        {/* =================================================
            RIGHT SIDE — USER CARD
        ================================================= */}

        <Paper
          elevation={0}
          sx={{
            width: {
              xs: "100%",
              md: 330,
            },

            flexShrink: 0,

            p: 2,

            borderRadius: 2.5,

            border: "1px solid",
            borderColor: "divider",

            bgcolor:
              "background.paper",
          }}
        >
          <Stack spacing={1.75}>
            <Stack
              direction="row"
              spacing={1.75}
              alignItems="center"
            >
              {/* ===========================================
                  PROFILE PHOTO
              =========================================== */}

              {loadingUser &&
              !rawPhoto ? (
                <Box
                  sx={{
                    width: 58,
                    height: 58,

                    display: "flex",
                    alignItems: "center",
                    justifyContent:
                      "center",

                    flexShrink: 0,
                  }}
                >
                  <CircularProgress
                    size={26}
                  />
                </Box>
              ) : (
                <Avatar
                  src={
                    photoUrl ||
                    undefined
                  }
                  alt={displayName}
                  imgProps={{
                    referrerPolicy:
                      "no-referrer",
                  }}
                  sx={{
                    width: 58,
                    height: 58,

                    bgcolor:
                      "primary.main",

                    fontSize: 22,
                    fontWeight: 700,

                    border: "2px solid",
                    borderColor:
                      "divider",

                    flexShrink: 0,

                    "& img": {
                      objectFit: "cover",
                    },
                  }}
                >
                  {!photoUrl &&
                    fallbackInitial}
                </Avatar>
              )}

              {/* ===========================================
                  USER INFORMATION
              =========================================== */}

              <Box
                sx={{
                  minWidth: 0,
                  flex: 1,
                }}
              >
                <Typography
                  variant="subtitle1"
                  fontWeight={700}
                  noWrap
                  title={displayName}
                >
                  {displayName}
                </Typography>

                {displayName !==
                  username && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    noWrap
                  >
                    @{username}
                  </Typography>
                )}

                <Typography
                  variant="body2"
                  color="text.secondary"
                  noWrap
                  title={email}
                >
                  {email}
                </Typography>
              </Box>
            </Stack>

            <Divider />

            {/* =================================================
                ROLE / SESSION
            ================================================= */}

            <Stack
              direction="row"
              spacing={1}
              flexWrap="wrap"
              useFlexGap
            >
              <Chip
                size="small"
                icon={
                  <IconUser
                    size={14}
                  />
                }
                label={role}
                color="primary"
                variant="outlined"
              />

              <Chip
                size="small"
                icon={
                  <IconCheck
                    size={14}
                  />
                }
                label="Active Session"
                color="success"
                variant="outlined"
              />
            </Stack>
          </Stack>
        </Paper>
      </Stack>
    </Paper>
  );
}