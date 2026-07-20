"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";

import {
  DataGrid,
  GridActionsCellItem,
  GridColDef,
} from "@mui/x-data-grid";

import {
  Avatar,
  Box,
  Chip,
  Stack,
  Typography,
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

  const columns = useMemo<GridColDef[]>(
    () => [
      // --------------------------------------------------
      // MEMBER NAME + PROFILE PHOTO
      // First column on the far left
      // --------------------------------------------------
      {
        field: "member_name",
        headerName: "Member Name",
        flex: 1,
        minWidth: 280,

        valueGetter: (_, row) =>
          `${row.first_name ?? ""} ${
            row.other_names ?? ""
          }`.trim(),

        renderCell: ({ row }) => {
          const member = row as Member;

          const fullName = `${
            member.first_name ?? ""
          } ${
            member.other_names ?? ""
          }`.trim();

          const photoUrl =
            member.passport_photo
              ? member.passport_photo.startsWith(
                  "http"
                )
                ? member.passport_photo
                : `http://127.0.0.1:8000${member.passport_photo}`
              : undefined;

          return (
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              sx={{
                height: "100%",
                overflow: "hidden",
              }}
            >
              <Avatar
                src={photoUrl}
                alt={fullName}
                sx={{
                  width: 44,
                  height: 44,
                  bgcolor: "primary.main",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {!member.passport_photo &&
                  member.first_name
                    ?.charAt(0)
                    .toUpperCase()}
              </Avatar>

              <Typography
                variant="body2"
                fontWeight={500}
                noWrap
                title={fullName}
              >
                {fullName}
              </Typography>
            </Stack>
          );
        },
      },

      // --------------------------------------------------
      // MEMBERSHIP NUMBER
      // Second column
      // --------------------------------------------------
      {
        field: "membership_number",
        headerName: "Membership No",
        width: 170,
      },

      // --------------------------------------------------
      // PHONE
      // --------------------------------------------------
      {
        field: "phone_number",
        headerName: "Phone",
        width: 160,
      },

      // --------------------------------------------------
      // STATUS
      // --------------------------------------------------
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

      // --------------------------------------------------
      // REGISTRATION STAGE
      // --------------------------------------------------
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

      // --------------------------------------------------
      // ACTIONS
      // --------------------------------------------------
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
              router.push(
                `/members/${row.id}`
              )
            }
            showInMenu
          />,

          <GridActionsCellItem
            key="edit"
            icon={<EditIcon />}
            label="Edit"
            onClick={() =>
              router.push(
                `/members/${row.id}/edit`
              )
            }
            showInMenu
          />,

          <GridActionsCellItem
            key="delete"
            icon={<DeleteIcon />}
            label="Delete"
            onClick={() =>
              onDelete(row as Member)
            }
            showInMenu
          />,
        ],
      },
    ],
    [onDelete, router]
  );

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
        rowHeight={64}
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