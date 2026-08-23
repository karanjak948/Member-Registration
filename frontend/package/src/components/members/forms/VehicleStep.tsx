"use client";

import { ChangeEvent, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setVehicle } from "@/store/registration/registrationSlice";
import {
  IconCar,
  IconNumber,
  IconPalette,
  IconEngine,
  IconArrowLeft,
  IconArrowRight,
} from "@tabler/icons-react";

interface VehicleStepProps {
  onComplete: () => void;
  onBack: () => void;
  onSkip?: () => void;
  required?: boolean;
}

export default function VehicleStep({
  onComplete,
  onBack,
  required = true,
}: VehicleStepProps) {
  const dispatch = useAppDispatch();
  const vehicle = useAppSelector((state) => state.registration.vehicle);

  const [form, setForm] = useState({
    registration_number: vehicle.registration_number || "",
    make: vehicle.make || "",
    model: vehicle.model || "",
    year: vehicle.year ?? "",
    color: vehicle.color || "",
    engine_number: vehicle.engine_number || "",
    chassis_number: vehicle.chassis_number || "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError("");
  }

  function handleSkip() {
    dispatch(
      setVehicle({
        registration_number: "",
        make: "",
        model: "",
        year: null,
        color: "",
        engine_number: "",
        chassis_number: "",
      }),
    );
    onComplete();
  }

  function handleSubmit() {
    const hasAnyValue = Object.values(form).some(
      (v) => String(v).trim().length > 0,
    );

    if (!required && !hasAnyValue) {
      handleSkip();
      return;
    }

    if (required || hasAnyValue) {
      if (!form.registration_number.trim()) {
        setError("Vehicle registration plate number is required.");
        return;
      }
    }

    setError("");
    setLoading(true);

    try {
      dispatch(
        setVehicle({
          registration_number: form.registration_number.trim().toUpperCase(),
          make: form.make.trim(),
          model: form.model.trim(),
          year: form.year === "" ? null : Number(form.year),
          color: form.color.trim(),
          engine_number: form.engine_number.trim(),
          chassis_number: form.chassis_number.trim(),
        }),
      );

      onComplete();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3.5 },
          borderRadius: 3.5,
          border: "1px solid #e2e8f0",
          borderLeft: "6px solid #0d9488",
          bgcolor: "#ffffff",
          boxShadow: "0 4px 20px -4px rgba(13, 148, 136, 0.08)",
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" mb={3} pb={2} borderBottom="1px solid #f1f5f9">
          <Box
            sx={{
              width: 44,
              height: 44,
              bgcolor: "#f0fdfa",
              color: "#0d9488",
              borderRadius: 2.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(13, 148, 136, 0.15)",
            }}
          >
            <IconCar size={24} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={900} sx={{ color: "#0f172a", fontSize: "1.15rem" }}>
              Vehicle Asset &amp; Collateral
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
              {required
                ? "Mandatory transport fleet asset registration and vehicle logbook specifications"
                : "Optional transport asset registration for commercial vehicle operators"}
            </Typography>
          </Box>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2, fontWeight: 700 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Plate Number */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box>
              <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.8, color: "#1e293b", fontSize: "0.875rem" }}>
                Registration Number Plate {required && <span style={{ color: "#e11d48", fontWeight: 800 }}>*</span>}
              </Typography>
              <TextField
                fullWidth
                name="registration_number"
                placeholder="e.g. KDC 123A"
                value={form.registration_number}
                onChange={handleChange}
                disabled={loading}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconNumber size={18} style={{ color: "#0d9488" }} />
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: 2,
                      fontWeight: 600,
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: "#cbd5e1" },
                      "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#0d9488" },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#0d9488", borderWidth: 2 },
                    },
                  },
                }}
              />
            </Box>
          </Grid>

          {/* Make */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box>
              <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.8, color: "#1e293b", fontSize: "0.875rem" }}>
                Vehicle Make
              </Typography>
              <TextField
                fullWidth
                name="make"
                placeholder="e.g. Toyota, Isuzu, Nissan"
                value={form.make}
                onChange={handleChange}
                disabled={loading}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconCar size={18} style={{ color: "#0d9488" }} />
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: 2,
                      fontWeight: 600,
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: "#cbd5e1" },
                      "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#0d9488" },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#0d9488", borderWidth: 2 },
                    },
                  },
                }}
              />
            </Box>
          </Grid>

          {/* Model */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box>
              <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.8, color: "#1e293b", fontSize: "0.875rem" }}>
                Vehicle Model
              </Typography>
              <TextField
                fullWidth
                name="model"
                placeholder="e.g. Hiace, Forward, NV350"
                value={form.model}
                onChange={handleChange}
                disabled={loading}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconCar size={18} style={{ color: "#0d9488" }} />
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: 2,
                      fontWeight: 600,
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: "#cbd5e1" },
                      "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#0d9488" },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#0d9488", borderWidth: 2 },
                    },
                  },
                }}
              />
            </Box>
          </Grid>

          {/* Year */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box>
              <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.8, color: "#1e293b", fontSize: "0.875rem" }}>
                Year of Manufacture
              </Typography>
              <TextField
                fullWidth
                type="number"
                name="year"
                placeholder="e.g. 2018"
                value={form.year}
                onChange={handleChange}
                disabled={loading}
                slotProps={{
                  input: {
                    sx: {
                      borderRadius: 2,
                      fontWeight: 600,
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: "#cbd5e1" },
                      "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#0d9488" },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#0d9488", borderWidth: 2 },
                    },
                  },
                }}
              />
            </Box>
          </Grid>

          {/* Color */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box>
              <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.8, color: "#1e293b", fontSize: "0.875rem" }}>
                Vehicle Color
              </Typography>
              <TextField
                fullWidth
                name="color"
                placeholder="e.g. White / Blue"
                value={form.color}
                onChange={handleChange}
                disabled={loading}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconPalette size={18} style={{ color: "#0d9488" }} />
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: 2,
                      fontWeight: 600,
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: "#cbd5e1" },
                      "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#0d9488" },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#0d9488", borderWidth: 2 },
                    },
                  },
                }}
              />
            </Box>
          </Grid>

          {/* Engine Number */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box>
              <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.8, color: "#1e293b", fontSize: "0.875rem" }}>
                Engine Number
              </Typography>
              <TextField
                fullWidth
                name="engine_number"
                placeholder="e.g. 1KD-1234567"
                value={form.engine_number}
                onChange={handleChange}
                disabled={loading}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconEngine size={18} style={{ color: "#0d9488" }} />
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: 2,
                      fontWeight: 600,
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: "#cbd5e1" },
                      "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#0d9488" },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#0d9488", borderWidth: 2 },
                    },
                  },
                }}
              />
            </Box>
          </Grid>

          {/* Chassis Number */}
          <Grid size={{ xs: 12 }}>
            <Box>
              <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.8, color: "#1e293b", fontSize: "0.875rem" }}>
                Chassis Number
              </Typography>
              <TextField
                fullWidth
                name="chassis_number"
                placeholder="e.g. TRH200-0012345"
                value={form.chassis_number}
                onChange={handleChange}
                disabled={loading}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconEngine size={18} style={{ color: "#0d9488" }} />
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: 2,
                      fontWeight: 600,
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: "#cbd5e1" },
                      "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#0d9488" },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#0d9488", borderWidth: 2 },
                    },
                  },
                }}
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Navigation Buttons */}
      <Box
        mt={4}
        pt={2.5}
        sx={{
          borderTop: "1px solid #e2e8f0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Button
          variant="outlined"
          startIcon={<IconArrowLeft size={18} />}
          onClick={onBack}
          disabled={loading}
          sx={{
            px: 3,
            py: 1.2,
            fontWeight: 700,
            textTransform: "none",
            borderColor: "#cbd5e1",
            color: "#334155",
          }}
        >
          Back
        </Button>

        <Stack direction="row" spacing={1.5}>
          {!required && (
            <Button
              variant="text"
              onClick={handleSkip}
              disabled={loading}
              sx={{
                px: 2.5,
                fontWeight: 700,
                color: "#64748b",
                textTransform: "none",
              }}
            >
              Skip Step
            </Button>
          )}

          <Button
            variant="contained"
            endIcon={loading ? undefined : <IconArrowRight size={18} />}
            onClick={handleSubmit}
            disabled={loading}
            sx={{
              bgcolor: "#064e3b",
              color: "#ffffff",
              fontWeight: 700,
              px: 4,
              py: 1.2,
              borderRadius: 2.5,
              textTransform: "none",
              boxShadow: "0 6px 18px rgba(6, 78, 59, 0.35)",
              "&:hover": { bgcolor: "#047857" },
            }}
          >
            {loading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Continue to Guarantor"
            )}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
