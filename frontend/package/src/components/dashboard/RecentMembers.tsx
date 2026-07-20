"use client";

import Link from "next/link";

import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";

import VisibilityIcon from "@mui/icons-material/Visibility";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

import { Member } from "@/interfaces/member";

interface RecentMembersProps {
  members: Member[];
}

export default function RecentMembers({ members }: RecentMembersProps) {
  const latestMembers = [...members]
    .sort((a, b) => {
      const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;

      const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;

      return bDate - aDate;
    })
    .slice(0, 5);

  function statusColor(status: string) {
    switch (status) {
      case "ACTIVE":
        return "success";

      case "INACTIVE":
        return "warning";

      case "SUSPENDED":
        return "error";

      default:
        return "default";
    }
  }

  return (
    <Card
      elevation={3}
      sx={{
        height: "100%",
        borderRadius: 3,
      }}
    >
      <CardContent>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Recent Members
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Latest registered members
            </Typography>
          </Box>

          <Button
            component={Link}
            href="/members"
            endIcon={<ArrowForwardIcon />}
            size="small"
          >
            View All
          </Button>
        </Stack>

        <Stack divider={<Divider />}>
          {latestMembers.length === 0 ? (
            <Box py={5}>
              <Typography align="center" color="text.secondary">
                No members found.
              </Typography>
            </Box>
          ) : (
            latestMembers.map((member) => (
              <Stack
                key={member.id}
                direction="row"
                spacing={2}
                alignItems="center"
                justifyContent="space-between"
                py={2}
              >
                <Stack direction="row" spacing={2} alignItems="center" flex={1}>
                  <Avatar
                    src={
                      member.passport_photo
                        ? member.passport_photo.startsWith("http")
                          ? member.passport_photo
                          : `http://127.0.0.1:8000${member.passport_photo}`
                        : undefined
                    }
                    alt={`${member.first_name ?? ""} ${member.other_names ?? ""}`.trim()}
                    sx={{
                      bgcolor: "primary.main",
                      width: 48,
                      height: 48,
                      fontWeight: 700,
                    }}
                  >
                    {!member.passport_photo &&
                      member.first_name?.charAt(0).toUpperCase()}
                  </Avatar>

                  <Box>
                    <Typography fontWeight={600}>
                      {member.first_name} {member.other_names}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      {member.membership_number}
                    </Typography>

                    <Typography variant="caption" color="text.secondary">
                      {member.category?.name ?? "No Category"}
                    </Typography>
                  </Box>
                </Stack>

                <Stack spacing={1} alignItems="flex-end">
                  <Chip
                    size="small"
                    label={member.status}
                    color={statusColor(member.status)}
                  />

                  <Button
                    component={Link}
                    href={`/members/${member.id}`}
                    startIcon={<VisibilityIcon />}
                    size="small"
                  >
                    View
                  </Button>
                </Stack>
              </Stack>
            ))
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
