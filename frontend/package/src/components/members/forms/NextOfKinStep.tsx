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

import api from "@/services/api";

export interface NextOfKin {
  id: number;
  member: number;
  full_name: string;
  relationship: string;
  phone_number: string;
  email: string;
  physical_address: string;
}

interface NextOfKinStepProps {
  memberId: number;

  onBack: () => void;

  onComplete: (nextOfKin: NextOfKin) => void;
}

export default function NextOfKinStep({
  memberId,
  onBack,
  onComplete,
}: NextOfKinStepProps) {
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    relationship: "",
    phone_number: "",
    email: "",
    physical_address: "",
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
    setLoading(true);
    setError("");

    try {
      const response = await api.post<NextOfKin>(
        "/next-of-kin/",
        {
          member: memberId,
          ...form,
        }
      );

      onComplete(response.data);
    } catch (err: any) {
      if (err.response?.data) {
        if (typeof err.response.data === "string") {
          setError(err.response.data);
        } else if (err.response.data.detail) {
          setError(err.response.data.detail);
        } else {
          setError("Please correct the highlighted errors.");
        }
      } else {
        setError("Failed to save next of kin.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            required
            label="Full Name"
            name="full_name"
            value={form.full_name}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            required
            label="Relationship"
            name="relationship"
            value={form.relationship}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            required
            label="Phone Number"
            name="phone_number"
            value={form.phone_number}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Physical Address"
            name="physical_address"
            value={form.physical_address}
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