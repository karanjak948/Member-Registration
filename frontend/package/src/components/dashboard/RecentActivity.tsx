"use client";

import { useMemo } from "react";

import Link from "next/link";

import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";

import {
  IconArrowRight,
  IconUserPlus,
  IconUserCheck,
  IconClockHour4,
} from "@tabler/icons-react";

import { Member } from "@/interfaces/member";

interface RecentActivityProps {
  members: Member[];
}

export default function RecentActivity({
  members,
}: RecentActivityProps) {
  const activities = useMemo(() => {
    return [...members]
      .sort((a, b) => {
        const first = new Date(
          b.created_at ?? ""
        ).getTime();

        const second = new Date(
          a.created_at ?? ""
        ).getTime();

        return first - second;
      })
      .slice(0, 6)
      .map((member) => ({
        id: member.id,
        title: `${member.first_name} ${member.other_names}`,
        membership: member.membership_number,
        status: member.status,
        stage: member.registration_stage,
        created_at: member.created_at,
      }));
  }, [members]);

  function getStatusColor(status?: string) {
    switch (status) {
      case "ACTIVE":
        return "success";

      case "INACTIVE":
        return "error";

      default:
        return "warning";
    }
  }

  return (
    <Card
      elevation={3}
      sx={{ height: "100%" }}
    >
      <CardContent>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography
            variant="h6"
            fontWeight={700}
          >
            Recent Activity
          </Typography>

          <Button
            component={Link}
            href="/members"
            endIcon={<IconArrowRight size={16} />}
          >
            View All
          </Button>
        </Stack>

        <Divider sx={{ mb: 2 }} />

        <List disablePadding>
          {activities.map((activity, index) => (
            <Box key={activity.id}>
              <ListItem
                disablePadding
                sx={{ py: 1.5 }}
              >
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      bgcolor: "primary.light",
                    }}
                  >
                    {activity.status ===
                    "ACTIVE" ? (
                      <IconUserCheck
                        size={18}
                      />
                    ) : (
                      <IconUserPlus
                        size={18}
                      />
                    )}
                  </Avatar>
                </ListItemAvatar>

                <ListItemText
                  primary={
                    <Typography
                      fontWeight={600}
                    >
                      {activity.title}
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography
                        variant="caption"
                        display="block"
                      >
                        {activity.membership}
                      </Typography>

                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        Registration completed
                      </Typography>
                    </>
                  }
                />

                <Stack
                  spacing={1}
                  alignItems="flex-end"
                >
                  <Chip
                    size="small"
                    label={
                      activity.status ??
                      "Pending"
                    }
                    color={getStatusColor(
                      activity.status
                    )}
                  />

                  <Stack
                    direction="row"
                    spacing={0.5}
                    alignItems="center"
                  >
                    <IconClockHour4
                      size={14}
                    />

                    <Typography
                      variant="caption"
                    >
                      {activity.created_at
                        ? new Date(
                            activity.created_at
                          ).toLocaleDateString()
                        : "-"}
                    </Typography>
                  </Stack>
                </Stack>
              </ListItem>

              {index <
                activities.length - 1 && (
                <Divider />
              )}
            </Box>
          ))}

          {activities.length === 0 && (
            <Typography
              color="text.secondary"
            >
              No recent activity available.
            </Typography>
          )}
        </List>
      </CardContent>
    </Card>
  );
}