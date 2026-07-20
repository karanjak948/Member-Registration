"use client";

import { useEffect, useState, useRef } from "react";

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
  Snackbar,
  Stack,
  TextField,
  Typography,
  IconButton,
  Paper,
} from "@mui/material";

import BusinessIcon from "@mui/icons-material/Business";
import EmailIcon from "@mui/icons-material/Email";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import SaveIcon from "@mui/icons-material/Save";
import CorporateFareIcon from "@mui/icons-material/CorporateFare";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ImageIcon from "@mui/icons-material/Image";

import organizationService from "@/services/organization.service";
import { Organization } from "@/interfaces/organization";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";

export default function OrganizationSettingsPage() {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [removingLogo, setRemovingLogo] = useState(false);
  const [error, setError] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "warning" | "info",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadOrganization();
  }, []);

  async function loadOrganization() {
    try {
      const data = await organizationService.get();
      setOrganization(data);
    } catch (err) {
      console.error(err);
      setError("Unable to load organization settings.");
    } finally {
      setLoading(false);
    }
  }

  const handleChange =
    (field: keyof Organization) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (!organization) return;

      setOrganization({
        ...organization,
        [field]: e.target.value,
      });
    };

  async function handleLogoUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file || !organization) return;

    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/gif",
    ];

    if (!allowedTypes.includes(file.type)) {
      setSnackbar({
        open: true,
        severity: "error",
        message:
          "Only PNG, JPG, WEBP and GIF images are allowed.",
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setSnackbar({
        open: true,
        severity: "error",
        message:
          "Logo must be smaller than 2MB.",
      });
      return;
    }

    try {
      setUploadingLogo(true);

      const updated =
        await organizationService.uploadLogo(file);

      setOrganization(updated);

      setSnackbar({
        open: true,
        severity: "success",
        message:
          "Organization logo updated successfully.",
      });
    } catch (error) {
      console.error(error);

      setSnackbar({
        open: true,
        severity: "error",
        message:
          "Failed to upload logo.",
      });
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleRemoveLogo() {
    if (!organization) return;

    try {
      setRemovingLogo(true);

      await organizationService.removeLogo();

      setOrganization({
        ...organization,
        logo: null,
      });

      setSnackbar({
        open: true,
        severity: "success",
        message:
          "Organization logo removed.",
      });
    } catch (error) {
      console.error(error);

      setSnackbar({
        open: true,
        severity: "error",
        message:
          "Unable to remove logo.",
      });
    } finally {
      setRemovingLogo(false);
    }
  }

  function validateForm() {
    if (!organization?.name?.trim()) {
      return "Organization name is required.";
    }

    if (!organization?.code?.trim()) {
      return "Organization code is required.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(organization?.email || "")) {
      return "Enter a valid email address.";
    }

    if (organization?.website && organization.website.trim()) {
      try {
        new URL(organization.website);
      } catch {
        return "Enter a valid website URL.";
      }
    }

    const phoneRegex = /^[+0-9()\-\s]{7,20}$/;
    if (!phoneRegex.test(organization?.phone_number || "")) {
      return "Enter a valid phone number.";
    }

    return null;
  }

  async function handleSave() {
    const error = validateForm();

    if (error) {
      setSnackbar({
        open: true,
        message: error,
        severity: "error",
      });
      return;
    }

    try {
      setSaving(true);

      const updated = await organizationService.update({
        name: organization?.name,
        code: organization?.code,
        email: organization?.email,
        phone_number: organization?.phone_number,
        website: organization?.website,
        physical_address: organization?.physical_address,
      });

      setOrganization(updated);

      setSnackbar({
        open: true,
        message: "Organization updated successfully.",
        severity: "success",
      });
    } catch (error) {
      console.error(error);
      setSnackbar({
        open: true,
        message: "Failed to save organization.",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  // Helper function to get the full logo URL
  const getLogoUrl = () => {
    if (!organization?.logo) return "";
    
    // If it's already a full URL, return as-is
    if (organization.logo.startsWith("http")) {
      return organization.logo;
    }
    
    // Otherwise, prepend the API base URL (removing /api if present)
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "";
    return `${baseUrl}${organization.logo}`;
  };

  const logoUrl = getLogoUrl();

  if (loading) {
    return (
      <PageContainer
        title="Organization Settings"
        description="Manage organization profile and branding"
      >
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          py={10}
          gap={2}
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
        <Alert severity="error">{error}</Alert>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Organization Settings"
      description="Manage organization profile and branding"
    >
      <Stack spacing={3}>
        <Box mb={4}>
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
                Configure your organization's profile, branding and contact
                information.
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Card
          sx={{
            borderRadius: 3,
            mb: 3,
          }}
        >
          <CardContent>
            <Stack direction="row" spacing={1} alignItems="center" mb={3}>
              <CorporateFareIcon color="primary" />

              <Typography variant="h6" fontWeight={700}>
                Organization Profile
              </Typography>
            </Stack>

            <Divider sx={{ mb: 3 }} />

            {/* Branding Section - Logo */}
            <Box mb={4}>
              <Typography variant="subtitle2" fontWeight={600} color="text.secondary" mb={2}>
                Organization Logo
              </Typography>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={3} alignItems="center">
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
                    <ImageIcon sx={{ fontSize: 48, color: "text.disabled" }} />
                  )}

                  {(uploadingLogo || removingLogo) && (
                    <Box
                      position="absolute"
                      top={0}
                      left={0}
                      right={0}
                      bottom={0}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      bgcolor="rgba(0,0,0,0.6)"
                    >
                      <CircularProgress size={30} color="inherit" />
                    </Box>
                  )}
                </Paper>

                <Box>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Button
                      variant="outlined"
                      startIcon={<PhotoCameraIcon />}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingLogo || removingLogo}
                      size="small"
                    >
                      Upload Logo
                    </Button>

                    {organization.logo && (
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

                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    PNG, JPG, WEBP or GIF • Max 2MB
                  </Typography>
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

        <Card
          sx={{
            borderRadius: 3,
            mb: 3,
          }}
        >
          <CardContent>
            <Stack direction="row" spacing={1} alignItems="center" mb={3}>
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
                  label="Email"
                  placeholder="info@organization.org"
                  value={organization.email ?? ""}
                  onChange={handleChange("email")}
                  required
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  placeholder="+254 700 000 000"
                  value={organization.phone_number ?? ""}
                  onChange={handleChange("phone_number")}
                  required
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Website"
                  placeholder="https://www.organization.org"
                  value={organization.website ?? ""}
                  onChange={handleChange("website")}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card
          sx={{
            borderRadius: 3,
            mb: 3,
          }}
        >
          <CardContent>
            <Stack direction="row" spacing={1} alignItems="center" mb={3}>
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
              value={organization.physical_address ?? ""}
              onChange={handleChange("physical_address")}
            />
          </CardContent>
        </Card>

        <Card
          sx={{
            borderRadius: 3,
            mb: 4,
          }}
        >
          <CardContent>
            <Stack direction="row" spacing={1} alignItems="center" mb={3}>
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
                  value={
                    organization.created_at
                      ? new Intl.DateTimeFormat("en-KE", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(organization.created_at))
                      : ""
                  }
                  InputProps={{
                    readOnly: true,
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Last Updated"
                  value={
                    organization.updated_at
                      ? new Intl.DateTimeFormat("en-KE", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(organization.updated_at))
                      : ""
                  }
                  InputProps={{
                    readOnly: true,
                  }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Box display="flex" justifyContent="flex-end">
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
            {saving ? "Saving Changes..." : "Save Changes"}
          </Button>
        </Box>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
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
      </Stack>
    </PageContainer>
  );
}