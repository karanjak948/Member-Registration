"use client";

import Grid from "@mui/material/Grid";

import {
  Card,
  CardContent,
  Typography,
} from "@mui/material";

interface Summary {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  pending: number;
  approved: number;
  rejected: number;
}

interface ReportsSummaryProps {
  summary: Summary;
}

interface SummaryCardProps {
  title: string;
  value: number;
  color: string;
}

function SummaryCard({
  title,
  value,
  color,
}: SummaryCardProps) {
  return (
    <Card
      sx={{
        height: "100%",
        borderLeft: `5px solid ${color}`,
      }}
    >
      <CardContent>
        <Typography
          variant="body2"
          color="text.secondary"
        >
          {title}
        </Typography>

        <Typography
          variant="h4"
          fontWeight={700}
          mt={1}
        >
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function ReportsSummary({
  summary,
}: ReportsSummaryProps) {
  return (
    <Grid container spacing={3}>

      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <SummaryCard
          title="Total Members"
          value={summary.total}
          color="#1976d2"
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <SummaryCard
          title="Active Members"
          value={summary.active}
          color="#2e7d32"
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <SummaryCard
          title="Inactive Members"
          value={summary.inactive}
          color="#ed6c02"
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <SummaryCard
          title="Suspended Members"
          value={summary.suspended}
          color="#d32f2f"
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 4 }}>
        <SummaryCard
          title="Pending"
          value={summary.pending}
          color="#ff9800"
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 4 }}>
        <SummaryCard
          title="Approved"
          value={summary.approved}
          color="#1976d2"
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 4 }}>
        <SummaryCard
          title="Rejected"
          value={summary.rejected}
          color="#d32f2f"
        />
      </Grid>

    </Grid>
  );
}