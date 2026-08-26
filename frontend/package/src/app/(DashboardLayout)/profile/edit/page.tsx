"use client";

import {
  ChangeEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  IconArrowLeft,
  IconCamera,
  IconTrash,
  IconDeviceFloppy,
  IconKey,
  IconUser,
  IconMail,
  IconAt,
  IconShieldCheck,
  IconInfoCircle,
} from "@tabler/icons-react";

import api from "@/services/api";

interface ProfileUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  profile_photo: string | null;
  is_staff: boolean;
  is_superuser: boolean;
}

interface ProfileForm {
  first_name: string;
  last_name: string;
  email: string;
}

interface FormErrors {
  first_name?: string;
  last_name?: string;
  email?: string;
  profile_photo?: string;
}

const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

export default function EditProfilePage() {
  const router = useRouter();
  const { status: sessionStatus, update: updateSession } = useSession();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [user, setUser] = useState<ProfileUser | null>(null);
  const [form, setForm] = useState<ProfileForm>({
    first_name: "",
    last_name: "",
    email: "",
  });

  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [success, setSuccess] = useState(false);

  const getPhotoUrl = useCallback((photo?: string | null) => {
    if (!photo) return null;
    if (
      photo.startsWith("http://") ||
      photo.startsWith("https://") ||
      photo.startsWith("blob:")
    ) {
      return photo;
    }
    return `http://127.0.0.1:8000${photo}`;
  }, []);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get<ProfileUser>("/auth/me/");
      const profile = response.data;

      setUser(profile);
      setForm({
        first_name: profile.first_name ?? "",
        last_name: profile.last_name ?? "",
        email: profile.email ?? "",
      });

      setSelectedPhoto(null);
      setRemovePhoto(false);
      setPhotoPreview(getPhotoUrl(profile.profile_photo));
    } catch (err) {
      console.error("Failed to load profile:", err);
      setError("Unable to load your profile information.");
    } finally {
      setLoading(false);
    }
  }, [getPhotoUrl]);

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      loadProfile();
    } else if (sessionStatus === "unauthenticated") {
      setLoading(false);
    }
  }, [sessionStatus, loadProfile]);

  useEffect(() => {
    return () => {
      if (photoPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
    setErrors((previous) => ({
      ...previous,
      [name]: undefined,
    }));
  }

  function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrors((previous) => ({
      ...previous,
      profile_photo: undefined,
    }));
    setError("");

    if (!file.type.startsWith("image/")) {
      setErrors((previous) => ({
        ...previous,
        profile_photo: "Please select a valid image file (PNG, JPG, WEBP).",
      }));
      e.target.value = "";
      return;
    }

    if (file.size > MAX_PHOTO_SIZE) {
      setErrors((previous) => ({
        ...previous,
        profile_photo: "Profile photo must not exceed 5 MB.",
      }));
      e.target.value = "";
      return;
    }

    if (photoPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(photoPreview);
    }

    const previewUrl = URL.createObjectURL(file);
    setSelectedPhoto(file);
    setPhotoPreview(previewUrl);
    setRemovePhoto(false);
    e.target.value = "";
  }

  function handleRemovePhoto() {
    if (photoPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(photoPreview);
    }

    setSelectedPhoto(null);
    setPhotoPreview(null);
    setRemovePhoto(true);
    setErrors((previous) => ({
      ...previous,
      profile_photo: undefined,
    }));

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function validateForm() {
    const nextErrors: FormErrors = {};

    if (!form.first_name.trim()) {
      nextErrors.first_name = "First name is required.";
    }

    if (!form.last_name.trim()) {
      nextErrors.last_name = "Last name is required.";
    }

    if (!form.email.trim()) {
      nextErrors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit() {
    if (saving) return;
    if (!validateForm()) return;

    setSaving(true);
    setError("");

    try {
      const payload = new FormData();
      payload.append("first_name", form.first_name.trim());
      payload.append("last_name", form.last_name.trim());
      payload.append("email", form.email.trim());

      if (selectedPhoto) {
        payload.append("profile_photo", selectedPhoto, selectedPhoto.name);
      }

      if (removePhoto) {
        payload.append("remove_profile_photo", "true");
      }

      const response = await api.patch<ProfileUser>("/auth/me/", payload);
      const updatedUser = response.data;

      setUser(updatedUser);
      setForm({
        first_name: updatedUser.first_name ?? "",
        last_name: updatedUser.last_name ?? "",
        email: updatedUser.email ?? "",
      });

      setSelectedPhoto(null);
      setRemovePhoto(false);
      setPhotoPreview(getPhotoUrl(updatedUser.profile_photo));

      try {
        await updateSession();
      } catch (sessionError) {
        console.warn("Profile saved, session refresh failed:", sessionError);
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/profile");
        router.refresh();
      }, 1000);
    } catch (err: any) {
      console.error("Failed to update profile:", err);
      const data = err?.response?.data;

      if (data && typeof data === "object") {
        const backendErrors: FormErrors = {};
        if (data.first_name) {
          backendErrors.first_name = Array.isArray(data.first_name) ? data.first_name[0] : String(data.first_name);
        }
        if (data.last_name) {
          backendErrors.last_name = Array.isArray(data.last_name) ? data.last_name[0] : String(data.last_name);
        }
        if (data.email) {
          backendErrors.email = Array.isArray(data.email) ? data.email[0] : String(data.email);
        }
        if (data.profile_photo) {
          backendErrors.profile_photo = Array.isArray(data.profile_photo) ? data.profile_photo[0] : String(data.profile_photo);
        }

        setErrors(backendErrors);
        setError(data.detail ?? "Some profile information could not be saved. Check the fields below.");
      } else {
        setError("Unable to update your profile. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  const fullName = [form.first_name, form.last_name].filter(Boolean).join(" ").trim();
  const displayName = fullName || user?.username || "SACCO Officer";

  const fallbackInitial =
    form.first_name.charAt(0).toUpperCase() ||
    user?.username?.charAt(0).toUpperCase() ||
    "U";

  if (sessionStatus === "loading" || loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
        gap={2}
      >
        <CircularProgress color="success" size={48} thickness={4} />
        <Typography variant="body2" color="text.secondary" fontWeight={600}>
          Loading profile form...
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 1, mb: 6 }}>
      {/* ------------------------------------------------------------- */}
      {/* Header Banner */}
      {/* ------------------------------------------------------------- */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3.5 },
          mb: 4,
          borderRadius: 3.5,
          background: "linear-gradient(135deg, #064e3b 0%, #047857 60%, #059669 100%)",
          color: "#ffffff",
          boxShadow: "0 10px 28px rgba(6, 78, 59, 0.22)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <IconButton
            onClick={() => router.push("/profile")}
            aria-label="Back to profile"
            sx={{
              bgcolor: "rgba(255, 255, 255, 0.15)",
              color: "#ffffff",
              borderRadius: 2.5,
              "&:hover": { bgcolor: "rgba(255, 255, 255, 0.25)" },
            }}
          >
            <IconArrowLeft size={22} />
          </IconButton>

          <Box>
            <Typography variant="h5" fontWeight={900} sx={{ color: "#ffffff", letterSpacing: "-0.4px" }}>
              Edit Account Profile
            </Typography>
            <Typography variant="caption" sx={{ color: "#d1fae5", fontWeight: 600 }}>
              Update your personal identification, email coordinates, and system avatar
            </Typography>
          </Box>
        </Stack>

        <Chip
          label="Profile Settings"
          size="small"
          sx={{
            bgcolor: "rgba(255, 255, 255, 0.2)",
            color: "#ffffff",
            fontWeight: 800,
            borderRadius: 2,
          }}
        />
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2.5, fontWeight: 700 }}>
          {error}
        </Alert>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2-Column Edit Layout */}
      {/* ------------------------------------------------------------- */}
      <Grid container spacing={3}>
        {/* LEFT: Avatar Upload Card */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3.5,
              borderRadius: 3,
              border: "1px solid #e2e8f0",
              bgcolor: "#ffffff",
              boxShadow: "0 4px 16px rgba(15, 23, 42, 0.04)",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <Typography variant="subtitle1" fontWeight={800} color="#0f172a" sx={{ width: "100%", textAlign: "left", mb: 0.5 }}>
              Profile Photo
            </Typography>
            <Typography variant="caption" color="#64748b" sx={{ width: "100%", textAlign: "left", mb: 3 }}>
              This portrait identifies your account in audit logs and system dialogues.
            </Typography>

            {/* Avatar Preview */}
            <Box sx={{ position: "relative", my: 2 }}>
              <Avatar
                src={photoPreview ?? undefined}
                alt={displayName}
                sx={{
                  width: 150,
                  height: 150,
                  fontSize: 52,
                  fontWeight: 900,
                  bgcolor: "#064e3b",
                  color: "#a7f3d0",
                  border: "5px solid #ecfdf5",
                  boxShadow: "0 8px 24px rgba(6, 78, 59, 0.2)",
                }}
              >
                {!photoPreview && fallbackInitial}
              </Avatar>

              <Tooltip title="Select New Image">
                <IconButton
                  component="label"
                  aria-label="Upload profile photo"
                  sx={{
                    position: "absolute",
                    right: 4,
                    bottom: 4,
                    bgcolor: "#059669",
                    color: "#ffffff",
                    boxShadow: "0 4px 12px rgba(5, 150, 105, 0.4)",
                    "&:hover": { bgcolor: "#047857" },
                  }}
                >
                  <IconCamera size={20} />
                  <input
                    ref={fileInputRef}
                    hidden
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                  />
                </IconButton>
              </Tooltip>
            </Box>

            <Typography variant="subtitle2" fontWeight={800} color="#0f172a" sx={{ mt: 1 }}>
              {displayName}
            </Typography>
            <Typography variant="caption" color="#64748b" sx={{ fontFamily: "monospace", mb: 3 }}>
              @{user?.username || "—"}
            </Typography>

            <Stack direction="row" spacing={1.5} sx={{ width: "100%", mb: 2 }}>
              <Button
                component="label"
                variant="outlined"
                fullWidth
                startIcon={<IconCamera size={18} />}
                sx={{
                  fontWeight: 800,
                  borderRadius: 2,
                  borderColor: "#059669",
                  color: "#059669",
                  "&:hover": { borderColor: "#047857", bgcolor: "#ecfdf5" },
                }}
              >
                {photoPreview ? "Replace" : "Upload Photo"}
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                />
              </Button>

              {photoPreview && (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<IconTrash size={18} />}
                  onClick={handleRemovePhoto}
                  sx={{
                    fontWeight: 800,
                    borderRadius: 2,
                    borderColor: "#fca5a5",
                    "&:hover": { bgcolor: "#fef2f2" },
                  }}
                >
                  Remove
                </Button>
              )}
            </Stack>

            <Typography variant="caption" color="#94a3b8">
              Supported: JPG, PNG, WEBP. Max size: 5 MB.
            </Typography>

            {errors.profile_photo && (
              <Alert severity="error" sx={{ width: "100%", mt: 2, borderRadius: 2, fontSize: "0.8rem" }}>
                {errors.profile_photo}
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* RIGHT: Personal Details Form */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 4 },
              borderRadius: 3,
              border: "1px solid #e2e8f0",
              bgcolor: "#ffffff",
              boxShadow: "0 4px 16px rgba(15, 23, 42, 0.04)",
            }}
          >
            <Typography variant="h6" fontWeight={800} color="#0f172a">
              Personal Information
            </Typography>
            <Typography variant="caption" color="#64748b" fontWeight={600}>
              Configure account details associated with your operational SACCO identity
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  required
                  label="First Name"
                  name="first_name"
                  value={form.first_name}
                  onChange={handleChange}
                  error={!!errors.first_name}
                  helperText={errors.first_name}
                  disabled={saving}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <IconUser size={18} color="#64748b" />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2.5,
                      bgcolor: "#f8fafc",
                      "&:hover fieldset": { borderColor: "#059669" },
                      "&.Mui-focused fieldset": { borderColor: "#059669" },
                    },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  required
                  label="Last Name"
                  name="last_name"
                  value={form.last_name}
                  onChange={handleChange}
                  error={!!errors.last_name}
                  helperText={errors.last_name}
                  disabled={saving}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <IconUser size={18} color="#64748b" />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2.5,
                      bgcolor: "#f8fafc",
                      "&:hover fieldset": { borderColor: "#059669" },
                      "&.Mui-focused fieldset": { borderColor: "#059669" },
                    },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Username"
                  value={user?.username ?? ""}
                  disabled
                  helperText="Username is system-managed and cannot be altered."
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <IconAt size={18} color="#94a3b8" />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2.5,
                      bgcolor: "#f1f5f9",
                    },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  required
                  type="email"
                  label="Email Address"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  error={!!errors.email}
                  helperText={errors.email}
                  disabled={saving}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <IconMail size={18} color="#64748b" />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2.5,
                      bgcolor: "#f8fafc",
                      "&:hover fieldset": { borderColor: "#059669" },
                      "&.Mui-focused fieldset": { borderColor: "#059669" },
                    },
                  }}
                />
              </Grid>
            </Grid>

            {/* Password Change Shortcut Banner */}
            <Box
              sx={{
                mt: 4,
                p: 2.5,
                borderRadius: 2.5,
                bgcolor: "#f0fdf4",
                border: "1px solid #bbf7d0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 2,
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    bgcolor: "#d1fae5",
                    color: "#065f46",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconKey size={20} />
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight={800} color="#065f46">
                    Account Security &amp; Password
                  </Typography>
                  <Typography variant="caption" color="#047857" fontWeight={600}>
                    Change your password from the dedicated secure credential interface
                  </Typography>
                </Box>
              </Stack>

              <Button
                component={Link}
                href="/profile/change-password"
                variant="outlined"
                startIcon={<IconKey size={16} />}
                sx={{
                  borderColor: "#059669",
                  color: "#065f46",
                  bgcolor: "#ffffff",
                  fontWeight: 800,
                  borderRadius: 2,
                  px: 2,
                  "&:hover": { borderColor: "#047857", bgcolor: "#ecfdf5" },
                }}
              >
                Change Password
              </Button>
            </Box>

            <Divider sx={{ my: 4 }} />

            {/* Bottom Actions */}
            <Stack
              direction={{ xs: "column-reverse", sm: "row" }}
              justifyContent="space-between"
              alignItems="center"
              spacing={2}
            >
              <Button
                variant="outlined"
                disabled={saving}
                onClick={() => router.push("/profile")}
                sx={{
                  fontWeight: 800,
                  borderRadius: 2,
                  px: 3,
                  borderColor: "#cbd5e1",
                  color: "#475569",
                }}
              >
                Cancel
              </Button>

              <Button
                variant="contained"
                disabled={saving}
                onClick={handleSubmit}
                startIcon={saving ? undefined : <IconDeviceFloppy size={18} />}
                sx={{
                  bgcolor: "#059669",
                  color: "#ffffff",
                  fontWeight: 800,
                  borderRadius: 2,
                  px: 4,
                  py: 1.1,
                  boxShadow: "0 4px 14px rgba(5, 150, 105, 0.35)",
                  "&:hover": { bgcolor: "#047857" },
                  minWidth: 160,
                }}
              >
                {saving ? (
                  <CircularProgress size={22} color="inherit" />
                ) : (
                  "Save Changes"
                )}
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Success Notification */}
      <Snackbar
        open={success}
        autoHideDuration={2500}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        onClose={() => setSuccess(false)}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => setSuccess(false)}
          sx={{ borderRadius: 2, fontWeight: 700 }}
        >
          Profile updated successfully! Redirecting...
        </Alert>
      </Snackbar>
    </Container>
  );
}