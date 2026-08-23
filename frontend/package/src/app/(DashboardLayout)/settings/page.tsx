"use client";

import Link from "next/link";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import {
  IconSettings,
  IconBuilding,
  IconUsersGroup,
  IconAdjustmentsAlt,
  IconNumbers,
  IconCpu,
  IconChevronRight,
} from "@tabler/icons-react";

const settings = [
  {
    title: "Organization Settings",
    description: "Configure SACCO legal name, physical address, contact details, and branding assets.",
    icon: <IconBuilding size={28} color="#2563eb" />,
    iconBg: "rgba(37, 99, 235, 0.1)",
    href: "/settings/organization",
  },
  {
    title: "Member Categories",
    description: "Manage classification tiers (Normal, Special, Other) and custom membership categories.",
    icon: <IconUsersGroup size={28} color="#0d9488" />,
    iconBg: "rgba(13, 148, 136, 0.1)",
    href: "/settings/categories",
  },
  {
    title: "Field Configuration",
    description: "Customize and activate dynamic registration form fields and mandatory validation rules.",
    icon: <IconAdjustmentsAlt size={28} color="#8b5cf6" />,
    iconBg: "rgba(139, 92, 246, 0.1)",
    href: "/settings/fields",
  },
  {
    title: "Member Numbering",
    description: "Configure automatic membership number sequencing, prefixes, and serial padding.",
    icon: <IconNumbers size={28} color="#f59e0b" />,
    iconBg: "rgba(245, 158, 11, 0.1)",
    href: "/settings/numbering",
  },
  {
    title: "System Preferences",
    description: "Configure system-wide application preferences, currency formats, and defaults.",
    icon: <IconCpu size={28} color="#ec4899" />,
    iconBg: "rgba(236, 72, 153, 0.1)",
    href: "/settings/preferences",
  },
];

export default function SettingsPage() {
  return (
    <PageContainer title="System Settings - Royal SACCO" description="Configure SACCO system settings, categories, and field rules">
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        {/* Executive Hero Banner */}
        <Box
          sx={{
            mb: 4,
            p: 3.5,
            borderRadius: 3,
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0d9488 100%)",
            color: "#ffffff",
            boxShadow: "0 12px 28px -6px rgba(15, 23, 42, 0.25)",
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" mb={0.5}>
            <Box sx={{ p: 1, bgcolor: "rgba(255,255,255,0.15)", borderRadius: 2, display: "flex" }}>
              <IconSettings size={28} color="#2dd4bf" />
            </Box>
            <Typography variant="h4" fontWeight={800} sx={{ color: "#ffffff", letterSpacing: "-0.5px" }}>
              System Configuration &amp; Preferences
            </Typography>
          </Stack>
          <Typography variant="body2" sx={{ color: "#cbd5e1", mt: 0.5 }}>
            Central control hub for organization branding, member category policies, form fields, and numbering rules
          </Typography>
        </Box>

        {/* Settings Modules Grid */}
        <Grid container spacing={3}>
          {settings.map((item) => (
            <Grid
              key={item.title}
              size={{
                xs: 12,
                sm: 6,
                lg: 4,
              }}
            >
              <Card
                elevation={0}
                sx={{
                  height: "100%",
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  transition: "all 0.25s ease-in-out",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
                    borderColor: "primary.main",
                  },
                }}
              >
                <CardActionArea component={Link} href={item.href} sx={{ height: "100%", p: 1 }}>
                  <CardContent sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: item.iconBg,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {item.icon}
                      </Box>
                      <Box sx={{ color: "text.secondary" }}>
                        <IconChevronRight size={20} />
                      </Box>
                    </Stack>

                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      {item.title}
                    </Typography>

                    <Typography color="text.secondary" variant="body2" sx={{ lineHeight: 1.6 }}>
                      {item.description}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </PageContainer>
  );
}