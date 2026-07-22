"use client";

import { useEffect, useRef, useState } from "react";

import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import BusinessIcon from "@mui/icons-material/Business";
import CorporateFareIcon from "@mui/icons-material/CorporateFare";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EmailIcon from "@mui/icons-material/Email";
import ImageIcon from "@mui/icons-material/Image";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import SaveIcon from "@mui/icons-material/Save";

import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import { Organization } from "@/interfaces/organization";
import organizationService from "@/services/organization.service";

type SnackbarSeverity = "success" | "error" | "warning" | "info";

export default function OrganizationSettingsPage() {
  const [organization, setOrganization] = useState<Organization | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [removingLogo, setRemovingLogo] = useState(false);

  const [error, setError] = useState("");

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: SnackbarSeverity;
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void loadOrganization();
  }, []);

  async function loadOrganization() {
    try {
      setLoading(true);
      setError("");

      const data = await organizationService.get();

      setOrganization(data);
    } catch (err) {
      console.error("Failed to load organization:", err);

      setOrganization(null);

      setError("Unable to load organization settings. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const handleChange =
    (field: keyof Organization) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;

      setOrganization((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          [field]: value,
        };
      });
    };

  function validateForm(): string | null {
    if (!organization) {
      return "Organization data is not available.";
    }

    if (!organization.name.trim()) {
      return "Organization name is required.";
    }

    if (!organization.code.trim()) {
      return "Organization code is required.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(organization.email)) {
      return "Enter a valid email address.";
    }

    if (!organization.phone_number.trim()) {
      return "Phone number is required.";
    }

    const phoneRegex = /^[+0-9()\-\s]{7,20}$/;

    if (!phoneRegex.test(organization.phone_number)) {
      return "Enter a valid phone number.";
    }

    if (!organization.physical_address.trim()) {
      return "Physical address is required.";
    }

    if (organization.website.trim()) {
      try {
        new URL(organization.website);
      } catch {
        return "Enter a valid website URL.";
      }
    }

    return null;
  }

  async function handleSave() {
    if (!organization) {
      return;
    }

    const validationError = validateForm();

    if (validationError) {
      setSnackbar({
        open: true,
        message: validationError,
        severity: "error",
      });

      return;
    }

    try {
      setSaving(true);

      const updated = await organizationService.update({
        name: organization.name.trim(),
        code: organization.code.trim().toUpperCase(),
        email: organization.email.trim().toLowerCase(),
        phone_number: organization.phone_number.trim(),
        physical_address: organization.physical_address.trim(),
        website: organization.website.trim(),
      });

      setOrganization(updated);

      setSnackbar({
        open: true,
        message: organization.id
          ? "Organization updated successfully."
          : "Organization configured successfully.",
        severity: "success",
      });
    } catch (err) {
      console.error("Failed to save organization:", err);

      setSnackbar({
        open: true,
        message:
          "Unable to save organization. Please review the information and try again.",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file || !organization) {
      return;
    }

    if (!organization.id) {
      setSnackbar({
        open: true,
        severity: "warning",
        message: "Save your organization profile before uploading a logo.",
      });

      return;
    }

    const allowedTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"];

    if (!allowedTypes.includes(file.type)) {
      setSnackbar({
        open: true,
        severity: "error",
        message: "Only PNG, JPG, WEBP and GIF images are allowed.",
      });

      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setSnackbar({
        open: true,
        severity: "error",
        message: "Logo must be smaller than 2MB.",
      });

      return;
    }

    try {
      setUploadingLogo(true);

      const updated = await organizationService.uploadLogo(file);

      setOrganization(updated);

      setSnackbar({
        open: true,
        severity: "success",
        message: "Organization logo updated successfully.",
      });
    } catch (err) {
      console.error("Failed to upload organization logo:", err);

      setSnackbar({
        open: true,
        severity: "error",
        message: "Unable to upload the organization logo.",
      });
    } finally {
      setUploadingLogo(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleRemoveLogo() {
    if (!organization || !organization.id || !organization.logo) {
      return;
    }

    try {
      setRemovingLogo(true);

      await organizationService.removeLogo();

      setOrganization((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          logo: null,
        };
      });

      setSnackbar({
        open: true,
        severity: "success",
        message: "Organization logo removed successfully.",
      });
    } catch (err) {
      console.error("Failed to remove organization logo:", err);

      setSnackbar({
        open: true,
        severity: "error",
        message: "Unable to remove the organization logo.",
      });
    } finally {
      setRemovingLogo(false);
    }
  }

  function getLogoUrl(): string {
    if (!organization?.logo) {
      return "";
    }

    if (organization.logo.startsWith("http")) {
      return organization.logo;
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") ?? "";

    return `${baseUrl}${organization.logo}`;
  }

  function formatDate(value: string | null): string {
    if (!value) {
      return "Not available";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Not available";
    }

    return new Intl.DateTimeFormat("en-KE", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  }

  const logoUrl = getLogoUrl();

  if (loading) {
    return (
      <PageContainer
        title="Organization Settings"
        description="Manage organization profile and branding"
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            py: 10,
            gap: 2,
          }}
        >
          <CircularProgress />

          <Typography color="text.secondary">
            Loading organization settings...
          </Typography>
        </Box>
      </PageContainer>
    );
  }

  if (!organization) {
    return (
      <PageContainer
        title="Organization Settings"
        description="Manage organization profile and branding"
      >
        <Stack spacing={2}>
          <Alert severity="error">
            {error || "Unable to load organization settings."}
          </Alert>

          <Box>
            <Button variant="outlined" onClick={() => void loadOrganization()}>
              Try Again
            </Button>
          </Box>
        </Stack>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Organization Settings"
      description="Manage organization profile and branding"
    >
      <Stack spacing={3}>
        <Box sx={{ mb: 1 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              sx={{
                bgcolor: "primary.main",
                width: 60,
                height: 60,
              }}
            >
              <BusinessIcon fontSize="large" />
            </Avatar>

            <Box>
              <Typography variant="h4" fontWeight={700}>
                Organization Settings
              </Typography>

              <Typography color="text.secondary">
                Configure your organization&apos;s profile, branding and contact
                information.
              </Typography>
            </Box>
          </Stack>
        </Box>

        {!organization.id && (
          <Alert severity="info">
            Your organization has not been configured yet. Complete the profile
            below and save it to create your organization workspace.
          </Alert>
        )}

        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ mb: 3 }}
            >
              <CorporateFareIcon color="primary" />

              <Typography variant="h6" fontWeight={700}>
                Organization Profile
              </Typography>
            </Stack>

            <Divider sx={{ mb: 3 }} />

            <Box sx={{ mb: 4 }}>
              <Typography
                variant="subtitle2"
                fontWeight={600}
                color="text.secondary"
                sx={{ mb: 2 }}
              >
                Organization Logo
              </Typography>

              <Stack
                direction={{
                  xs: "column",
                  sm: "row",
                }}
                spacing={3}
                alignItems={{
                  xs: "flex-start",
                  sm: "center",
                }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    width: 120,
                    height: 120,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px dashed",
                    borderColor: "divider",
                    borderRadius: 2,
                    bgcolor: "background.default",
                    position: "relative",
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  {organization.logo ? (
                    <Box
                      component="img"
                      src={logoUrl}
                      alt="Organization Logo"
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        p: 1,
                      }}
                    />
                  ) : (
                    <ImageIcon
                      sx={{
                        fontSize: 48,
                        color: "text.disabled",
                      }}
                    />
                  )}

                  {(uploadingLogo || removingLogo) && (
                    <Box
                      sx={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "rgba(0, 0, 0, 0.6)",
                        zIndex: 1,
                      }}
                    >
                      <CircularProgress
                        size={30}
                        sx={{
                          color: "common.white",
                        }}
                      />
                    </Box>
                  )}
                </Paper>

                <Box>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Button
                      variant="outlined"
                      startIcon={<PhotoCameraIcon />}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={
                        uploadingLogo || removingLogo || !organization.id
                      }
                      size="small"
                    >
                      Upload Logo
                    </Button>

                    {organization.logo && organization.id && (
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteOutlineIcon />}
                        onClick={handleRemoveLogo}
                        disabled={uploadingLogo || removingLogo}
                        size="small"
                      >
                        Remove Logo
                      </Button>
                    )}
                  </Stack>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    sx={{ mt: 1 }}
                  >
                    PNG, JPG, WEBP or GIF • Max 2MB
                  </Typography>

                  {!organization.id && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      sx={{ mt: 0.5 }}
                    >
                      Save your organization profile before uploading a logo.
                    </Typography>
                  )}
                </Box>
              </Stack>

              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleLogoUpload}
                ref={fileInputRef}
                style={{ display: "none" }}
              />
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Organization Name"
                  placeholder="e.g. Riverside Church"
                  value={organization.name}
                  onChange={handleChange("name")}
                  required
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Organization Code"
                  placeholder="e.g. RC001"
                  value={organization.code}
                  onChange={handleChange("code")}
                  required
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ mb: 3 }}
            >
              <EmailIcon color="primary" />

              <Typography variant="h6" fontWeight={700}>
                Contact Information
              </Typography>
            </Stack>

            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  type="email"
                  label="Email"
                  placeholder="info@organization.org"
                  value={organization.email}
                  onChange={handleChange("email")}
                  required
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  placeholder="+254 700 000 000"
                  value={organization.phone_number}
                  onChange={handleChange("phone_number")}
                  required
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Website"
                  placeholder="https://www.organization.org"
                  value={organization.website}
                  onChange={handleChange("website")}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ mb: 3 }}
            >
              <LocationOnIcon color="primary" />

              <Typography variant="h6" fontWeight={700}>
                Physical Address
              </Typography>
            </Stack>

            <Divider sx={{ mb: 3 }} />

            <TextField
              fullWidth
              multiline
              minRows={4}
              label="Physical Address"
              placeholder="Enter your organization's physical address"
              value={organization.physical_address}
              onChange={handleChange("physical_address")}
              required
            />
          </CardContent>
        </Card>

        {organization.id && (
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ mb: 3 }}
              >
                <InfoOutlinedIcon color="primary" />

                <Typography variant="h6" fontWeight={700}>
                  System Information
                </Typography>
              </Stack>

              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Created At"
                    value={formatDate(organization.created_at)}
                    slotProps={{
                      input: {
                        readOnly: true,
                      },
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Last Updated"
                    value={formatDate(organization.updated_at)}
                    slotProps={{
                      input: {
                        readOnly: true,
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <Button
            variant="contained"
            size="large"
            startIcon={
              saving ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <SaveIcon />
              )
            }
            onClick={handleSave}
            disabled={saving || uploadingLogo || removingLogo}
          >
            {saving
              ? "Saving Changes..."
              : organization.id
                ? "Save Changes"
                : "Create Organization"}
          </Button>
        </Box>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() =>
            setSnackbar((current) => ({
              ...current,
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
              setSnackbar((current) => ({
                ...current,
                open: false,
              }))
            }
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Stack>
    </PageContainer>
  );
}
