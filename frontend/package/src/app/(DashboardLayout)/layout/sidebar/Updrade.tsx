"use client";

import { Box, Chip, Divider, Stack, Typography } from "@mui/material";
import { IconDatabase, IconServer, IconShieldCheck } from "@tabler/icons-react";

export const Upgrade = () => {
  return (
    <Box
      sx={{
        mt: 2,
        p: 2,
        borderRadius: 2.5,
        bgcolor: "#f8fafc",
        border: "1px solid #e2e8f0",
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" mb={1.2}>
        <IconShieldCheck size={18} color="#2563eb" />
        <Typography variant="caption" fontWeight={800} color="text.primary" sx={{ letterSpacing: 0.5 }}>
          SYSTEM HEALTH &amp; STATUS
        </Typography>
      </Stack>

      <Stack spacing={1}>
        {/* Backend status */}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1} alignItems="center">
            <IconServer size={15} style={{ color: "#64748b" }} />
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              Backend API
            </Typography>
          </Stack>
          <Chip
            label="● Online"
            size="small"
            sx={{
              height: 20,
              fontSize: "0.68rem",
              fontWeight: 700,
              bgcolor: "rgba(16, 185, 129, 0.12)",
              color: "#059669",
              border: "1px solid rgba(16, 185, 129, 0.25)",
            }}
          />
        </Stack>

        {/* Database status */}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1} alignItems="center">
            <IconDatabase size={15} style={{ color: "#64748b" }} />
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              Database
            </Typography>
          </Stack>
          <Chip
            label="● Connected"
            size="small"
            sx={{
              height: 20,
              fontSize: "0.68rem",
              fontWeight: 700,
              bgcolor: "rgba(16, 185, 129, 0.12)",
              color: "#059669",
              border: "1px solid rgba(16, 185, 129, 0.25)",
            }}
          />
        </Stack>
      </Stack>

      <Divider sx={{ my: 1.2 }} />

      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.68rem" }}>
          Royal SACCO Core
        </Typography>
        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ fontSize: "0.68rem" }}>
          v1.0.0 Pro
        </Typography>
      </Stack>
    </Box>
  );
};