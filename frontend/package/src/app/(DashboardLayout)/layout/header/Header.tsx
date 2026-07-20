"use client";

import React, {
  MouseEvent,
  useState,
} from "react";

import {
  AppBar,
  Box,
  Divider,
  IconButton,
  Menu,
  Stack,
  Toolbar,
  Typography,
  styled,
} from "@mui/material";

import {
  IconBellRinging,
  IconMenu,
} from "@tabler/icons-react";

import Profile from "./Profile";

interface ItemType {
  toggleMobileSidebar: (
    event: React.MouseEvent<HTMLElement>
  ) => void;
}

const AppBarStyled = styled(AppBar)(
  ({ theme }) => ({
    boxShadow: "none",
    background:
      theme.palette.background.paper,
    justifyContent: "center",
    backdropFilter: "blur(4px)",

    [theme.breakpoints.up("lg")]: {
      minHeight: "70px",
    },
  })
);

const ToolbarStyled = styled(Toolbar)(
  ({ theme }) => ({
    width: "100%",
    color:
      theme.palette.text.secondary,
  })
);

export default function Header({
  toggleMobileSidebar,
}: ItemType) {
  const [
    notificationAnchor,
    setNotificationAnchor,
  ] =
    useState<HTMLElement | null>(null);

  function handleNotificationOpen(
    event: MouseEvent<HTMLElement>
  ) {
    setNotificationAnchor(
      event.currentTarget
    );
  }

  function handleNotificationClose() {
    setNotificationAnchor(null);
  }

  return (
    <AppBarStyled
      position="sticky"
      color="default"
    >
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
          <IconMenu
            width={20}
            height={20}
          />
        </IconButton>

        <Box flexGrow={1} />

        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
        >
          {/* Notifications */}
          <IconButton
            size="large"
            color="inherit"
            aria-label="Open notifications"
            aria-controls={
              notificationAnchor
                ? "notifications-menu"
                : undefined
            }
            aria-haspopup="true"
            aria-expanded={
              notificationAnchor
                ? "true"
                : undefined
            }
            onClick={
              handleNotificationOpen
            }
          >
            <IconBellRinging
              size={21}
              stroke={1.5}
            />
          </IconButton>

          {/* Authenticated user */}
          <Profile />
        </Stack>

        {/* Notification dropdown */}
        <Menu
          id="notifications-menu"
          anchorEl={notificationAnchor}
          open={Boolean(
            notificationAnchor
          )}
          onClose={
            handleNotificationClose
          }
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
                  xs: 300,
                  sm: 360,
                },
                mt: 1.5,
                borderRadius: 2,
                boxShadow:
                  "0 8px 30px rgba(0,0,0,0.12)",
              },
            },
          }}
        >
          <Box
            px={2.5}
            py={2}
          >
            <Typography
              variant="h6"
              fontWeight={700}
            >
              Notifications
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              Registration and system
              updates
            </Typography>
          </Box>

          <Divider />

          <Box
            px={3}
            py={4}
            textAlign="center"
          >
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                bgcolor: "action.hover",
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "center",
                mx: "auto",
                mb: 1.5,
              }}
            >
              <IconBellRinging
                size={25}
                stroke={1.5}
              />
            </Box>

            <Typography
              fontWeight={600}
              mb={0.5}
            >
              No new notifications
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              Registration approvals and
              important system updates will
              appear here.
            </Typography>
          </Box>
        </Menu>
      </ToolbarStyled>
    </AppBarStyled>
  );
}