"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  TextField,
  Typography,
  Alert,
  Snackbar,
  CircularProgress,
  MenuItem,
  InputAdornment,
  IconButton,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";

import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import api from "@/services/api";

type SnackbarSeverity = "success" | "error" | "warning" | "info";

export default function CreateAdminUserPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: SnackbarSeverity;
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  const [formData, setFormData] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirm_password: "",
    role_id: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (formError) {
      setFormError("");
    }
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      setFormError("Username is required.");
      return false;
    }

    if (!formData.email.trim()) {
      setFormError("Email is required.");
      return false;
    }

    if (!formData.password) {
      setFormError("Password is required.");
      return false;
    }

    if (!formData.confirm_password) {
      setFormError("Please confirm the password.");
      return false;
    }

    if (formData.password !== formData.confirm_password) {
      setFormError("Passwords do not match.");
      return false;
    }

    if (!formData.role_id) {
      setFormError("Please select a Role for this user.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (loading || !validateForm()) {
      return;
    }

    setLoading(true);
    setFormError("");

    try {
      /*
       * FIRST:
       * Try to create the user and assign them to the organization.
       */
      try {
        await api.post("/users/", {
          username: formData.username.trim(),
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          confirm_password: formData.confirm_password,
          role_id: Number(formData.role_id),
        });

        setSnackbar({
          open: true,
          message: "New user created and added to organization successfully!",
          severity: "success",
        });
      } catch (error: any) {
        /*
         * If Django returns 400, check whether the username
         * already exists.
         */
        if (error.response?.status === 400) {
          const responseData = error.response?.data;

          const usernameError = responseData?.username?.[0] ?? "";

          /*
           * EXISTING USER:
           * If the username already exists, assign the
           * existing user to the organization instead.
           */
          if (
            typeof usernameError === "string" &&
            usernameError.toLowerCase().includes("already exists")
          ) {
            await api.post("/organization-users/", {
              username: formData.username.trim(),
              role_id: Number(formData.role_id),
            });

            setSnackbar({
              open: true,
              message: `Existing user "${formData.username}" has been successfully assigned to the organization!`,
              severity: "success",
            });
          } else {
            /*
             * This was a different 400 error, so let the
             * outer catch block handle it.
             */
            throw error;
          }
        } else {
          /*
           * Handle other HTTP errors such as 403, 404, 500, etc.
           */
          throw error;
        }
      }

      /*
       * SUCCESS:
       * Give the success message time to display before
       * returning to the users page.
       */
      setTimeout(() => {
        router.push("/administration/users");
        router.refresh();
      }, 1500);
    } catch (error: any) {
      console.error("Failed to create/assign user:", error);

      let errorMessage = "Failed to add user.";

      const responseData = error.response?.data;

      if (responseData) {
        /*
         * Django validation errors normally look like:
         *
         * {
         *   username: ["This username already exists."]
         * }
         */
        if (typeof responseData === "string") {
          errorMessage = responseData;
        } else if (responseData.detail) {
          errorMessage = responseData.detail;
        } else {
          const firstErrorKey = Object.keys(responseData)[0];

          if (
            firstErrorKey &&
            Array.isArray(responseData[firstErrorKey]) &&
            responseData[firstErrorKey].length > 0
          ) {
            errorMessage = `${firstErrorKey.replace(
              /_/g,
              " ",
            )}: ${responseData[firstErrorKey][0]}`;
          } else if (firstErrorKey && responseData[firstErrorKey]) {
            errorMessage = `${firstErrorKey.replace(
              /_/g,
              " ",
            )}: ${String(responseData[firstErrorKey])}`;
          }
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      setFormError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer
      title="Add New User"
      description="Admin adds a new user to the existing organization."
    >
      <Box>
        {/* Back Button */}
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push("/administration/users")}
          sx={{ mb: 2 }}
          disabled={loading}
        >
          Back to Users
        </Button>

        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            {/* Page Header */}
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              sx={{ mb: 3 }}
            >
              <PersonAddIcon color="primary" />

              <Typography variant="h5" fontWeight={700}>
                Add New User to Organization
              </Typography>
            </Stack>

            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                {/* Form Error */}
                {formError && <Alert severity="error">{formError}</Alert>}

                <Grid container spacing={3}>
                  {/* Username */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      required
                      label="Username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </Grid>

                  {/* Email */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      required
                      label="Email Address"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </Grid>

                  {/* First Name */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="First Name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </Grid>

                  {/* Last Name */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Last Name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </Grid>

                  {/* Role */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      select
                      fullWidth
                      required
                      label="Assign Role"
                      name="role_id"
                      value={formData.role_id}
                      onChange={handleChange}
                      disabled={loading}
                    >
                      <MenuItem value="">
                        <em>Select a role</em>
                      </MenuItem>

                      <MenuItem value={1}>
                        Owner - Member Registration System
                      </MenuItem>

                      <MenuItem value={2}>
                        Member Officer - Member Registration System
                      </MenuItem>
                    </TextField>
                  </Grid>

                  {/* Password */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      required
                      label="Password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleChange}
                      disabled={loading}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              type="button"
                              edge="end"
                              onClick={() => setShowPassword((prev) => !prev)}
                              disabled={loading}
                              aria-label={
                                showPassword ? "Hide password" : "Show password"
                              }
                            >
                              {showPassword ? (
                                <VisibilityOffOutlinedIcon />
                              ) : (
                                <VisibilityOutlinedIcon />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  {/* Confirm Password */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      required
                      label="Confirm Password"
                      name="confirm_password"
                      type={showPassword ? "text" : "password"}
                      value={formData.confirm_password}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </Grid>
                </Grid>

                {/* Submit */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "flex-end",
                    mt: 2,
                  }}
                >
                  <Button
                    variant="contained"
                    type="submit"
                    size="large"
                    disabled={loading}
                    startIcon={
                      loading ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : null
                    }
                  >
                    {loading ? "Adding User..." : "Add User to Organization"}
                  </Button>
                </Box>
              </Stack>
            </form>
          </CardContent>
        </Card>
      </Box>

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() =>
          setSnackbar((prev) => ({
            ...prev,
            open: false,
          }))
        }
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() =>
            setSnackbar((prev) => ({
              ...prev,
              open: false,
            }))
          }
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </PageContainer>
  );
}
