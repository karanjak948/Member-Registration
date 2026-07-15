"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";

import {
  DataGrid,
  GridActionsCellItem,
  GridColDef,
} from "@mui/x-data-grid";

import {
  Box,
  Chip,
} from "@mui/material";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";

import { Member } from "@/interfaces/member";

interface MemberDataGridProps {
  members: Member[];

  loading?: boolean;

  onDelete: (member: Member) => void;

  onRefresh?: () => void | Promise<void>;
}

export default function MemberDataGrid({
  members,
  loading = false,
  onDelete,
}: MemberDataGridProps) {
  const router = useRouter();

  const columns = useMemo<GridColDef[]>((
  ) => [
    {
      field: "membership_number",
      headerName: "Membership No",
      width: 170,
    },

    {
      field: "member_name",
      headerName: "Member Name",
      flex: 1,
      valueGetter: (_, row) =>
        `${row.first_name} ${row.other_names}`,
    },

    {
      field: "phone_number",
      headerName: "Phone",
      width: 160,
    },

    {
      field: "status",
      headerName: "Status",
      width: 140,

      renderCell: ({ value }) => (
        <Chip
          label={value}
          color={
            value === "ACTIVE"
              ? "success"
              : value === "INACTIVE"
                ? "warning"
                : "error"
          }
          size="small"
        />
      ),
    },

    {
      field: "registration_stage",
      headerName: "Registration Stage",
      width: 220,

      renderCell: ({ value }) => {
        let color:
          | "success"
          | "warning"
          | "error"
          | "primary" = "warning";

        if (value === "APPROVED") {
          color = "primary";
        }

        if (value === "ACTIVE") {
          color = "success";
        }

        if (value === "REJECTED") {
          color = "error";
        }

        return (
          <Chip
            label={value}
            color={color}
            size="small"
          />
        );
      },
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
          onClick={() =>
            router.push(`/members/${row.id}`)
          }
          showInMenu
        />,

        <GridActionsCellItem
          key="edit"
          icon={<EditIcon />}
          label="Edit"
          onClick={() =>
            router.push(`/members/${row.id}/edit`)
          }
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
  ], [
    onDelete,
    router,
  ]);

  return (
    <Box
      sx={{
        height: 650,
        width: "100%",
      }}
    >
      <DataGrid
        rows={members}
        columns={columns}
        loading={loading}
        pageSizeOptions={[10, 25, 50]}
        disableRowSelectionOnClick
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: 10,
              page: 0,
            },
          },
        }}
      />
    </Box>
  );
}