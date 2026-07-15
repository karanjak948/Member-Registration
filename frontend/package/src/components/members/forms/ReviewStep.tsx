"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  Snackbar,
  Typography,
} from "@mui/material";

import { Member } from "@/interfaces/member";

interface ReviewStepProps {
  member: Member;

  nextOfKin: Record<string, unknown> | null;

  vehicle: Record<string, unknown> | null;

  guarantor: Record<string, unknown> | null;

  onBack: () => void;
}

export default function ReviewStep({
  member,
  nextOfKin,
  vehicle,
  guarantor,
  onBack,
}: ReviewStepProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function finishRegistration() {
    setLoading(true);

    try {
      // Previous steps have already persisted all data.
      localStorage.removeItem("member-registration");

      setSuccess(true);

      setTimeout(() => {
        router.push("/members");
      }, 1500);
    } finally {
      setLoading(false);
    }
  }

  const Detail = ({
    label,
    value,
  }: {
    label: string;
    value: unknown;
  }) => (
    <Grid size={{ xs: 12, md: 6 }}>
      <Typography
        variant="body2"
        color="text.secondary"
      >
        {label}
      </Typography>

      <Typography
        variant="subtitle1"
        fontWeight={600}
      >
        {value ? String(value) : "-"}
      </Typography>
    </Grid>
  );

  return (
    <>
      <Card>
        <CardContent>
          <Typography
            variant="h5"
            mb={3}
          >
            Review Registration
          </Typography>

          {/* Member */}

          <Typography
            variant="h6"
            gutterBottom
          >
            Member Details
          </Typography>

          <Grid container spacing={2} mb={3}>
            <Detail
              label="Membership Number"
              value={member.membership_number}
            />

            <Detail
              label="First Name"
              value={member.first_name}
            />

            <Detail
              label="Other Names"
              value={member.other_names}
            />

            <Detail
              label="National ID"
              value={(member as any).national_id}
            />

            <Detail
              label="Phone Number"
              value={member.phone_number}
            />

            <Detail
              label="Email"
              value={member.email}
            />

            <Detail
              label="Occupation"
              value={(member as any).occupation}
            />

            <Detail
              label="Status"
              value={member.status}
            />
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Next of Kin */}

          <Typography
            variant="h6"
            gutterBottom
          >
            Next of Kin
          </Typography>

          <Grid container spacing={2} mb={3}>
            <Detail
              label="Name"
              value={(nextOfKin as any)?.full_name}
            />

            <Detail
              label="Relationship"
              value={(nextOfKin as any)?.relationship}
            />

            <Detail
              label="Phone"
              value={(nextOfKin as any)?.phone_number}
            />

            <Detail
              label="Email"
              value={(nextOfKin as any)?.email}
            />
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Vehicle */}

          <Typography
            variant="h6"
            gutterBottom
          >
            Vehicle
          </Typography>

          <Grid container spacing={2} mb={3}>
            <Detail
              label="Registration Number"
              value={(vehicle as any)?.registration_number}
            />

            <Detail
              label="Make"
              value={(vehicle as any)?.make}
            />

            <Detail
              label="Model"
              value={(vehicle as any)?.model}
            />

            <Detail
              label="Color"
              value={(vehicle as any)?.color}
            />
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Guarantor */}

          <Typography
            variant="h6"
            gutterBottom
          >
            Guarantor
          </Typography>

          <Grid container spacing={2}>
            <Detail
              label="Name"
              value={(guarantor as any)?.full_name}
            />

            <Detail
              label="National ID"
              value={(guarantor as any)?.national_id}
            />

            <Detail
              label="Phone"
              value={(guarantor as any)?.phone_number}
            />

            <Detail
              label="Email"
              value={(guarantor as any)?.email}
            />
          </Grid>
        </CardContent>
      </Card>

      <Box
        mt={4}
        display="flex"
        justifyContent="space-between"
      >
        <Button
          variant="outlined"
          onClick={onBack}
          disabled={loading}
        >
          Back
        </Button>

        <Button
          variant="contained"
          onClick={finishRegistration}
          disabled={loading}
        >
          {loading ? (
            <CircularProgress
              size={22}
              color="inherit"
            />
          ) : (
            "Finish Registration"
          )}
        </Button>
      </Box>

      <Snackbar
        open={success}
        autoHideDuration={2000}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        <Alert
          severity="success"
          variant="filled"
        >
          Member registered successfully.
        </Alert>
      </Snackbar>
    </>
  );
}