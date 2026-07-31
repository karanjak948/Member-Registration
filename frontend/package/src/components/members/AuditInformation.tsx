import { Card, CardContent, Grid, Typography } from "@mui/material";

import { formatDateTime } from "@/utils/date";

/**
 * Only the fields required by this component.
 *
 * This allows the component to work with both:
 * - Member (API model)
 * - MemberState (Redux registration state)
 */
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

const value = (text?: string | null) => text || "—";

export default function AuditInformation({ member }: AuditInformationProps) {
  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2.5,
      }}
    >
      <CardContent>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Audit Information
        </Typography>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="caption">Created By</Typography>

            <Typography fontWeight={600}>
              {value(member.created_by_username)}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="caption">Created On</Typography>

            <Typography fontWeight={600}>
              {formatDateTime(member.created_at)}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="caption">Last Updated By</Typography>

            <Typography fontWeight={600}>
              {value(member.updated_by_username)}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="caption">Last Updated On</Typography>

            <Typography fontWeight={600}>
              {formatDateTime(member.updated_at)}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="caption">Approved By</Typography>

            <Typography fontWeight={600}>
              {value(member.approved_by_username)}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="caption">Approved On</Typography>

            <Typography fontWeight={600}>
              {formatDateTime(member.approved_at)}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="caption">Activated By</Typography>

            <Typography fontWeight={600}>
              {value(member.activated_by_username)}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="caption">Activated On</Typography>

            <Typography fontWeight={600}>
              {formatDateTime(member.activated_at)}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="caption">Rejected By</Typography>

            <Typography fontWeight={600}>
              {value(member.rejected_by_username)}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="caption">Rejected On</Typography>

            <Typography fontWeight={600}>
              {formatDateTime(member.rejected_at)}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
