"use client";

import { Stack, Typography } from "@mui/material";

import LoadingButton from "@mui/lab/LoadingButton";

import RefreshIcon from "@mui/icons-material/Refresh";
import AddIcon from "@mui/icons-material/Add";

interface RoleToolbarProps {
  onRefresh: () => Promise<void> | void;
  onCreate: () => void;
  loading?: boolean;
}

export default function RoleToolbar({
  onRefresh,
  onCreate,
  loading = false,
}: RoleToolbarProps) {
  return (
    <Stack
      direction={{ xs: "column", md: "row" }}
      justifyContent="space-between"
      alignItems={{ xs: "flex-start", md: "center" }}
      spacing={3}
    >
      <Stack spacing={0.5}>
        <Typography
          variant="h4"
          fontWeight={700}
        >
          Role Management
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
        >
          Manage organization roles and assign permissions to organization users.
        </Typography>
      </Stack>

      <Stack
        direction="row"
        spacing={2}
      >
        <LoadingButton
          loading={loading}
          loadingPosition="start"
          startIcon={<RefreshIcon />}
          variant="outlined"
          onClick={onRefresh}
        >
          Refresh
        </LoadingButton>

        <LoadingButton
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onCreate}
          disabled={loading}
        >
          New Role
        </LoadingButton>
      </Stack>
    </Stack>
  );
}