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

export interface Vehicle {
  id: number;
  member: number;

  registration_number: string;
  make: string;
  model: string;

  year: number | null;
  color: string;
  engine_number: string;
  chassis_number: string;

  created_at?: string;
  updated_at?: string;
}

interface VehicleStepProps {
  memberId: number;

  onBack: () => void;

  onComplete: (vehicle: Vehicle) => void;
}

export default function VehicleStep({
  memberId,
  onBack,
  onComplete,
}: VehicleStepProps) {
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [form, setForm] = useState({
    registration_number: "",
    make: "",
    model: "",
    year: "",
    color: "",
    engine_number: "",
    chassis_number: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.post<Vehicle>(
        "/vehicles/",
        {
          member: memberId,

          registration_number: form.registration_number,
          make: form.make,
          model: form.model,

          year:
            form.year === ""
              ? null
              : Number(form.year),

          color: form.color,
          engine_number: form.engine_number,
          chassis_number: form.chassis_number,
        }
      );

      onComplete(response.data);
    } catch (err: any) {
      console.error(err.response?.data);

      if (err.response?.data) {
        const data = err.response.data;

        if (typeof data === "string") {
          setError(data);
        } else if (data.detail) {
          setError(data.detail);
        } else {
          setError(
            JSON.stringify(data, null, 2)
          );
        }
      } else {
        setError("Failed to save vehicle.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            required
            label="Registration Number"
            name="registration_number"
            value={form.registration_number}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            required
            label="Make"
            name="make"
            value={form.make}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            required
            label="Model"
            name="model"
            value={form.model}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Year"
            name="year"
            type="number"
            value={form.year}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Color"
            name="color"
            value={form.color}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Engine Number"
            name="engine_number"
            value={form.engine_number}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Chassis Number"
            name="chassis_number"
            value={form.chassis_number}
            onChange={handleChange}
          />
        </Grid>
      </Grid>

      {error && (
        <Alert severity="error" sx={{ mt: 3 }}>
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