"use client";

import { useMemo } from "react";

import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Grid,
  Typography,
} from "@mui/material";

import { useMembers } from "@/hooks/useMembers";

import ReportsSummary from "@/components/reports/ReportsSummary";
import MemberStatusChart from "@/components/reports/MemberStatusChart";
import CategoryDistributionChart from "@/components/reports/CategoryDistributionChart";
import ExportButtons from "@/components/reports/ExportButtons";

export default function ReportsPage() {
  const {
    members,
    loading,
    error,
  } = useMembers();

  const summary = useMemo(
    () => ({
      total: members.length,

      active: members.filter(
        (m) => m.status === "ACTIVE"
      ).length,

      inactive: members.filter(
        (m) => m.status === "INACTIVE"
      ).length,

      suspended: members.filter(
        (m) => m.status === "SUSPENDED"
      ).length,

      pending: members.filter(
        (m) =>
          m.registration_stage ===
          "DATA_CAPTURE_PENDING"
      ).length,

      approved: members.filter(
        (m) =>
          m.registration_stage ===
          "APPROVED"
      ).length,

      rejected: members.filter(
        (m) =>
          m.registration_stage ===
          "REJECTED"
      ).length,
    }),
    [members]
  );

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

  if (error) {
    return (
      <Container maxWidth={false}>
        <Alert severity="error">
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth={false}>
      <Typography
        variant="h4"
        gutterBottom
      >
        Reports
      </Typography>

      <Typography
        variant="body1"
        color="text.secondary"
        mb={4}
      >
        Membership statistics, charts and export tools.
      </Typography>

      <ReportsSummary summary={summary} />

      <Grid
        container
        spacing={3}
        mt={1}
      >
        <Grid size={{ xs: 12, lg: 6 }}>
          <MemberStatusChart
            members={members}
          />
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <CategoryDistributionChart
            members={members}
          />
        </Grid>
      </Grid>

      <Box mt={4}>
        <ExportButtons
          members={members}
        />
      </Box>
    </Container>
  );
}