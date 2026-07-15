"use client";

import { useMemo } from "react";

import {
  DataGrid,
  GridActionsCellItem,
  GridColDef,
} from "@mui/x-data-grid";

import { Box } from "@mui/material";

import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

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
      },

      {
        field: "name",
        headerName: "Category Name",
        flex: 1,
        minWidth: 220,
      },

      {
        field: "code",
        headerName: "Code",
        width: 140,
      },

      {
        field: "description",
        headerName: "Description",
        flex: 2,
        minWidth: 250,
      },

      {
        field: "actions",
        type: "actions",
        headerName: "Actions",
        width: 120,

        getActions: ({ row }) => [
          <GridActionsCellItem
            key="view"
            icon={<VisibilityIcon />}
            label="View"
            onClick={() => onView(row)}
            showInMenu
          />,

          <GridActionsCellItem
            key="edit"
            icon={<EditIcon />}
            label="Edit"
            onClick={() => onEdit(row)}
            showInMenu
          />,

          <GridActionsCellItem
            key="delete"
            icon={<DeleteIcon />}
            label="Delete"
            onClick={() => onDelete(row)}
            showInMenu
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
        height: 650,
      }}
    >
      <DataGrid
        rows={categories}
        columns={columns}
        loading={loading}
        disableRowSelectionOnClick
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