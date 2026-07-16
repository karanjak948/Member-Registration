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
    first_name: "",
    other_names: "",
    relationship: "",
    national_id: "",
    phone_number: "",
    physical_address: "",
    is_primary: true,
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
          first_name: form.first_name,
          other_names: form.other_names,
          relationship: form.relationship,
          national_id: form.national_id,
          phone_number: form.phone_number,
          physical_address: form.physical_address,
          is_primary: form.is_primary,
        }
      );

      onComplete(response.data);
    } catch (err: any) {
      console.error(err.response?.data);

      if (err.response?.data) {
        setError(JSON.stringify(err.response.data, null, 2));
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
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            required
            label="First Name"
            name="first_name"
            value={form.first_name}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            required
            label="Other Names"
            name="other_names"
            value={form.other_names}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            required
            label="Relationship"
            name="relationship"
            value={form.relationship}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            label="National ID"
            name="national_id"
            value={form.national_id}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
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
          <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {error}
          </pre>
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