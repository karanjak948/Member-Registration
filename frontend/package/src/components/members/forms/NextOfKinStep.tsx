"use client";

import { useState } from "react";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  TextField,
} from "@mui/material";

import {
  useAppDispatch,
  useAppSelector,
} from "@/store/hooks";

import {
  setNextOfKin,
} from "@/store/registration/registrationSlice";

interface NextOfKinStepProps {
  onBack: () => void;
  onComplete: () => void;
}

export default function NextOfKinStep({
  onBack,
  onComplete,
}: NextOfKinStepProps) {
  const dispatch = useAppDispatch();

  const existingNextOfKin = useAppSelector(
    (state) => state.registration.nextOfKin
  );

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [form, setForm] = useState({
    first_name:
      existingNextOfKin?.first_name ?? "",
    other_names:
      existingNextOfKin?.other_names ?? "",
    relationship:
      existingNextOfKin?.relationship ?? "",
    national_id:
      existingNextOfKin?.national_id ?? "",
    phone_number:
      existingNextOfKin?.phone_number ?? "",
    physical_address:
      existingNextOfKin?.physical_address ??
      "",
    is_primary:
      existingNextOfKin?.is_primary ?? true,
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit() {
    if (!form.first_name.trim()) {
      setError("First name is required.");
      return;
    }

    if (!form.relationship.trim()) {
      setError("Relationship is required.");
      return;
    }

    if (!form.phone_number.trim()) {
      setError("Phone number is required.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      dispatch(
        setNextOfKin({
          first_name:
            form.first_name.trim(),
          other_names:
            form.other_names.trim(),
          relationship:
            form.relationship.trim(),
          national_id:
            form.national_id.trim(),
          phone_number:
            form.phone_number.trim(),
          physical_address:
            form.physical_address.trim(),
          is_primary:
            form.is_primary,
        })
      );

      onComplete();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box>
      <Grid
        container
        spacing={3}
      >
        <Grid
          size={{
            xs: 12,
            md: 6,
          }}
        >
          <TextField
            fullWidth
            required
            label="First Name"
            name="first_name"
            value={form.first_name}
            onChange={handleChange}
          />
        </Grid>

        <Grid
          size={{
            xs: 12,
            md: 6,
          }}
        >
          <TextField
            fullWidth
            label="Other Names"
            name="other_names"
            value={form.other_names}
            onChange={handleChange}
          />
        </Grid>

        <Grid
          size={{ xs: 12 }}
        >
          <TextField
            fullWidth
            required
            label="Relationship"
            name="relationship"
            value={form.relationship}
            onChange={handleChange}
          />
        </Grid>

        <Grid
          size={{ xs: 12 }}
        >
          <TextField
            fullWidth
            label="National ID"
            name="national_id"
            value={form.national_id}
            onChange={handleChange}
          />
        </Grid>

        <Grid
          size={{ xs: 12 }}
        >
          <TextField
            fullWidth
            required
            label="Phone Number"
            name="phone_number"
            value={form.phone_number}
            onChange={handleChange}
          />
        </Grid>

        <Grid
          size={{ xs: 12 }}
        >
          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Physical Address"
            name="physical_address"
            value={
              form.physical_address
            }
            onChange={handleChange}
          />
        </Grid>
      </Grid>

      {error && (
        <Alert
          severity="error"
          sx={{ mt: 3 }}
        >
          {error}
        </Alert>
      )}

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
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <CircularProgress
              size={22}
              color="inherit"
            />
          ) : (
            "Next"
          )}
        </Button>
      </Box>
    </Box>
  );
}