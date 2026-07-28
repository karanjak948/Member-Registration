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
import userService from "@/services/user.service";

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

  const [activateDialogOpen, setActivateDialogOpen] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  const handleUserStatus = async () => {
    if (!selectedUser) return;

    // Frontend guard: prevent deactivation of Owner account
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
        headerName: "Email",
        flex: 1.4,
        minWidth: 250,
      },

      {
        field: "role",
        headerName: "Role",
        width: 180,

        renderCell: ({ row }) => (
          <Chip
            label={row.role.name}
            color="primary"
            variant="outlined"
            size="small"
          />
        ),
      },

      {
        field: "is_active",
        headerName: "Status",
        width: 140,

        renderCell: ({ value }) => (
          <Chip
            label={value ? "Active" : "Inactive"}
            color={value ? "success" : "error"}
            sx={{
              fontWeight: 600,
              minWidth: 80,
            }}
            size="small"
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
              label="View"
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
              label="Edit"
              showInMenu
              onClick={() => {
                setEditingUser(row);
                setEditDialogOpen(true);
              }}
            />
          );

          // Status (Activate/Deactivate) or Owner Protection
          if (!isProtectedUser) {
            actions.push(
              <GridActionsCellItem
                key="status"
                icon={<DeleteIcon />}
                label={row.is_active ? "Deactivate" : "Activate"}
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
    </>
  );
}