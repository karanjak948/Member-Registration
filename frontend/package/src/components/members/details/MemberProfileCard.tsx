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
  IconUser,
  IconId,
  IconPhone,
  IconMail,
  IconBriefcase,
  IconReceiptTax,
  IconMapPin,
  IconBadge,
} from "@tabler/icons-react";
import { Member } from "@/interfaces/member";
import { getMediaUrl } from "@/utils/media";

interface Props {
  member: Member;
}

interface DossierFieldProps {
  label: string;
  value: string | number | null | undefined;
  icon: React.ReactNode;
  accentColor?: string;
  isMono?: boolean;
}

function DossierField({
  label,
  value,
  icon,
  accentColor = "#059669",
  isMono = false,
}: DossierFieldProps) {
  const displayVal = value ? String(value) : "—";

  return (
    <Box
      sx={{
        p: 1.75,
        borderRadius: 2.5,
        bgcolor: "#f8fafc",
        border: "1px solid #f1f5f9",
        transition: "all 0.2s ease",
        "&:hover": {
          bgcolor: "#ffffff",
          borderColor: "#e2e8f0",
          boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
        },
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" mb={0.75}>
        <Box
          sx={{
            color: accentColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </Box>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            color: "#64748b",
            textTransform: "uppercase",
            letterSpacing: "0.4px",
            fontSize: "0.72rem",
          }}
        >
          {label}
        </Typography>
      </Stack>
      <Typography
        sx={{
          fontWeight: 800,
          color: value ? "#0f172a" : "#94a3b8",
          fontSize: "1.02rem",
          fontFamily: isMono ? "monospace" : "inherit",
          letterSpacing: isMono ? "0.5px" : "normal",
        }}
      >
        {displayVal}
      </Typography>
    </Box>
  );
}

export default function MemberProfileCard({ member }: Props) {
  const photoUrl = getMediaUrl(member.passport_photo);

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
      {/* Card Header with Accent Line */}
      <Box
        sx={{
          px: 3,
          py: 2,
          bgcolor: "#fafbfc",
          borderBottom: "1px solid #f1f5f9",
          borderLeft: "5px solid #059669",
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
            bgcolor: "#ecfdf5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#059669",
          }}
        >
          <IconUser size={18} />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 900, color: "#0f172a", fontSize: "1.1rem" }}>
            Personal KYC Profile & Demographics
          </Typography>
          <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
            Official registered biodata, identification numbers, and contact channels
          </Typography>
        </Box>
      </Box>

      <CardContent sx={{ p: 3 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={3.5} alignItems={{ xs: "center", md: "flex-start" }}>
          {/* Portrait Photo with Badge Ring */}
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Box
              sx={{
                p: "4px",
                borderRadius: 3.5,
                background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                boxShadow: "0 8px 20px rgba(5, 150, 105, 0.25)",
              }}
            >
              <Avatar
                src={photoUrl}
                variant="rounded"
                sx={{
                  width: 140,
                  height: 165,
                  borderRadius: 3,
                  bgcolor: "#f1f5f9",
                  fontWeight: 900,
                  fontSize: "2.5rem",
                  color: "#059669",
                }}
              >
                {member.first_name?.[0]?.toUpperCase()}
              </Avatar>
            </Box>
            <Chip
              size="small"
              label="Verified Identity"
              color="success"
              variant="outlined"
              sx={{ mt: 1.5, fontWeight: 700, fontSize: "0.72rem", borderRadius: 2 }}
            />
          </Box>

          {/* KYC Details Grid */}
          <Grid container spacing={2} sx={{ flex: 1 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DossierField
                label="First Name"
                value={member.first_name}
                icon={<IconUser size={15} />}
                accentColor="#059669"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <DossierField
                label="Other Names / Surname"
                value={member.other_names}
                icon={<IconUser size={15} />}
                accentColor="#059669"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <DossierField
                label="National ID Number"
                value={member.national_id}
                icon={<IconId size={15} />}
                accentColor="#0284c7"
                isMono
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <DossierField
                label="Primary Phone Number"
                value={member.phone_number}
                icon={<IconPhone size={15} />}
                accentColor="#2563eb"
                isMono
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <DossierField
                label="Email Address"
                value={member.email}
                icon={<IconMail size={15} />}
                accentColor="#7c3aed"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <DossierField
                label="Occupation / Profession"
                value={member.occupation}
                icon={<IconBriefcase size={15} />}
                accentColor="#d97706"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <DossierField
                label="KRA PIN Number"
                value={member.kra_pin}
                icon={<IconReceiptTax size={15} />}
                accentColor="#ea580c"
                isMono
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <DossierField
                label="Physical Residential Address"
                value={member.physical_address}
                icon={<IconMapPin size={15} />}
                accentColor="#0d9488"
              />
            </Grid>
          </Grid>
        </Stack>
      </CardContent>
    </Card>
  );
}