"use client";

import { useMemo } from "react";

import { DataGrid, GridActionsCellItem, GridColDef } from "@mui/x-data-grid";

import { Avatar, Box, Chip, Stack, Typography } from "@mui/material";

import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import ToggleOnOutlinedIcon from "@mui/icons-material/ToggleOnOutlined";
import ToggleOffOutlinedIcon from "@mui/icons-material/ToggleOffOutlined";
import AutorenewOutlinedIcon from "@mui/icons-material/AutorenewOutlined";

import { Member } from "@/interfaces/member";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/constants/permissions";

interface MemberDataGridProps {
  members: Member[];

  loading?: boolean;

  onView: (member: Member) => void;

  onEdit: (member: Member) => void;

  onApprove: (member: Member) => void;

  onReject: (member: Member) => void;

  onActivate: (member: Member) => void;

  onDeactivate: (member: Member) => void;

  onCompleteRegistration: (member: Member) => void;

  onDelete: (member: Member) => void;
}

export default function MemberDataGrid({
  members,
  loading = false,
  onView,
  onEdit,
  onApprove,
  onReject,
  onActivate,
  onDeactivate,
  onCompleteRegistration,
  onDelete,
}: MemberDataGridProps) {
  const { can } = usePermissions();

  const columns = useMemo<GridColDef<Member>[]>(
    () => [
      {
        field: "member_name",
        headerName: "Member Name",
        flex: 1,
        minWidth: 280,

        valueGetter: (_, row) =>
          `${row.first_name ?? ""} ${row.other_names ?? ""}`.trim(),

        renderCell: ({ row }) => {
          const fullName =
            `${row.first_name ?? ""} ${row.other_names ?? ""}`.trim();

          const photoUrl = row.passport_photo
            ? row.passport_photo.startsWith("http")
              ? row.passport_photo
              : `http://127.0.0.1:8000${row.passport_photo}`
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
                {!row.passport_photo && row.first_name?.charAt(0).toUpperCase()}
              </Avatar>

              <Typography
                variant="body2"
                fontWeight={600}
                noWrap
                title={fullName}
              >
                {fullName}
              </Typography>
            </Stack>
          );
        },
      },

      {
        field: "membership_number",
        headerName: "Membership No",
        width: 170,
      },

      {
        field: "phone_number",
        headerName: "Phone",
        width: 170,
      },

      {
        field: "status",
        headerName: "Status",
        width: 140,

        renderCell: ({ value }) => (
          <Chip
            size="small"
            label={value}
            color={
              value === "ACTIVE"
                ? "success"
                : value === "INACTIVE"
                  ? "warning"
                  : "error"
            }
          />
        ),
      },

      {
        field: "registration_stage",
        headerName: "Registration Stage",
        width: 220,

        renderCell: ({ value }) => {
          let color: "success" | "warning" | "error" | "primary" = "warning";

          switch (value) {
            case "APPROVED":
              color = "primary";
              break;

            case "ACTIVE":
              color = "success";
              break;

            case "REJECTED":
              color = "error";
              break;

            default:
              color = "warning";
          }

          return <Chip size="small" label={value} color={color} />;
        },
      },

      {
        field: "actions",
        type: "actions",
        headerName: "Actions",
        width: 90,

        getActions: ({ row }) => {
          const member = row as Member;

          const actions: React.ReactElement[] = [];

          // View - requires view_members permission
          if (can(PERMISSIONS.VIEW_MEMBERS)) {
            actions.push(
              <GridActionsCellItem
                key="view"
                icon={<VisibilityIcon />}
                label="View"
                showInMenu
                onClick={() => onView(member)}
              />
            );
          }

          // Edit - requires edit_members permission
          if (can(PERMISSIONS.EDIT_MEMBERS)) {
            actions.push(
              <GridActionsCellItem
                key="edit"
                icon={<EditIcon />}
                label="Edit"
                showInMenu
                onClick={() => onEdit(member)}
              />
            );
          }

          // Workflow actions based on registration stage
          switch (member.registration_stage) {
            case "DATA_CAPTURE_PENDING":
              // Approve - requires approve_members permission
              if (can(PERMISSIONS.APPROVE_MEMBERS)) {
                actions.push(
                  <GridActionsCellItem
                    key="approve"
                    icon={<CheckCircleOutlineIcon />}
                    label="Approve"
                    showInMenu
                    onClick={() => onApprove(member)}
                  />
                );
              }

              // Reject - requires reject_members permission
              if (can(PERMISSIONS.REJECT_MEMBERS)) {
                actions.push(
                  <GridActionsCellItem
                    key="reject"
                    icon={<CancelOutlinedIcon />}
                    label="Reject"
                    showInMenu
                    onClick={() => onReject(member)}
                  />
                );
              }

              break;

            case "REJECTED":
              // Approve (from rejected) - requires approve_members permission
              if (can(PERMISSIONS.APPROVE_MEMBERS)) {
                actions.push(
                  <GridActionsCellItem
                    key="approve_rejected"
                    icon={<CheckCircleOutlineIcon />}
                    label="Approve"
                    showInMenu
                    onClick={() => onApprove(member)}
                  />
                );
              }

              break;

            case "APPROVED":
              // Complete Registration - requires complete_registration permission
              if (can(PERMISSIONS.COMPLETE_REGISTRATION)) {
                actions.push(
                  <GridActionsCellItem
                    key="complete_registration"
                    icon={<AutorenewOutlinedIcon />}
                    label="Complete Registration"
                    showInMenu
                    onClick={() => onCompleteRegistration(member)}
                  />
                );
              }

              break;
          }

          // Deactivate - requires deactivate_members permission and member must be ACTIVE
          if (
            member.status === "ACTIVE" &&
            can(PERMISSIONS.DEACTIVATE_MEMBERS)
          ) {
            actions.push(
              <GridActionsCellItem
                key="deactivate"
                icon={<ToggleOffOutlinedIcon />}
                label="Deactivate"
                showInMenu
                onClick={() => onDeactivate(member)}
              />
            );
          }

          // Activate - requires activate_members permission and member must be INACTIVE
          if (
            member.status === "INACTIVE" &&
            can(PERMISSIONS.ACTIVATE_MEMBERS)
          ) {
            actions.push(
              <GridActionsCellItem
                key="activate"
                icon={<ToggleOnOutlinedIcon />}
                label="Activate"
                showInMenu
                onClick={() => onActivate(member)}
              />
            );
          }

          // Delete - requires delete_members permission
          if (can(PERMISSIONS.DELETE_MEMBERS)) {
            actions.push(
              <GridActionsCellItem
                key="delete"
                icon={<DeleteIcon />}
                label="Delete"
                showInMenu
                onClick={() => onDelete(member)}
              />
            );
          }

          return actions;
        },
      },
    ],
    [
      can,
      onView,
      onEdit,
      onApprove,
      onReject,
      onActivate,
      onDeactivate,
      onCompleteRegistration,
      onDelete,
    ],
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
        disableRowSelectionOnClick
        pageSizeOptions={[10, 25, 50]}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: 10,
              page: 0,
            },
          },
        }}
        sx={{
          border: 0,

          "& .MuiDataGrid-columnHeaders": {
            bgcolor: "background.paper",
            borderBottom: 1,
            borderColor: "divider",
            fontWeight: 600,
          },

          "& .MuiDataGrid-cell": {
            display: "flex",
            alignItems: "center",
            borderBottomColor: "divider",
          },

          "& .MuiDataGrid-row:hover": {
            bgcolor: "action.hover",
          },

          "& .MuiDataGrid-footerContainer": {
            borderTop: 1,
            borderColor: "divider",
          },

          "& .MuiDataGrid-overlay": {
            bgcolor: "background.default",
          },
        }}
      />
    </Box>
  );
}