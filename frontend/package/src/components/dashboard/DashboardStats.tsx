"use client";

import {
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
  Box,
} from "@mui/material";

import {
  IconUsers,
  IconUserCheck,
  IconUserX,
  IconClockHour4,
  IconCategory,
  IconCalendarStats,
  IconCircleCheck,
  IconCircleX,
} from "@tabler/icons-react";

interface DashboardStatsProps {
  totalMembers: number;
  activeMembers: number;
  pendingMembers: number;
  inactiveMembers: number;

  approvedMembers?: number;
  rejectedMembers?: number;
  totalCategories?: number;
  newMembersThisMonth?: number;
}

export default function DashboardStats({
  totalMembers,
  activeMembers,
  pendingMembers,
  inactiveMembers,
  approvedMembers = 0,
  rejectedMembers = 0,
  totalCategories = 0,
  newMembersThisMonth = 0,
}: DashboardStatsProps) {
  const cards = [
    {
      title: "Total Members",
      value: totalMembers,
      subtitle: "Registered members",
      icon: IconUsers,
      color: "#1976d2",
    },
    {
      title: "Active Members",
      value: activeMembers,
      subtitle: "Currently active",
      icon: IconUserCheck,
      color: "#2e7d32",
    },
    {
      title: "Pending",
      value: pendingMembers,
      subtitle: "Awaiting approval",
      icon: IconClockHour4,
      color: "#ed6c02",
    },
    {
      title: "Inactive",
      value: inactiveMembers,
      subtitle: "Inactive records",
      icon: IconUserX,
      color: "#d32f2f",
    },
    {
      title: "Approved",
      value: approvedMembers,
      subtitle: "Completed approvals",
      icon: IconCircleCheck,
      color: "#00897b",
    },
    {
      title: "Rejected",
      value: rejectedMembers,
      subtitle: "Rejected registrations",
      icon: IconCircleX,
      color: "#c62828",
    },
    {
      title: "Categories",
      value: totalCategories,
      subtitle: "Member categories",
      icon: IconCategory,
      color: "#6a1b9a",
    },
    {
      title: "New This Month",
      value: newMembersThisMonth,
      subtitle: "Monthly registrations",
      icon: IconCalendarStats,
      color: "#0277bd",
    },
  ];

  return (
    <Grid container spacing={3}>
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Grid
            key={card.title}
            size={{
              xs: 12,
              sm: 6,
              md: 3,
            }}
          >
            <Card
              elevation={3}
              sx={{
                height: "100%",
                borderLeft: `6px solid ${card.color}`,
                transition: "0.25s",

                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: 8,
                },
              }}
            >
              <CardContent>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      {card.title}
                    </Typography>

                    <Typography
                      variant="h3"
                      fontWeight={700}
                      mt={1}
                    >
                      {card.value}
                    </Typography>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      {card.subtitle}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: "50%",
                      backgroundColor: `${card.color}20`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon
                      size={30}
                      color={card.color}
                    />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
}