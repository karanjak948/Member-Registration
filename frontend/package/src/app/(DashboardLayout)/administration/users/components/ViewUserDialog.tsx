"use client";

import {
  Avatar,
  Box,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import { OrganizationUser } from "@/types/user";

interface ViewUserDialogProps {
  open: boolean;
  user: OrganizationUser | null;
  onClose: () => void;
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Grid size={{ xs: 12, sm: 6 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          textTransform: "uppercase",
          letterSpacing: 1,
        }}
      >
        {label}
      </Typography>

      <Typography variant="body1" fontWeight={600} mt={0.5}>
        {value}
      </Typography>
    </Grid>
  );
}

export default function ViewUserDialog({
  open,
  user,
  onClose,
}: ViewUserDialogProps) {
  if (!user) return null;

  const fullName = `${user.first_name} ${user.last_name}`.trim();

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>User Details</DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3}>
          {/* ====================================== */}
          {/* PROFILE HEADER */}
          {/* ====================================== */}

          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: (theme) => `1px solid ${theme.palette.divider}`,
              borderRadius: 3,
            }}
          >
            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              spacing={3}
              alignItems={{
                xs: "center",
                sm: "flex-start",
              }}
            >
              <Avatar
                sx={{
                  width: 88,
                  height: 88,
                  bgcolor: "primary.main",
                  fontSize: 32,
                  fontWeight: 700,
                }}
              >
                {(user.first_name || user.username).charAt(0).toUpperCase()}
              </Avatar>

              <Box flex={1}>
                <Typography variant="h5" fontWeight={700}>
                  {fullName}
                </Typography>

                <Typography color="text.secondary">@{user.username}</Typography>

                <Stack direction="row" spacing={1} mt={2} flexWrap="wrap">
                  <Chip
                    label={user.role.name}
                    color="primary"
                    variant="outlined"
                  />

                  <Chip
                    label={user.is_active ? "Active" : "Inactive"}
                    color={user.is_active ? "success" : "error"}
                  />

                  {user.role.is_system_role && (
                    <Chip label="System Role" color="warning" />
                  )}
                </Stack>
              </Box>
            </Stack>
          </Paper>

          {/* ====================================== */}
          {/* USER INFORMATION */}
          {/* ====================================== */}

          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: (theme) => `1px solid ${theme.palette.divider}`,
              borderRadius: 3,
            }}
          >
            <Typography variant="h6" gutterBottom>
              User Information
            </Typography>

            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <DetailItem label="First Name" value={user.first_name} />

              <DetailItem label="Last Name" value={user.last_name} />

              <DetailItem label="Username" value={user.username} />

              <DetailItem label="Email" value={user.email} />

              <DetailItem
                label="Created"
                value={new Date(user.created_at).toLocaleString()}
              />

              <DetailItem
                label="Updated"
                value={new Date(user.updated_at).toLocaleString()}
              />
            </Grid>
          </Paper>

          {/* ====================================== */}
          {/* PERMISSIONS */}
          {/* ====================================== */}

          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: (theme) => `1px solid ${theme.palette.divider}`,
              borderRadius: 3,
            }}
          >
            <Typography variant="h6" gutterBottom>
              Effective Permissions
            </Typography>

            <Divider sx={{ mb: 3 }} />

            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {user.permissions.length > 0 ? (
                user.permissions.map((permission) => (
                  <Chip
                    key={permission.id}
                    label={permission.name}
                    color="primary"
                    variant="outlined"
                  />
                ))
              ) : (
                <Typography color="text.secondary">
                  No permissions assigned.
                </Typography>
              )}
            </Stack>
          </Paper>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button variant="contained" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
