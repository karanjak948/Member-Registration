"use client";

import React, {
  MouseEvent,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import {
  AppBar,
  Badge,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  Toolbar,
  Tooltip,
  Typography,
  styled,
} from "@mui/material";

import {
  IconBellRinging,
  IconMenu,
  IconUserCheck,
  IconShieldCheck,
  IconClock,
  IconCheck,
  IconTrash,
  IconArrowRight,
  IconSparkles,
  IconAlertCircle,
  IconCreditCard,
} from "@tabler/icons-react";

import Profile from "./Profile";

interface ItemType {
  toggleMobileSidebar: (
    event: React.MouseEvent<HTMLElement>
  ) => void;
}

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  category: "members" | "security" | "loans";
  read: boolean;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  link?: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    title: "Bulk Member Activation",
    description: "12 member accounts were verified and activated successfully.",
    time: "Just now",
    category: "members",
    read: false,
    icon: <IconUserCheck size={18} stroke={2.5} />,
    iconBg: "#ecfdf5",
    iconColor: "#059669",
    link: "/members",
  },
  {
    id: "notif-2",
    title: "System Authentication",
    description: "Administrator session established from IP 127.0.0.1.",
    time: "15m ago",
    category: "security",
    read: false,
    icon: <IconShieldCheck size={18} stroke={2.5} />,
    iconBg: "#eff6ff",
    iconColor: "#2563eb",
    link: "/profile",
  },
  {
    id: "notif-3",
    title: "KYC Approval Pending",
    description: "Member registration for Andrew Kibe is waiting for stage review.",
    time: "1h ago",
    category: "members",
    read: true,
    icon: <IconClock size={18} stroke={2.5} />,
    iconBg: "#fffbeb",
    iconColor: "#d97706",
    link: "/members",
  },
];

const AppBarStyled = styled(AppBar)(({ theme }) => ({
  boxShadow: "none",
  background: theme.palette.background.paper,
  justifyContent: "center",
  backdropFilter: "blur(4px)",
  [theme.breakpoints.up("lg")]: {
    minHeight: "70px",
  },
}));

const ToolbarStyled = styled(Toolbar)(({ theme }) => ({
  width: "100%",
  color: theme.palette.text.secondary,
}));

