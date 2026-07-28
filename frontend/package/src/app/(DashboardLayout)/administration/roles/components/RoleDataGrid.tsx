"use client";

import { useMemo } from "react";

import {
  DataGrid,
  GridActionsCellItem,
  GridColDef,
} from "@mui/x-data-grid";

import {
  Chip,
  Paper,
  Typography,
  Box,
} from "@mui/material";

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
    >
      <Typography variant="h6">
        No Roles Found
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
      >
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
        headerName: "Role",
        flex: 1,
        minWidth: 220,

        renderCell: ({ row }) => (
          <Typography fontWeight={700}>
            {row.name}
          </Typography>
        ),
      },

      {
        field: "description",
        headerName: "Description",
        flex: 2,
        minWidth: 320,

        renderCell: ({ row }) => (
          <Typography
            variant="body2"
            noWrap
            title={row.description ?? ""}
          >
            {row.description || "-"}
          </Typography>
        ),
      },

      {
        field: "permissions",
        headerName: "Permissions",
        width: 140,
        sortable: false,

        renderCell: ({ row }) => (
          <Chip
            size="small"
            color="primary"
            label={row.permissions.length}
          />
        ),
      },

      {
        field: "is_system_role",
        headerName: "Type",
        width: 140,

        renderCell: ({ value }) => (
          <Chip
            size="small"
            color={value ? "warning" : "primary"}
            label={value ? "System" : "Organization"}
          />
        ),
      },

      {
        field: "actions",
        type: "actions",
        headerName: "Actions",
        width: 90,

        getActions: ({ row }) => {
          const actions = [
            <GridActionsCellItem
              key="view"
              icon={<VisibilityIcon />}
              label="View"
              showInMenu
              onClick={() => onView(row)}
            />,
          ];

          if (row.is_system_role) {
            actions.push(
              <GridActionsCellItem
                key="protected"
                icon={<LockIcon />}
                label="Protected Role"
                disabled
                showInMenu
                onClick={() => {}}
              />
            );
          } else {
            actions.push(
              <GridActionsCellItem
                key="edit"
                icon={<EditIcon />}
                label="Edit"
                showInMenu
                onClick={() => onEdit(row)}
              />
            );

            actions.push(
              <GridActionsCellItem
                key="delete"
                icon={<DeleteOutlineIcon />}
                label="Delete"
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
        borderRadius: 3,
        border: (theme) =>
          `1px solid ${theme.palette.divider}`,
        overflow: "hidden",
      }}
    >
      <DataGrid
        rows={roles}
        columns={columns}
        loading={loading}
        density="compact"
        disableRowSelectionOnClick
        rowHeight={60}
        pageSizeOptions={[10, 20, 50, 100]}
        initialState={{
          sorting: {
            sortModel: [
              {
                field: "name",
                sort: "asc",
              },
            ],
          },
          pagination: {
            paginationModel: {
              page: 0,
              pageSize: 10,
            },
          },
        }}
        slots={{
          noRowsOverlay: NoRowsOverlay,
        }}
        sx={{
          border: 0,

          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "#f8fafc",
            borderBottom: "1px solid #e5e7eb",
          },

          "& .MuiDataGrid-columnHeaderTitle": {
            fontWeight: 700,
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
        }}
      />
    </Paper>
  );
}