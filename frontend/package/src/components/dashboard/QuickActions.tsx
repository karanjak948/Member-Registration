"use client";

import Link from "next/link";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

import {
  IconArrowRight,
  IconPlus,
  IconUsers,
} from "@tabler/icons-react";

const actions = [
  {
    title: "Register Member",
    description:
      "Launch the multi-step registration wizard to onboard a new member into the system.",
    href: "/members/new",
    button: "Start Registration",
    icon: IconPlus,
    color: "#1976D2",
    background:
      "linear-gradient(135deg,#1976D2 0%,#42A5F5 100%)",
    badge: "Primary",
  },
  {
    title: "Manage Members",
    description:
      "Browse, search, edit and manage all registered members from one place.",
    href: "/members",
    button: "Open Members",
    icon: IconUsers,
    color: "#2E7D32",
    background:
      "linear-gradient(135deg,#2E7D32 0%,#66BB6A 100%)",
    badge: "Management",
  },
];

export default function QuickActions() {
  return (
    <Box mt={4}>
      <Typography
        variant="h5"
        fontWeight={700}
        mb={0.5}
      >
        Quick Actions
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        mb={3}
      >
        Frequently used actions for managing the membership lifecycle.
      </Typography>

      <Grid container spacing={3}>
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <Grid
              key={action.title}
              size={{
                xs: 12,
                md: 6,
              }}
            >
              <Card
                elevation={4}
                sx={{
                  height: "100%",
                  overflow: "hidden",
                  borderRadius: 4,
                  transition: "all .3s ease",

                  "&:hover": {
                    transform: "translateY(-6px)",
                    boxShadow: 10,
                  },
                }}
              >
                <Box
                  sx={{
                    height: 8,
                    background: action.background,
                  }}
                />

                <CardContent sx={{ p: 4 }}>
                  <Stack
                    spacing={3}
                    height="100%"
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Box
                        sx={{
                          width: 68,
                          height: 68,
                          borderRadius: 3,
                          bgcolor: `${action.color}15`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Icon
                          size={34}
                          color={action.color}
                        />
                      </Box>

                      <Chip
                        label={action.badge}
                        color="primary"
                        size="small"
                      />
                    </Stack>

                    <Box>
                      <Typography
                        variant="h5"
                        fontWeight={700}
                        gutterBottom
                      >
                        {action.title}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        {action.description}
                      </Typography>
                    </Box>

                    <Box flexGrow={1} />

                    <Button
                      component={Link}
                      href={action.href}
                      variant="contained"
                      size="large"
                      fullWidth
                      endIcon={
                        <IconArrowRight size={18} />
                      }
                      sx={{
                        py: 1.4,
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 600,
                      }}
                    >
                      {action.button}
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}