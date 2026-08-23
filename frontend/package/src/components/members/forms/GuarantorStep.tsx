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
import { setGuarantor } from "@/store/registration/registrationSlice";
import {
  IconShieldCheck,
  IconUser,
  IconId,
  IconPhone,
  IconHeartHandshake,
  IconArrowLeft,
  IconArrowRight,
} from "@tabler/icons-react";

interface GuarantorStepProps {
  onComplete: () => void;
  onBack: () => void;
  onSkip?: () => void;
  required?: boolean;
}

export default function GuarantorStep({
  onComplete,
  onBack,
  required = true,
}: GuarantorStepProps) {
  const dispatch = useAppDispatch();
  const guarantor = useAppSelector((state) => state.registration.guarantor);

  const [form, setForm] = useState({
    first_name: guarantor.first_name || "",
    other_names: guarantor.other_names || "",
    national_id: guarantor.national_id || "",
    phone_number: guarantor.phone_number || "",
    relationship: guarantor.relationship || "",
    guarantor_member: guarantor.guarantor_member ?? "",
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
      setGuarantor({
        first_name: "",
        other_names: "",
        national_id: "",
        phone_number: "",
        relationship: "",
        guarantor_member: null,
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
      if (!form.first_name.trim()) {
        setError("Guarantor first name is required.");
        return;
      }
      if (!form.national_id.trim()) {
        setError("Guarantor National ID / Passport Number is required to verify adult status.");
        return;
      }
      if (!form.phone_number.trim()) {
        setError("Guarantor phone number is required.");
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
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3.5 },
          borderRadius: 3.5,
          border: "1px solid #e2e8f0",
          borderLeft: "6px solid #2563eb",
          bgcolor: "#ffffff",
          boxShadow: "0 4px 20px -4px rgba(37, 99, 235, 0.08)",
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" mb={3} pb={2} borderBottom="1px solid #f1f5f9">
          <Box
            sx={{
              width: 44,
              height: 44,
              bgcolor: "#eff6ff",
              color: "#2563eb",
              borderRadius: 2.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(37, 99, 235, 0.15)",
            }}
          >
            <IconShieldCheck size={24} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={900} sx={{ color: "#0f172a", fontSize: "1.15rem" }}>
              Guarantor &amp; Financial Security
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
              {required
                ? "Mandatory registered SACCO endorsing guarantor for member liability"
                : "Optional SACCO guarantor endorsement"}
            </Typography>
          </Box>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2, fontWeight: 700 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* First Name */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box>
              <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.8, color: "#1e293b", fontSize: "0.875rem" }}>
                Guarantor First Name {required && <span style={{ color: "#e11d48", fontWeight: 800 }}>*</span>}
              </Typography>
              <TextField
                fullWidth
                name="first_name"
                placeholder="e.g. Peter"
                value={form.first_name}
                onChange={handleChange}
                disabled={loading}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconUser size={18} style={{ color: "#2563eb" }} />
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: 2,
                      fontWeight: 600,
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: "#cbd5e1" },
                      "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#2563eb" },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#2563eb", borderWidth: 2 },
                    },
                  },
                }}
              />
            </Box>
          </Grid>

          {/* Other Names */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box>
              <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.8, color: "#1e293b", fontSize: "0.875rem" }}>
                Other / Middle Names
              </Typography>
              <TextField
                fullWidth
                name="other_names"
                placeholder="e.g. Otieno"
                value={form.other_names}
                onChange={handleChange}
                disabled={loading}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconUser size={18} style={{ color: "#2563eb" }} />
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: 2,
                      fontWeight: 600,
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: "#cbd5e1" },
                      "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#2563eb" },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#2563eb", borderWidth: 2 },
                    },
                  },
                }}
              />
            </Box>
          </Grid>

          {/* National ID */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box>
              <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.8, color: "#1e293b", fontSize: "0.875rem" }}>
                National ID / Passport Number {required && <span style={{ color: "#e11d48", fontWeight: 800 }}>*</span>}
              </Typography>
              <TextField
                fullWidth
                name="national_id"
                placeholder="e.g. 23456789"
                value={form.national_id}
                onChange={handleChange}
                disabled={loading}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconId size={18} style={{ color: "#2563eb" }} />
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: 2,
                      fontWeight: 600,
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: "#cbd5e1" },
                      "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#2563eb" },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#2563eb", borderWidth: 2 },
                    },
                  },
                }}
              />
            </Box>
          </Grid>

          {/* Phone Number */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box>
              <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.8, color: "#1e293b", fontSize: "0.875rem" }}>
                Phone Number {required && <span style={{ color: "#e11d48", fontWeight: 800 }}>*</span>}
              </Typography>
              <TextField
                fullWidth
                name="phone_number"
                placeholder="e.g. 0733000000"
                value={form.phone_number}
                onChange={handleChange}
                disabled={loading}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconPhone size={18} style={{ color: "#2563eb" }} />
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: 2,
                      fontWeight: 600,
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: "#cbd5e1" },
                      "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#2563eb" },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#2563eb", borderWidth: 2 },
                    },
                  },
                }}
              />
            </Box>
          </Grid>

          {/* Relationship */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box>
              <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.8, color: "#1e293b", fontSize: "0.875rem" }}>
                Relationship / Association
              </Typography>
              <TextField
                fullWidth
                name="relationship"
                placeholder="e.g. Colleague, Brother, Sacco Member"
                value={form.relationship}
                onChange={handleChange}
                disabled={loading}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconHeartHandshake size={18} style={{ color: "#2563eb" }} />
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: 2,
                      fontWeight: 600,
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: "#cbd5e1" },
                      "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#2563eb" },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#2563eb", borderWidth: 2 },
                    },
                  },
                }}
              />
            </Box>
          </Grid>

          {/* Linked Member ID */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box>
              <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.8, color: "#1e293b", fontSize: "0.875rem" }}>
                Linked Existing Member ID
              </Typography>
              <TextField
                fullWidth
                type="number"
                name="guarantor_member"
                placeholder="e.g. 104"
                value={form.guarantor_member}
                onChange={handleChange}
                disabled={loading}
                helperText="If the guarantor is already an active SACCO member"
                slotProps={{
                  input: {
                    sx: {
                      borderRadius: 2,
                      fontWeight: 600,
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: "#cbd5e1" },
                      "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#2563eb" },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#2563eb", borderWidth: 2 },
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
              "Continue to Review"
            )}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
