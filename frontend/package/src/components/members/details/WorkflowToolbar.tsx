"use client";

import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import {
  IconCheck,
  IconX,
  IconArrowForwardUp,
  IconUserCheck,
  IconUserX,
  IconShieldCheck,
  IconClockHour4,
  IconTrash,
} from "@tabler/icons-react";
import { Member } from "@/interfaces/member";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/constants/permissions";

interface Props {
  member: Member;
  onApprove: () => void;
  onReject: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
  onCompleteRegistration: () => void;
  onDelete?: () => void;
}

export default function WorkflowToolbar({
  member,
  onApprove,
  onReject,
  onActivate,
  onDeactivate,
  onCompleteRegistration,
  onDelete,
}: Props) {
  const { can } = usePermissions();

  const isDataCapture = member.registration_stage === "DATA_CAPTURE_PENDING";
  const isApproved = member.registration_stage === "APPROVED";
  const isActive = member.registration_stage === "ACTIVE";
  const isRejected = member.registration_stage === "REJECTED";

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 3,
        border: "1px solid #e2e8f0",
        bgcolor: "#ffffff",
        boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05)",
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        spacing={2}
      >
        {/* Stage Status & Process Flow Indicator */}
        <Box>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 800,
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              display: "block",
              mb: 0.5,
            }}
          >
            SACCO Governance &amp; Workflow Status
          </Typography>
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
            {isDataCapture && (
              <Chip
                icon={<IconClockHour4 size={16} color="#b45309" />}
                label="Step 1: Data Capture Pending (Awaiting Officer Approval)"
                sx={{
                  bgcolor: "#fffbeb",
                  color: "#92400e",
                  border: "1px solid #fde68a",
                  fontWeight: 800,
                  fontSize: "0.85rem",
                  py: 0.5,
                  px: 1,
                  borderRadius: 2,
                }}
              />
            )}
            {isApproved && (
              <Chip
                icon={<IconCheck size={16} color="#1d4ed8" />}
                label="Step 2: Approved (Ready for Final Activation / Completion)"
                sx={{
                  bgcolor: "#eff6ff",
                  color: "#1e40af",
                  border: "1px solid #bfdbfe",
                  fontWeight: 800,
                  fontSize: "0.85rem",
                  py: 0.5,
                  px: 1,
                  borderRadius: 2,
                }}
              />
            )}
            {isActive && (
              <Chip
                icon={<IconShieldCheck size={16} color="#065f46" />}
                label="Step 3: Registration Completed &amp; Account Active"
                sx={{
                  bgcolor: "#ecfdf5",
                  color: "#065f46",
                  border: "1px solid #a7f3d0",
                  fontWeight: 800,
                  fontSize: "0.85rem",
                  py: 0.5,
                  px: 1,
                  borderRadius: 2,
                }}
              />
            )}
            {isRejected && (
              <Chip
                icon={<IconX size={16} color="#be123c" />}
                label="Application Rejected"
                sx={{
                  bgcolor: "#fff1f2",
                  color: "#be123c",
                  border: "1px solid #fecdd3",
                  fontWeight: 800,
                  fontSize: "0.85rem",
                  py: 0.5,
                  px: 1,
                  borderRadius: 2,
                }}
              />
            )}

            {/* Live Status Pill */}
            <Chip
              size="small"
              label={member.status === "ACTIVE" ? "Account Active" : "Account Inactive"}
              sx={{
                fontWeight: 700,
                fontSize: "0.78rem",
                bgcolor: member.status === "ACTIVE" ? "#f0fdf4" : "#fefce8",
                color: member.status === "ACTIVE" ? "#166534" : "#854d0e",
                border: `1px solid ${member.status === "ACTIVE" ? "#bbf7d0" : "#fef08a"}`,
                borderRadius: 2,
              }}
            />
          </Stack>
        </Box>

        {/* Contextual Action Buttons */}
        <Stack direction="row" spacing={1.5} flexWrap="wrap">
          {/* 1. STAGE 1: DATA_CAPTURE_PENDING -> Approve, Reject, or Delete */}
          {isDataCapture && (
            <>
              {can(PERMISSIONS.APPROVE_MEMBERS) && (
                <Button
                  variant="contained"
                  startIcon={<IconCheck size={18} />}
                  onClick={onApprove}
                  sx={{
                    background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                    color: "#ffffff",
                    fontWeight: 800,
                    fontSize: "0.9rem",
                    px: 2.5,
                    py: 1,
                    borderRadius: 2.5,
                    boxShadow: "0 4px 14px rgba(5, 150, 105, 0.35)",
                    "&:hover": {
                      background: "linear-gradient(135deg, #047857 0%, #065f46 100%)",
                    },
                  }}
                >
                  Approve Member
                </Button>
              )}

              {can(PERMISSIONS.REJECT_MEMBERS) && (
                <Button
                  variant="outlined"
                  startIcon={<IconX size={18} />}
                  onClick={onReject}
                  sx={{
                    borderColor: "#f43f5e",
                    color: "#e11d48",
                    fontWeight: 800,
                    fontSize: "0.9rem",
                    px: 2.5,
                    py: 1,
                    borderRadius: 2.5,
                    "&:hover": {
                      borderColor: "#be123c",
                      bgcolor: "#fff1f2",
                    },
                  }}
                >
                  Reject Member
                </Button>
              )}

              {can(PERMISSIONS.DELETE_MEMBERS) && onDelete && (
                <Button
                  variant="outlined"
                  startIcon={<IconTrash size={18} />}
                  onClick={onDelete}
                  sx={{
                    borderColor: "#fca5a5",
                    color: "#dc2626",
                    fontWeight: 800,
                    fontSize: "0.9rem",
                    px: 2.5,
                    py: 1,
                    borderRadius: 2.5,
                    "&:hover": {
                      borderColor: "#dc2626",
                      bgcolor: "#fef2f2",
                    },
                  }}
                >
                  Delete Member
                </Button>
              )}
            </>
          )}

          {/* 2. STAGE 2: APPROVED -> Complete Registration & Activate */}
          {isApproved && (
            <>
              {can(PERMISSIONS.COMPLETE_REGISTRATION) && (
                <Button
                  variant="contained"
                  startIcon={<IconArrowForwardUp size={18} />}
                  onClick={onCompleteRegistration}
                  sx={{
                    background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
                    color: "#ffffff",
                    fontWeight: 800,
                    fontSize: "0.9rem",
                    px: 2.5,
                    py: 1,
                    borderRadius: 2.5,
                    boxShadow: "0 4px 14px rgba(13, 148, 136, 0.35)",
                    "&:hover": {
                      background: "linear-gradient(135deg, #0f766e 0%, #115e59 100%)",
                    },
                  }}
                >
                  Complete Registration
                </Button>
              )}

              {can(PERMISSIONS.DEACTIVATE_MEMBERS) && member.status === "ACTIVE" && (
                <Button
                  variant="outlined"
                  startIcon={<IconUserX size={18} />}
                  onClick={onDeactivate}
                  sx={{
                    borderColor: "#f59e0b",
                    color: "#d97706",
                    fontWeight: 800,
                    fontSize: "0.9rem",
                    px: 2.5,
                    py: 1,
                    borderRadius: 2.5,
                    "&:hover": {
                      borderColor: "#d97706",
                      bgcolor: "#fffbeb",
                    },
                  }}
                >
                  Deactivate Account
                </Button>
              )}

              {can(PERMISSIONS.ACTIVATE_MEMBERS) && member.status === "INACTIVE" && (
                <Button
                  variant="contained"
                  startIcon={<IconUserCheck size={18} />}
                  onClick={onActivate}
                  sx={{
                    background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                    color: "#ffffff",
                    fontWeight: 800,
                    fontSize: "0.9rem",
                    px: 2.5,
                    py: 1,
                    borderRadius: 2.5,
                    boxShadow: "0 4px 14px rgba(2, 132, 199, 0.35)",
                    "&:hover": {
                      background: "linear-gradient(135deg, #0369a1 0%, #075985 100%)",
                    },
                  }}
                >
                  Activate Account
                </Button>
              )}

              {can(PERMISSIONS.DELETE_MEMBERS) && onDelete && (
                <Button
                  variant="outlined"
                  startIcon={<IconTrash size={18} />}
                  onClick={onDelete}
                  sx={{
                    borderColor: "#fca5a5",
                    color: "#dc2626",
                    fontWeight: 800,
                    fontSize: "0.9rem",
                    px: 2.5,
                    py: 1,
                    borderRadius: 2.5,
                    "&:hover": {
                      borderColor: "#dc2626",
                      bgcolor: "#fef2f2",
                    },
                  }}
                >
                  Delete Member
                </Button>
              )}
            </>
          )}

          {/* 3. STAGE 3: ACTIVE -> Deactivate or Reactivate */}
          {isActive && (
            <>
              {can(PERMISSIONS.DEACTIVATE_MEMBERS) && member.status === "ACTIVE" && (
                <Button
                  variant="outlined"
                  startIcon={<IconUserX size={18} />}
                  onClick={onDeactivate}
                  sx={{
                    borderColor: "#f59e0b",
                    color: "#d97706",
                    fontWeight: 800,
                    fontSize: "0.9rem",
                    px: 2.5,
                    py: 1,
                    borderRadius: 2.5,
                    "&:hover": {
                      borderColor: "#d97706",
                      bgcolor: "#fffbeb",
                    },
                  }}
                >
                  Deactivate Account
                </Button>
              )}

              {can(PERMISSIONS.ACTIVATE_MEMBERS) && member.status === "INACTIVE" && (
                <Button
                  variant="contained"
                  startIcon={<IconUserCheck size={18} />}
                  onClick={onActivate}
                  sx={{
                    background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                    color: "#ffffff",
                    fontWeight: 800,
                    fontSize: "0.9rem",
                    px: 2.5,
                    py: 1,
                    borderRadius: 2.5,
                    boxShadow: "0 4px 14px rgba(5, 150, 105, 0.35)",
                    "&:hover": {
                      background: "linear-gradient(135deg, #047857 0%, #065f46 100%)",
                    },
                  }}
                >
                  Reactivate Account
                </Button>
              )}
            </>
          )}

          {/* 4. REJECTED -> Delete */}
          {isRejected && can(PERMISSIONS.DELETE_MEMBERS) && onDelete && (
            <Button
              variant="outlined"
              startIcon={<IconTrash size={18} />}
              onClick={onDelete}
              sx={{
                borderColor: "#fca5a5",
                color: "#dc2626",
                fontWeight: 800,
                fontSize: "0.9rem",
                px: 2.5,
                py: 1,
                borderRadius: 2.5,
                "&:hover": {
                  borderColor: "#dc2626",
                  bgcolor: "#fef2f2",
                },
              }}
            >
              Delete Member
            </Button>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}