"use client";

import { useMemo } from "react";

import { useSession } from "next-auth/react";

import {
  Avatar,
  Box,
  Chip,
  Paper,
  Stack,
  Typography,
  Divider,
} from "@mui/material";

import {
  IconCalendarEvent,
  IconShieldCheck,
  IconClockHour4,
  IconUser,
} from "@tabler/icons-react";

export default function DashboardHeader() {
  const { data: session } = useSession();

  const currentDate = useMemo(() => {
    return new Intl.DateTimeFormat("en-KE", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date());
  }, []);

  const currentTime = useMemo(() => {
    return new Intl.DateTimeFormat("en-KE", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date());
  }, []);

  const username =
    session?.user?.username ??
    session?.user?.name ??
    "Administrator";

  const email =
    session?.user?.email ??
    "administrator@example.com";

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 4,
        p: 4,
        borderRadius: 4,
        border: "1px solid",
        borderColor: "divider",
        background:
          "linear-gradient(135deg,#ffffff 0%,#f8fbff 100%)",
        transition: ".3s",

        "&:hover": {
          boxShadow: 8,
        },
      }}
    >
      <Stack
        direction={{
          xs: "column",
          lg: "row",
        }}
        spacing={4}
        justifyContent="space-between"
      >
        {/* Left */}

        <Box flex={1}>
          <Typography
            variant="h3"
            fontWeight={700}
            gutterBottom
          >
            Welcome back,
            <Box
              component="span"
              color="primary.main"
            >
              {" "}
              {username}
            </Box>
          </Typography>

          <Typography
            variant="h6"
            color="text.secondary"
            mb={1}
          >
            Member Registration Management System
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              maxWidth: 650,
            }}
          >
            Monitor registrations,
            manage members,
            review reports and
            oversee system
            operations from one
            centralized dashboard.
          </Typography>

          <Stack
            direction="row"
            spacing={1.5}
            mt={4}
            flexWrap="wrap"
            useFlexGap
          >
            <Chip
              icon={
                <IconCalendarEvent
                  size={16}
                />
              }
              label={currentDate}
              color="primary"
              variant="outlined"
            />

            <Chip
              icon={
                <IconClockHour4
                  size={16}
                />
              }
              label={currentTime}
              color="info"
              variant="outlined"
            />

            <Chip
              icon={
                <IconShieldCheck
                  size={16}
                />
              }
              label="System Online"
              color="success"
            />
          </Stack>
        </Box>

        {/* Right */}

        <Paper
          elevation={0}
          sx={{
            width: {
              xs: "100%",
              lg: 330,
            },
            p: 3,
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            background:
              "linear-gradient(180deg,#ffffff,#f9fbfd)",
          }}
        >
          <Stack
            alignItems="center"
            spacing={2}
          >
            <Avatar
              sx={{
                width: 82,
                height: 82,
                bgcolor: "primary.main",
                fontSize: 32,
                fontWeight: 700,
              }}
            >
              {username
                .charAt(0)
                .toUpperCase()}
            </Avatar>

            <Typography
              variant="h5"
              fontWeight={700}
            >
              {username}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              {email}
            </Typography>

            <Divider
              sx={{
                width: "100%",
              }}
            />

            <Stack
              direction="row"
              spacing={1}
              flexWrap="wrap"
              justifyContent="center"
            >
              <Chip
                icon={
                  <IconUser
                    size={15}
                  />
                }
                label="Administrator"
                color="primary"
              />

              <Chip
                label="Active Session"
                color="success"
                variant="outlined"
              />
            </Stack>

            <Typography
              variant="caption"
              color="text.secondary"
              textAlign="center"
            >
              Securely connected to
              the Member Registration
              Management System.
            </Typography>
          </Stack>
        </Paper>
      </Stack>
    </Paper>
  );
}