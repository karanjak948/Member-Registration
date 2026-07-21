"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
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
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

import api from "@/services/api";

import { validateMember, ValidationErrors } from "@/utils/memberValidation";

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
}

interface MemberDetailsStepProps {
  /*
   * Values previously saved in Redux.
   *
   * These are used when:
   * - the user returns from another step,
   * - the wizard remounts Step 1,
   * - an existing draft is restored.
   */
  initialValues?: Partial<MemberFormData>;

  /*
   * Called ONLY after Step 1 passes
   * validation.
   *
   * RegisterMemberPage must:
   *
   * 1. Save this complete snapshot to Redux.
   * 2. Then navigate to the next wizard step.
   */
  onComplete: (data: MemberFormData) => void | Promise<void>;

  submitLabel?: string;

  showBackButton?: boolean;

  onBack?: () => void;
}

/* =========================================================
   FORM FACTORY
========================================================= */

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
  };
}

/* =========================================================
   COMPONENT
========================================================= */

export default function MemberDetailsStep({
  initialValues,
  onComplete,
  submitLabel = "Next",
  showBackButton = false,
  onBack,
}: MemberDetailsStepProps) {
  /* =======================================================
     STATE
  ======================================================= */

  const [loading, setLoading] = useState(false);

  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [categories, setCategories] = useState<MemberCategory[]>([]);

  const [error, setError] = useState("");

  const [errors, setErrors] = useState<ValidationErrors>({});

  /*
   * IMPORTANT:
   *
   * Step 1 owns its form state while
   * the user is editing.
   *
   * Redux is NOT updated on every
   * keystroke.
   *
   * When the user clicks Next:
   *
   * local form
   *      ↓
   * validation
   *      ↓
   * onComplete(form)
   *      ↓
   * parent saves Redux
   *      ↓
   * parent changes wizard step
   */
  const [form, setForm] = useState<MemberFormData>(() =>
    createFormData(initialValues),
  );

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  /* =======================================================
     LOAD MEMBER CATEGORIES
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    async function loadCategories() {
      setCategoriesLoading(true);

      try {
        const response = await api.get("/member-categories/");

        if (!mounted) {
          return;
        }

        /*
         * Support both:
         *
         * [
         *   {...}
         * ]
         *
         * and paginated DRF:
         *
         * {
         *   count,
         *   next,
         *   previous,
         *   results: [...]
         * }
         */
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

  /* =======================================================
     PASSPORT PHOTO PREVIEW
  ======================================================= */

  useEffect(() => {
    const photo = form.passport_photo;

    /*
     * No photo.
     */
    if (!photo) {
      setPhotoPreview(null);

      return;
    }

    /*
     * Newly selected browser File.
     */
    if (photo instanceof File) {
      const objectUrl = URL.createObjectURL(photo);

      setPhotoPreview(objectUrl);

      /*
       * Prevent browser memory leaks.
       */
      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    }

    /*
     * Existing backend URL/path.
     */
    if (typeof photo === "string") {
      setPhotoPreview(photo);
    }
  }, [form.passport_photo]);

  /* =======================================================
     SELECTED CATEGORY
  ======================================================= */

  const selectedCategory = useMemo(() => {
    if (form.category === "") {
      return null;
    }

    return (
      categories.find((category) => category.id === Number(form.category)) ??
      null
    );
  }, [categories, form.category]);

  /* =======================================================
     LOCAL FORM UPDATE
  ======================================================= */

  function updateForm(values: Partial<MemberFormData>) {
    /*
     * CRITICAL FIX:
     *
     * This state updater must remain PURE.
     *
     * Do NOT:
     *
     * onChange?.(...)
     * dispatch(...)
     * set parent state
     *
     * from inside this callback.
     *
     * Doing so causes:
     *
     * "Cannot update a component
     * (RegisterMemberPage) while
     * rendering a different component
     * (MemberDetailsStep)"
     */
    setForm((previousForm) => ({
      ...previousForm,
      ...values,
    }));

    /*
     * Clear validation errors only
     * for fields the user has started
     * correcting.
     */
    setErrors((previousErrors) => {
      const nextErrors = {
        ...previousErrors,
      };

      Object.keys(values).forEach((key) => {
        delete nextErrors[key as keyof ValidationErrors];
      });

      return nextErrors;
    });

    /*
     * Remove generic error after
     * the user starts correcting
     * the form.
     */
    if (error) {
      setError("");
    }
  }

  /* =======================================================
     CATEGORY CHANGE
  ======================================================= */

  function handleCategoryChange(event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;

    if (!value) {
      setForm((previous) => ({
        ...previous,
        category: "",
        category_details: null,
      }));

      return;
    }

    const categoryId = Number(value);

    const selectedCategory =
      categories.find((category) => category.id === categoryId) ?? null;

    setForm((previous) => ({
      ...previous,
      category: categoryId,
      category_details: selectedCategory
        ? {
            id: selectedCategory.id,
            name: selectedCategory.name,
            code: selectedCategory.code,
          }
        : null,
    }));
  }

  /* =======================================================
     TEXT CHANGE
  ======================================================= */

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;

    updateForm({
      [name]: value,
    } as Partial<MemberFormData>);
  }

  /* =======================================================
     PHOTO HANDLERS
  ======================================================= */

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    /*
     * Reset the input so the same
     * image can be selected again
     * after removal/replacement.
     */
    event.target.value = "";

    if (!file) {
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setError("Passport photo must be a JPG, PNG, or WebP image.");

      return;
    }

    /*
     * 5 MB client-side safety limit.
     */
    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      setError("Passport photo must be smaller than 5 MB.");

      return;
    }

    updateForm({
      passport_photo: file,
    });
  }

  function handleRemovePhoto() {
    updateForm({
      passport_photo: null,
    });
  }

  /* =======================================================
     SUBMIT STEP
  ======================================================= */

  async function handleSubmit() {
    if (loading) {
      return;
    }

    /*
     * Validate exactly what is
     * currently displayed.
     */
    const validationErrors = validateMember(form);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);

      setError("Please correct the highlighted fields before continuing.");

      return;
    }

    setErrors({});
    setError("");
    setLoading(true);

    try {
      /*
       * Create a complete snapshot
       * of Step 1.
       *
       * This prevents later local
       * mutations from affecting
       * the object passed upward.
       */
      const memberSnapshot: MemberFormData = {
        ...form,
      };

      /*
       * IMPORTANT:
       *
       * The parent RegisterMemberPage
       * receives the validated data.
       *
       * It must dispatch:
       *
       * replaceMember(memberSnapshot)
       *
       * BEFORE calling handleNext().
       *
       * No Redux update occurs during
       * local setForm().
       */
      await onComplete(memberSnapshot);
    } catch (err) {
      console.error("Unable to complete Member Details:", err);

      setError("Unable to save the member details. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <Box>
      {/* =============================================
          SECTION HEADER
      ============================================== */}

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight={700}>
          Member Information
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Enter the member&apos;s personal and registration details. Required
          fields must be completed before continuing.
        </Typography>
      </Box>

      {/* =============================================
          GENERAL ERROR
      ============================================== */}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* =============================================
          MEMBER FORM
      ============================================== */}

      <Grid container spacing={2.5}>
        {/* First Name */}

        <Grid
          size={{
            xs: 12,
            md: 6,
          }}
        >
          <TextField
            fullWidth
            required
            label="First Name"
            name="first_name"
            value={form.first_name}
            onChange={handleChange}
            error={!!errors.first_name}
            helperText={errors.first_name}
            disabled={loading}
          />
        </Grid>

        {/* Other Names */}

        <Grid
          size={{
            xs: 12,
            md: 6,
          }}
        >
          <TextField
            fullWidth
            label="Other Names"
            name="other_names"
            value={form.other_names}
            onChange={handleChange}
            error={!!errors.other_names}
            helperText={errors.other_names}
            disabled={loading}
          />
        </Grid>

        {/* National ID */}

        <Grid
          size={{
            xs: 12,
            md: 6,
          }}
        >
          <TextField
            fullWidth
            required
            label="National ID"
            name="national_id"
            value={form.national_id}
            onChange={handleChange}
            error={!!errors.national_id}
            helperText={errors.national_id}
            disabled={loading}
          />
        </Grid>

        {/* Phone Number */}

        <Grid
          size={{
            xs: 12,
            md: 6,
          }}
        >
          <TextField
            fullWidth
            required
            label="Phone Number"
            name="phone_number"
            value={form.phone_number}
            onChange={handleChange}
            error={!!errors.phone_number}
            helperText={errors.phone_number}
            disabled={loading}
          />
        </Grid>

        {/* Email */}

        <Grid
          size={{
            xs: 12,
            md: 6,
          }}
        >
          <TextField
            fullWidth
            type="email"
            label="Email Address"
            name="email"
            value={form.email}
            onChange={handleChange}
            error={!!errors.email}
            helperText={errors.email}
            disabled={loading}
          />
        </Grid>

        {/* Occupation */}

        <Grid
          size={{
            xs: 12,
            md: 6,
          }}
        >
          <TextField
            fullWidth
            label="Occupation / Business"
            name="occupation"
            value={form.occupation}
            onChange={handleChange}
            disabled={loading}
          />
        </Grid>

        {/* Physical Address */}

        <Grid
          size={{
            xs: 12,
          }}
        >
          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Physical Address"
            name="physical_address"
            value={form.physical_address}
            onChange={handleChange}
            disabled={loading}
          />
        </Grid>

        {/* KRA PIN */}

        <Grid
          size={{
            xs: 12,
            md: 6,
          }}
        >
          <TextField
            fullWidth
            label="KRA PIN"
            name="kra_pin"
            value={form.kra_pin}
            onChange={handleChange}
            disabled={loading}
            helperText="Optional"
          />
        </Grid>

        {/* Member Category */}

        <Grid
          size={{
            xs: 12,
            md: 6,
          }}
        >
          <TextField
            fullWidth
            select
            required
            label="Member Category"
            name="category"
            value={form.category}
            onChange={handleCategoryChange}
            error={!!errors.category}
            helperText={errors.category}
            disabled={loading || categoriesLoading}
          >
            {categoriesLoading && (
              <MenuItem value="" disabled>
                Loading categories...
              </MenuItem>
            )}

            {!categoriesLoading && categories.length === 0 && (
              <MenuItem value="" disabled>
                No categories available
              </MenuItem>
            )}

            {categories
              .filter((category) => category.is_active !== false)
              .map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
          </TextField>
        </Grid>

        {/* =============================================
            PASSPORT PHOTO
        ============================================== */}

        <Grid
          size={{
            xs: 12,
          }}
        >
          <Box sx={{ mt: 1 }}>
            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              alignItems={{
                xs: "flex-start",
                sm: "center",
              }}
              justifyContent="space-between"
              spacing={1}
              sx={{ mb: 1.5 }}
            >
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  Passport Photo
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Upload a clear passport-style JPG, PNG, or WebP image.
                </Typography>
              </Box>

              {photoPreview && (
                <Chip
                  size="small"
                  color="success"
                  variant="outlined"
                  icon={<CheckCircleOutlineIcon />}
                  label="Photo selected"
                />
              )}
            </Stack>

            <Card
              variant="outlined"
              sx={{
                borderRadius: 2.5,

                bgcolor: "background.default",
              }}
            >
              <CardContent
                sx={{
                  p: {
                    xs: 2,
                    sm: 3,
                  },

                  "&:last-child": {
                    pb: {
                      xs: 2,
                      sm: 3,
                    },
                  },
                }}
              >
                <Stack spacing={2} alignItems="center">
                  {photoPreview ? (
                    <Box
                      component="img"
                      src={photoPreview}
                      alt="Passport photo preview"
                      sx={{
                        width: 150,

                        height: 180,

                        objectFit: "cover",

                        borderRadius: 2,

                        border: "1px solid",

                        borderColor: "divider",

                        boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: 150,

                        height: 180,

                        border: "2px dashed",

                        borderColor: "divider",

                        borderRadius: 2,

                        display: "flex",

                        flexDirection: "column",

                        alignItems: "center",

                        justifyContent: "center",

                        gap: 1,

                        bgcolor: "background.paper",
                      }}
                    >
                      <PhotoCameraOutlinedIcon
                        sx={{
                          fontSize: 34,

                          color: "text.secondary",
                        }}
                      />

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        textAlign="center"
                      >
                        No photo selected
                      </Typography>
                    </Box>
                  )}

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    textAlign="center"
                  >
                    {form.passport_photo instanceof File
                      ? form.passport_photo.name
                      : typeof form.passport_photo === "string"
                        ? "Current passport photo"
                        : "Maximum file size: 5 MB"}
                  </Typography>

                  <Stack direction="row" spacing={1} alignItems="center">
                    <Button
                      component="label"
                      variant={photoPreview ? "outlined" : "contained"}
                      startIcon={<PhotoCameraOutlinedIcon />}
                      disabled={loading}
                    >
                      {photoPreview ? "Replace Photo" : "Upload Photo"}

                      <input
                        hidden
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handlePhotoChange}
                      />
                    </Button>

                    {photoPreview && (
                      <IconButton
                        color="error"
                        aria-label="Remove passport photo"
                        onClick={handleRemovePhoto}
                        disabled={loading}
                      >
                        <DeleteOutlineIcon />
                      </IconButton>
                    )}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>

      {/* =============================================
          NAVIGATION
      ============================================== */}

      <Box
        mt={4}
        pt={2.5}
        sx={{
          borderTop: "1px solid",

          borderColor: "divider",

          display: "flex",

          justifyContent: showBackButton ? "space-between" : "flex-end",

          alignItems: "center",

          gap: 2,
        }}
      >
        {showBackButton && (
          <Button variant="outlined" onClick={onBack} disabled={loading}>
            Back
          </Button>
        )}

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || categoriesLoading}
          sx={{
            minWidth: 110,
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
