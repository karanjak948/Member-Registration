"use client";

import { useState } from "react";

import {
  Add as AddIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";

import {
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import { usePermissions } from "@/hooks/usePermissions";

import { UserToolbarProps } from "@/types/user-components";

import UserDialog from "./UserDialog";

export default function UserToolbar({
  onRefresh,
}: UserToolbarProps) {
  const { can } = usePermissions();

  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: (theme) =>
            `1px solid ${theme.palette.divider}`,
          mb: 2,
        }}
      >
        <Stack spacing={3}>
          {/* ===================================== */}
          {/* HEADER */}
          {/* ===================================== */}

          <Stack
            direction={{
              xs: "column",
              md: "row",
            }}
            justifyContent="space-between"
            alignItems={{
              xs: "flex-start",
              md: "center",
            }}
            spacing={3}
          >
            <Box>
              <Typography
                variant="h4"
                fontWeight={700}
                gutterBottom
              >
                User Management
              </Typography>

              <Typography
                variant="body1"
                color="text.secondary"
              >
                Manage organization users, assign roles,
                activate accounts and control access
                permissions.
              </Typography>
            </Box>

            <Stack
              direction="row"
              spacing={2}
              flexWrap="wrap"
            >
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={onRefresh}
              >
                Refresh
              </Button>

              {can("manage_users") && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  size="large"
                  onClick={() =>
                    setDialogOpen(true)
                  }
                >
                  New User
                </Button>
              )}
            </Stack>
          </Stack>

          <Divider />

          {/* ===================================== */}
          {/* SUMMARY */}
          {/* ===================================== */}

          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            spacing={2}
            alignItems={{
              xs: "flex-start",
              sm: "center",
            }}
          >
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Organization Administration
            </Typography>

            <Chip
              label="Users"
              color="primary"
              variant="outlined"
              size="small"
            />
          </Stack>
        </Stack>
      </Paper>

      {/* ===================================== */}
      {/* CREATE USER */}
      {/* ===================================== */}

      <UserDialog
        open={dialogOpen}
        mode="create"
        user={null}
        onClose={() => setDialogOpen(false)}
        onSuccess={async () => {
          setDialogOpen(false);
          await onRefresh();
        }}
      />
    </>
  );
}