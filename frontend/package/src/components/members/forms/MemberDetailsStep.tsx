"use client";

import { useEffect, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PhotoCameraOutlinedIcon from "@mui/icons-material/PhotoCameraOutlined";

import api from "@/services/api";

import {
  validateMember,
  ValidationErrors,
} from "@/utils/memberValidation";

interface MemberCategory {
  id: number;
  name: string;
  code: string;
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
  passport_photo: File | string | null;
}

interface MemberDetailsStepProps {
  initialValues?: Partial<MemberFormData>;
  onChange?: (data: MemberFormData) => void;
  onComplete: (data: MemberFormData) => void;
  submitLabel?: string;
  showBackButton?: boolean;
  onBack?: () => void;
}

// Constant empty object to prevent infinite loop
const EMPTY_MEMBER: Partial<MemberFormData> = {};

export default function MemberDetailsStep({
  initialValues = EMPTY_MEMBER,
  onChange,
  onComplete,
  submitLabel = "Next",
  showBackButton = false,
  onBack,
}: MemberDetailsStepProps) {
  const [loading, setLoading] = useState(false);

  const [categories, setCategories] = useState<MemberCategory[]>([]);

  const [error, setError] = useState("");

  const [errors, setErrors] =
    useState<ValidationErrors>({});

  const [form, setForm] = useState<MemberFormData>({
    first_name: initialValues.first_name ?? "",
    other_names: initialValues.other_names ?? "",
    national_id: initialValues.national_id ?? "",
    phone_number: initialValues.phone_number ?? "",
    email: initialValues.email ?? "",
    physical_address:
      initialValues.physical_address ?? "",
    occupation: initialValues.occupation ?? "",
    kra_pin: initialValues.kra_pin ?? "",
    category: initialValues.category ?? "",
    passport_photo:
      initialValues.passport_photo ?? null,
  });

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  // Update form when initialValues changes - with individual dependencies
  useEffect(() => {
    setForm({
      first_name: initialValues.first_name ?? "",
      other_names: initialValues.other_names ?? "",
      national_id: initialValues.national_id ?? "",
      phone_number:
        initialValues.phone_number ?? "",
      email: initialValues.email ?? "",
      physical_address:
        initialValues.physical_address ?? "",
      occupation:
        initialValues.occupation ?? "",
      kra_pin: initialValues.kra_pin ?? "",
      category: initialValues.category ?? "",
      passport_photo:
        initialValues.passport_photo ?? null,
    });
  }, [
    initialValues.first_name,
    initialValues.other_names,
    initialValues.national_id,
    initialValues.phone_number,
    initialValues.email,
    initialValues.physical_address,
    initialValues.occupation,
    initialValues.kra_pin,
    initialValues.category,
    initialValues.passport_photo,
  ]);

  // Generate preview for passport photo
  useEffect(() => {
    if (!form.passport_photo) {
      setPhotoPreview(null);
      return;
    }

    if (form.passport_photo instanceof File) {
      const url = URL.createObjectURL(form.passport_photo);
      setPhotoPreview(url);
      return () => URL.revokeObjectURL(url);
    }

    if (typeof form.passport_photo === "string") {
      setPhotoPreview(form.passport_photo);
    }
  }, [form.passport_photo]);

  async function loadCategories() {
    try {
      const response = await api.get(
        "/member-categories/"
      );

      setCategories(response.data);
    } catch (error) {
      console.error(error);
    }
  }

  function updateForm(
    values: Partial<MemberFormData>
  ) {
    setForm((prev) => {
      const newForm = {
        ...prev,
        ...values,
      };

      onChange?.(newForm);

      return newForm;
    });
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const { name, value } = e.target;

    updateForm({
      [name]:
        name === "category"
          ? value === ""
            ? ""
            : Number(value)
          : value,
    } as Partial<MemberFormData>);
  }

  async function handleSubmit() {
    if (loading) return;

    const validationErrors =
      validateMember(form);

    if (
      Object.keys(validationErrors).length > 0
    ) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setLoading(true);
    setError("");

    try {
      await onComplete(form);
    } catch {
      setError(
        "Unable to continue."
      );
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
            label="First Name"
            name="first_name"
            value={form.first_name}
            onChange={handleChange}
            error={!!errors.first_name}
            helperText={errors.first_name}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Other Names"
            name="other_names"
            value={form.other_names}
            onChange={handleChange}
            error={!!errors.other_names}
            helperText={errors.other_names}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="National ID"
            name="national_id"
            value={form.national_id}
            onChange={handleChange}
            error={!!errors.national_id}
            helperText={errors.national_id}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Phone Number"
            name="phone_number"
            value={form.phone_number}
            onChange={handleChange}
            error={!!errors.phone_number}
            helperText={errors.phone_number}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Email"
            name="email"
            value={form.email}
            onChange={handleChange}
            error={!!errors.email}
            helperText={errors.email}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Occupation"
            name="occupation"
            value={form.occupation}
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

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="KRA PIN"
            name="kra_pin"
            value={form.kra_pin}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            select
            label="Member Category"
            name="category"
            value={form.category}
            onChange={handleChange}
            error={!!errors.category}
            helperText={errors.category}
          >
            {categories.map((category) => (
              <MenuItem
                key={category.id}
                value={category.id}
              >
                {category.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Passport Photo Upload */}
        <Grid size={{ xs: 12 }}>
          <Typography
            variant="subtitle2"
            sx={{ mb: 1 }}
          >
            Passport Photo
          </Typography>

          <Card variant="outlined">
            <CardContent>
              <Stack
                spacing={2}
                alignItems="center"
              >
                {photoPreview ? (
                  <Box
                    component="img"
                    src={photoPreview}
                    alt="Passport Preview"
                    sx={{
                      width: 170,
                      height: 200,
                      objectFit: "cover",
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: 170,
                      height: 200,
                      border: "2px dashed",
                      borderColor: "divider",
                      borderRadius: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      No Photo Selected
                    </Typography>
                  </Box>
                )}

                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  {form.passport_photo instanceof File
                    ? form.passport_photo.name
                    : typeof form.passport_photo === "string"
                    ? "Current Passport Photo"
                    : "No file selected"}
                </Typography>

                <Stack
                  direction="row"
                  spacing={2}
                >
                  <Button
                    component="label"
                    variant="contained"
                    startIcon={<PhotoCameraOutlinedIcon />}
                  >
                    {photoPreview
                      ? "Replace Photo"
                      : "Upload Photo"}

                    <input
                      hidden
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];

                        if (!file) return;

                        updateForm({
                          passport_photo: file,
                        });
                      }}
                    />
                  </Button>

                  {photoPreview && (
                    <IconButton
                      color="error"
                      onClick={() => {
                        updateForm({
                          passport_photo: null,
                        });
                      }}
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                  )}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
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
        justifyContent={
          showBackButton
            ? "space-between"
            : "flex-end"
        }
      >
        {showBackButton && (
          <Button
            variant="outlined"
            onClick={onBack}
            disabled={loading}
          >
            Back
          </Button>
        )}

        <Button
          variant="contained"
          disabled={loading}
          onClick={handleSubmit}
        >
          {loading ? (
            <CircularProgress
              size={22}
              color="inherit"
            />
          ) : (
            submitLabel
          )}
        </Button>
      </Box>
    </Box>
  );
}