"use client";

import { useMemo } from "react";
import { DataGrid, GridActionsCellItem, GridColDef } from "@mui/x-data-grid";
import { Chip, Paper, Typography, Box, Stack } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import LockIcon from "@mui/icons-material/Lock";
import { Role } from "@/types/role";

interface RoleDataGridProps {
  roles: Role[];
  loading?: boolean;
  onView: (role: Role) => void;
  onEdit: (role: Role) => void;
  onDelete: (role: Role) => void;
}

function NoRowsOverlay() {
  return (
    <Box
      height="100%"
      display="flex"
      alignItems="center"
      justifyContent="center"
      flexDirection="column"
      gap={1}
      py={6}
    >
      <Typography variant="h6" fontWeight={700}>
        No Roles Found
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Create your first role to start assigning permissions.
      </Typography>
    </Box>
  );
}

export default function RoleDataGrid({
  roles,
  loading = false,
  onView,
  onEdit,
  onDelete,
}: RoleDataGridProps) {
  const columns = useMemo<GridColDef<Role>[]>(
    () => [
      {
        field: "name",
        headerName: "Role Name",
        flex: 1,
        minWidth: 200,
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ height: "100%" }}>
            <Typography fontWeight={700} color="text.primary">
              {row.name}
            </Typography>
          </Stack>
        ),
      },

      {
        field: "description",
        headerName: "Description",
        flex: 2,
        minWidth: 300,
        renderCell: ({ row }) => (
          <Typography variant="body2" color="text.secondary" noWrap title={row.description ?? ""}>
            {row.description || "Custom organization role"}
          </Typography>
        ),
      },

      {
        field: "permissions",
        headerName: "Assigned Rights",
        width: 170,
        sortable: false,
        renderCell: ({ row }) => (
          <Chip
            size="small"
            label={`${row.permissions?.length || 0} Permissions`}
            sx={{
              bgcolor: "rgba(37, 99, 235, 0.1)",
              color: "#2563eb",
              fontWeight: 700,
              border: "1px solid rgba(37, 99, 235, 0.25)",
              borderRadius: 1.5,
            }}
          />
        ),
      },

      {
        field: "is_system_role",
        headerName: "Role Classification",
        width: 170,
        renderCell: ({ value }) => (
          <Chip
            size="small"
            icon={value ? <LockIcon style={{ fontSize: 14, color: "#d97706" }} /> : undefined}
            label={value ? "System Core" : "Organization"}
            sx={{
              bgcolor: value ? "rgba(245, 158, 11, 0.12)" : "rgba(13, 148, 136, 0.12)",
              color: value ? "#b45309" : "#0d9488",
              fontWeight: 700,
              border: value ? "1px solid rgba(245, 158, 11, 0.3)" : "1px solid rgba(13, 148, 136, 0.3)",
              borderRadius: 1.5,
            }}
          />
        ),
      },

      {
        field: "actions",
        type: "actions",
        headerName: "Actions",
        width: 100,
        getActions: ({ row }) => {
          const actions = [
            <GridActionsCellItem
              key="view"
              icon={<VisibilityIcon sx={{ fontSize: 19 }} />}
              label="View Details"
              showInMenu
              onClick={() => onView(row)}
            />,
          ];

          if (row.is_system_role) {
            actions.push(
              <GridActionsCellItem
                key="protected"
                icon={<LockIcon sx={{ fontSize: 19 }} />}
                label="Protected (Immutable)"
                disabled
                showInMenu
                onClick={() => {}}
              />
            );
          } else {
            actions.push(
              <GridActionsCellItem
                key="edit"
                icon={<EditIcon sx={{ fontSize: 19 }} />}
                label="Edit Role"
                showInMenu
                onClick={() => onEdit(row)}
              />
            );

            actions.push(
              <GridActionsCellItem
                key="delete"
                icon={<DeleteOutlineIcon sx={{ fontSize: 19, color: "error.main" }} />}
                label="Delete Role"
                showInMenu
                onClick={() => onDelete(row)}
              />
            );
          }

          return actions;
        },
      },
    ],
    [onView, onEdit, onDelete]
  );

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        border: (theme) => `1px solid ${theme.palette.divider}`,
        overflow: "hidden",
      }}
    >
      <DataGrid
        rows={roles}
        columns={columns}
        loading={loading}
        density="standard"
        disableRowSelectionOnClick
        rowHeight={56}
        pageSizeOptions={[10, 20, 50]}
        initialState={{
          sorting: {
            sortModel: [{ field: "name", sort: "asc" }],
          },
          pagination: {
            paginationModel: { page: 0, pageSize: 10 },
          },
        }}
        slots={{
          noRowsOverlay: NoRowsOverlay,
        }}
        sx={{
          border: 0,
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "#f8fafc",
            borderBottom: "1px solid #e2e8f0",
          },
          "& .MuiDataGrid-columnHeaderTitle": {
            fontWeight: 700,
            fontSize: "0.82rem",
            color: "#475569",
          },
          "& .MuiDataGrid-row:hover": {
            backgroundColor: "#f8fbff",
          },
          "& .MuiDataGrid-cell": {
            borderBottom: "1px solid #f1f5f9",
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "1px solid #e2e8f0",
          },
        }}
      />
    </Paper>
  );
}