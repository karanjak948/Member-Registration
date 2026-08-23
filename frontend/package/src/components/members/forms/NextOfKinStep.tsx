"use client";

import { ChangeEvent, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setNextOfKin } from "@/store/registration/registrationSlice";
import {
  IconHeartHandshake,
  IconUser,
  IconId,
  IconPhone,
  IconMapPin,
  IconArrowLeft,
  IconArrowRight,
} from "@tabler/icons-react";

interface NextOfKinStepProps {
  onComplete: () => void;
  onBack: () => void;
  onSkip?: () => void;
  required?: boolean;
}

const RELATIONSHIP_OPTIONS = [
  "Spouse",
  "Child",
  "Parent",
  "Sibling",
  "Relative",
  "Guardian",
  "Business Partner",
  "Other",
];

export default function NextOfKinStep({
  onComplete,
  onBack,
  required = true,
}: NextOfKinStepProps) {
  const dispatch = useAppDispatch();
  const nextOfKin = useAppSelector((state) => state.registration.nextOfKin);

  const [form, setForm] = useState({
    first_name: nextOfKin.first_name || "",
    other_names: nextOfKin.other_names || "",
    relationship: nextOfKin.relationship || "",
    national_id: nextOfKin.national_id || "",
    phone_number: nextOfKin.phone_number || "",
    physical_address: nextOfKin.physical_address || "",
    is_primary: true,
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError("");
  }

  function handleSkip() {
    dispatch(
      setNextOfKin({
        first_name: "",
        other_names: "",
        relationship: "",
        national_id: "",
        phone_number: "",
        physical_address: "",
        is_primary: false,
      }),
    );
    onComplete();
  }

  function handleSubmit() {
    const hasAnyValue = Object.values(form).some(
      (v) => typeof v === "string" && v.trim().length > 0,
    );

    if (!required && !hasAnyValue) {
      handleSkip();
      return;
    }

    if (required || hasAnyValue) {
      if (!form.first_name.trim()) {
        setError("Next of Kin first name is required.");
        return;
      }
      if (!form.relationship.trim()) {
        setError("Relationship is required.");
        return;
      }
      if (!form.phone_number.trim()) {
        setError("Primary phone number is required.");
        return;
      }
    }

    setError("");
    setLoading(true);

    try {
      dispatch(
        setNextOfKin({
          first_name: form.first_name.trim(),
          other_names: form.other_names.trim(),
          relationship: form.relationship.trim(),
          national_id: form.national_id.trim(),
          phone_number: form.phone_number.trim(),
          physical_address: form.physical_address.trim(),
          is_primary: form.is_primary,
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
          borderLeft: "6px solid #e11d48",
          bgcolor: "#ffffff",
          boxShadow: "0 4px 20px -4px rgba(225, 29, 72, 0.08)",
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" mb={3} pb={2} borderBottom="1px solid #f1f5f9">
          <Box
            sx={{
              width: 44,
              height: 44,
              bgcolor: "#fff1f2",
              color: "#e11d48",
              borderRadius: 2.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(225, 29, 72, 0.15)",
            }}
          >
            <IconHeartHandshake size={24} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={900} sx={{ color: "#0f172a", fontSize: "1.15rem" }}>
              Next of Kin &amp; Primary Beneficiary
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
              {required
                ? "Mandatory emergency contact and primary nominated beneficiary records"
                : "Optional emergency contact person and beneficiary details"}
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
                Next of Kin First Name {required && <span style={{ color: "#e11d48", fontWeight: 800 }}>*</span>}
              </Typography>
              <TextField
                fullWidth
                name="first_name"
                placeholder="e.g. Grace"
                value={form.first_name}
                onChange={handleChange}
                disabled={loading}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconUser size={18} style={{ color: "#e11d48" }} />
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: 2,
                      fontWeight: 600,
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: "#cbd5e1" },
                      "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#e11d48" },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#e11d48", borderWidth: 2 },
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
                placeholder="e.g. Wanjiku"
                value={form.other_names}
                onChange={handleChange}
                disabled={loading}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconUser size={18} style={{ color: "#e11d48" }} />
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: 2,
                      fontWeight: 600,
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: "#cbd5e1" },
                      "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#e11d48" },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#e11d48", borderWidth: 2 },
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
                Relationship {required && <span style={{ color: "#e11d48", fontWeight: 800 }}>*</span>}
              </Typography>
              <TextField
                fullWidth
                select
                name="relationship"
                value={form.relationship}
                onChange={handleChange}
                disabled={loading}
                slotProps={{
                  input: {
                    sx: {
                      borderRadius: 2,
                      fontWeight: 600,
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: "#cbd5e1" },
                      "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#e11d48" },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#e11d48", borderWidth: 2 },
                    },
                  },
                }}
              >
                <MenuItem value="" disabled>
                  <em>Select relationship</em>
                </MenuItem>
                {RELATIONSHIP_OPTIONS.map((rel) => (
                  <MenuItem key={rel} value={rel}>
                    {rel}
                  </MenuItem>
                ))}
              </TextField>
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
                placeholder="e.g. 0722000000"
                value={form.phone_number}
                onChange={handleChange}
                disabled={loading}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconPhone size={18} style={{ color: "#e11d48" }} />
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: 2,
                      fontWeight: 600,
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: "#cbd5e1" },
                      "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#e11d48" },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#e11d48", borderWidth: 2 },
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
                National ID / Passport Number
              </Typography>
              <TextField
                fullWidth
                name="national_id"
                placeholder="e.g. 29384756"
                value={form.national_id}
                onChange={handleChange}
                disabled={loading}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconId size={18} style={{ color: "#e11d48" }} />
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: 2,
                      fontWeight: 600,
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: "#cbd5e1" },
                      "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#e11d48" },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#e11d48", borderWidth: 2 },
                    },
                  },
                }}
              />
            </Box>
          </Grid>

          {/* Physical Address */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box>
              <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.8, color: "#1e293b", fontSize: "0.875rem" }}>
                Physical Address / Location
              </Typography>
              <TextField
                fullWidth
                name="physical_address"
                placeholder="e.g. Nairobi, Westlands"
                value={form.physical_address}
                onChange={handleChange}
                disabled={loading}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconMapPin size={18} style={{ color: "#e11d48" }} />
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: 2,
                      fontWeight: 600,
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: "#cbd5e1" },
                      "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#e11d48" },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#e11d48", borderWidth: 2 },
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
              "Continue to Vehicle Asset"
            )}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
