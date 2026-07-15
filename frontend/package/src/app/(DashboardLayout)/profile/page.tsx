"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";

import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Typography,
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import LockResetIcon from "@mui/icons-material/LockReset";

export default function ProfilePage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  const user = session?.user;

  return (
    <Container maxWidth="lg">
      <Typography
        variant="h4"
        gutterBottom
      >
        My Profile
      </Typography>

      <Typography
        variant="body1"
        color="text.secondary"
        mb={4}
      >
        View and manage your account information.
      </Typography>

      <Card>
        <CardContent>
          <Box
            display="flex"
            alignItems="center"
            gap={3}
            mb={4}
          >
            <Avatar
              src={user?.image ?? ""}
              sx={{
                width: 90,
                height: 90,
              }}
            >
              {user?.name?.charAt(0)}
            </Avatar>

            <Box>
              <Typography variant="h5">
                {user?.name ?? "User"}
              </Typography>

              <Typography color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 4 }} />

          <Grid
            container
            spacing={3}
          >
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Full Name
              </Typography>

              <Typography variant="subtitle1">
                {user?.name ?? "-"}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Email Address
              </Typography>

              <Typography variant="subtitle1">
                {user?.email ?? "-"}
              </Typography>
            </Grid>
          </Grid>

          <Box
            mt={5}
            display="flex"
            gap={2}
          >
            <Button
              component={Link}
              href="/profile/edit"
              variant="contained"
              startIcon={<EditIcon />}
            >
              Edit Profile
            </Button>

            <Button
              component={Link}
              href="/profile/change-password"
              variant="outlined"
              startIcon={<LockResetIcon />}
            >
              Change Password
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}