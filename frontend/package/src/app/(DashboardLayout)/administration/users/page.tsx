"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import UserService from "@/services/user.service";
import { OrganizationUser } from "@/types/user";
import UserDataGrid from "./components/UserDataGrid";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/constants/permissions";
import { useRouter } from "next/navigation";
import {
  IconUserShield,
  IconUserPlus,
  IconRefresh,
  IconUsers,
  IconShieldCheck,
  IconUserCheck,
  IconSearch,
} from "@tabler/icons-react";

interface ApiErrorResponse {
  detail?: string;
}

export default function UsersPage() {
  const router = useRouter();
  const { permissions, isSuperuser } = usePermissions();

  const canManageUsers = isSuperuser || permissions.includes(PERMISSIONS.MANAGE_USERS);

  const [users, setUsers] = useState<OrganizationUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await UserService.getUsers();
      setUsers(Array.isArray(response) ? response : []);
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;
      setError(err.response?.data?.detail ?? "Failed to load organization users.");
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

  const metrics = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.is_active).length;
    const owners = users.filter((u) => u.role?.name === "Owner").length;
    const officers = users.filter((u) => u.role?.name !== "Owner").length;
    return { total, active, owners, officers };
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const query = search.toLowerCase();
      const matchesSearch =
        user.username.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        `${user.first_name || ""} ${user.last_name || ""}`.toLowerCase().includes(query);

      const matchesRole =
        roleFilter === "ALL" ||
        (roleFilter === "OWNER" && user.role?.name === "Owner") ||
        (roleFilter === "OFFICER" && user.role?.name !== "Owner");

      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  if (!canManageUsers) {
    return (
      <PageContainer title="Access Denied - Royal SACCO" description="Permission Required">
        <Box sx={{ p: 3 }}>
          <Alert severity="error">
            You do not have administrative permission to manage organization users.
          </Alert>
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="User Management - Royal SACCO" description="Manage organization users, access roles, and account security">
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        {/* Executive Hero Banner */}
        <Box
          sx={{
            mb: 4,
            p: 3.5,
            borderRadius: 3,
            background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #2563eb 100%)",
            color: "#ffffff",
            boxShadow: "0 12px 28px -6px rgba(15, 23, 42, 0.3)",
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={2}
          >
            <Box>
              <Stack direction="row" spacing={1.5} alignItems="center" mb={0.5}>
                <Box sx={{ p: 1, bgcolor: "rgba(255,255,255,0.15)", borderRadius: 2, display: "flex" }}>
                  <IconUserShield size={28} color="#60a5fa" />
                </Box>
                <Typography variant="h4" fontWeight={800} sx={{ color: "#ffffff", letterSpacing: "-0.5px" }}>
                  User &amp; Access Management
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ color: "#cbd5e1" }}>
                Manage staff accounts, assign granular role permissions, and control security access
              </Typography>
            </Box>

            {/* Quick Actions */}
            <Stack direction="row" spacing={1.5}>
              <Button
                variant="contained"
                startIcon={<IconUserPlus size={18} />}
                onClick={() => router.push("/administration/users/new")}
                sx={{
                  bgcolor: "#2563eb",
                  color: "#ffffff",
                  fontWeight: 700,
                  textTransform: "none",
                  boxShadow: "0 4px 12px rgba(37, 99, 235, 0.4)",
                  "&:hover": { bgcolor: "#1d4ed8" },
                }}
              >
                + New User
              </Button>
              <IconButton
                onClick={loadUsers}
                disabled={loading}
                sx={{
                  bgcolor: "rgba(255,255,255,0.15)",
                  color: "#ffffff",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.25)" },
                }}
              >
                <IconRefresh size={18} />
              </IconButton>
            </Stack>
          </Stack>
        </Box>

        {/* KPI Metric Cards */}
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>TOTAL STAFF ACCOUNTS</Typography>
                    <Typography variant="h4" fontWeight={800} color="primary.main" mt={0.5}>
                      {metrics.total}
                    </Typography>
                    <Typography variant="caption" color="success.main" fontWeight={700}>
                      {metrics.active} Active ({Math.round((metrics.active / (metrics.total || 1)) * 100)}%)
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.5, bgcolor: "primary.light", color: "primary.main", borderRadius: 2 }}>
                    <IconUsers size={28} />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>ACTIVE STATUS</Typography>
                    <Typography variant="h4" fontWeight={800} color="success.main" mt={0.5}>
                      {metrics.active} / {metrics.total}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      100% Operational
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.5, bgcolor: "success.light", color: "success.main", borderRadius: 2 }}>
                    <IconUserCheck size={28} />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>SYSTEM OWNERS</Typography>
                    <Typography variant="h4" fontWeight={800} color="secondary.main" mt={0.5}>
                      {metrics.owners} Owners
                    </Typography>
                    <Typography variant="caption" color="secondary.dark" fontWeight={700}>
                      Full Admin Access
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.5, bgcolor: "secondary.light", color: "secondary.main", borderRadius: 2 }}>
                    <IconShieldCheck size={28} />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>MEMBER OFFICERS</Typography>
                    <Typography variant="h4" fontWeight={800} color="info.main" mt={0.5}>
                      {metrics.officers} Staff
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Operational Roles
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.5, bgcolor: "info.light", color: "info.main", borderRadius: 2 }}>
                    <IconUserShield size={28} />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* User DataGrid Card */}
        <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2} mb={2.5}>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Organization Staff Registry ({filteredUsers.length})
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Active user accounts and assigned authorization roles
                </Typography>
              </Box>

              <Stack direction="row" spacing={1.5} alignItems="center">
                <TextField
                  size="small"
                  placeholder="Search user, name, email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: <IconSearch size={16} style={{ marginRight: 8, color: "#94a3b8" }} />,
                    },
                  }}
                  sx={{ width: { xs: "100%", sm: 260 } }}
                />
              </Stack>
            </Stack>

            <Divider sx={{ mb: 2 }} />

            <UserDataGrid
              users={filteredUsers}
              loading={loading}
              onRefresh={loadUsers}
            />
          </CardContent>
        </Card>
      </Box>
    </PageContainer>
  );
}
