"use client";

import { useCallback, useEffect, useState } from "react";
import { AxiosError } from "axios";
import { Alert, Box, CircularProgress, Stack } from "@mui/material";

import UserService from "@/services/user.service";
import { OrganizationUser } from "@/types/user";
import UserToolbar from "./components/UserToolbar";
import UserDataGrid from "./components/UserDataGrid";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/constants/permissions";

interface ApiErrorResponse {
  detail?: string;
}

export default function UsersPage() {
  const { permissions } = usePermissions();

  const canManageUsers = permissions.includes(PERMISSIONS.MANAGE_USERS);

  const [users, setUsers] = useState<OrganizationUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await UserService.getUsers();

      setUsers(response);
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;

      setError(
        err.response?.data?.detail ?? "Failed to load organization users.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canManageUsers) {
      setLoading(false);
      return;
    }

    loadUsers();
  }, [canManageUsers, loadUsers]);

  if (!canManageUsers) {
    return (
      <Alert severity="error">
        You do not have permission to manage users.
      </Alert>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={10}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      <UserToolbar onRefresh={loadUsers} />

      {error && <Alert severity="error">{error}</Alert>}

      <UserDataGrid users={users} onRefresh={loadUsers} />
    </Stack>
  );
}
