"use client";

import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import {
  IconIdBadge2,
  IconBuildingCommunity,
  IconCategory,
  IconActivity,
  IconProgress,
  IconChecks,
} from "@tabler/icons-react";
import { Member } from "@/interfaces/member";

interface Props {
  member: Member;
}

export default function MemberSummaryCard({ member }: Props) {
  const isDataCapture = member.registration_stage === "DATA_CAPTURE_PENDING";
  const isApproved = member.registration_stage === "APPROVED";
  const isActive = member.registration_stage === "ACTIVE";
  const isRejected = member.registration_stage === "REJECTED";

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3.5,
        border: "1px solid #e2e8f0",
        boxShadow: "0 4px 20px -4px rgba(0,0,0,0.04)",
        overflow: "hidden",
      }}
    >
      {/* Header with Blue-Teal Accent Line */}
      <Box
        sx={{
          px: 3,
          py: 2,
          bgcolor: "#fafbfc",
          borderBottom: "1px solid #f1f5f9",
          borderLeft: "5px solid #0284c7",
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 2,
            bgcolor: "#f0f9ff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#0284c7",
          }}
        >
          <IconIdBadge2 size={18} />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 900, color: "#0f172a", fontSize: "1.1rem" }}>
            SACCO Membership & Account Status
          </Typography>
          <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
            Organizational affiliation, membership category tier, and lifecycle state
          </Typography>
        </Box>
      </Box>

      <CardContent sx={{ p: 3 }}>
        <Grid container spacing={2.5}>
          {/* Membership Number */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2.5,
                bgcolor: "#f8fafc",
                border: "1px solid #f1f5f9",
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center" mb={0.75}>
                <IconIdBadge2 size={16} color="#0284c7" />
                <Typography variant="caption" sx={{ fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                  Membership No
                </Typography>
              </Stack>
              <Chip
                label={member.membership_number || "Pending"}
                sx={{
                  bgcolor: "#f0fdf4",
                  color: "#15803d",
                  border: "1px solid #bbf7d0",
                  fontFamily: "monospace",
                  fontWeight: 900,
                  fontSize: "0.95rem",
                  borderRadius: 2,
                }}
              />
            </Box>
          </Grid>

          {/* Membership Category */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2.5,
                bgcolor: "#f8fafc",
                border: "1px solid #f1f5f9",
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center" mb={0.75}>
                <IconCategory size={16} color="#2563eb" />
                <Typography variant="caption" sx={{ fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                  Membership Tier
                </Typography>
              </Stack>
              <Chip
                label={member.category_name || "Normal Member"}
                sx={{
                  bgcolor: "#eff6ff",
                  color: "#1d4ed8",
                  border: "1px solid #bfdbfe",
                  fontWeight: 800,
                  fontSize: "0.9rem",
                  borderRadius: 2,
                }}
              />
            </Box>
          </Grid>

          {/* Account Status */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2.5,
                bgcolor: "#f8fafc",
                border: "1px solid #f1f5f9",
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center" mb={0.75}>
                <IconActivity size={16} color={member.status === "ACTIVE" ? "#059669" : "#d97706"} />
                <Typography variant="caption" sx={{ fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                  Account Status
                </Typography>
              </Stack>
              <Chip
                label={member.status === "ACTIVE" ? "Active" : member.status === "INACTIVE" ? "Inactive" : "Suspended"}
                sx={{
                  bgcolor: member.status === "ACTIVE" ? "#ecfdf5" : "#fffbeb",
                  color: member.status === "ACTIVE" ? "#065f46" : "#92400e",
                  border: `1px solid ${member.status === "ACTIVE" ? "#a7f3d0" : "#fde68a"}`,
                  fontWeight: 800,
                  fontSize: "0.9rem",
                  borderRadius: 2,
                }}
              />
            </Box>
          </Grid>

          {/* Registration Stage */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2.5,
                bgcolor: "#f8fafc",
                border: "1px solid #f1f5f9",
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center" mb={0.75}>
                <IconProgress size={16} color="#4f46e5" />
                <Typography variant="caption" sx={{ fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                  Registration Stage
                </Typography>
              </Stack>
              <Chip
                label={
                  isDataCapture
                    ? "Data Capture Pending"
                    : isApproved
                    ? "Approved"
                    : isActive
                    ? "Completed & Active"
                    : isRejected
                    ? "Rejected"
                    : member.registration_stage
                }
                sx={{
                  bgcolor: isDataCapture
                    ? "#fffbeb"
                    : isApproved
                    ? "#eff6ff"
                    : isActive
                    ? "#ecfdf5"
                    : "#fff1f2",
                  color: isDataCapture
                    ? "#b45309"
                    : isApproved
                    ? "#1d4ed8"
                    : isActive
                    ? "#065f46"
                    : "#be123c",
                  border: `1px solid ${
                    isDataCapture
                      ? "#fde68a"
                      : isApproved
                      ? "#bfdbfe"
                      : isActive
                      ? "#a7f3d0"
                      : "#fecdd3"
                  }`,
                  fontWeight: 800,
                  fontSize: "0.85rem",
                  borderRadius: 2,
                }}
              />
            </Box>
          </Grid>

          {/* Organization */}
          <Grid size={{ xs: 12 }}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2.5,
                bgcolor: "#f8fafc",
                border: "1px solid #f1f5f9",
                display: "flex",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              <IconBuildingCommunity size={20} color="#64748b" />
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                  Parent SACCO / Branch Organization
                </Typography>
                <Typography sx={{ fontWeight: 800, color: "#0f172a", fontSize: "1rem" }}>
                  {member.organization_name || "Main SACCO Headquarters"}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}