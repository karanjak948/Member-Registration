"use client";

import { useEffect, useMemo, useState } from "react";
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
  IconClockHour4,
  IconShieldCheck,
  IconUser,
  IconBuildingBank,
} from "@tabler/icons-react";
import { getMediaUrl } from "@/utils/media";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

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

export default function DashboardHeader() {
  const { data: session, status: sessionStatus } = useSession();
  const [currentUser, setCurrentUser] = useState<DashboardUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (sessionStatus === "loading") return;

    async function loadCurrentUser() {
      try {
        setLoadingUser(true);
        const extendedSession = session as any;
        const accessToken = extendedSession?.accessToken ?? extendedSession?.access_token;
        const headers: HeadersInit = { Accept: "application/json" };
        if (accessToken) {
          headers.Authorization = `Bearer ${accessToken}`;
        }

        const response = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/auth/me/`, {
          method: "GET",
          headers,
          credentials: "include",
          cache: "no-store",
        });

        if (response.ok) {
          const user: DashboardUser = await response.json();
          setCurrentUser(user);
        }
      } catch (error) {
        console.error("Failed to load dashboard user:", error);
      } finally {
        setLoadingUser(false);
      }
    }

    loadCurrentUser();
  }, [session, sessionStatus]);

  const sessionUser = session?.user as any;

  const displayName = useMemo(() => {
    const backendFullName = [currentUser?.first_name, currentUser?.last_name].filter(Boolean).join(" ").trim();
    if (backendFullName) return backendFullName;

    const sessionFullName = [sessionUser?.first_name, sessionUser?.last_name].filter(Boolean).join(" ").trim();
    if (sessionFullName) return sessionFullName;

    return currentUser?.username || sessionUser?.username || sessionUser?.name || "Administrator";
  }, [currentUser, sessionUser]);

  const username = currentUser?.username || sessionUser?.username || sessionUser?.name || "admin";
  const email = currentUser?.email || sessionUser?.email || "admin@royalsacco.co.ke";
  const isSuperuser = currentUser?.is_superuser ?? sessionUser?.is_superuser ?? false;
  const isStaff = currentUser?.is_staff ?? sessionUser?.is_staff ?? false;
  const role = isSuperuser ? "Administrator" : isStaff ? "Staff Officer" : "Officer";

  const photoUrl = getMediaUrl(currentUser?.profile_photo || sessionUser?.profile_photo || sessionUser?.image);
  const fallbackInitial = displayName.charAt(0).toUpperCase() || "A";

  const currentDate = useMemo(() => {
    return new Intl.DateTimeFormat("en-KE", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(now);
  }, [now]);

  const currentTime = useMemo(() => {
    return new Intl.DateTimeFormat("en-KE", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(now);
  }, [now]);

  return (
    <Box
      sx={{
        mb: 3.5,
        p: { xs: 2.5, md: 3.5 },
        borderRadius: 3,
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #2563eb 100%)",
        color: "#ffffff",
        boxShadow: "0 12px 28px -6px rgba(15, 23, 42, 0.3)",
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={{ xs: 3, md: 4 }}
        alignItems={{ xs: "flex-start", md: "center" }}
        justifyContent="space-between"
      >
        {/* Left Welcome Area */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
            <Box sx={{ p: 1, bgcolor: "rgba(255, 255, 255, 0.15)", borderRadius: 2, display: "flex" }}>
              <IconBuildingBank size={26} color="#60a5fa" />
            </Box>
            <Typography variant="caption" fontWeight={800} sx={{ color: "#93c5fd", letterSpacing: "1px", textTransform: "uppercase" }}>
              Royal SACCO Executive Core
            </Typography>
          </Stack>

          <Typography
            variant="h3"
            fontWeight={800}
            sx={{
              color: "#ffffff",
              letterSpacing: "-0.5px",
              lineHeight: 1.2,
              mb: 0.5,
              fontSize: { xs: "1.6rem", md: "2.1rem" },
            }}
          >
            Welcome back, {displayName}
          </Typography>

          <Typography variant="body2" sx={{ color: "#cbd5e1", maxWidth: 650, lineHeight: 1.6, mb: 2 }}>
            Centralized SACCO dashboard for member operations, loan disbursements, daily collection reconciliation, and portfolio risk.
          </Typography>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              size="small"
              icon={<IconCalendarEvent size={14} style={{ color: "#ffffff" }} />}
              label={currentDate}
              sx={{ bgcolor: "rgba(255, 255, 255, 0.15)", color: "#ffffff", fontWeight: 600, border: "1px solid rgba(255,255,255,0.2)" }}
            />
            <Chip
              size="small"
              icon={<IconClockHour4 size={14} style={{ color: "#ffffff" }} />}
              label={currentTime}
              sx={{ bgcolor: "rgba(255, 255, 255, 0.15)", color: "#ffffff", fontWeight: 600, border: "1px solid rgba(255,255,255,0.2)" }}
            />
            <Chip
              size="small"
              icon={<IconShieldCheck size={14} style={{ color: "#ffffff" }} />}
              label="System Online"
              sx={{ bgcolor: "#10b981", color: "#ffffff", fontWeight: 700 }}
            />
          </Stack>
        </Box>

        {/* Right User Badge Card */}
        <Paper
          elevation={0}
          sx={{
            width: { xs: "100%", md: 320 },
            flexShrink: 0,
            p: 2.2,
            borderRadius: 2.5,
            bgcolor: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            color: "#ffffff",
          }}
        >
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1.75} alignItems="center">
              <Avatar
                src={photoUrl}
                sx={{
                  width: 52,
                  height: 52,
                  bgcolor: "rgba(255, 255, 255, 0.25)",
                  color: "#ffffff",
                  fontSize: 22,
                  fontWeight: 800,
                  border: "2px solid rgba(255, 255, 255, 0.4)",
                }}
              >
                {fallbackInitial}
              </Avatar>

              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="subtitle1" fontWeight={800} noWrap sx={{ color: "#ffffff" }}>
                  {displayName}
                </Typography>
                <Typography variant="caption" sx={{ color: "#93c5fd", display: "block" }} noWrap>
                  @{username}
                </Typography>
                <Typography variant="caption" sx={{ color: "#cbd5e1", display: "block" }} noWrap>
                  {email}
                </Typography>
              </Box>
            </Stack>

            <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.15)" }} />

            <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
              <Chip
                size="small"
                icon={<IconUser size={13} style={{ color: "#ffffff" }} />}
                label={role}
                sx={{ bgcolor: "rgba(255, 255, 255, 0.2)", color: "#ffffff", fontWeight: 700, fontSize: "0.72rem" }}
              />
              <Chip
                size="small"
                label="● Active Session"
                sx={{ bgcolor: "rgba(16, 185, 129, 0.25)", color: "#34d399", fontWeight: 700, fontSize: "0.72rem", border: "1px solid rgba(52, 211, 153, 0.3)" }}
              />
            </Stack>
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}