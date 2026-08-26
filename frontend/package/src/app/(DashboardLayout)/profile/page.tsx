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
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  IconUser,
  IconMail,
  IconAt,
  IconShieldCheck,
  IconLock,
  IconEdit,
  IconBuildingBank,
  IconCopy,
  IconCheck,
  IconRefresh,
  IconUserCheck,
  IconKey,
  IconSparkles,
  IconId,
  IconClock,
  IconCircleCheck,
} from "@tabler/icons-react";

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
  organization?: {
    id: number;
    name: string;
  } | null;
}

export default function ProfilePage() {
  const { status: sessionStatus } = useSession();

  const [user, setUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get<ProfileUser>("/auth/me/");
      setUser(response.data);
    } catch (err) {
      console.error("Failed to load profile:", err);
      setError("Unable to load your profile information. Please verify your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      loadProfile();
    } else if (sessionStatus === "unauthenticated") {
      setLoading(false);
    }
  }, [sessionStatus, loadProfile]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setSnackbarMessage(`${label} copied to clipboard!`);
    setSnackbarOpen(true);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (sessionStatus === "loading" || loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
        gap={2}
      >
        <CircularProgress color="success" size={48} thickness={4} />
        <Typography variant="body2" color="text.secondary" fontWeight={600}>
          Loading profile details...
        </Typography>
      </Box>
    );
  }

  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(" ");
  const displayName = fullName || user?.username || "SACCO Officer";

  const photoUrl = user?.profile_photo
    ? user.profile_photo.startsWith("http")
      ? user.profile_photo
      : `http://127.0.0.1:8000${user.profile_photo}`
    : undefined;

  const fallbackInitial =
    user?.first_name?.charAt(0).toUpperCase() ||
    user?.username?.charAt(0).toUpperCase() ||
    "U";

  const roleTitle = user?.is_superuser
    ? "System Administrator"
    : user?.is_staff
      ? "Staff Officer"
      : "Standard User";

  return (
    <Container maxWidth="xl" sx={{ mt: 1, mb: 6 }}>
      {/* ------------------------------------------------------------- */}
      {/* 1. EXECUTIVE HERO BANNER */}
      {/* ------------------------------------------------------------- */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, sm: 4 },
          mb: 4,
          borderRadius: 3.5,
          background: "linear-gradient(135deg, #064e3b 0%, #047857 45%, #059669 85%, #10b981 100%)",
          color: "#ffffff",
          boxShadow: "0 12px 32px rgba(6, 78, 59, 0.28)",
          position: "relative",
          overflow: "hidden",
          border: "1px solid rgba(255, 255, 255, 0.15)",
        }}
      >
        {/* Background Decorative Circles */}
        <Box
          sx={{
            position: "absolute",
            top: -60,
            right: -60,
            width: 240,
            height: 240,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 70%)",
            pointerEvents: "none",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            bottom: -40,
            left: "30%",
            width: 180,
            height: 180,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 70%)",
            pointerEvents: "none",
          }}
        />

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={{ xs: 3, md: 4 }}
          alignItems={{ xs: "flex-start", md: "center" }}
          justifyContent="space-between"
          sx={{ position: "relative", zIndex: 1 }}
        >
          {/* Avatar & Info */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={3} alignItems={{ xs: "flex-start", sm: "center" }}>
            <Box sx={{ position: "relative" }}>
              <Avatar
                src={photoUrl}
                alt={displayName}
                sx={{
                  width: { xs: 90, sm: 110 },
                  height: { xs: 90, sm: 110 },
                  fontSize: { xs: 36, sm: 44 },
                  fontWeight: 900,
                  bgcolor: "#022c22",
                  color: "#a7f3d0",
                  border: "4px solid #ffffff",
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.25)",
                }}
              >
                {!photoUrl && fallbackInitial}
              </Avatar>

              {/* Online Indicator Status */}
              <Box
                sx={{
                  position: "absolute",
                  bottom: 4,
                  right: 4,
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  bgcolor: "#10b981",
                  border: "3px solid #ffffff",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                }}
              />
            </Box>

            <Box>
              <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ mb: 0.5 }}>
                <Typography
                  variant="h4"
                  fontWeight={900}
                  sx={{
                    color: "#ffffff",
                    letterSpacing: "-0.6px",
                    fontSize: { xs: "1.6rem", sm: "2rem" },
                  }}
                >
                  {displayName}
                </Typography>

                <Chip
                  icon={<IconShieldCheck size={16} color="#065f46" />}
                  label={roleTitle}
                  size="small"
                  sx={{
                    bgcolor: "#d1fae5",
                    color: "#065f46",
                    fontWeight: 800,
                    fontSize: "0.78rem",
                    borderRadius: 2,
                    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                  }}
                />
              </Stack>

              <Typography
                variant="body2"
                sx={{
                  color: "#d1fae5",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  flexWrap: "wrap",
                }}
              >
                <span>{user?.email || "No email assigned"}</span>
                {user?.username && (
                  <>
                    <span>•</span>
                    <span style={{ fontFamily: "monospace", opacity: 0.9 }}>@{user.username}</span>
                  </>
                )}
              </Typography>

              <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} flexWrap="wrap">
                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.8,
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1.5,
                    bgcolor: "rgba(255, 255, 255, 0.15)",
                    backdropFilter: "blur(6px)",
                    border: "1px solid rgba(255, 255, 255, 0.25)",
                  }}
                >
                  <IconBuildingBank size={15} color="#a7f3d0" />
                  <Typography variant="caption" sx={{ color: "#ffffff", fontWeight: 700 }}>
                    Royal SACCO Platform
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.8,
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1.5,
                    bgcolor: "rgba(255, 255, 255, 0.15)",
                    backdropFilter: "blur(6px)",
                    border: "1px solid rgba(255, 255, 255, 0.25)",
                  }}
                >
                  <IconId size={15} color="#a7f3d0" />
                  <Typography variant="caption" sx={{ color: "#ffffff", fontWeight: 700, fontFamily: "monospace" }}>
                    UID #{user?.id ?? "—"}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Stack>

          {/* Quick Hero Actions */}
          <Stack direction={{ xs: "row", sm: "row" }} spacing={1.5} flexWrap="wrap">
            <Button
              component={Link}
              href="/profile/edit"
              variant="contained"
              startIcon={<IconEdit size={18} />}
              sx={{
                bgcolor: "#ffffff",
                color: "#065f46",
                fontWeight: 800,
                borderRadius: 2.5,
                px: 2.5,
                py: 1,
                boxShadow: "0 4px 14px rgba(0, 0, 0, 0.15)",
                "&:hover": {
                  bgcolor: "#f0fdf4",
                  color: "#047857",
                  transform: "translateY(-1px)",
                },
                transition: "all 0.2s ease",
              }}
            >
              Edit Profile
            </Button>

            <Button
              component={Link}
              href="/profile/change-password"
              variant="outlined"
              startIcon={<IconKey size={18} />}
              sx={{
                color: "#ffffff",
                borderColor: "rgba(255, 255, 255, 0.5)",
                bgcolor: "rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(6px)",
                fontWeight: 800,
                borderRadius: 2.5,
                px: 2.5,
                py: 1,
                "&:hover": {
                  borderColor: "#ffffff",
                  bgcolor: "rgba(255, 255, 255, 0.2)",
                  transform: "translateY(-1px)",
                },
                transition: "all 0.2s ease",
              }}
            >
              Change Password
            </Button>

            <Tooltip title="Reload Profile Data">
              <IconButton
                onClick={loadProfile}
                sx={{
                  color: "#ffffff",
                  bgcolor: "rgba(255, 255, 255, 0.12)",
                  borderRadius: 2.5,
                  p: 1.1,
                  "&:hover": { bgcolor: "rgba(255, 255, 255, 0.25)" },
                }}
              >
                <IconRefresh size={20} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Paper>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3, borderRadius: 2.5, fontWeight: 700 }}
          action={
            <Button color="inherit" size="small" onClick={loadProfile}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. PROFILE DASHBOARD GRID */}
      {/* ------------------------------------------------------------- */}
      <Grid container spacing={3}>
        {/* LEFT COLUMN: Identity & Quick Contacts */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={3}>
            {/* Account Status Badge Card */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                border: "1px solid #e2e8f0",
                bgcolor: "#ffffff",
                boxShadow: "0 4px 16px rgba(15, 23, 42, 0.04)",
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", mb: 2 }}>
                Account Standing &amp; Access
              </Typography>

              <Stack spacing={2}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    bgcolor: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 2,
                        bgcolor: "#ecfdf5",
                        color: "#059669",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <IconCircleCheck size={20} stroke={2.5} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={800} color="#065f46">
                        Active Account
                      </Typography>
                      <Typography variant="caption" color="#047857" fontWeight={600}>
                        Verified SACCO Member Officer
                      </Typography>
                    </Box>
                  </Stack>
                  <Chip label="ONLINE" color="success" size="small" sx={{ fontWeight: 900, fontSize: "0.7rem", borderRadius: 1.5 }} />
                </Box>

                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    bgcolor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 2,
                        bgcolor: "#eff6ff",
                        color: "#2563eb",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <IconShieldCheck size={20} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={800} color="#1e293b">
                        System Level
                      </Typography>
                      <Typography variant="caption" color="#64748b" fontWeight={600}>
                        {user?.is_superuser ? "Full Root Privileges" : user?.is_staff ? "Operational Staff Access" : "Standard Officer Access"}
                      </Typography>
                    </Box>
                  </Stack>
                  <Chip
                    label={user?.is_superuser ? "SUPERADMIN" : user?.is_staff ? "STAFF" : "USER"}
                    size="small"
                    sx={{
                      fontWeight: 800,
                      fontSize: "0.7rem",
                      borderRadius: 1.5,
                      bgcolor: user?.is_superuser ? "#fef3c7" : "#eff6ff",
                      color: user?.is_superuser ? "#92400e" : "#1d4ed8",
                      border: `1px solid ${user?.is_superuser ? "#fde68a" : "#bfdbfe"}`,
                    }}
                  />
                </Box>
              </Stack>
            </Paper>

            {/* Quick Contact & Copy Card */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                border: "1px solid #e2e8f0",
                bgcolor: "#ffffff",
                boxShadow: "0 4px 16px rgba(15, 23, 42, 0.04)",
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", mb: 2 }}>
                Quick Copy Information
              </Typography>

              <Stack spacing={1.8}>
                <Box
                  sx={{
                    p: 1.8,
                    borderRadius: 2,
                    bgcolor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Box sx={{ minWidth: 0, mr: 1 }}>
                    <Typography variant="caption" color="#64748b" fontWeight={700} display="block">
                      Email Address
                    </Typography>
                    <Typography variant="body2" fontWeight={800} color="#0f172a" noWrap>
                      {user?.email || "—"}
                    </Typography>
                  </Box>

                  {user?.email && (
                    <Tooltip title={copiedField === "Email" ? "Copied!" : "Copy Email"}>
                      <IconButton
                        size="small"
                        onClick={() => handleCopy(user.email, "Email")}
                        sx={{
                          bgcolor: copiedField === "Email" ? "#ecfdf5" : "#ffffff",
                          border: "1px solid #cbd5e1",
                          color: copiedField === "Email" ? "#059669" : "#475569",
                        }}
                      >
                        {copiedField === "Email" ? <IconCheck size={16} /> : <IconCopy size={16} />}
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>

                <Box
                  sx={{
                    p: 1.8,
                    borderRadius: 2,
                    bgcolor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Box sx={{ minWidth: 0, mr: 1 }}>
                    <Typography variant="caption" color="#64748b" fontWeight={700} display="block">
                      Username Tag
                    </Typography>
                    <Typography variant="body2" fontWeight={800} color="#0f172a" noWrap sx={{ fontFamily: "monospace" }}>
                      @{user?.username || "—"}
                    </Typography>
                  </Box>

                  {user?.username && (
                    <Tooltip title={copiedField === "Username" ? "Copied!" : "Copy Username"}>
                      <IconButton
                        size="small"
                        onClick={() => handleCopy(`@${user.username}`, "Username")}
                        sx={{
                          bgcolor: copiedField === "Username" ? "#ecfdf5" : "#ffffff",
                          border: "1px solid #cbd5e1",
                          color: copiedField === "Username" ? "#059669" : "#475569",
                        }}
                      >
                        {copiedField === "Username" ? <IconCheck size={16} /> : <IconCopy size={16} />}
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Stack>
            </Paper>
          </Stack>
        </Grid>

        {/* RIGHT COLUMN: Detailed Information & Capabilities */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={3}>
            {/* Primary Details Card */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2.5, sm: 3.5 },
                borderRadius: 3,
                border: "1px solid #e2e8f0",
                bgcolor: "#ffffff",
                boxShadow: "0 4px 16px rgba(15, 23, 42, 0.04)",
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Box>
                  <Typography variant="h6" fontWeight={800} color="#0f172a">
                    Personal &amp; Organization Details
                  </Typography>
                  <Typography variant="caption" color="#64748b" fontWeight={600}>
                    Primary account parameters registered in the Royal SACCO directory
                  </Typography>
                </Box>

                <Button
                  component={Link}
                  href="/profile/edit"
                  variant="outlined"
                  size="small"
                  startIcon={<IconEdit size={16} />}
                  sx={{
                    fontWeight: 800,
                    borderRadius: 2,
                    borderColor: "#cbd5e1",
                    color: "#0f172a",
                    "&:hover": { borderColor: "#059669", color: "#059669" },
                  }}
                >
                  Edit
                </Button>
              </Stack>

              <Grid container spacing={2.5}>
                {/* Full Name */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2.5,
                      bgcolor: "#f8fafc",
                      border: "1px solid #f1f5f9",
                      height: "100%",
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      <Box sx={{ color: "#059669" }}>
                        <IconUser size={18} />
                      </Box>
                      <Typography variant="caption" fontWeight={800} color="#64748b" textTransform="uppercase">
                        Full Name
                      </Typography>
                    </Stack>
                    <Typography variant="body1" fontWeight={800} color="#0f172a">
                      {fullName || "—"}
                    </Typography>
                  </Box>
                </Grid>

                {/* Email Address */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2.5,
                      bgcolor: "#f8fafc",
                      border: "1px solid #f1f5f9",
                      height: "100%",
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      <Box sx={{ color: "#0284c7" }}>
                        <IconMail size={18} />
                      </Box>
                      <Typography variant="caption" fontWeight={800} color="#64748b" textTransform="uppercase">
                        Email Address
                      </Typography>
                    </Stack>
                    <Typography variant="body1" fontWeight={800} color="#0f172a">
                      {user?.email || "—"}
                    </Typography>
                  </Box>
                </Grid>

                {/* Username */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2.5,
                      bgcolor: "#f8fafc",
                      border: "1px solid #f1f5f9",
                      height: "100%",
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      <Box sx={{ color: "#7c3aed" }}>
                        <IconAt size={18} />
                      </Box>
                      <Typography variant="caption" fontWeight={800} color="#64748b" textTransform="uppercase">
                        Username Tag
                      </Typography>
                    </Stack>
                    <Typography variant="body1" fontWeight={800} color="#0f172a" sx={{ fontFamily: "monospace" }}>
                      @{user?.username || "—"}
                    </Typography>
                  </Box>
                </Grid>

                {/* Assigned Role */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2.5,
                      bgcolor: "#f8fafc",
                      border: "1px solid #f1f5f9",
                      height: "100%",
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      <Box sx={{ color: "#d97706" }}>
                        <IconShieldCheck size={18} />
                      </Box>
                      <Typography variant="caption" fontWeight={800} color="#64748b" textTransform="uppercase">
                        Assigned Platform Role
                      </Typography>
                    </Stack>
                    <Typography variant="body1" fontWeight={800} color="#0f172a">
                      {roleTitle}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {/* System Capabilities & Operational Privileges */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2.5, sm: 3.5 },
                borderRadius: 3,
                border: "1px solid #e2e8f0",
                bgcolor: "#ffffff",
                boxShadow: "0 4px 16px rgba(15, 23, 42, 0.04)",
              }}
            >
              <Box sx={{ mb: 2.5 }}>
                <Typography variant="h6" fontWeight={800} color="#0f172a">
                  Active Capabilities &amp; System Permissions
                </Typography>
                <Typography variant="caption" color="#64748b" fontWeight={600}>
                  Privileges automatically granted to your account role
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      display: "flex",
                      flexDirection: "column",
                      gap: 0.5,
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <IconUserCheck size={18} color="#059669" />
                      <Typography variant="subtitle2" fontWeight={800} color="#065f46">
                        Member Directory
                      </Typography>
                    </Stack>
                    <Typography variant="caption" color="#047857" fontWeight={600}>
                      View, register, and edit SACCO member profiles &amp; KYC
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: "#eff6ff",
                      border: "1px solid #bfdbfe",
                      display: "flex",
                      flexDirection: "column",
                      gap: 0.5,
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <IconShieldCheck size={18} color="#2563eb" />
                      <Typography variant="subtitle2" fontWeight={800} color="#1e40af">
                        Account Lifecycle
                      </Typography>
                    </Stack>
                    <Typography variant="caption" color="#1d4ed8" fontWeight={600}>
                      Approve, activate, and deactivate member records
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: "#faf5ff",
                      border: "1px solid #e9d5ff",
                      display: "flex",
                      flexDirection: "column",
                      gap: 0.5,
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <IconLock size={18} color="#9333ea" />
                      <Typography variant="subtitle2" fontWeight={800} color="#6b21a8">
                        Security &amp; Audits
                      </Typography>
                    </Stack>
                    <Typography variant="caption" color="#7e22ce" fontWeight={600}>
                      Role-based access control and immutable audit trails
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {/* Quick Action Navigation Buttons */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                border: "1px solid #cbd5e1",
                background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 2,
              }}
            >
              <Box>
                <Typography variant="subtitle1" fontWeight={800} color="#f8fafc">
                  Account Management Shortcuts
                </Typography>
                <Typography variant="caption" color="#94a3b8" fontWeight={600}>
                  Update credentials, contact info, or return to the main dashboard
                </Typography>
              </Box>

              <Stack direction="row" spacing={1.5} flexWrap="wrap">
                <Button
                  component={Link}
                  href="/profile/edit"
                  variant="contained"
                  startIcon={<IconEdit size={18} />}
                  sx={{
                    bgcolor: "#059669",
                    color: "#ffffff",
                    fontWeight: 800,
                    borderRadius: 2,
                    px: 2.5,
                    py: 0.9,
                    "&:hover": { bgcolor: "#047857" },
                  }}
                >
                  Edit Profile
                </Button>

                <Button
                  component={Link}
                  href="/profile/change-password"
                  variant="outlined"
                  startIcon={<IconKey size={18} />}
                  sx={{
                    borderColor: "#475569",
                    color: "#cbd5e1",
                    fontWeight: 700,
                    borderRadius: 2,
                    px: 2.5,
                    py: 0.9,
                    "&:hover": { borderColor: "#94a3b8", bgcolor: "rgba(255, 255, 255, 0.05)" },
                  }}
                >
                  Change Password
                </Button>

                <Button
                  component={Link}
                  href="/members"
                  variant="outlined"
                  startIcon={<IconUserCheck size={18} />}
                  sx={{
                    borderColor: "#475569",
                    color: "#cbd5e1",
                    fontWeight: 700,
                    borderRadius: 2,
                    px: 2.5,
                    py: 0.9,
                    "&:hover": { borderColor: "#94a3b8", bgcolor: "rgba(255, 255, 255, 0.05)" },
                  }}
                >
                  Member Directory
                </Button>
              </Stack>
            </Paper>
          </Stack>
        </Grid>
      </Grid>

      {/* Copy Notification Toast */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2500}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => setSnackbarOpen(false)}
          sx={{ borderRadius: 2, fontWeight: 700 }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
}