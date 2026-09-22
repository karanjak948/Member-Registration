"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Box, Button, CircularProgress, Paper, Typography } from "@mui/material";
import { IconShieldLock, IconArrowLeft } from "@tabler/icons-react";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/constants/permissions";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { can, isAdmin, loading } = usePermissions();

  const canAccessSettings =
    isAdmin ||
    can(PERMISSIONS.VIEW_SETTINGS) ||
    can(PERMISSIONS.MANAGE_SETTINGS);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!canAccessSettings) {
    return (
      <PageContainer
        title="Access Denied - Royal SACCO"
        description="Administrative Permission Required"
      >
        <Box sx={{ p: { xs: 2, sm: 4 }, maxWidth: 560, mx: "auto", mt: 6 }}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "error.light",
              textAlign: "center",
              bgcolor: "background.paper",
              boxShadow: "0 8px 30px rgba(0, 0, 0, 0.06)",
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                bgcolor: "error.lighter",
                color: "error.main",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 2,
              }}
            >
              <IconShieldLock size={36} />
            </Box>

            <Typography variant="h5" fontWeight={700} gutterBottom>
              Access Denied
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 3, lineHeight: 1.6 }}
            >
              You do not have administrative or owner permissions to view or configure SACCO system settings. Please contact your organization administrator if you require access.
            </Typography>

            <Button
              variant="contained"
              startIcon={<IconArrowLeft size={18} />}
              onClick={() => router.push("/dashboard")}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderRadius: 2,
                px: 3,
              }}
            >
              Return to Dashboard
            </Button>
          </Paper>
        </Box>
      </PageContainer>
    );
  }

  return <>{children}</>;
}
