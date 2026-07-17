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
  setVehicle,
} from "@/store/registration/registrationSlice";

interface VehicleStepProps {
  onBack: () => void;
  onComplete: () => void;
}

export default function VehicleStep({
  onBack,
  onComplete,
}: VehicleStepProps) {
  const dispatch = useAppDispatch();

  const existingVehicle = useAppSelector(
    (state) => state.registration.vehicle
  );

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [form, setForm] = useState({
    registration_number:
      existingVehicle?.registration_number ??
      "",
    make: existingVehicle?.make ?? "",
    model: existingVehicle?.model ?? "",
    year:
      existingVehicle?.year?.toString() ??
      "",
    color: existingVehicle?.color ?? "",
    engine_number:
      existingVehicle?.engine_number ?? "",
    chassis_number:
      existingVehicle?.chassis_number ?? "",
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
    if (
      !form.registration_number.trim()
    ) {
      setError(
        "Registration number is required."
      );
      return;
    }

    if (!form.make.trim()) {
      setError("Make is required.");
      return;
    }

    if (!form.model.trim()) {
      setError("Model is required.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      dispatch(
        setVehicle({
          registration_number:
            form.registration_number.trim(),
          make: form.make.trim(),
          model: form.model.trim(),
          year:
            form.year === ""
              ? null
              : Number(form.year),
          color: form.color.trim(),
          engine_number:
            form.engine_number.trim(),
          chassis_number:
            form.chassis_number.trim(),
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
            label="Registration Number"
            name="registration_number"
            value={
              form.registration_number
            }
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
            required
            label="Make"
            name="make"
            value={form.make}
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
            required
            label="Model"
            name="model"
            value={form.model}
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
            type="number"
            label="Year"
            name="year"
            value={form.year}
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
            label="Color"
            name="color"
            value={form.color}
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
            label="Engine Number"
            name="engine_number"
            value={
              form.engine_number
            }
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
            label="Chassis Number"
            name="chassis_number"
            value={
              form.chassis_number
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