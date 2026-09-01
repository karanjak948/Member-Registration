"use client";

import { useMemo, useState } from "react";

import { DataGrid, GridActionsCellItem, GridColDef } from "@mui/x-data-grid";

import { Avatar, Box, Chip, Paper, Stack, Typography } from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import LockIcon from "@mui/icons-material/Lock";

import { usePermissions } from "@/hooks/usePermissions";

import { UserDataGridProps } from "@/types/user-components";
import { OrganizationUser } from "@/types/user";
import ViewUserDialog from "./ViewUserDialog";
import UserDialog from "./UserDialog";
import ActivateUserDialog from "./ActivateUserDialog";
import ResetPasswordDialog from "./ResetPasswordDialog";
import userService from "@/services/user.service";
import KeyIcon from "@mui/icons-material/VpnKey";

export default function UserDataGrid({
  users,
  loading = false,
  onRefresh,
}: UserDataGridProps) {
  const { can } = usePermissions();

  const [selectedUser, setSelectedUser] = useState<OrganizationUser | null>(
    null,
  );
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<OrganizationUser | null>(null);

  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [resetUser, setResetUser] = useState<OrganizationUser | null>(null);

  const [activateDialogOpen, setActivateDialogOpen] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  const handleUserStatus = async () => {
    if (!selectedUser) return;

    if (
      selectedUser?.role?.is_system_role &&
      selectedUser?.role?.name === "Owner"
    ) {
      return;
    }

    try {
      setStatusLoading(true);

      if (selectedUser.is_active) {
        await userService.deactivateUser(selectedUser.id);
      } else {
        await userService.activateUser(selectedUser.id);
      }

      setActivateDialogOpen(false);
      setSelectedUser(null);

      await onRefresh();
    } catch (error) {
      console.error("Failed to update user status:", error);
    } finally {
      setStatusLoading(false);
    }
  };

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        field: "user",
        headerName: "User",
        flex: 1.4,
        minWidth: 300,

        valueGetter: (_, row) => `${row.first_name} ${row.last_name}`.trim(),

        renderCell: ({ row }) => {
          const fullName = `${row.first_name} ${row.last_name}`.trim();

          return (
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              sx={{ height: "100%" }}
            >
              <Avatar
                sx={{
                  bgcolor: "primary.main",
                  width: 46,
                  height: 46,
                  fontWeight: 700,
                }}
              >
                {(row.first_name || row.username).charAt(0).toUpperCase()}
              </Avatar>

              <Box
                sx={{
                  overflow: "hidden",
                }}
              >
                <Typography fontWeight={700} noWrap>
                  {fullName}
                </Typography>

                <Typography variant="body2" color="text.secondary" noWrap>
                  @{row.username}
                </Typography>
              </Box>
            </Stack>
          );
        },
      },

      {
        field: "email",
        headerName: "Email Address",
        flex: 1.4,
        minWidth: 250,
        renderCell: ({ value }) => (
          <Typography variant="body2" sx={{ color: "text.primary", fontWeight: 500 }}>
            {value}
          </Typography>
        ),
      },

      {
        field: "role",
        headerName: "Assigned Role",
        width: 190,
        renderCell: ({ row }) => {
          const isOwner = row.role?.name === "Owner" || row.is_superuser;
          return (
            <Chip
              label={row.role?.name || (isOwner ? "Owner" : "Staff")}
              size="small"
              sx={{
                bgcolor: isOwner ? "rgba(99, 102, 241, 0.12)" : "rgba(13, 148, 136, 0.12)",
                color: isOwner ? "#4f46e5" : "#0d9488",
                fontWeight: 700,
                border: isOwner ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid rgba(13, 148, 136, 0.3)",
                borderRadius: 1.5,
              }}
            />
          );
        },
      },

      {
        field: "is_active",
        headerName: "Account Status",
        width: 150,
        renderCell: ({ value }) => (
          <Chip
            label={value ? "● Active" : "Inactive"}
            size="small"
            sx={{
              fontWeight: 700,
              bgcolor: value ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
              color: value ? "#059669" : "#dc2626",
              border: value ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: 1.5,
              minWidth: 80,
            }}
          />
        ),
      },

      {
        field: "actions",
        type: "actions",
        headerName: "Actions",
        width: 110,

        getActions: ({ row }) => {
          if (!can("manage_users")) {
            return [];
          }

          const isProtectedUser =
            row.role?.is_system_role && row.role?.name === "Owner";

          const actions: React.ReactElement[] = [];

          // View
          actions.push(
            <GridActionsCellItem
              key="view"
              icon={<VisibilityIcon />}
              label="View Profile"
              showInMenu
              onClick={() => {
                setSelectedUser(row);
                setViewDialogOpen(true);
              }}
            />
          );

          // Edit
          actions.push(
            <GridActionsCellItem
              key="edit"
              icon={<EditIcon />}
              label="Edit Details"
              showInMenu
              onClick={() => {
                setEditingUser(row);
                setEditDialogOpen(true);
              }}
            />
          );

          // Reset Password
          actions.push(
            <GridActionsCellItem
              key="reset_password"
              icon={<KeyIcon />}
              label="Reset Password"
              showInMenu
              onClick={() => {
                setResetUser(row);
                setResetPasswordDialogOpen(true);
              }}
            />
          );

          // Status (Activate/Deactivate) or Owner Protection
          if (!isProtectedUser) {
            actions.push(
              <GridActionsCellItem
                key="status"
                icon={<DeleteIcon />}
                label={row.is_active ? "Deactivate Account" : "Activate Account"}
                showInMenu
                onClick={() => {
                  setSelectedUser(row);
                  setActivateDialogOpen(true);
                }}
              />
            );
          } else {
            actions.push(
              <GridActionsCellItem
                key="owner"
                icon={<LockIcon />}
                label="Owner Account"
                disabled
                showInMenu
                onClick={() => {}}
              />
            );
          }

          return actions;
        },
      },
    ],
    [can, onRefresh],
  );

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: (theme) => `1px solid ${theme.palette.divider}`,
          overflow: "hidden",
        }}
      >
        <DataGrid
          rows={users}
          columns={columns}
          loading={loading}
          rowHeight={72}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          initialState={{
            pagination: {
              paginationModel: {
                page: 0,
                pageSize: 10,
              },
            },
          }}
          sx={{
            border: 0,

            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "#f8fafc",
              fontSize: 14,
              fontWeight: 700,
              borderBottom: "1px solid #e5e7eb",
            },

            "& .MuiDataGrid-columnHeaderTitle": {
              fontWeight: 700,
            },

            "& .MuiDataGrid-row": {
              transition: "0.2s",
            },

            "& .MuiDataGrid-row:hover": {
              backgroundColor: "#f8fbff",
            },

            "& .MuiDataGrid-cell": {
              borderBottom: "1px solid #f1f5f9",
            },

            "& .MuiDataGrid-footerContainer": {
              borderTop: "1px solid #e5e7eb",
            },

            "& .MuiDataGrid-toolbarContainer": {
              padding: 2,
            },

            "& .MuiDataGrid-overlay": {
              minHeight: 250,
            },
          }}
        />
      </Paper>

      <ViewUserDialog
        open={viewDialogOpen}
        user={selectedUser}
        onClose={() => {
          setViewDialogOpen(false);
          setSelectedUser(null);
        }}
      />

      <UserDialog
        open={editDialogOpen}
        mode="edit"
        user={editingUser}
        onClose={() => {
          setEditDialogOpen(false);
          setEditingUser(null);
        }}
        onSuccess={async () => {
          setEditDialogOpen(false);
          setEditingUser(null);
          await onRefresh();
        }}
      />

      <ActivateUserDialog
        open={activateDialogOpen}
        user={selectedUser}
        loading={statusLoading}
        onClose={() => {
          setActivateDialogOpen(false);
          setSelectedUser(null);
        }}
        onConfirm={handleUserStatus}
      />

      <ResetPasswordDialog
        open={resetPasswordDialogOpen}
        user={resetUser}
        onClose={() => {
          setResetPasswordDialogOpen(false);
          setResetUser(null);
        }}
        onSuccess={async () => {
          setResetPasswordDialogOpen(false);
          setResetUser(null);
          await onRefresh();
        }}
      />
    </>
  );
}