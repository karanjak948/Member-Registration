import {
  Card,
  CardContent,
  Chip,
  Grid,
  Typography,
} from "@mui/material";

import { Member } from "@/interfaces/member";
import DetailItem from "@/components/common/DetailItem";

interface Props {
  member: Member;
}

export default function MemberSummaryCard({
  member,
}: Props) {
  return (
    <Card>
      <CardContent>
        <Typography
          variant="h6"
          gutterBottom
        >
          Membership Summary
        </Typography>

        <Grid container spacing={3}>
          <DetailItem
            label="Membership Number"
            value={member.membership_number}
          />

          <DetailItem
            label="Organization"
            value={member.organization_name}
          />

          <DetailItem
            label="Category"
            value={member.category_name}
          />

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              sx={{ mb: 0.5 }}
            >
              Status
            </Typography>

            <Chip
              label={member.status}
              color={
                member.status === "ACTIVE"
                  ? "success"
                  : member.status === "INACTIVE"
                  ? "warning"
                  : "error"
              }
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              sx={{ mb: 0.5 }}
            >
              Registration Stage
            </Typography>

            <Chip
              label={member.registration_stage}
              color="primary"
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}