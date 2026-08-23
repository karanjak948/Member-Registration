"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import {
  IconCpu,
  IconDeviceFloppy,
  IconCurrencyDollar,
  IconClock,
  IconBell,
  IconLock,
  IconArrowLeft,
} from "@tabler/icons-react";

type SnackbarSeverity = "success" | "error" | "warning" | "info";

interface SystemPreferences {
  currency: string;
  currencySymbol: string;
  dateFormat: string;
  timezone: string;
  enableSmsAlerts: boolean;
  enableEmailNotifications: boolean;
  autoApproveVerifiedMembers: boolean;
  defaultLoanInterestType: "REDUCING_BALANCE" | "FLAT_RATE";
  sessionTimeoutMinutes: number;
}

export default function SystemPreferencesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [preferences, setPreferences] = useState<SystemPreferences>({
    currency: "KES",
    currencySymbol: "KSh",
    dateFormat: "DD/MM/YYYY",
    timezone: "Africa/Nairobi",
    enableSmsAlerts: true,
    enableEmailNotifications: true,
    autoApproveVerifiedMembers: false,
    defaultLoanInterestType: "REDUCING_BALANCE",
    sessionTimeoutMinutes: 60,
  });

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: SnackbarSeverity;
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sacco_system_preferences");
      if (saved) {
        try {
          setPreferences(JSON.parse(saved));
        } catch {
          // fallback
        }
      }
    }
    setLoading(false);
  }, []);

  function handleSave() {
    try {
      setSaving(true);
      if (typeof window !== "undefined") {
        localStorage.setItem("sacco_system_preferences", JSON.stringify(preferences));
      }
      setTimeout(() => {
        setSaving(false);
        setSnackbar({
          open: true,
          message: "System preferences and operational defaults saved successfully.",
          severity: "success",
        });
      }, 400);
    } catch {
      setSaving(false);
      setSnackbar({
        open: true,
        message: "Failed to save system preferences.",
        severity: "error",
      });
    }
  }

  if (loading) {
    return (
      <PageContainer title="System Preferences - Royal SACCO" description="Configure system preferences">
        <Box display="flex" justifyContent="center" alignItems="center" py={12}>
          <CircularProgress size={48} sx={{ color: "#064e3b" }} />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="System Preferences - Royal SACCO"
      description="Configure system-wide application preferences, currency formats, notifications, and operational defaults"
    >
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
                  <IconCpu size={28} color="#6ee7b7" />
                </Box>
                <Typography variant="h4" fontWeight={800} sx={{ color: "#ffffff", letterSpacing: "-0.5px" }}>
                  System Preferences &amp; Defaults
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ color: "#a7f3d0" }}>
                Configure currency localization, notification dispatches, loan computation models, and security timeouts
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <IconDeviceFloppy size={18} />}
              onClick={handleSave}
              disabled={saving}
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
              {saving ? "Saving..." : "Save Preferences"}
            </Button>
          </Stack>
        </Box>

        <Stack spacing={3}>
          {/* Card 1: Regional & Localization */}
          <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}>
            <CardContent sx={{ p: 3.5 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2.5, color: "text.primary" }}>
                Localization &amp; Currency
              </Typography>

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <FormControl fullWidth>
                    <InputLabel>Operating Currency</InputLabel>
                    <Select
                      label="Operating Currency"
                      value={preferences.currency}
                      onChange={(e) => setPreferences((prev) => ({ ...prev, currency: e.target.value }))}
                    >
                      <MenuItem value="KES">KES - Kenyan Shilling (KSh)</MenuItem>
                      <MenuItem value="USD">USD - US Dollar ($)</MenuItem>
                      <MenuItem value="UGX">UGX - Ugandan Shilling (USh)</MenuItem>
                      <MenuItem value="TZS">TZS - Tanzanian Shilling (TSh)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <FormControl fullWidth>
                    <InputLabel>System Date Format</InputLabel>
                    <Select
                      label="System Date Format"
                      value={preferences.dateFormat}
                      onChange={(e) => setPreferences((prev) => ({ ...prev, dateFormat: e.target.value }))}
                    >
                      <MenuItem value="DD/MM/YYYY">DD/MM/YYYY (e.g. 23/08/2026)</MenuItem>
                      <MenuItem value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-08-23)</MenuItem>
                      <MenuItem value="MM/DD/YYYY">MM/DD/YYYY (e.g. 08/23/2026)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <FormControl fullWidth>
                    <InputLabel>Timezone</InputLabel>
                    <Select
                      label="Timezone"
                      value={preferences.timezone}
                      onChange={(e) => setPreferences((prev) => ({ ...prev, timezone: e.target.value }))}
                    >
                      <MenuItem value="Africa/Nairobi">Africa/Nairobi (EAT +03:00)</MenuItem>
                      <MenuItem value="Africa/Kampala">Africa/Kampala (EAT +03:00)</MenuItem>
                      <MenuItem value="Africa/Dar_es_Salaam">Africa/Dar_es_Salaam (EAT +03:00)</MenuItem>
                      <MenuItem value="UTC">UTC (Coordinated Universal Time)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Card 2: Notifications & Communication Defaults */}
          <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}>
            <CardContent sx={{ p: 3.5 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2.5, color: "text.primary" }}>
                Automatic Notifications &amp; Alerts
              </Typography>

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.enableSmsAlerts}
                        onChange={(e) => setPreferences((prev) => ({ ...prev, enableSmsAlerts: e.target.checked }))}
                        color="success"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight={700}>
                          Automated SMS Transaction Notifications
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Send instant SMS receipts on savings, deposit refunds, and loan repayments
                        </Typography>
                      </Box>
                    }
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.enableEmailNotifications}
                        onChange={(e) => setPreferences((prev) => ({ ...prev, enableEmailNotifications: e.target.checked }))}
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight={700}>
                          Email Statements &amp; Audit Logs
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Dispatch monthly PDF member statements and manager approval notices
                        </Typography>
                      </Box>
                    }
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Card 3: Loan & Security Policies */}
          <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}>
            <CardContent sx={{ p: 3.5 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2.5, color: "text.primary" }}>
                Loan Computation &amp; Session Security
              </Typography>

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Default Loan Amortization Model</InputLabel>
                    <Select
                      label="Default Loan Amortization Model"
                      value={preferences.defaultLoanInterestType}
                      onChange={(e) =>
                        setPreferences((prev) => ({
                          ...prev,
                          defaultLoanInterestType: e.target.value as "REDUCING_BALANCE" | "FLAT_RATE",
                        }))
                      }
                    >
                      <MenuItem value="REDUCING_BALANCE">Reducing Balance (Standard SACCO Amortization)</MenuItem>
                      <MenuItem value="FLAT_RATE">Flat Rate Interest (Fixed Monthly Charges)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Idle Session Timeout (Minutes)"
                    value={preferences.sessionTimeoutMinutes}
                    onChange={(e) =>
                      setPreferences((prev) => ({
                        ...prev,
                        sessionTimeoutMinutes: Math.max(10, Number(e.target.value)),
                      }))
                    }
                    helperText="Automatically locks inactive staff screens for audit compliance"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

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
              disabled={saving}
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
              {saving ? "Saving Changes..." : "Save Preferences"}
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
