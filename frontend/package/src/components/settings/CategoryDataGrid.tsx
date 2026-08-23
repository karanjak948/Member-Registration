"use client";

import { useMemo } from "react";
import {
  DataGrid,
  GridActionsCellItem,
  GridColDef,
} from "@mui/x-data-grid";

import { Box, Chip, Stack, Tooltip, Typography } from "@mui/material";
import {
  IconEdit,
  IconTrash,
  IconEye,
  IconCategory,
} from "@tabler/icons-react";

import { MemberCategory } from "@/interfaces/category";

interface CategoryDataGridProps {
  categories: MemberCategory[];
  loading: boolean;
  onView: (category: MemberCategory) => void;
  onEdit: (category: MemberCategory) => void;
  onDelete: (category: MemberCategory) => void;
}

export default function CategoryDataGrid({
  categories,
  loading,
  onView,
  onEdit,
  onDelete,
}: CategoryDataGridProps) {
  const columns = useMemo<GridColDef[]>(
    () => [
      {
        field: "id",
        headerName: "ID",
        width: 80,
        renderCell: (params) => (
          <Typography variant="body2" fontWeight={700} color="text.secondary">
            #{params.value}
          </Typography>
        ),
      },
      {
        field: "name",
        headerName: "Category Name",
        flex: 1.2,
        minWidth: 200,
        renderCell: (params) => (
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                bgcolor: "rgba(6, 78, 59, 0.08)",
                color: "#064e3b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <IconCategory size={16} />
            </Box>
            <Typography variant="body2" fontWeight={700} sx={{ color: "#1e293b" }}>
              {params.value}
            </Typography>
          </Stack>
        ),
      },
      {
        field: "code",
        headerName: "Code",
        width: 140,
        renderCell: (params) => {
          const code = String(params.value || "").toUpperCase();
          let chipColor: { bg: string; color: string; border: string } = {
            bg: "#f0fdf4",
            color: "#065f46",
            border: "#bbf7d0",
          };

          if (code.includes("SPECIAL") || code.includes("VIP")) {
            chipColor = { bg: "#f0f9ff", color: "#0369a1", border: "#bae6fd" };
          } else if (code.includes("OTHER")) {
            chipColor = { bg: "#faf5ff", color: "#6d28d9", border: "#e9d5ff" };
          }

          return (
            <Chip
              label={code}
              size="small"
              sx={{
                bgcolor: chipColor.bg,
                color: chipColor.color,
                border: "1px solid",
                borderColor: chipColor.border,
                fontWeight: 800,
                fontSize: "0.75rem",
              }}
            />
          );
        },
      },
      {
        field: "description",
        headerName: "Description",
        flex: 2,
        minWidth: 260,
        renderCell: (params) => (
          <Typography variant="body2" color="text.secondary" noWrap>
            {params.value || "Default member category tier"}
          </Typography>
        ),
      },
      {
        field: "actions",
        type: "actions",
        headerName: "Actions",
        width: 140,
        getActions: ({ row }) => [
          <GridActionsCellItem
            key="view"
            icon={
              <Tooltip title="View Details">
                <Box sx={{ p: 0.5, borderRadius: 1, "&:hover": { bgcolor: "rgba(5, 150, 105, 0.1)" } }}>
                  <IconEye size={18} color="#059669" />
                </Box>
              </Tooltip>
            }
            label="View"
            onClick={() => onView(row)}
            showInMenu={false}
          />,
          <GridActionsCellItem
            key="edit"
            icon={
              <Tooltip title="Edit Category">
                <Box sx={{ p: 0.5, borderRadius: 1, "&:hover": { bgcolor: "rgba(2, 132, 199, 0.1)" } }}>
                  <IconEdit size={18} color="#0284c7" />
                </Box>
              </Tooltip>
            }
            label="Edit"
            onClick={() => onEdit(row)}
            showInMenu={false}
          />,
          <GridActionsCellItem
            key="delete"
            icon={
              <Tooltip title="Delete Category">
                <Box sx={{ p: 0.5, borderRadius: 1, "&:hover": { bgcolor: "rgba(220, 38, 38, 0.1)" } }}>
                  <IconTrash size={18} color="#dc2626" />
                </Box>
              </Tooltip>
            }
            label="Delete"
            onClick={() => onDelete(row)}
            showInMenu={false}
          />,
        ],
      },
    ],
    [onView, onEdit, onDelete]
  );

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: 380,
        "& .MuiDataGrid-root": {
          border: "none",
        },
        "& .MuiDataGrid-columnHeaders": {
          bgcolor: "#f8fafc",
          fontWeight: 700,
          borderBottom: "1px solid #e2e8f0",
        },
        "& .MuiDataGrid-row": {
          borderBottom: "1px solid #f1f5f9",
          "&:hover": {
            bgcolor: "#f8fafc",
          },
        },
      }}
    >
      <DataGrid
        rows={categories}
        columns={columns}
        loading={loading}
        disableRowSelectionOnClick
        autoHeight
        pageSizeOptions={[10, 25, 50]}
        initialState={{
          pagination: {
            paginationModel: {
              page: 0,
              pageSize: 10,
            },
          },
        }}
      />
    </Box>
  );
}