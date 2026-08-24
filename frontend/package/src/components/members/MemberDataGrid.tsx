"use client";

import { useMemo } from "react";
import {
  DataGrid,
  GridActionsCellItem,
  GridColDef,
  GridRowSelectionModel,
} from "@mui/x-data-grid";
import { Avatar, Box, Chip, Stack, Typography } from "@mui/material";
import {
  IconEye,
  IconEdit,
  IconTrash,
  IconCheck,
  IconX,
  IconUserCheck,
  IconUserX,
  IconArrowForwardUp,
  IconPhone,
  IconUser,
  IconId,
  IconShieldCheck,
  IconProgress,
  IconDotsVertical,
} from "@tabler/icons-react";

import { Member } from "@/interfaces/member";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/constants/permissions";
import { getMediaUrl } from "@/utils/media";

interface MemberDataGridProps {
  members: Member[];
  loading?: boolean;
  checkboxSelection?: boolean;
  selectedRowIds?: number[];
  onSelectionChange?: (selectedIds: number[]) => void;
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
  checkboxSelection = true,
  selectedRowIds = [],
  onSelectionChange,
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
        headerName: "Member Name & Profile",
        flex: 1.2,
        minWidth: 260,
        renderHeader: () => (
          <Stack direction="row" spacing={1} alignItems="center">
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: 1.75,
                bgcolor: "#0f172a15",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#0f172a",
              }}
            >
              <IconUser size={16} />
            </Box>
            <Typography sx={{ fontWeight: 900, color: "#0f172a", fontSize: "0.98rem", letterSpacing: "-0.2px" }}>
              Member Name &amp; Profile
            </Typography>
          </Stack>
        ),
        valueGetter: (_, row) =>
          `${row.first_name ?? ""} ${row.other_names ?? ""}`.trim(),
        renderCell: ({ row }) => {
          const fullName =
            `${row.first_name ?? ""} ${row.other_names ?? ""}`.trim();
          const photoUrl = getMediaUrl(row.passport_photo);

          const catName = row.category_name || "Normal Member";
          const isSpecial = catName.toLowerCase().includes("special");
          const isOther = catName.toLowerCase().includes("other");

          return (
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              sx={{ height: "100%" }}
            >
              <Avatar
                src={photoUrl}
                alt={fullName}
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: "#064e3b",
                  color: "#ffffff",
                  fontWeight: 800,
                  fontSize: "0.95rem",
                  flexShrink: 0,
                  border: "2px solid #e2e8f0",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                }}
              >
                {!row.passport_photo && row.first_name?.charAt(0).toUpperCase()}
              </Avatar>

              <Box sx={{ minWidth: 0, overflow: "hidden" }}>
                <Typography
                  variant="body2"
                  fontWeight={800}
                  noWrap
                  title={fullName}
                  sx={{ color: "#0f172a", fontSize: "0.95rem", lineHeight: 1.3 }}
                >
                  {fullName}
                </Typography>

                <Typography
                  variant="caption"
                  noWrap
                  sx={{
                    color: isSpecial ? "#0284c7" : isOther ? "#7c3aed" : "#059669",
                    fontWeight: 700,
                    fontSize: "0.75rem",
                    display: "block",
                    lineHeight: 1.2,
                  }}
                >
                  {catName}
                </Typography>
              </Box>
            </Stack>
          );
        },
      },

      {
        field: "membership_number",
        headerName: "Membership No",
        flex: 0.75,
        minWidth: 150,
        renderHeader: () => (
          <Stack direction="row" spacing={1} alignItems="center">
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: 1.75,
                bgcolor: "#05966915",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#059669",
              }}
            >
              <IconId size={16} />
            </Box>
            <Typography sx={{ fontWeight: 900, color: "#065f46", fontSize: "0.98rem", letterSpacing: "-0.2px" }}>
              Membership No
            </Typography>
          </Stack>
        ),
        renderCell: ({ value }) => (
          <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
            <Chip
              label={value || "Pending ID"}
              size="small"
              sx={{
                fontFamily: "monospace",
                fontWeight: 800,
                fontSize: "0.82rem",
                bgcolor: "#f0fdf4",
                color: "#065f46",
                border: "1px solid #bbf7d0",
                borderRadius: 1.5,
                boxShadow: "0 1px 2px rgba(6, 78, 59, 0.04)",
                px: 0.5,
                py: 0.2,
              }}
            />
          </Box>
        ),
      },

      {
        field: "phone_number",
        headerName: "Phone Number",
        flex: 0.8,
        minWidth: 150,
        renderHeader: () => (
          <Stack direction="row" spacing={1} alignItems="center">
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: 1.75,
                bgcolor: "#0284c715",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#0284c7",
              }}
            >
              <IconPhone size={16} />
            </Box>
            <Typography sx={{ fontWeight: 900, color: "#0284c7", fontSize: "0.98rem", letterSpacing: "-0.2px" }}>
              Phone Number
            </Typography>
          </Stack>
        ),
        renderCell: ({ value }) => (
          <Stack direction="row" spacing={0.8} alignItems="center" sx={{ height: "100%" }}>
            <IconPhone size={16} color="#0284c7" />
            <Typography variant="body2" fontWeight={800} sx={{ color: "#0369a1", fontSize: "0.9rem" }}>
              {value || "—"}
            </Typography>
          </Stack>
        ),
      },

      {
        field: "status",
        headerName: "Account Status",
        flex: 0.7,
        minWidth: 130,
        renderHeader: () => (
          <Stack direction="row" spacing={1} alignItems="center">
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: 1.75,
                bgcolor: "#d9770615",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#d97706",
              }}
            >
              <IconShieldCheck size={16} />
            </Box>
            <Typography sx={{ fontWeight: 900, color: "#d97706", fontSize: "0.98rem", letterSpacing: "-0.2px" }}>
              Account Status
            </Typography>
          </Stack>
        ),
        renderCell: ({ value }) => {
          const isactive = value === "ACTIVE";
          const isInactive = value === "INACTIVE";

          return (
            <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
              <Chip
                size="small"
                label={
                  isactive
                    ? "● Active"
                    : isInactive
                      ? "● Inactive"
                      : "● Suspended"
                }
                sx={{
                  fontWeight: 800,
                  fontSize: "0.78rem",
                  bgcolor: isactive
                    ? "#ecfdf5"
                    : isInactive
                      ? "#fffbeb"
                      : "#fff1f2",
                  color: isactive
                    ? "#065f46"
                    : isInactive
                      ? "#b45309"
                      : "#be123c",
                  border: `1px solid ${
                    isactive
                      ? "#a7f3d0"
                      : isInactive
                        ? "#fde68a"
                        : "#fecdd3"
                  }`,
                  borderRadius: 2,
                  px: 0.6,
                }}
              />
            </Box>
          );
        },
      },

      {
        field: "registration_stage",
        headerName: "Registration Stage",
        flex: 0.95,
        minWidth: 190,
        renderHeader: () => (
          <Stack direction="row" spacing={1} alignItems="center">
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: 1.75,
                bgcolor: "#4f46e515",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#4f46e5",
              }}
            >
              <IconProgress size={16} />
            </Box>
            <Typography sx={{ fontWeight: 900, color: "#4f46e5", fontSize: "0.98rem", letterSpacing: "-0.2px" }}>
              Registration Stage
            </Typography>
          </Stack>
        ),
        renderCell: ({ value }) => {
          let label = "Pending Capture";
          let bg = "#fffbeb";
          let color = "#b45309";
          let border = "#fde68a";

          switch (value) {
            case "APPROVED":
              label = "Approved";
              bg = "#eff6ff";
              color = "#1d4ed8";
              border = "#bfdbfe";
              break;

            case "ACTIVE":
              label = "Completed & Active";
              bg = "#ecfdf5";
              color = "#065f46";
              border = "#a7f3d0";
              break;

            case "REJECTED":
              label = "Rejected";
              bg = "#fff1f2";
              color = "#be123c";
              border = "#fecdd3";
              break;

            case "DATA_CAPTURE_PENDING":
              label = "Data Capture Pending";
              bg = "#fffbeb";
              color = "#b45309";
              border = "#fde68a";
              break;

            default:
              label = value ? String(value).replace(/_/g, " ") : "Pending";
          }

          return (
            <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
              <Chip
                size="small"
                label={label}
                sx={{
                  fontWeight: 800,
                  fontSize: "0.78rem",
                  bgcolor: bg,
                  color: color,
                  border: `1px solid ${border}`,
                  borderRadius: 2,
                  px: 0.6,
                }}
              />
            </Box>
          );
        },
      },

      {
        field: "actions",
        type: "actions",
        headerName: "Actions",
        flex: 0.5,
        minWidth: 90,
        renderHeader: () => (
          <Stack direction="row" spacing={1} alignItems="center">
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: 1.75,
                bgcolor: "#47556915",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#475569",
              }}
            >
              <IconDotsVertical size={16} />
            </Box>
            <Typography sx={{ fontWeight: 900, color: "#475569", fontSize: "0.98rem", letterSpacing: "-0.2px" }}>
              Actions
            </Typography>
          </Stack>
        ),
        getActions: (params) => {
          const member = params.row;
          const actions = [];

          // 1. View Member Details (Always available)
          actions.push(
            <GridActionsCellItem
              key="view"
              icon={<IconEye size={18} color="#0284c7" />}
              label="View Member Details"
              onClick={() => onView(member)}
              showInMenu={false}
            />,
          );

          // 2. Edit Member (Authorized officers)
          if (can(PERMISSIONS.EDIT_MEMBERS)) {
            actions.push(
              <GridActionsCellItem
                key="edit"
                icon={<IconEdit size={18} color="#059669" />}
                label="Edit Member"
                onClick={() => onEdit(member)}
                showInMenu={false}
              />,
            );
          }

          // 3. STAGE 1: DATA_CAPTURE_PENDING -> Approve, Reject, or Delete
          if (member.registration_stage === "DATA_CAPTURE_PENDING") {
            if (can(PERMISSIONS.APPROVE_MEMBERS)) {
              actions.push(
                <GridActionsCellItem
                  key="approve"
                  icon={<IconCheck size={18} color="#059669" />}
                  label="Approve Member"
                  onClick={() => onApprove(member)}
                  showInMenu={true}
                />,
              );
            }

            if (can(PERMISSIONS.REJECT_MEMBERS)) {
              actions.push(
                <GridActionsCellItem
                  key="reject"
                  icon={<IconX size={18} color="#e11d48" />}
                  label="Reject Member"
                  onClick={() => onReject(member)}
                  showInMenu={true}
                />,
              );
            }

            if (can(PERMISSIONS.DELETE_MEMBERS)) {
              actions.push(
                <GridActionsCellItem
                  key="delete_pending"
                  icon={<IconTrash size={18} color="#dc2626" />}
                  label="Delete Member"
                  onClick={() => onDelete(member)}
                  showInMenu={true}
                />,
              );
            }
          }

          // 4. Complete Registration (Available when in APPROVED stage)
          if (member.registration_stage === "APPROVED") {
            if (can(PERMISSIONS.COMPLETE_REGISTRATION)) {
              actions.push(
                <GridActionsCellItem
                  key="complete"
                  icon={<IconArrowForwardUp size={18} color="#059669" />}
                  label="Complete Registration"
                  onClick={() => onCompleteRegistration(member)}
                  showInMenu={true}
                />,
              );
            }
          }

          // 5. Account Lifecycle Actions (Deactivate active accounts / Reactivate inactive accounts)
          if (
            member.registration_stage === "APPROVED" ||
            member.registration_stage === "ACTIVE"
          ) {
            if (can(PERMISSIONS.DEACTIVATE_MEMBERS) && member.status === "ACTIVE") {
              actions.push(
                <GridActionsCellItem
                  key="deactivate"
                  icon={<IconUserX size={18} color="#d97706" />}
                  label="Deactivate Account"
                  onClick={() => onDeactivate(member)}
                  showInMenu={true}
                />,
              );
            } else if (can(PERMISSIONS.ACTIVATE_MEMBERS) && member.status === "INACTIVE") {
              actions.push(
                <GridActionsCellItem
                  key="activate"
                  icon={<IconUserCheck size={18} color="#059669" />}
                  label="Activate Account"
                  onClick={() => onActivate(member)}
                  showInMenu={true}
                />,
              );
            }
          }

          // 6. Delete Member (Admin / Authorized roles only)
          if (can(PERMISSIONS.DELETE_MEMBERS)) {
            actions.push(
              <GridActionsCellItem
                key="delete"
                icon={<IconTrash size={18} color="#e11d48" />}
                label="Delete"
                onClick={() => onDelete(member)}
                showInMenu={true}
              />,
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
      onDelete,
      onApprove,
      onReject,
      onActivate,
      onDeactivate,
      onCompleteRegistration,
    ],
  );

  const rowSelectionModel = useMemo<GridRowSelectionModel>(() => {
    return {
      type: "include",
      ids: new Set(selectedRowIds),
    };
  }, [selectedRowIds]);

  return (
    <Box
      sx={{
        width: "100%",
        bgcolor: "#ffffff",
        borderRadius: 3,
        border: "1px solid #cbd5e1",
        overflow: "hidden",
        boxShadow: "0 4px 16px rgba(15, 23, 42, 0.04)",
        "& .MuiDataGrid-root": {
          border: "none",
        },
        "& .MuiDataGrid-columnHeaders": {
          bgcolor: "#f8fafc",
          borderBottom: "2px solid #e2e8f0",
        },
        "& .MuiDataGrid-row": {
          borderBottom: "1px solid #f1f5f9",
          transition: "background-color 0.15s ease",
          "&:hover": {
            bgcolor: "#f8fafc",
          },
        },
        "& .MuiDataGrid-cell": {
          borderBottom: "none",
        },
        "& .MuiCheckbox-root": {
          color: "#94a3b8",
          "&.Mui-checked": {
            color: "#059669",
          },
          "&.MuiCheckbox-indeterminate": {
            color: "#059669",
          },
        },
      }}
    >
      <DataGrid
        rows={members}
        columns={columns}
        loading={loading}
        autoHeight
        rowHeight={64}
        columnHeaderHeight={52}
        checkboxSelection={checkboxSelection}
        rowSelectionModel={rowSelectionModel}
        onRowSelectionModelChange={(newModel) => {
          if (!onSelectionChange) return;
          if (newModel.type === "include") {
            onSelectionChange(Array.from(newModel.ids).map(Number));
          } else {
            const allIds = members.map((m) => m.id);
            onSelectionChange(allIds.filter((id) => !newModel.ids.has(id)));
          }
        }}
        pageSizeOptions={[10, 25, 50]}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: 10,
              page: 0,
            },
          },
        }}
        disableRowSelectionOnClick
      />
    </Box>
  );
}