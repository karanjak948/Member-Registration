"use client";

import Link from "next/link";

import {
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  Stack,
} from "@mui/material";

import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import GroupsIcon from "@mui/icons-material/Groups";

export default function QuickActions() {
  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Card
          sx={{
            height: "100%",
          }}
        >
          <CardContent>
            <Stack spacing={2}>
              <PersonAddAlt1Icon
                color="primary"
                sx={{ fontSize: 48 }}
              />

              <Typography variant="h5">
                Register Member
              </Typography>

              <Typography color="text.secondary">
                Register a new member using the
                multi-step registration wizard.
              </Typography>

              <Button
                component={Link}
                href="/members/new"
                variant="contained"
              >
                Register Member
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Card
          sx={{
            height: "100%",
          }}
        >
          <CardContent>
            <Stack spacing={2}>
              <GroupsIcon
                color="success"
                sx={{ fontSize: 48 }}
              />

              <Typography variant="h5">
                View Members
              </Typography>

              <Typography color="text.secondary">
                View, search, edit and manage all
                registered members.
              </Typography>

              <Button
                component={Link}
                href="/members"
                variant="contained"
                color="success"
              >
                View Members
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}