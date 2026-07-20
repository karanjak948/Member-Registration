"use client";

import { useEffect, useState } from "react";

import { useParams, useRouter } from "next/navigation";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import memberService from "@/services/member.service";
import { Member } from "@/interfaces/member";

export default function ViewMemberPage() {
  const params = useParams();

  const router = useRouter();

  const [member, setMember] =
    useState<Member | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadMember();
  }, []);

  async function loadMember() {
    try {
      const data =
        await memberService.getById(
          Number(params.id)
        );

      setMember(data);
    } catch {
      setError("Unable to load member.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        mt={10}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        {error}
      </Alert>
    );
  }

  if (!member) {
    return (
      <Alert severity="warning">
        Member not found.
      </Alert>
    );
  }

  const Item = ({
    label,
    value,
  }: {
    label: string;
    value: any;
  }) => (
    <Grid size={{ xs: 12, md: 6 }}>
      <Typography
        color="text.secondary"
      >
        {label}
      </Typography>

      <Typography
        fontWeight={600}
      >
        {value || "-"}
      </Typography>
    </Grid>
  );

  return (
    <Card>

      <CardContent>

        <Stack
          direction="row"
          justifyContent="space-between"
          mb={3}
        >
          <Typography variant="h4">
            Member Details
          </Typography>

          <Stack
            direction="row"
            spacing={2}
          >
            <Button
              startIcon={<ArrowBackIcon />}
              variant="outlined"
              onClick={() =>
                router.push("/members")
              }
            >
              Back
            </Button>

            <Button
              startIcon={<EditIcon />}
              variant="contained"
              onClick={() =>
                router.push(
                  `/members/${member.id}/edit`
                )
              }
            >
              Edit
            </Button>

          </Stack>

        </Stack>

        <Divider sx={{ mb:3 }}/>

        <Grid container spacing={3}>

          <Item
            label="Membership Number"
            value={member.membership_number}
          />

          <Item
            label="First Name"
            value={member.first_name}
          />

          <Item
            label="Other Names"
            value={member.other_names}
          />

          <Item
            label="National ID"
            value={member.national_id}
          />

          <Item
            label="Phone Number"
            value={member.phone_number}
          />

          <Item
            label="Email"
            value={member.email}
          />

          <Item
            label="Occupation"
            value={member.occupation}
          />

          <Item
            label="Address"
            value={member.physical_address}
          />

          <Grid size={{ xs:12, md:6 }}>

            <Typography
              color="text.secondary"
            >
              Status
            </Typography>

            <Chip
              label={member.status}
              color={
                member.status==="ACTIVE"
                  ? "success"
                  : member.status==="INACTIVE"
                  ? "warning"
                  : "error"
              }
            />

          </Grid>

          <Grid size={{ xs:12, md:6 }}>

            <Typography
              color="text.secondary"
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