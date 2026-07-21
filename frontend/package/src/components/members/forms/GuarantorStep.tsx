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

import { useAppDispatch, useAppSelector } from "@/store/hooks";

import { setGuarantor } from "@/store/registration/registrationSlice";

interface GuarantorStepProps {
  required?: boolean;
  onBack: () => void;
  onComplete: () => void;
  onSkip?: () => void;
}

export default function GuarantorStep({
  required = true,
  onBack,
  onComplete,
  onSkip,
}: GuarantorStepProps) {
  const dispatch = useAppDispatch();

  const existingGuarantor = useAppSelector(
    (state) => state.registration.guarantor,
  );

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [form, setForm] = useState({
    first_name: existingGuarantor?.first_name ?? "",
    other_names: existingGuarantor?.other_names ?? "",
    national_id: existingGuarantor?.national_id ?? "",
    phone_number: existingGuarantor?.phone_number ?? "",
    relationship: existingGuarantor?.relationship ?? "",
    guarantor_member: existingGuarantor?.guarantor_member?.toString() ?? "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit() {
    if (required) {
      if (!form.first_name.trim()) {
        setError("First name is required.");
        return;
      }

      if (!form.national_id.trim()) {
        setError("National ID is required.");
        return;
      }

      if (!form.phone_number.trim()) {
        setError("Phone number is required.");
        return;
      }
    }

    setError("");
    setLoading(true);

    try {
      dispatch(
        setGuarantor({
          first_name: form.first_name.trim(),
          other_names: form.other_names.trim(),
          national_id: form.national_id.trim(),
          phone_number: form.phone_number.trim(),
          relationship: form.relationship.trim(),
          guarantor_member:
            form.guarantor_member === "" ? null : Number(form.guarantor_member),
        }),
      );

      onComplete();
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
            required={required}
            label="First Name"
            name="first_name"
            value={form.first_name}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Other Names"
            name="other_names"
            value={form.other_names}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            required={required}
            label="National ID"
            name="national_id"
            value={form.national_id}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            required={required}
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
            type="number"
            label="Guarantor Member ID (Optional)"
            name="guarantor_member"
            value={form.guarantor_member}
            onChange={handleChange}
          />
        </Grid>
      </Grid>

      {error && (
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
      )}

      <Box mt={4} display="flex" justifyContent="space-between">
        <Button variant="outlined" onClick={onBack} disabled={loading}>
          Back
        </Button>

        <Box display="flex" gap={2}>
          {!required && (
            <Button variant="text" onClick={onSkip} disabled={loading}>
              Skip
            </Button>
          )}

          <Button variant="contained" onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <CircularProgress size={22} color="inherit" />
            ) : required ? (
              "Next"
            ) : (
              "Save & Continue"
            )}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
