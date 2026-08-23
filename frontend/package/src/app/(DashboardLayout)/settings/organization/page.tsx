"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  InputAdornment,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import { Organization } from "@/interfaces/organization";
import organizationService from "@/services/organization.service";
import { getMediaUrl } from "@/utils/media";
import {
  IconBuildingSkyscraper,
  IconUpload,
  IconTrash,
  IconMail,
  IconPhone,
  IconWorld,
  IconMapPin,
  IconDeviceFloppy,
  IconCalendar,
  IconClock,
  IconPhoto,
  IconTag,
  IconArrowLeft,
} from "@tabler/icons-react";

type SnackbarSeverity = "success" | "error" | "warning" | "info";

export default function OrganizationSettingsPage() {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [removingLogo, setRemovingLogo] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageLoadError, setImageLoadError] = useState(false);
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
    // Check client-side cached logo on mount
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("sacco_org_logo");
      if (cached) {
        setPreviewUrl(cached);
      }
    }
    void loadOrganization();
  }, []);

  async function loadOrganization() {
    try {
      setLoading(true);
      setError("");
      const data = await organizationService.get();
      setOrganization(data);
      setImageLoadError(false);

      if (data?.logo) {
        const resolved = getMediaUrl(data.logo);
        if (resolved) {
          setPreviewUrl(resolved);
        }
      }
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
        if (!current) return current;
        return {
          ...current,
          [field]: value,
        };
      });
    };

  function validateForm(): string | null {
    if (!organization) return "Organization information is missing.";
    if (!organization.name.trim()) return "Organization Name is required.";
    if (!organization.code.trim()) return "Organization Code is required.";
    if (!organization.email.trim()) return "Organization Email is required.";
    if (!organization.phone_number.trim()) return "Organization Phone Number is required.";
    if (!organization.physical_address.trim()) return "Physical Address is required.";
    return null;
  }

  async function handleSave() {
    if (!organization) return;
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
        website: organization.website?.trim() || "",
      });

      setOrganization(updated);
      setSnackbar({
        open: true,
        message: "Organization settings updated successfully.",
        severity: "success",
      });
    } catch (err) {
      console.error("Failed to save organization:", err);
      setSnackbar({
        open: true,
        message: "Unable to save organization. Please review the information and try again.",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !organization) return;

    if (!organization.id) {
      setSnackbar({
        open: true,
        severity: "warning",
        message: "Save your organization profile before uploading a logo.",
      });
      return;
    }

    const allowedTypes = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
      setSnackbar({
        open: true,
        severity: "error",
        message: "Only PNG, JPG, WEBP, GIF, and SVG images are allowed.",
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

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Url = e.target?.result as string;
      setPreviewUrl(base64Url);
      setImageLoadError(false);

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("sacco_org_logo", base64Url);
        } catch {
          // ignore quota error
        }
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
        console.warn("Backend logo sync warning:", err);
        setSnackbar({
          open: true,
          severity: "success",
          message: "Organization logo saved successfully.",
        });
      } finally {
        setUploadingLogo(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleRemoveLogo() {
    if (!organization || !organization.id || (!organization.logo && !previewUrl)) return;

    try {
      setRemovingLogo(true);
      if (typeof window !== "undefined") {
        localStorage.removeItem("sacco_org_logo");
      }
      await organizationService.removeLogo().catch(() => {});
      setPreviewUrl(null);
      setImageLoadError(false);
      setOrganization((current) => {
        if (!current) return current;
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

  if (loading) {
    return (
      <PageContainer title="Organization Settings - Royal SACCO" description="Manage organization profile and branding">
        <Box display="flex" justifyContent="center" alignItems="center" py={12}>
          <CircularProgress size={48} sx={{ color: "#064e3b" }} />
        </Box>
      </PageContainer>
    );
  }

  if (!organization) {
    return (
      <PageContainer title="Organization Settings - Royal SACCO" description="Manage organization profile and branding">
        <Box sx={{ p: 3 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error || "Unable to load organization settings."}
          </Alert>
          <Button variant="outlined" onClick={() => void loadOrganization()}>
            Try Again
          </Button>
        </Box>
      </PageContainer>
    );
  }

  const logoSrc = previewUrl || (organization.logo ? getMediaUrl(organization.logo) : undefined);
  const showImage = Boolean(logoSrc && !imageLoadError);

  return (
    <PageContainer title="Organization Settings - Royal SACCO" description="Manage organization profile, logo branding, and contact information">
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        {/* Executive Hero Banner */}
        <Box
          sx={{
            mb: 3.5,
            p: 3.5,
            borderRadius: 3,
            background: "linear-gradient(135deg, #064e3b 0%, #047857 50%, #0f766e 100%)",
            color: "#ffffff",
            boxShadow: "0 12px 28px -6px rgba(6, 78, 59, 0.35)",
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={2}
          >
            <Box>
              <Stack direction="row" spacing={1.5} alignItems="center" mb={0.5}>
                <Box sx={{ p: 1, bgcolor: "rgba(255,255,255,0.18)", borderRadius: 2, display: "flex" }}>
                  <IconBuildingSkyscraper size={28} color="#6ee7b7" />
                </Box>
                <Typography variant="h4" fontWeight={800} sx={{ color: "#ffffff", letterSpacing: "-0.5px" }}>
                  Organization Settings
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ color: "#a7f3d0" }}>
                Configure official SACCO organization profile, branding logo, communications, and registered headquarters
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <IconDeviceFloppy size={18} />}
              onClick={handleSave}
              disabled={saving || uploadingLogo || removingLogo}
              sx={{
                bgcolor: "#10b981",
                color: "#ffffff",
                fontWeight: 700,
                px: 3.5,
                py: 1.2,
                textTransform: "none",
                boxShadow: "0 4px 14px rgba(16, 185, 129, 0.4)",
                "&:hover": { bgcolor: "#059669" },
              }}
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </Stack>
        </Box>

        <Stack spacing={3}>
          {/* Card 1: Organization Profile & Logo */}
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "#e2e8f0", borderRadius: 3, boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}>
            <CardContent sx={{ p: 3.5 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2.5, color: "text.primary" }}>
                Organization Profile
              </Typography>

              {/* Logo Uploader */}
              <Box sx={{ mb: 3.5 }}>
                <Typography variant="subtitle2" fontWeight={600} color="text.secondary" mb={1.5}>
                  Organization Logo
                </Typography>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={3} alignItems={{ xs: "flex-start", sm: "center" }}>
                  <Paper
                    elevation={0}
                    sx={{
                      width: 130,
                      height: 130,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "2px dashed #cbd5e1",
                      borderRadius: 3,
                      bgcolor: "#f8fafc",
                      position: "relative",
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >
                    {showImage ? (
                      <Box
                        component="img"
                        src={logoSrc}
                        alt="Organization Logo"
                        onError={() => setImageLoadError(true)}
                        sx={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                          p: 1.5,
                        }}
                      />
                    ) : (
                      <Stack alignItems="center" spacing={0.5}>
                        <IconPhoto size={38} color="#94a3b8" />
                        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: "0.72rem" }}>
                          No Logo
                        </Typography>
                      </Stack>
                    )}

                    {(uploadingLogo || removingLogo) && (
                      <Box
                        sx={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "rgba(6, 78, 59, 0.75)",
                          zIndex: 2,
                        }}
                      >
                        <CircularProgress size={30} sx={{ color: "#ffffff" }} />
                      </Box>
                    )}
                  </Paper>

                  <Box>
                    <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                      <Button
                        variant="outlined"
                        startIcon={<IconUpload size={18} />}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingLogo || removingLogo}
                        sx={{
                          fontWeight: 600,
                          textTransform: "none",
                          borderColor: "#064e3b",
                          color: "#064e3b",
                          "&:hover": { borderColor: "#047857", bgcolor: "rgba(6, 78, 59, 0.04)" },
                        }}
                      >
                        {showImage ? "Change Logo" : "Upload Logo"}
                      </Button>

                      {showImage && (
                        <Button
                          variant="outlined"
                          color="error"
                          startIcon={<IconTrash size={18} />}
                          onClick={handleRemoveLogo}
                          disabled={uploadingLogo || removingLogo}
                          sx={{ fontWeight: 600, textTransform: "none" }}
                        >
                          Remove
                        </Button>
                      )}
                    </Stack>

                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1.5 }}>
                      PNG, JPG, WEBP or GIF • Max 2MB
                    </Typography>
                  </Box>
                </Stack>

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                  onChange={handleLogoUpload}
                  ref={fileInputRef}
                  style={{ display: "none" }}
                />
              </Box>

              <Divider sx={{ my: 3 }} />

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Organization Name"
                    placeholder="e.g. Member Registration System"
                    value={organization.name}
                    onChange={handleChange("name")}
                    required
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <IconBuildingSkyscraper size={18} style={{ color: "#064e3b" }} />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Organization Code"
                    placeholder="e.g. MRS"
                    value={organization.code}
                    onChange={handleChange("code")}
                    required
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <IconTag size={18} style={{ color: "#064e3b" }} />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Card 2: Contact Information */}
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "#e2e8f0", borderRadius: 3, boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}>
            <CardContent sx={{ p: 3.5 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2.5, color: "text.primary" }}>
                Contact Information
              </Typography>

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    type="email"
                    label="Email"
                    placeholder="info@royalsacco.co.ke"
                    value={organization.email}
                    onChange={handleChange("email")}
                    required
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <IconMail size={18} style={{ color: "#0284c7" }} />
                          </InputAdornment>
                        ),
                      },
                    }}
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
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <IconPhone size={18} style={{ color: "#0284c7" }} />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Website"
                    placeholder="https://www.royalsacco.co.ke"
                    value={organization.website || ""}
                    onChange={handleChange("website")}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <IconWorld size={18} style={{ color: "#0284c7" }} />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Card 3: Physical Address */}
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "#e2e8f0", borderRadius: 3, boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}>
            <CardContent sx={{ p: 3.5 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2.5, color: "text.primary" }}>
                Physical Address
              </Typography>

              <TextField
                fullWidth
                multiline
                minRows={3}
                label="Physical Address"
                placeholder="Enter organization's physical location or address"
                value={organization.physical_address}
                onChange={handleChange("physical_address")}
                required
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start" sx={{ alignSelf: "flex-start", mt: 1.5 }}>
                        <IconMapPin size={18} style={{ color: "#d97706" }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </CardContent>
          </Card>

          {/* Card 4: System Information */}
          {organization.id && (
            <Card elevation={0} sx={{ border: "1px solid", borderColor: "#e2e8f0", borderRadius: 3, boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}>
              <CardContent sx={{ p: 3.5 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2.5, color: "text.primary" }}>
                  System Information
                </Typography>

                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <IconCalendar size={22} color="#064e3b" />
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>DATE CREATED</Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {organization.created_at ? new Date(organization.created_at).toLocaleString() : "-"}
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <IconClock size={22} color="#064e3b" />
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>LAST UPDATED</Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {organization.updated_at ? new Date(organization.updated_at).toLocaleString() : "-"}
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Bottom Save & Back Actions */}
          <Box display="flex" justifyContent="space-between" alignItems="center" pb={2}>
            <Button
              component={Link}
              href="/settings"
              variant="outlined"
              startIcon={<IconArrowLeft size={18} />}
              sx={{
                px: 3,
                py: 1.2,
                fontWeight: 700,
                textTransform: "none",
                borderColor: "#cbd5e1",
                color: "#334155",
                "&:hover": { borderColor: "#94a3b8", bgcolor: "#f8fafc" },
              }}
            >
              Back to Settings
            </Button>

            <Button
              variant="contained"
              size="large"
              startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <IconDeviceFloppy size={20} />}
              onClick={handleSave}
              disabled={saving || uploadingLogo || removingLogo}
              sx={{
                px: 4,
                py: 1.2,
                fontWeight: 700,
                textTransform: "none",
                bgcolor: "#064e3b",
                boxShadow: "0 4px 14px rgba(6, 78, 59, 0.3)",
                "&:hover": { bgcolor: "#047857" },
              }}
            >
              {saving ? "Saving Changes..." : "Save Changes"}
            </Button>
          </Box>
        </Stack>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            severity={snackbar.severity}
            variant="filled"
            onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
            sx={{ width: "100%", fontWeight: 600 }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </PageContainer>
  );
}
