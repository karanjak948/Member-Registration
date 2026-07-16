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

export interface Guarantor {
  id: number;

  member: number;
  guarantor_member: number | null;

  first_name: string;
  other_names: string;
  phone_number: string;
  national_id: string;
  relationship: string;

  created_at?: string;
  updated_at?: string;
}

interface GuarantorStepProps {
  memberId: number;

  onBack: () => void;

  onComplete: (guarantor: Guarantor) => void;
}

export default function GuarantorStep({
  memberId,
  onBack,
  onComplete,
}: GuarantorStepProps) {
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [form, setForm] = useState({
    first_name: "",
    other_names: "",
    national_id: "",
    phone_number: "",
    relationship: "",
    guarantor_member: "",
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
      const response = await api.post<Guarantor>(
        "/guarantors/",
        {
          member: memberId,

          first_name: form.first_name,
          other_names: form.other_names,

          national_id: form.national_id,
          phone_number: form.phone_number,
          relationship: form.relationship,

          guarantor_member:
            form.guarantor_member === ""
              ? null
              : Number(form.guarantor_member),
        }
      );

      onComplete(response.data);
    } catch (err: any) {
      console.error(err.response?.data);

      if (err.response?.data) {
        if (typeof err.response.data === "string") {
          setError(err.response.data);
        } else if (err.response.data.detail) {
          setError(err.response.data.detail);
        } else {
          setError(
            Object.values(err.response.data)
              .flat()
              .join(" ")
          );
        }
      } else {
        setError("Failed to save guarantor.");
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

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            required
            label="National ID"
            name="national_id"
            value={form.national_id}
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
            label="Relationship"
            name="relationship"
            value={form.relationship}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            label="Guarantor Member ID (optional)"
            name="guarantor_member"
            type="number"
            value={form.guarantor_member}
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