"use client";

import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import {
  IconHistory,
  IconUserCheck,
  IconUserPlus,
  IconUserX,
  IconClock,
  IconShieldCheck,
} from "@tabler/icons-react";
import { formatDateTime } from "@/utils/date";

export interface AuditInformationProps {
  member: {
    created_by_username: string | null;
    created_at: string | null;

    updated_by_username: string | null;
    updated_at: string | null;

    approved_by_username: string | null;
    approved_at: string | null;

    rejected_by_username: string | null;
    rejected_at: string | null;

    activated_by_username: string | null;
    activated_at: string | null;
  };
}

interface AuditTileProps {
  title: string;
  username: string | null;
  timestamp: string | null;
  icon: React.ReactNode;
  accentColor: string;
  badgeBg: string;
  badgeBorder: string;
}

function AuditTile({
  title,
  username,
  timestamp,
  icon,
  accentColor,
  badgeBg,
  badgeBorder,
}: AuditTileProps) {
  const hasAction = Boolean(username || timestamp);

  return (
    <Box
      sx={{
        p: 2.25,
        borderRadius: 3,
        bgcolor: "#f8fafc",
        border: "1px solid #f1f5f9",
        transition: "all 0.2s ease",
        "&:hover": {
          bgcolor: "#ffffff",
          borderColor: "#e2e8f0",
          boxShadow: "0 4px 14px rgba(0,0,0,0.03)",
        },
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center" mb={1.5}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 2,
            bgcolor: badgeBg,
            border: `1px solid ${badgeBorder}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: accentColor,
          }}
        >
          {icon}
        </Box>
        <Typography
          sx={{
            fontWeight: 800,
            color: "#334155",
            fontSize: "0.92rem",
          }}
        >
          {title}
        </Typography>
      </Stack>

      <Stack spacing={1}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Avatar
            sx={{
              width: 24,
              height: 24,
              fontSize: "0.75rem",
              fontWeight: 800,
              bgcolor: hasAction ? accentColor : "#cbd5e1",
            }}
          >
            {username ? username[0]?.toUpperCase() : "—"}
          </Avatar>
          <Typography
            sx={{
              fontWeight: 800,
              color: username ? "#0f172a" : "#94a3b8",
              fontSize: "0.95rem",
            }}
          >
            {username || "Not Recorded"}
          </Typography>
        </Box>

        <Stack direction="row" spacing={0.75} alignItems="center">
          <IconClock size={14} color="#94a3b8" />
          <Typography
            variant="caption"
            sx={{
              color: timestamp ? "#64748b" : "#94a3b8",
              fontWeight: 700,
              fontSize: "0.8rem",
            }}
          >
            {timestamp ? formatDateTime(timestamp) : "No timestamp available"}
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );
}

export default function AuditInformation({ member }: AuditInformationProps) {
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
      {/* Header */}
      <Box
        sx={{
          px: 3,
          py: 2,
          bgcolor: "#fafbfc",
          borderBottom: "1px solid #f1f5f9",
          borderLeft: "5px solid #475569",
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
            bgcolor: "#f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#475569",
          }}
        >
          <IconHistory size={18} />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 900, color: "#0f172a", fontSize: "1.1rem" }}>
            Governance, Compliance & Audit Trail
          </Typography>
          <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
            Immutable administrative event logging and officer accountability records
          </Typography>
        </Box>
      </Box>

      <CardContent sx={{ p: 3 }}>
        <Grid container spacing={2.5}>
          {/* Created Record */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <AuditTile
              title="Data Captured By"
              username={member.created_by_username}
              timestamp={member.created_at}
              icon={<IconUserPlus size={16} />}
              accentColor="#059669"
              badgeBg="#ecfdf5"
              badgeBorder="#a7f3d0"
            />
          </Grid>

          {/* Approved Record */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <AuditTile
              title="Approved By Officer"
              username={member.approved_by_username}
              timestamp={member.approved_at}
              icon={<IconShieldCheck size={16} />}
              accentColor="#2563eb"
              badgeBg="#eff6ff"
              badgeBorder="#bfdbfe"
            />
          </Grid>

          {/* Activated Record */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <AuditTile
              title="Activated By Officer"
              username={member.activated_by_username}
              timestamp={member.activated_at}
              icon={<IconUserCheck size={16} />}
              accentColor="#0d9488"
              badgeBg="#f0fdfa"
              badgeBorder="#99f6e4"
            />
          </Grid>

          {/* Last Updated Record */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <AuditTile
              title="Last Modified By"
              username={member.updated_by_username}
              timestamp={member.updated_at}
              icon={<IconHistory size={16} />}
              accentColor="#7c3aed"
              badgeBg="#f5f3ff"
              badgeBorder="#ddd6fe"
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
