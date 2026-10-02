"use client";

import { ChangeEvent, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormHelperText,
  Grid,
  InputAdornment,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import api from "@/services/api";
import { validateMember, ValidationErrors } from "@/utils/memberValidation";
import fieldConfigurationService from "@/services/fieldConfiguration.service";
import { FieldConfiguration } from "@/interfaces/fieldConfiguration";
import {
  IconUser,
  IconId,
  IconPhone,
  IconMail,
  IconMapPin,
  IconBriefcase,
  IconReceiptTax,
  IconCategory,
  IconPhoto,
  IconTrash,
  IconArrowRight,
  IconArrowLeft,
  IconUpload,
  IconInfoCircle,
  IconCoins,
  IconPigMoney,
  IconBuildingBank,
} from "@tabler/icons-react";

/* =========================================================
   TYPES
========================================================= */

interface MemberCategory {
  id: number;
  name: string;
  code: string;
  description?: string;
  is_active?: boolean;
}

export interface MemberFormData {
  first_name: string;
  other_names: string;
  national_id: string;
  phone_number: string;
  email: string;
  physical_address: string;
  occupation: string;
  kra_pin: string;
  category: number | "";
  category_details: {
    id: number;
    name: string;
    code: string;
  } | null;
  passport_photo: File | string | null;

  // Onboarding Financial Contributions & Registration Fee
  registration_fee_paid?: boolean;
  registration_fee_amount?: number | string;
  initial_savings_amount?: number | string;
  initial_shares_amount?: number | string;
  payment_channel?: string;
  payment_reference?: string;
  deduct_via_checkoff?: boolean;
}

interface MemberDetailsStepProps {
  initialValues?: Partial<MemberFormData>;
  onComplete: (data: MemberFormData) => void | Promise<void>;
  submitLabel?: string;
  showBackButton?: boolean;
  onBack?: () => void;
}

function createFormData(values?: Partial<MemberFormData>): MemberFormData {
  return {
    first_name: values?.first_name ?? "",
    other_names: values?.other_names ?? "",
    national_id: values?.national_id ?? "",
    phone_number: values?.phone_number ?? "",
    email: values?.email ?? "",
    physical_address: values?.physical_address ?? "",
    occupation: values?.occupation ?? "",
    kra_pin: values?.kra_pin ?? "",
    category: values?.category ?? "",
    category_details: values?.category_details ?? null,
    passport_photo: values?.passport_photo ?? null,

    registration_fee_paid: values?.registration_fee_paid ?? true,
    registration_fee_amount: values?.registration_fee_amount ?? 1000,
    initial_savings_amount: values?.initial_savings_amount ?? 1500,
    initial_shares_amount: values?.initial_shares_amount ?? 0,
    payment_channel: values?.payment_channel ?? "MPESA",
    payment_reference: values?.payment_reference ?? "",
    deduct_via_checkoff: values?.deduct_via_checkoff ?? false,
  };
}

const CATEGORY_COLORS: Record<
  string,
  { dot: string; bg: string; text: string; border: string }
> = {
  NORMAL: { dot: "#059669", bg: "#ecfdf5", text: "#065f46", border: "#a7f3d0" },
  SPECIAL: {
    dot: "#0284c7",
    bg: "#f0f9ff",
    text: "#0369a1",
    border: "#bae6fd",
  },
  OTHER: { dot: "#7c3aed", bg: "#faf5ff", text: "#6d28d9", border: "#ddd6fe" },
};

function getCategoryTheme(code?: string) {
  const normalized = code?.toUpperCase() || "NORMAL";
  return (
    CATEGORY_COLORS[normalized] || {
      dot: "#64748b",
      bg: "#f8fafc",
      text: "#334155",
      border: "#e2e8f0",
    }
  );
}

export default function MemberDetailsStep({
  initialValues,
  onComplete,
  submitLabel = "Continue to Next of Kin",
  showBackButton = false,
  onBack,
}: MemberDetailsStepProps) {
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categories, setCategories] = useState<MemberCategory[]>([]);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [fieldConfigs, setFieldConfigs] = useState<FieldConfiguration[]>([]);

  const [form, setForm] = useState<MemberFormData>(() =>
    createFormData(initialValues),
  );

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Load field configurations dynamically whenever selected category changes
  useEffect(() => {
    if (!form.category) {
      setFieldConfigs([]);
      return;
    }
    let isMounted = true;
    fieldConfigurationService
      .getAll(Number(form.category))
      .then((configs) => {
        if (isMounted) {
          setFieldConfigs(Array.isArray(configs) ? configs : []);
        }
      })
      .catch((err) => {
        console.warn("Unable to load category field configs:", err);
      });
    return () => {
      isMounted = false;
    };
  }, [form.category]);

  const kraPinConfig = fieldConfigs.find((f) => f.field_name === "kra_pin");
  const isKraPinVisible = kraPinConfig ? kraPinConfig.is_visible : true;
  const isKraPinEnabled = kraPinConfig ? kraPinConfig.is_enabled : true;
  const isKraPinRequired = kraPinConfig
    ? Boolean(kraPinConfig.is_required && kraPinConfig.is_enabled && kraPinConfig.is_visible)
    : false;

  useEffect(() => {
    let mounted = true;

    async function loadCategories() {
      setCategoriesLoading(true);
      try {
        const response = await api.get("/member-categories/");
        if (!mounted) return;

        const data = Array.isArray(response.data)
          ? response.data
          : (response.data?.results ?? []);

        setCategories(data);
      } catch (err) {
        console.error("Unable to load member categories:", err);
        if (mounted) {
          setError(
            "Unable to load member categories. Please refresh and try again.",
          );
        }
      } finally {
        if (mounted) {
          setCategoriesLoading(false);
        }
      }
    }

    void loadCategories();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (initialValues) {
      setForm((prev) => ({
        ...prev,
        ...createFormData(initialValues),
      }));
    }
  }, [initialValues]);

  useEffect(() => {
    if (categories.length > 0 && form.category && !form.category_details) {
      const match = categories.find((c) => c.id === form.category);
      if (match) {
        setForm((prev) => ({
          ...prev,
          category_details: {
            id: match.id,
            name: match.name,
            code: match.code,
          },
        }));
      }
    }
  }, [categories, form.category, form.category_details]);

  useEffect(() => {
    const photo = form.passport_photo;
    if (!photo) {
      setPhotoPreview(null);
      return;
    }

    if (photo instanceof File) {
      const objectUrl = URL.createObjectURL(photo);
      setPhotoPreview(objectUrl);
      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    }

    if (typeof photo === "string") {
      setPhotoPreview(photo);
    }
  }, [form.passport_photo]);

  function updateForm(values: Partial<MemberFormData>) {
    setForm((previousForm) => ({
      ...previousForm,
      ...values,
    }));

    setErrors((previousErrors) => {
      const nextErrors = { ...previousErrors };
      Object.keys(values).forEach((key) => {
        delete nextErrors[key as keyof ValidationErrors];
      });
      return nextErrors;
    });

    if (error) {
      setError("");
    }
  }

  function handleCategorySelect(categoryId: number) {
    const selected = categories.find((c) => c.id === categoryId) ?? null;
    setForm((previous) => ({
      ...previous,
      category: categoryId,
      category_details: selected
        ? {
            id: selected.id,
            name: selected.name,
            code: selected.code,
          }
        : null,
    }));

    setErrors((previousErrors) => {
      const next = { ...previousErrors };
      delete next.category;
      return next;
    });
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    updateForm({
      [name]: value,
    } as Partial<MemberFormData>);
  }

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Passport photo must be a JPG, PNG, or WebP image.");
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("Passport photo must be smaller than 5 MB.");
      return;
    }

    updateForm({ passport_photo: file });
  }

  function handleRemovePhoto() {
    updateForm({ passport_photo: null });
  }

  async function handleSubmit() {
    if (loading) return;

    const validationErrors = validateMember(form);

    // Dynamically enforce or bypass KRA PIN validation based on category configuration
    if (isKraPinRequired && !form.kra_pin.trim()) {
      validationErrors.kra_pin = "KRA Tax PIN is required for this member category.";
    } else if (!isKraPinRequired) {
      delete validationErrors.kra_pin;
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setError(
        "Please complete all required fields highlighted below before proceeding.",
      );
      return;
    }

    setErrors({});
    setError("");
    setLoading(true);

    try {
      const memberSnapshot: MemberFormData = { ...form };
      await onComplete(memberSnapshot);
    } catch (err) {
      console.error("Unable to complete Member Details:", err);
      setError("Unable to save member details. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const selectedCategoryObj = categories.find((c) => c.id === form.category);
  const selectedTheme = getCategoryTheme(selectedCategoryObj?.code);

  return (
    <Box>
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3.5, borderRadius: 2.5, fontWeight: 700 }}
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      )}

      <Stack spacing={3.5}>
        {/* Module 1: Personal Identification */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3.5 },
            borderRadius: 3,
            border: "1px solid #cbd5e1",
            bgcolor: "#ffffff",
            boxShadow: "0 2px 8px rgba(15, 23, 42, 0.03)",
          }}
        >
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            mb={3}
            pb={2}
            borderBottom="1px solid #f1f5f9"
          >
            <Box
              sx={{
                width: 42,
                height: 42,
                bgcolor: "#0f172a",
                color: "#ffffff",
                borderRadius: 2.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 10px rgba(15, 23, 42, 0.15)",
              }}
            >
              <IconUser size={22} />
            </Box>
            <Box>
              <Typography
                variant="h6"
                fontWeight={800}
                sx={{ color: "#0f172a", fontSize: "1.1rem" }}
              >
                1. Personal Identification
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "#64748b", fontWeight: 600 }}
              >
                Official legal names, identity credentials, and membership
                classification
              </Typography>
            </Box>
          </Stack>

          <Grid container spacing={3}>
            {/* First Name */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box>
                <Typography
                  variant="subtitle2"
                  fontWeight={800}
                  sx={{ mb: 0.8, color: "#1e293b", fontSize: "0.875rem" }}
                >
                  First Name{" "}
                  <span style={{ color: "#e11d48", fontWeight: 800 }}>*</span>
                </Typography>
                <TextField
                  fullWidth
                  name="first_name"
                  placeholder="e.g. Samuel"
                  value={form.first_name}
                  onChange={handleChange}
                  error={!!errors.first_name}
                  helperText={errors.first_name}
                  disabled={loading}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <IconUser size={18} style={{ color: "#059669" }} />
                        </InputAdornment>
                      ),
                      sx: {
                        borderRadius: 2,
                        fontWeight: 600,
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#cbd5e1",
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#059669",
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#059669",
                          borderWidth: 2,
                        },
                      },
                    },
                  }}
                />
              </Box>
            </Grid>

            {/* Other Names */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box>
                <Typography
                  variant="subtitle2"
                  fontWeight={800}
                  sx={{ mb: 0.8, color: "#1e293b", fontSize: "0.875rem" }}
                >
                  Other / Middle Names
                </Typography>
                <TextField
                  fullWidth
                  name="other_names"
                  placeholder="e.g. Mwangi Kariuki"
                  value={form.other_names}
                  onChange={handleChange}
                  error={!!errors.other_names}
                  helperText={errors.other_names}
                  disabled={loading}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <IconUser size={18} style={{ color: "#059669" }} />
                        </InputAdornment>
                      ),
                      sx: {
                        borderRadius: 2,
                        fontWeight: 600,
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#cbd5e1",
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#059669",
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#059669",
                          borderWidth: 2,
                        },
                      },
                    },
                  }}
                />
              </Box>
            </Grid>

            {/* National ID */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box>
                <Typography
                  variant="subtitle2"
                  fontWeight={800}
                  sx={{ mb: 0.8, color: "#1e293b", fontSize: "0.875rem" }}
                >
                  National ID / Passport Number{" "}
                  <span style={{ color: "#e11d48", fontWeight: 800 }}>*</span>
                </Typography>
                <TextField
                  fullWidth
                  name="national_id"
                  placeholder="e.g. 28475921"
                  value={form.national_id}
                  onChange={handleChange}
                  error={!!errors.national_id}
                  helperText={errors.national_id}
                  disabled={loading}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <IconId size={18} style={{ color: "#059669" }} />
                        </InputAdornment>
                      ),
                      sx: {
                        borderRadius: 2,
                        fontWeight: 600,
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#cbd5e1",
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#059669",
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#059669",
                          borderWidth: 2,
                        },
                      },
                    },
                  }}
                />
              </Box>
            </Grid>

            {/* Member Category */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box>
                <Typography
                  variant="subtitle2"
                  fontWeight={800}
                  sx={{ mb: 0.8, color: "#1e293b", fontSize: "0.875rem" }}
                >
                  Member Category Tier{" "}
                  <span style={{ color: "#e11d48", fontWeight: 800 }}>*</span>
                </Typography>
                <FormControl
                  fullWidth
                  required
                  error={!!errors.category}
                  disabled={loading || categoriesLoading}
                >
                  <Select
                    displayEmpty
                    value={form.category}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) {
                        handleCategorySelect(Number(val));
                      }
                    }}
                    renderValue={(selectedId) => {
                      if (!selectedId) {
                        return (
                          <Typography
                            variant="body2"
                            sx={{ color: "#94a3b8", fontWeight: 500 }}
                          >
                            — Select Member Category —
                          </Typography>
                        );
                      }
                      const selected = categories.find(
                        (c) => c.id === selectedId,
                      );
                      if (!selected) {
                        return (
                          <Typography
                            variant="body2"
                            sx={{ color: "#94a3b8", fontWeight: 500 }}
                          >
                            — Select Member Category —
                          </Typography>
                        );
                      }
                      const theme = getCategoryTheme(selected.code);
                      return (
                        <Stack
                          direction="row"
                          spacing={1.5}
                          alignItems="center"
                        >
                          <Box
                            sx={{
                              width: 10,
                              height: 10,
                              borderRadius: "50%",
                              bgcolor: theme.dot,
                            }}
                          />
                          <Typography
                            variant="body2"
                            fontWeight={800}
                            sx={{ color: "#0f172a" }}
                          >
                            {selected.name}
                          </Typography>
                        </Stack>
                      );
                    }}
                    startAdornment={
                      <InputAdornment position="start" sx={{ mr: 1 }}>
                        <IconCategory size={18} style={{ color: "#064e3b" }} />
                      </InputAdornment>
                    }
                    sx={{
                      borderRadius: 2,
                      fontWeight: 600,
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#cbd5e1",
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#064e3b",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#064e3b",
                        borderWidth: 2,
                      },
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          borderRadius: 2.5,
                          boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
                          border: "1px solid #e2e8f0",
                          mt: 0.5,
                          "& .MuiMenuItem-root": {
                            py: 1.3,
                            px: 2,
                            "&.Mui-selected": {
                              bgcolor: "#f0fdf4 !important",
                              fontWeight: 700,
                            },
                            "&:hover": {
                              bgcolor: "#f8fafc",
                            },
                          },
                        },
                      },
                    }}
                  >
                    <MenuItem value="" disabled>
                      <Typography variant="body2" sx={{ color: "#94a3b8" }}>
                        — Select Member Category —
                      </Typography>
                    </MenuItem>
                    {categoriesLoading ? (
                      <MenuItem value="" disabled>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <CircularProgress size={16} color="inherit" />
                          <Typography variant="body2">
                            Loading categories...
                          </Typography>
                        </Stack>
                      </MenuItem>
                    ) : categories.length === 0 ? (
                      <MenuItem value="" disabled>
                        No categories found
                      </MenuItem>
                    ) : (
                      categories
                        .filter((category) => category.is_active !== false)
                        .map((category) => {
                          const theme = getCategoryTheme(category.code);
                          return (
                            <MenuItem key={category.id} value={category.id}>
                              <Stack
                                direction="row"
                                spacing={1.5}
                                alignItems="center"
                                width="100%"
                              >
                                <Box
                                  sx={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: "50%",
                                    bgcolor: theme.dot,
                                  }}
                                />
                                <Typography
                                  variant="body2"
                                  fontWeight={700}
                                  sx={{ color: "#0f172a" }}
                                >
                                  {category.name}
                                </Typography>
                              </Stack>
                            </MenuItem>
                          );
                        })
                    )}
                  </Select>
                  <FormHelperText
                    sx={{
                      color: errors.category ? "error.main" : "text.secondary",
                    }}
                  >
                    {errors.category ||
                      "Configures onboarding requirements and benefits"}
                  </FormHelperText>
                </FormControl>
              </Box>
            </Grid>

            {/* Subtle Tonal Policy Banner */}
            {selectedCategoryObj && (
              <Grid size={{ xs: 12 }}>
                <Box
                  sx={{
                    p: 1.5,
                    px: 2,
                    borderRadius: 2,
                    bgcolor: selectedTheme.bg,
                    border: `1px solid ${selectedTheme.border}`,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                  }}
                >
                  <IconInfoCircle size={18} color={selectedTheme.dot} />
                  <Typography
                    variant="caption"
                    sx={{ color: selectedTheme.text, fontWeight: 700 }}
                  >
                    {selectedCategoryObj.code?.toUpperCase() === "NORMAL"
                      ? "Normal Member: Standard SACCO workflow requiring Next of Kin, Vehicle Asset, and Guarantor."
                      : `${selectedCategoryObj.name}: Next of Kin and Collateral steps are optional.`}
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </Paper>

        {/* Module 2: Contact & Residential Info */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3.5 },
            borderRadius: 3,
            border: "1px solid #cbd5e1",
            bgcolor: "#ffffff",
            boxShadow: "0 2px 8px rgba(15, 23, 42, 0.03)",
          }}
        >
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            mb={3}
            pb={2}
            borderBottom="1px solid #f1f5f9"
          >
            <Box
              sx={{
                width: 42,
                height: 42,
                bgcolor: "#0369a1",
                color: "#ffffff",
                borderRadius: 2.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 10px rgba(3, 105, 161, 0.15)",
              }}
            >
              <IconPhone size={22} />
            </Box>
            <Box>
              <Typography
                variant="h6"
                fontWeight={800}
                sx={{ color: "#0f172a", fontSize: "1.1rem" }}
              >
                2. Contact &amp; Residential Info
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "#64748b", fontWeight: 600 }}
              >
                Direct communication channels, tax compliance PIN, and physical
                location
              </Typography>
            </Box>
          </Stack>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box>
                <Typography
                  variant="subtitle2"
                  fontWeight={800}
                  sx={{ mb: 0.8, color: "#1e293b", fontSize: "0.875rem" }}
                >
                  Primary Phone Number{" "}
                  <span style={{ color: "#e11d48", fontWeight: 800 }}>*</span>
                </Typography>
                <TextField
                  fullWidth
                  name="phone_number"
                  placeholder="e.g. 0712345678"
                  value={form.phone_number}
                  onChange={handleChange}
                  error={!!errors.phone_number}
                  helperText={errors.phone_number}
                  disabled={loading}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <IconPhone size={18} style={{ color: "#0284c7" }} />
                        </InputAdornment>
                      ),
                      sx: {
                        borderRadius: 2,
                        fontWeight: 600,
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#cbd5e1",
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#0284c7",
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#0284c7",
                          borderWidth: 2,
                        },
                      },
                    },
                  }}
                />
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Box>
                <Typography
                  variant="subtitle2"
                  fontWeight={800}
                  sx={{ mb: 0.8, color: "#1e293b", fontSize: "0.875rem" }}
                >
                  Email Address
                </Typography>
                <TextField
                  fullWidth
                  type="email"
                  placeholder="member@domain.com"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  error={!!errors.email}
                  helperText={errors.email}
                  disabled={loading}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <IconMail size={18} style={{ color: "#0284c7" }} />
                        </InputAdornment>
                      ),
                      sx: {
                        borderRadius: 2,
                        fontWeight: 600,
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#cbd5e1",
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#0284c7",
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#0284c7",
                          borderWidth: 2,
                        },
                      },
                    },
                  }}
                />
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Box>
                <Typography
                  variant="subtitle2"
                  fontWeight={800}
                  sx={{ mb: 0.8, color: "#1e293b", fontSize: "0.875rem" }}
                >
                  Occupation / Primary Business
                </Typography>
                <TextField
                  fullWidth
                  placeholder="e.g. Matatu Owner, Trader, Teacher"
                  name="occupation"
                  value={form.occupation}
                  onChange={handleChange}
                  disabled={loading}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <IconBriefcase
                            size={18}
                            style={{ color: "#0284c7" }}
                          />
                        </InputAdornment>
                      ),
                      sx: {
                        borderRadius: 2,
                        fontWeight: 600,
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#cbd5e1",
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#0284c7",
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#0284c7",
                          borderWidth: 2,
                        },
                      },
                    },
                  }}
                />
              </Box>
            </Grid>

            {/* KRA PIN - Dynamic Category Field Configuration */}
            {isKraPinVisible && (
              <Grid size={{ xs: 12, md: 6 }}>
                <Box>
                  <Typography
                    variant="subtitle2"
                    fontWeight={800}
                    sx={{ mb: 0.8, color: "#1e293b", fontSize: "0.875rem" }}
                  >
                    KRA Tax PIN{" "}
                    {isKraPinRequired && (
                      <span style={{ color: "#e11d48", fontWeight: 800 }}>*</span>
                    )}
                  </Typography>
                  <TextField
                    fullWidth
                    name="kra_pin"
                    placeholder="e.g. A012345678Z"
                    value={form.kra_pin}
                    onChange={handleChange}
                    error={!!errors.kra_pin}
                    disabled={loading || !isKraPinEnabled}
                    helperText={
                      errors.kra_pin ||
                      (!isKraPinEnabled
                        ? "Field disabled in SACCO configuration for this category"
                        : isKraPinRequired
                        ? "Mandatory for this member category"
                        : "Optional for tax compliance")
                    }
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <IconReceiptTax
                              size={18}
                              style={{
                                color: isKraPinEnabled ? "#0284c7" : "#94a3b8",
                              }}
                            />
                          </InputAdornment>
                        ),
                        sx: {
                          borderRadius: 2,
                          fontWeight: 600,
                          bgcolor: !isKraPinEnabled ? "#f8fafc" : "transparent",
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#cbd5e1",
                          },
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: isKraPinEnabled ? "#0284c7" : "#cbd5e1",
                          },
                          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#0284c7",
                            borderWidth: 2,
                          },
                        },
                      },
                    }}
                  />
                </Box>
              </Grid>
            )}

            <Grid size={{ xs: 12 }}>
              <Box>
                <Typography
                  variant="subtitle2"
                  fontWeight={800}
                  sx={{ mb: 0.8, color: "#1e293b", fontSize: "0.875rem" }}
                >
                  Physical Address / Residential Location
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  minRows={2.5}
                  name="physical_address"
                  placeholder="e.g. Nairobi, Kilimani Estate, Building No. 4B"
                  value={form.physical_address}
                  onChange={handleChange}
                  disabled={loading}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment
                          position="start"
                          sx={{ alignSelf: "flex-start", mt: 1.5 }}
                        >
                          <IconMapPin size={18} style={{ color: "#0284c7" }} />
                        </InputAdornment>
                      ),
                      sx: {
                        borderRadius: 2,
                        fontWeight: 600,
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#cbd5e1",
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#0284c7",
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#0284c7",
                          borderWidth: 2,
                        },
                      },
                    },
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Module 3: Onboarding Contributions & Fees */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3.5 },
            borderRadius: 3,
            border: "1px solid #cbd5e1",
            bgcolor: "#ffffff",
            boxShadow: "0 2px 8px rgba(15, 23, 42, 0.03)",
          }}
        >
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            mb={3}
            pb={2}
            borderBottom="1px solid #f1f5f9"
          >
            <Box
              sx={{
                width: 42,
                height: 42,
                bgcolor: "#059669",
                color: "#ffffff",
                borderRadius: 2.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 10px rgba(5, 150, 105, 0.2)",
              }}
            >
              <IconCoins size={22} />
            </Box>
            <Box>
              <Typography
                variant="h6"
                fontWeight={800}
                sx={{ color: "#0f172a", fontSize: "1.1rem" }}
              >
                3. Onboarding Contributions &amp; Registration Fee
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "#64748b", fontWeight: 600 }}
              >
                Choose to pay registration fee, savings, and shares upfront or deduct via monthly payroll check-off
              </Typography>
            </Box>
          </Stack>

          {/* Payment Method Option Selector */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Paper
                elevation={0}
                onClick={() => setForm((prev) => ({ ...prev, deduct_via_checkoff: false, registration_fee_paid: true }))}
                sx={{
                  p: 2.5,
                  borderRadius: 2.5,
                  border: !form.deduct_via_checkoff ? "2px solid #059669" : "1px solid #e2e8f0",
                  bgcolor: !form.deduct_via_checkoff ? "#f0fdf4" : "#f8fafc",
                  cursor: "pointer",
                  transition: "all 0.2s ease-in-out",
                  "&:hover": { borderColor: "#059669" },
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      border: !form.deduct_via_checkoff ? "6px solid #059669" : "2px solid #cbd5e1",
                      bgcolor: "#ffffff",
                      mt: 0.3,
                      flexShrink: 0,
                    }}
                  />
                  <Box>
                    <Typography variant="subtitle2" fontWeight={800} color={!form.deduct_via_checkoff ? "#064e3b" : "#334155"}>
                      Pay Upfront During Registration
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5, lineHeight: 1.5 }}>
                      Member pays registration fee, initial savings, or shares today. Effects accounts and generates receipts immediately.
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Paper
                elevation={0}
                onClick={() => setForm((prev) => ({ ...prev, deduct_via_checkoff: true, registration_fee_paid: false }))}
                sx={{
                  p: 2.5,
                  borderRadius: 2.5,
                  border: form.deduct_via_checkoff ? "2px solid #0284c7" : "1px solid #e2e8f0",
                  bgcolor: form.deduct_via_checkoff ? "#f0f9ff" : "#f8fafc",
                  cursor: "pointer",
                  transition: "all 0.2s ease-in-out",
                  "&:hover": { borderColor: "#0284c7" },
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      border: form.deduct_via_checkoff ? "6px solid #0284c7" : "2px solid #cbd5e1",
                      bgcolor: "#ffffff",
                      mt: 0.3,
                      flexShrink: 0,
                    }}
                  />
                  <Box>
                    <Typography variant="subtitle2" fontWeight={800} color={form.deduct_via_checkoff ? "#0369a1" : "#334155"}>
                      Deduct via Monthly Deductions / Check-off
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5, lineHeight: 1.5 }}>
                      No payment collected today. Fees and savings will be scheduled and automatically deducted during monthly employer check-off uploads.
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          </Grid>

          {!form.deduct_via_checkoff ? (
            <Box sx={{ p: 2.5, bgcolor: "#f8fafc", borderRadius: 2.5, border: "1px solid #e2e8f0" }}>
              <Grid container spacing={2.5}>
                {/* Registration Fee */}
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="caption" fontWeight={700} color="#334155" mb={0.8} display="block">
                    Registration Fee (KES) *
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    value={form.registration_fee_amount}
                    onChange={(e) => setForm({ ...form, registration_fee_amount: e.target.value })}
                    placeholder="1000.00"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">KES</InputAdornment>,
                    }}
                  />
                  <Typography variant="caption" color="#64748b" sx={{ mt: 0.5, display: "block" }}>
                    Standard one-time SACCO entry fee
                  </Typography>
                </Grid>

                {/* Initial Savings */}
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="caption" fontWeight={700} color="#334155" mb={0.8} display="block">
                    Initial Savings Deposit (KES)
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    value={form.initial_savings_amount}
                    onChange={(e) => setForm({ ...form, initial_savings_amount: e.target.value })}
                    placeholder="1500.00"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">KES</InputAdornment>,
                    }}
                  />
                  <Typography variant="caption" color="#64748b" sx={{ mt: 0.5, display: "block" }}>
                    Credited directly to Normal Savings ledger
                  </Typography>
                </Grid>

                {/* Initial Shares */}
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="caption" fontWeight={700} color="#334155" mb={0.8} display="block">
                    Initial Shares Capital (KES)
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    value={form.initial_shares_amount}
                    onChange={(e) => setForm({ ...form, initial_shares_amount: e.target.value })}
                    placeholder="0.00"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">KES</InputAdornment>,
                    }}
                  />
                  <Typography variant="caption" color="#64748b" sx={{ mt: 0.5, display: "block" }}>
                    Issues shares @ KES 100 / share
                  </Typography>
                </Grid>

                {/* Payment Channel */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" fontWeight={700} color="#334155" mb={0.8} display="block">
                    Payment Channel *
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={form.payment_channel || "MPESA"}
                      onChange={(e) => setForm({ ...form, payment_channel: e.target.value })}
                    >
                      <MenuItem value="MPESA">M-Pesa Paybill / Till</MenuItem>
                      <MenuItem value="BANK">Bank Deposit / Transfer</MenuItem>
                      <MenuItem value="CASH">Cash at Counter</MenuItem>
                      <MenuItem value="CHEQUE">Cheque</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Payment Reference */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" fontWeight={700} color="#334155" mb={0.8} display="block">
                    Payment Reference / Code
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="e.g. MPESA-QWE876 or Slip #4021"
                    value={form.payment_reference || ""}
                    onChange={(e) => setForm({ ...form, payment_reference: e.target.value })}
                  />
                </Grid>
              </Grid>

              {/* Total Summary */}
              <Box sx={{ mt: 2.5, p: 2, bgcolor: "#ecfdf5", borderRadius: 2, border: "1px solid #a7f3d0" }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" fontWeight={800} color="#065f46">
                    Total Upfront Amount to Collect Today:
                  </Typography>
                  <Typography variant="h6" fontWeight={900} color="#059669">
                    KES {(
                      Number(form.registration_fee_amount || 0) +
                      Number(form.initial_savings_amount || 0) +
                      Number(form.initial_shares_amount || 0)
                    ).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Typography>
                </Stack>
              </Box>
            </Box>
          ) : (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              <Typography variant="subtitle2" fontWeight={800}>
                Monthly Deduction Check-off Scheduled
              </Typography>
              <Typography variant="caption">
                The registration fee of <strong>KES {Number(form.registration_fee_amount || 1000).toLocaleString()}</strong> and monthly savings will be listed in the monthly deductions check-off schedule and automatically deducted and reconciled when the employer check-off file is uploaded.
              </Typography>
            </Alert>
          )}
        </Paper>

        {/* Module 4: Passport Photograph */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3.5 },
            borderRadius: 3,
            border: "1px solid #cbd5e1",
            bgcolor: "#ffffff",
            boxShadow: "0 2px 8px rgba(15, 23, 42, 0.03)",
          }}
        >
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            mb={3}
            pb={2}
            borderBottom="1px solid #f1f5f9"
          >
            <Box
              sx={{
                width: 42,
                height: 42,
                bgcolor: "#064e3b",
                color: "#ffffff",
                borderRadius: 2.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 10px rgba(6, 78, 59, 0.15)",
              }}
            >
              <IconPhoto size={22} />
            </Box>
            <Box>
              <Typography
                variant="h6"
                fontWeight={800}
                sx={{ color: "#0f172a", fontSize: "1.1rem" }}
              >
                4. Passport Photograph
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "#64748b", fontWeight: 600 }}
              >
                Frontal biometric photo for member ID badge, passbook, and
                ledger record
              </Typography>
            </Box>
          </Stack>

          <Box
            sx={{
              p: 3,
              borderRadius: 2.5,
              bgcolor: "#f8fafc",
              border: "1px dashed #cbd5e1",
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: "center",
              gap: 3.5,
            }}
          >
            {photoPreview ? (
              <Box
                component="img"
                src={photoPreview}
                alt="Passport preview"
                sx={{
                  width: 140,
                  height: 165,
                  objectFit: "cover",
                  borderRadius: 2,
                  border: "2px solid #064e3b",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
                }}
              />
            ) : (
              <Box
                sx={{
                  width: 140,
                  height: 165,
                  borderRadius: 2,
                  bgcolor: "#ffffff",
                  border: "1.5px dashed #cbd5e1",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#94a3b8",
                }}
              >
                <IconPhoto size={36} stroke={1.5} />
                <Typography variant="caption" fontWeight={700} sx={{ mt: 1 }}>
                  No Photo
                </Typography>
              </Box>
            )}

            <Box flex={1}>
              <Typography
                variant="subtitle1"
                fontWeight={800}
                sx={{ color: "#0f172a" }}
              >
                {photoPreview
                  ? "✓ Passport Photo Uploaded"
                  : "Upload Passport Photo"}
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "#64748b", mt: 0.5, mb: 2.5, lineHeight: 1.6 }}
              >
                Accepted formats: <strong>JPG, PNG, WebP</strong>. Maximum file
                size: <strong>5 MB</strong>. Ensure neutral background and clear
                lighting.
              </Typography>

              <Stack direction="row" spacing={1.5} alignItems="center">
                <Button
                  component="label"
                  variant="contained"
                  startIcon={<IconUpload size={18} />}
                  disabled={loading}
                  sx={{
                    bgcolor: "#064e3b",
                    color: "#ffffff",
                    fontWeight: 700,
                    textTransform: "none",
                    px: 3,
                    py: 1,
                    borderRadius: 2,
                    boxShadow: "0 4px 12px rgba(6, 78, 59, 0.25)",
                    "&:hover": { bgcolor: "#047857" },
                  }}
                >
                  {photoPreview ? "Replace Photo" : "Upload Passport Photo"}
                  <input
                    hidden
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoChange}
                  />
                </Button>

                {photoPreview && (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<IconTrash size={18} />}
                    onClick={handleRemovePhoto}
                    disabled={loading}
                    sx={{
                      textTransform: "none",
                      fontWeight: 700,
                      borderRadius: 2,
                      px: 2.5,
                    }}
                  >
                    Remove
                  </Button>
                )}
              </Stack>
            </Box>
          </Box>
        </Paper>
      </Stack>

      {/* Navigation Buttons */}
      <Box
        mt={4}
        pt={2.5}
        sx={{
          borderTop: "1px solid #e2e8f0",
          display: "flex",
          justifyContent: showBackButton ? "space-between" : "flex-end",
          alignItems: "center",
        }}
      >
        {showBackButton && (
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
        )}

        <Button
          variant="contained"
          endIcon={loading ? undefined : <IconArrowRight size={18} />}
          onClick={handleSubmit}
          disabled={loading || categoriesLoading}
          sx={{
            bgcolor: "#064e3b",
            color: "#ffffff",
            fontWeight: 700,
            px: 4.5,
            py: 1.3,
            borderRadius: 2.5,
            textTransform: "none",
            fontSize: "0.95rem",
            boxShadow: "0 6px 18px rgba(6, 78, 59, 0.35)",
            "&:hover": { bgcolor: "#047857" },
          }}
        >
          {loading ? (
            <CircularProgress size={22} color="inherit" />
          ) : (
            submitLabel
          )}
        </Button>
      </Box>
    </Box>
  );
}