export default function Header({ toggleMobileSidebar }: ItemType) {
  const router = useRouter();

  const [notificationAnchor, setNotificationAnchor] =
    useState<HTMLElement | null>(null);
  const [notifications, setNotifications] =
    useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [activeTab, setActiveTab] = useState<string>("all");

  const unreadCount = notifications.filter((n) => !n.read).length;

  function handleNotificationOpen(event: MouseEvent<HTMLElement>) {
    setNotificationAnchor(event.currentTarget);
  }

  function handleNotificationClose() {
    setNotificationAnchor(null);
  }

  function markAllAsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function clearAllNotifications() {
    setNotifications([]);
  }

  function handleItemClick(notif: NotificationItem) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
    );
    if (notif.link) {
      router.push(notif.link);
      handleNotificationClose();
    }
  }

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "all") return true;
    return n.category === activeTab;
  });

  return (
    <AppBarStyled position="sticky" color="default">
      <ToolbarStyled>
        {/* Mobile menu */}
        <IconButton
          color="inherit"
          aria-label="Open navigation menu"
          onClick={toggleMobileSidebar}
          sx={{
            display: {
              xs: "inline-flex",
              lg: "none",
            },
          }}
        >
          <IconMenu width={20} height={20} />
        </IconButton>

        <Box flexGrow={1} />

        <Stack direction="row" spacing={1.5} alignItems="center">
          {/* Notifications Trigger */}
          <IconButton
            size="large"
            color="inherit"
            aria-label="Open notifications"
            aria-controls={notificationAnchor ? "notifications-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={notificationAnchor ? "true" : undefined}
            onClick={handleNotificationOpen}
            sx={{
              transition: "all 0.2s ease",
              "&:hover": {
                bgcolor: "#ecfdf5",
                color: "#059669",
              },
            }}
          >
            <Badge
              badgeContent={unreadCount}
              color="success"
              sx={{
                "& .MuiBadge-badge": {
                  bgcolor: "#059669",
                  color: "#ffffff",
                  fontWeight: 800,
                  fontSize: "0.7rem",
                  boxShadow: "0 0 0 2px #ffffff",
                },
              }}
            >
              <IconBellRinging
                size={22}
                stroke={unreadCount > 0 ? 2 : 1.5}
                color={unreadCount > 0 ? "#059669" : "currentColor"}
              />
            </Badge>
          </IconButton>

          {/* Authenticated user */}
          <Profile />
        </Stack>

        {/* Notification dropdown */}
        <Menu
          id="notifications-menu"
          anchorEl={notificationAnchor}
          open={Boolean(notificationAnchor)}
          onClose={handleNotificationClose}
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
                width: {
                  xs: 320,
                  sm: 400,
                },
                mt: 1.5,
                borderRadius: 3.5,
                boxShadow: "0 20px 40px -10px rgba(0,0,0,0.18)",
                overflow: "hidden",
                border: "1px solid #e2e8f0",
              },
            },
          }}
        >
          {/* 1. Header Banner */}
          <Box
            sx={{
              px: 3,
              py: 2.2,
              background: "linear-gradient(135deg, #064e3b 0%, #047857 60%, #059669 100%)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="subtitle1" fontWeight={900} sx={{ color: "#ffffff", letterSpacing: "-0.3px" }}>
                  Notifications
                </Typography>
                {unreadCount > 0 && (
                  <Chip
                    label={`${unreadCount} New`}
                    size="small"
                    sx={{
                      bgcolor: "rgba(255, 255, 255, 0.25)",
                      color: "#ffffff",
                      fontWeight: 800,
                      fontSize: "0.68rem",
                      height: 20,
                    }}
                  />
                )}
              </Stack>
              <Typography variant="caption" sx={{ color: "#d1fae5", fontWeight: 600 }}>
                Live SACCO events &amp; system updates
              </Typography>
            </Box>

            {unreadCount > 0 && (
              <Tooltip title="Mark all notifications as read">
                <Button
                  size="small"
                  onClick={markAllAsRead}
                  startIcon={<IconCheck size={14} />}
                  sx={{
                    color: "#ffffff",
                    bgcolor: "rgba(255, 255, 255, 0.18)",
                    backdropFilter: "blur(4px)",
                    fontWeight: 800,
                    fontSize: "0.72rem",
                    borderRadius: 2,
                    px: 1.2,
                    py: 0.3,
                    "&:hover": { bgcolor: "rgba(255, 255, 255, 0.3)" },
                  }}
                >
                  Mark Read
                </Button>
              </Tooltip>
            )}
          </Box>

          {/* 2. Filter Pills */}
          {notifications.length > 0 && (
            <Box sx={{ px: 2, py: 1, bgcolor: "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
              <Stack direction="row" spacing={0.8}>
                <Chip
                  label={`All (${notifications.length})`}
                  size="small"
                  onClick={() => setActiveTab("all")}
                  sx={{
                    fontWeight: 800,
                    fontSize: "0.72rem",
                    borderRadius: 1.5,
                    bgcolor: activeTab === "all" ? "#064e3b" : "#ffffff",
                    color: activeTab === "all" ? "#ffffff" : "#64748b",
                    border: `1px solid ${activeTab === "all" ? "#064e3b" : "#e2e8f0"}`,
                    cursor: "pointer",
                  }}
                />
                <Chip
                  label={`Members (${notifications.filter((n) => n.category === "members").length})`}
                  size="small"
                  onClick={() => setActiveTab("members")}
                  sx={{
                    fontWeight: 800,
                    fontSize: "0.72rem",
                    borderRadius: 1.5,
                    bgcolor: activeTab === "members" ? "#064e3b" : "#ffffff",
                    color: activeTab === "members" ? "#ffffff" : "#64748b",
                    border: `1px solid ${activeTab === "members" ? "#064e3b" : "#e2e8f0"}`,
                    cursor: "pointer",
                  }}
                />
                <Chip
                  label={`Security (${notifications.filter((n) => n.category === "security").length})`}
                  size="small"
                  onClick={() => setActiveTab("security")}
                  sx={{
                    fontWeight: 800,
                    fontSize: "0.72rem",
                    borderRadius: 1.5,
                    bgcolor: activeTab === "security" ? "#064e3b" : "#ffffff",
                    color: activeTab === "security" ? "#ffffff" : "#64748b",
                    border: `1px solid ${activeTab === "security" ? "#064e3b" : "#e2e8f0"}`,
                    cursor: "pointer",
                  }}
                />
              </Stack>
            </Box>
          )}

          {/* 3. Notifications Feed List */}
          <Box sx={{ maxHeight: 340, overflowY: "auto" }}>
            {filteredNotifications.length === 0 ? (
              <Box px={3} py={5} textAlign="center">
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    bgcolor: "#ecfdf5",
                    color: "#059669",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mx: "auto",
                    mb: 2,
                    boxShadow: "0 0 0 8px #f0fdf4",
                  }}
                >
                  <IconBellRinging size={30} stroke={1.8} />
                </Box>

                <Typography variant="subtitle2" fontWeight={800} color="#0f172a" mb={0.5}>
                  All Caught Up!
                </Typography>

                <Typography variant="caption" color="#64748b" display="block" sx={{ maxWidth: 260, mx: "auto", lineHeight: 1.5 }}>
                  No unread notifications in this category. Registration approvals and system updates will appear here.
                </Typography>
              </Box>
            ) : (
              filteredNotifications.map((notif, index) => (
                <Box key={notif.id}>
                  <MenuItem
                    onClick={() => handleItemClick(notif)}
                    sx={{
                      px: 2.5,
                      py: 1.8,
                      bgcolor: notif.read ? "#ffffff" : "#f0fdf4",
                      transition: "all 0.15s ease",
                      "&:hover": {
                        bgcolor: notif.read ? "#f8fafc" : "#ecfdf5",
                      },
                    }}
                  >
                    <Stack direction="row" spacing={1.8} alignItems="flex-start" sx={{ width: "100%" }}>
                      {/* Icon Avatar */}
                      <Box
                        sx={{
                          width: 38,
                          height: 38,
                          borderRadius: 2,
                          bgcolor: notif.iconBg,
                          color: notif.iconColor,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          mt: 0.2,
                        }}
                      >
                        {notif.icon}
                      </Box>

                      {/* Content */}
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.3 }}>
                          <Typography
                            variant="body2"
                            fontWeight={notif.read ? 700 : 900}
                            color="#0f172a"
                            noWrap
                          >
                            {notif.title}
                          </Typography>

                          <Typography variant="caption" color="#94a3b8" fontWeight={600} sx={{ flexShrink: 0, ml: 1, fontSize: "0.7rem" }}>
                            {notif.time}
                          </Typography>
                        </Stack>

                        <Typography
                          variant="caption"
                          color="#64748b"
                          sx={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            lineHeight: 1.4,
                            fontWeight: 500,
                          }}
                        >
                          {notif.description}
                        </Typography>
                      </Box>

                      {/* Unread Indicator Dot */}
                      {!notif.read && (
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            bgcolor: "#059669",
                            flexShrink: 0,
                            mt: 1,
                            boxShadow: "0 0 6px #10b981",
                          }}
                        />
                      )}
                    </Stack>
                  </MenuItem>
                  {index < filteredNotifications.length - 1 && <Divider sx={{ borderColor: "#f1f5f9" }} />}
                </Box>
              ))
            )}
          </Box>

          {/* 4. Footer Actions */}
          <Divider />
          <Box
            sx={{
              p: 1.5,
              bgcolor: "#f8fafc",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {notifications.length > 0 ? (
              <Button
                size="small"
                onClick={clearAllNotifications}
                startIcon={<IconTrash size={15} />}
                sx={{
                  color: "#94a3b8",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  "&:hover": { color: "#dc2626" },
                }}
              >
                Clear All
              </Button>
            ) : <Box />}

            <Button
              size="small"
              onClick={() => {
                router.push("/members");
                handleNotificationClose();
              }}
              endIcon={<IconArrowRight size={15} />}
              sx={{
                color: "#065f46",
                fontWeight: 800,
                fontSize: "0.75rem",
                "&:hover": { color: "#047857" },
              }}
            >
              Member Directory
            </Button>
          </Box>
        </Menu>
      </ToolbarStyled>
    </AppBarStyled>
  );
}