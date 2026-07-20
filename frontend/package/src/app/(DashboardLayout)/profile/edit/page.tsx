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

import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  Grid,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import LockResetIcon from "@mui/icons-material/LockReset";
import PhotoCameraOutlinedIcon from "@mui/icons-material/PhotoCameraOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";

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

  const {
    status: sessionStatus,
    update: updateSession,
  } = useSession();

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  const [user, setUser] =
    useState<ProfileUser | null>(null);

  const [form, setForm] =
    useState<ProfileForm>({
      first_name: "",
      last_name: "",
      email: "",
    });

  const [selectedPhoto, setSelectedPhoto] =
    useState<File | null>(null);

  const [photoPreview, setPhotoPreview] =
    useState<string | null>(null);

  const [removePhoto, setRemovePhoto] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [errors, setErrors] =
    useState<FormErrors>({});

  const [success, setSuccess] =
    useState(false);

  const getPhotoUrl = useCallback(
    (photo?: string | null) => {
      if (!photo) {
        return null;
      }

      if (
        photo.startsWith("http://") ||
        photo.startsWith("https://") ||
        photo.startsWith("blob:")
      ) {
        return photo;
      }

      return `http://127.0.0.1:8000${photo}`;
    },
    []
  );

  const loadProfile = useCallback(
    async () => {
      setLoading(true);
      setError("");

      try {
        const response =
          await api.get<ProfileUser>(
            "/auth/me/"
          );

        const profile = response.data;

        setUser(profile);

        setForm({
          first_name:
            profile.first_name ?? "",
          last_name:
            profile.last_name ?? "",
          email:
            profile.email ?? "",
        });

        setSelectedPhoto(null);
        setRemovePhoto(false);

        setPhotoPreview(
          getPhotoUrl(
            profile.profile_photo
          )
        );
      } catch (err) {
        console.error(
          "Failed to load profile:",
          err
        );

        setError(
          "Unable to load your profile information."
        );
      } finally {
        setLoading(false);
      }
    },
    [getPhotoUrl]
  );

  useEffect(() => {
    if (
      sessionStatus ===
      "authenticated"
    ) {
      loadProfile();
    }

    if (
      sessionStatus ===
      "unauthenticated"
    ) {
      setLoading(false);
    }
  }, [
    sessionStatus,
    loadProfile,
  ]);

  useEffect(() => {
    return () => {
      if (
        photoPreview?.startsWith(
          "blob:"
        )
      ) {
        URL.revokeObjectURL(
          photoPreview
        );
      }
    };
  }, [photoPreview]);

  function handleChange(
    e: ChangeEvent<HTMLInputElement>
  ) {
    const {
      name,
      value,
    } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: undefined,
    }));
  }

  function handlePhotoChange(
    e: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      e.target.files?.[0];

    if (!file) {
      return;
    }

    setErrors((previous) => ({
      ...previous,
      profile_photo: undefined,
    }));

    setError("");

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      setErrors((previous) => ({
        ...previous,
        profile_photo:
          "Please select a valid image file.",
      }));

      e.target.value = "";

      return;
    }

    if (
      file.size >
      MAX_PHOTO_SIZE
    ) {
      setErrors((previous) => ({
        ...previous,
        profile_photo:
          "Profile photo must not exceed 5 MB.",
      }));

      e.target.value = "";

      return;
    }

    if (
      photoPreview?.startsWith(
        "blob:"
      )
    ) {
      URL.revokeObjectURL(
        photoPreview
      );
    }

    const previewUrl =
      URL.createObjectURL(file);

    setSelectedPhoto(file);
    setPhotoPreview(previewUrl);
    setRemovePhoto(false);

    e.target.value = "";
  }

  function handleRemovePhoto() {
    if (
      photoPreview?.startsWith(
        "blob:"
      )
    ) {
      URL.revokeObjectURL(
        photoPreview
      );
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
    const nextErrors: FormErrors =
      {};

    if (!form.first_name.trim()) {
      nextErrors.first_name =
        "First name is required.";
    }

    if (!form.last_name.trim()) {
      nextErrors.last_name =
        "Last name is required.";
    }

    if (!form.email.trim()) {
      nextErrors.email =
        "Email address is required.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.email.trim()
      )
    ) {
      nextErrors.email =
        "Enter a valid email address.";
    }

    setErrors(nextErrors);

    return (
      Object.keys(nextErrors)
        .length === 0
    );
  }

  async function handleSubmit() {
    if (saving) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload =
        new FormData();

      payload.append(
        "first_name",
        form.first_name.trim()
      );

      payload.append(
        "last_name",
        form.last_name.trim()
      );

      payload.append(
        "email",
        form.email.trim()
      );

      if (selectedPhoto) {
        payload.append(
          "profile_photo",
          selectedPhoto,
          selectedPhoto.name
        );
      }

      /*
       * This flag requires the backend
       * CurrentUserView PATCH handler to
       * support profile-photo deletion.
       */
      if (removePhoto) {
        payload.append(
          "remove_profile_photo",
          "true"
        );
      }

      const response =
        await api.patch<ProfileUser>(
          "/auth/me/",
          payload
        );

      const updatedUser =
        response.data;

      setUser(updatedUser);

      setForm({
        first_name:
          updatedUser.first_name ??
          "",
        last_name:
          updatedUser.last_name ??
          "",
        email:
          updatedUser.email ?? "",
      });

      setSelectedPhoto(null);
      setRemovePhoto(false);

      setPhotoPreview(
        getPhotoUrl(
          updatedUser.profile_photo
        )
      );

      /*
       * Ask NextAuth to refresh/update
       * session-dependent components.
       * The header avatar will be wired
       * fully in the next step.
       */
      try {
        await updateSession();
      } catch (sessionError) {
        console.warn(
          "Profile saved, but session refresh failed:",
          sessionError
        );
      }

      setSuccess(true);

      setTimeout(() => {
        router.push("/profile");
        router.refresh();
      }, 1000);
    } catch (err: any) {
      console.error(
        "Failed to update profile:",
        err
      );

      const data =
        err?.response?.data;

      if (
        data &&
        typeof data === "object"
      ) {
        const backendErrors: FormErrors =
          {};

        if (data.first_name) {
          backendErrors.first_name =
            Array.isArray(
              data.first_name
            )
              ? data.first_name[0]
              : String(
                  data.first_name
                );
        }

        if (data.last_name) {
          backendErrors.last_name =
            Array.isArray(
              data.last_name
            )
              ? data.last_name[0]
              : String(
                  data.last_name
                );
        }

        if (data.email) {
          backendErrors.email =
            Array.isArray(data.email)
              ? data.email[0]
              : String(data.email);
        }

        if (data.profile_photo) {
          backendErrors.profile_photo =
            Array.isArray(
              data.profile_photo
            )
              ? data
                  .profile_photo[0]
              : String(
                  data.profile_photo
                );
        }

        setErrors(
          backendErrors
        );

        setError(
          data.detail ??
            "Some profile information could not be saved. Check the fields below."
        );
      } else {
        setError(
          "Unable to update your profile. Please try again."
        );
      }
    } finally {
      setSaving(false);
    }
  }

  const fullName = [
    form.first_name,
    form.last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  const displayName =
    fullName ||
    user?.username ||
    "User";

  const fallbackInitial =
    form.first_name
      .charAt(0)
      .toUpperCase() ||
    user?.username
      ?.charAt(0)
      .toUpperCase() ||
    "U";

  if (
    sessionStatus === "loading" ||
    loading
  ) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        mb={1}
      >
        <IconButton
          onClick={() =>
            router.push("/profile")
          }
          aria-label="Back to profile"
        >
          <ArrowBackIcon />
        </IconButton>

        <Typography
          variant="h4"
          fontWeight={700}
        >
          Edit Profile
        </Typography>
      </Stack>

      <Typography
        variant="body1"
        color="text.secondary"
        mb={4}
        sx={{ ml: { sm: 7 } }}
      >
        Update your personal
        information and profile photo.
      </Typography>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
        >
          {error}
        </Alert>
      )}

      <Grid
        container
        spacing={3}
      >
        {/* Profile photo */}
        <Grid
          size={{
            xs: 12,
            md: 4,
          }}
        >
          <Card
            sx={{
              height: "100%",
            }}
          >
            <CardContent>
              <Typography
                variant="h6"
                fontWeight={700}
                mb={0.5}
              >
                Profile Photo
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                mb={3}
              >
                This photo will identify
                your account throughout
                the system.
              </Typography>

              <Stack
                spacing={2}
                alignItems="center"
              >
                <Box
                  sx={{
                    position:
                      "relative",
                  }}
                >
                  <Avatar
                    src={
                      photoPreview ??
                      undefined
                    }
                    alt={displayName}
                    sx={{
                      width: 160,
                      height: 160,
                      fontSize: 52,
                      fontWeight: 700,
                      bgcolor:
                        "primary.main",
                      border: "4px solid",
                      borderColor:
                        "background.paper",
                      boxShadow: 3,
                    }}
                  >
                    {!photoPreview &&
                      fallbackInitial}
                  </Avatar>

                  <Tooltip title="Choose photo">
                    <IconButton
                      component="label"
                      aria-label="Choose profile photo"
                      sx={{
                        position:
                          "absolute",
                        right: 2,
                        bottom: 2,
                        bgcolor:
                          "background.paper",
                        boxShadow: 2,

                        "&:hover": {
                          bgcolor:
                            "background.paper",
                        },
                      }}
                    >
                      <PhotoCameraOutlinedIcon />

                      <input
                        ref={
                          fileInputRef
                        }
                        hidden
                        type="file"
                        accept="image/*"
                        onChange={
                          handlePhotoChange
                        }
                      />
                    </IconButton>
                  </Tooltip>
                </Box>

                <Box
                  textAlign="center"
                >
                  <Typography
                    fontWeight={600}
                  >
                    {displayName}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    {user?.username
                      ? `@${user.username}`
                      : ""}
                  </Typography>
                </Box>

                <Stack
                  direction={{
                    xs: "column",
                    sm: "row",
                    md: "column",
                    lg: "row",
                  }}
                  spacing={1}
                  width="100%"
                  justifyContent="center"
                >
                  <Button
                    component="label"
                    variant={
                      photoPreview
                        ? "outlined"
                        : "contained"
                    }
                    startIcon={
                      <PhotoCameraOutlinedIcon />
                    }
                  >
                    {photoPreview
                      ? "Replace Photo"
                      : "Upload Photo"}

                    <input
                      hidden
                      type="file"
                      accept="image/*"
                      onChange={
                        handlePhotoChange
                      }
                    />
                  </Button>

                  {photoPreview && (
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={
                        <DeleteOutlineIcon />
                      }
                      onClick={
                        handleRemovePhoto
                      }
                    >
                      Remove
                    </Button>
                  )}
                </Stack>

                <Typography
                  variant="caption"
                  color="text.secondary"
                  textAlign="center"
                >
                  JPG, PNG, WEBP or other
                  supported image format.
                  Maximum size: 5 MB.
                </Typography>

                {errors.profile_photo && (
                  <Alert
                    severity="error"
                    sx={{
                      width: "100%",
                    }}
                  >
                    {
                      errors.profile_photo
                    }
                  </Alert>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Account details */}
        <Grid
          size={{
            xs: 12,
            md: 8,
          }}
        >
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                fontWeight={700}
              >
                Personal Information
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                mt={0.5}
              >
                Manage the information
                associated with your
                account.
              </Typography>

              <Divider
                sx={{ my: 3 }}
              />

              <Grid
                container
                spacing={3}
              >
                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                  }}
                >
                  <TextField
                    fullWidth
                    required
                    label="First Name"
                    name="first_name"
                    value={
                      form.first_name
                    }
                    onChange={
                      handleChange
                    }
                    error={
                      !!errors.first_name
                    }
                    helperText={
                      errors.first_name
                    }
                    disabled={saving}
                  />
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                  }}
                >
                  <TextField
                    fullWidth
                    required
                    label="Last Name"
                    name="last_name"
                    value={
                      form.last_name
                    }
                    onChange={
                      handleChange
                    }
                    error={
                      !!errors.last_name
                    }
                    helperText={
                      errors.last_name
                    }
                    disabled={saving}
                  />
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                  }}
                >
                  <TextField
                    fullWidth
                    label="Username"
                    value={
                      user?.username ??
                      ""
                    }
                    disabled
                    helperText="Username cannot be changed here."
                  />
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                  }}
                >
                  <TextField
                    fullWidth
                    required
                    type="email"
                    label="Email Address"
                    name="email"
                    value={form.email}
                    onChange={
                      handleChange
                    }
                    error={
                      !!errors.email
                    }
                    helperText={
                      errors.email
                    }
                    disabled={saving}
                  />
                </Grid>
              </Grid>

              <Paper
                variant="outlined"
                sx={{
                  mt: 4,
                  p: 2.5,
                  display: "flex",
                  flexDirection: {
                    xs: "column",
                    sm: "row",
                  },
                  alignItems: {
                    xs: "stretch",
                    sm: "center",
                  },
                  justifyContent:
                    "space-between",
                  gap: 2,
                }}
              >
                <Box>
                  <Typography
                    fontWeight={600}
                  >
                    Account Password
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Change your password
                    from the dedicated
                    secure password page.
                  </Typography>
                </Box>

                <Button
                  variant="outlined"
                  startIcon={
                    <LockResetIcon />
                  }
                  onClick={() =>
                    router.push(
                      "/profile/change-password"
                    )
                  }
                >
                  Change Password
                </Button>
              </Paper>

              <Divider
                sx={{ my: 4 }}
              />

              <Stack
                direction={{
                  xs: "column-reverse",
                  sm: "row",
                }}
                justifyContent="space-between"
                spacing={2}
              >
                <Button
                  variant="outlined"
                  disabled={saving}
                  onClick={() =>
                    router.push(
                      "/profile"
                    )
                  }
                >
                  Cancel
                </Button>

                <Button
                  variant="contained"
                  startIcon={
                    saving ? undefined : (
                      <SaveOutlinedIcon />
                    )
                  }
                  disabled={saving}
                  onClick={
                    handleSubmit
                  }
                  sx={{
                    minWidth: 160,
                  }}
                >
                  {saving ? (
                    <CircularProgress
                      size={22}
                      color="inherit"
                    />
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar
        open={success}
        autoHideDuration={2500}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        onClose={() =>
          setSuccess(false)
        }
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() =>
            setSuccess(false)
          }
        >
          Profile updated successfully.
        </Alert>
      </Snackbar>
    </Container>
  );
}