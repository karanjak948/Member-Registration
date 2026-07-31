import {
  Avatar,
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

import { Member } from "@/interfaces/member";

import DetailItem from "@/components/common/DetailItem";

interface Props {
  member: Member;
}

export default function MemberProfileCard({
  member,
}: Props) {
  return (
    <Card>
      <CardContent>
        <Typography
          variant="h6"
          gutterBottom
        >
          Member Profile
        </Typography>

        <Stack
          direction={{
            xs: "column",
            md: "row",
          }}
          spacing={3}
        >
          <Avatar
            src={
              member.passport_photo ?? undefined
            }
            variant="rounded"
            sx={{
              width: 120,
              height: 140,
            }}
          />

          <Grid
            container
            spacing={3}
            sx={{ flex: 1 }}
          >
            <DetailItem
              label="First Name"
              value={member.first_name}
            />

            <DetailItem
              label="Other Names"
              value={member.other_names}
            />

            <DetailItem
              label="National ID"
              value={member.national_id}
            />

            <DetailItem
              label="Phone Number"
              value={member.phone_number}
            />

            <DetailItem
              label="Email"
              value={member.email}
            />

            <DetailItem
              label="Occupation"
              value={member.occupation}
            />

            <DetailItem
              label="KRA PIN"
              value={member.kra_pin}
            />

            <DetailItem
              label="Address"
              value={member.physical_address}
            />
          </Grid>
        </Stack>
      </CardContent>
    </Card>
  );
}