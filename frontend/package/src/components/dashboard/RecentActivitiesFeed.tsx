"use client";

import {
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  Button,
  List,
  ListItem,
  Avatar,
} from "@mui/material";
import Link from "next/link";
import {
  IconArrowRight,
  IconReceipt,
  IconCash,
  IconUserCheck,
  IconCircleCheck,
} from "@tabler/icons-react";

export default function RecentActivitiesFeed() {
  const activities = [
    {
      id: 1,
      title: "Payment of KES 2,500 received from",
      name: "James Mwangi - RC12345678",
      time: "10:23 AM",
      icon: IconReceipt,
      bgColor: "#10b981", // Green
    },
    {
      id: 2,
      title: "Loan of KES 50,000 disbursed to",
      name: "Mary Wanjiku - RC23456789",
      time: "09:45 AM",
      icon: IconCash,
      bgColor: "#f59e0b", // Amber/Gold
    },
    {
      id: 3,
      title: "New member registered:",
      name: "Peter Kimani - RC34567890",
      time: "09:15 AM",
      icon: IconUserCheck,
      bgColor: "#8b5cf6", // Purple
    },
    {
      id: 4,
      title: "Loan application approved for",
      name: "Susan Akinyi - RC45678901",
      time: "08:50 AM",
      icon: IconCircleCheck,
      bgColor: "#0284c7", // Blue
    },
  ];

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <CardContent sx={{ p: 2.5, pb: 1.5 }}>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 800,
            fontSize: "0.85rem",
            letterSpacing: 0.5,
            color: "text.primary",
            mb: 1.5,
          }}
        >
          RECENT ACTIVITIES
        </Typography>

        <List disablePadding>
          {activities.map((item, index) => {
            const Icon = item.icon;
            return (
              <ListItem
                key={item.id}
                disablePadding
                sx={{
                  py: 1.2,
                  borderBottom: index < activities.length - 1 ? "1px solid #f1f5f9" : "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1, minWidth: 0, pr: 1 }}>
                  <Avatar
                    sx={{
                      bgcolor: item.bgColor,
                      width: 32,
                      height: 32,
                    }}
                  >
                    <Icon size={18} color="#ffffff" stroke={2} />
                  </Avatar>

                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        fontSize: "0.72rem",
                        display: "block",
                        lineHeight: 1.2,
                      }}
                    >
                      {item.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.78rem",
                        color: "text.primary",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {item.name}
                    </Typography>
                  </Box>
                </Stack>

                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    fontSize: "0.72rem",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.time}
                </Typography>
              </ListItem>
            );
          })}
        </List>
      </CardContent>

      <Box sx={{ p: 1.5, px: 2.5, borderTop: "1px solid", borderColor: "divider" }}>
        <Button
          component={Link}
          href="/reports"
          size="small"
          endIcon={<IconArrowRight size={14} />}
          sx={{ textTransform: "none", fontSize: "0.75rem", p: 0, fontWeight: 600, color: "#0f766e" }}
        >
          View all activities
        </Button>
      </Box>
    </Card>
  );
}
