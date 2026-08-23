"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import memberService from "@/services/member.service";
import {
  IconNumbers,
  IconDeviceFloppy,
  IconHash,
  IconTag,
  IconRefresh,
  IconArrowLeft,
} from "@tabler/icons-react";

type SnackbarSeverity = "success" | "error" | "warning" | "info";

interface NumberingConfig {
  prefix: string;
  padding: number;
  nextNumber: number;
  suffix: string;
  enableCategoryPrefix: boolean;
  normalPrefix: string;
  specialPrefix: string;
  otherPrefix: string;
  autoIncrement: boolean;
}

export default function MemberNumberingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [totalMembers, setTotalMembers] = useState(0);

  const [config, setConfig] = useState<NumberingConfig>({
    prefix: "RC-",
    padding: 6,
    nextNumber: 1,
    suffix: "",
    enableCategoryPrefix: false,
    normalPrefix: "RC-",
    specialPrefix: "RCS-",
    otherPrefix: "RCO-",
    autoIncrement: true,
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
    void loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const members = await memberService.getAll().catch(() => []);
      const count = Array.isArray(members) ? members.length : 0;
      setTotalMembers(count);

      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("sacco_numbering_config");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setConfig(parsed);
          } catch {
            // fallback
          }
        } else {
          setConfig((prev) => ({
            ...prev,
            nextNumber: count + 1,
          }));
        }
      }
    } catch (err) {
      console.error("Failed to load numbering info:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleSave(andGoBack: boolean = false) {
    try {
      setSaving(true);
      if (typeof window !== "undefined") {
        localStorage.setItem("sacco_numbering_config", JSON.stringify(config));
      }
      setTimeout(() => {
        setSaving(false);
        setSnackbar({
          open: true,
          message: "Membership numbering sequence and rules saved successfully.",
          severity: "success",
        });
        if (andGoBack) {
          setTimeout(() => {
            router.push("/settings");
          }, 800);
        }
      }, 400);
    } catch (err) {
      setSaving(false);
      setSnackbar({
        open: true,
        message: "Failed to save numbering settings.",
        severity: "error",
      });
    }
  }

  function formatSample(prefix: string, num: number, padding: number, suffix: string) {
    const padded = String(num).padStart(padding, "0");
    return `${prefix}${padded}${suffix}`;
  }

  const sample1 = formatSample(
    config.enableCategoryPrefix ? config.normalPrefix : config.prefix,
    config.nextNumber,
    config.padding,
    config.suffix
  );

  const sample2 = formatSample(
    config.enableCategoryPrefix ? config.normalPrefix : config.prefix,
    config.nextNumber + 1,
    config.padding,
    config.suffix
  );

  const sample3 = formatSample(
    config.enableCategoryPrefix ? config.specialPrefix : config.prefix,
    config.nextNumber + 2,
    config.padding,
    config.suffix
  );

  if (loading) {
    return (
      <PageContainer title="Member Numbering - Royal SACCO" description="Configure automatic member numbering rules">
        <Box display="flex" justifyContent="center" alignItems="center" py={12}>
          <CircularProgress size={48} sx={{ color: "#064e3b" }} />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Member Numbering - Royal SACCO"
      description="Configure automatic membership number sequencing, prefixes, and serial padding"
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
                  <IconNumbers size={28} color="#6ee7b7" />
                </Box>
                <Typography variant="h4" fontWeight={800} sx={{ color: "#ffffff", letterSpacing: "-0.5px" }}>
                  Member Numbering &amp; Sequencing
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ color: "#a7f3d0" }}>
                Configure automatic membership number generation, serial padding length, prefixes, and tier patterns
              </Typography>
            </Box>

            <Stack direction="row" spacing={1.5}>
              <Button
                variant="contained"
                startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <IconDeviceFloppy size={18} />}
                onClick={() => handleSave(false)}
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
                {saving ? "Saving..." : "Save Settings"}
              </Button>
            </Stack>
          </Stack>
        </Box>

        {/* Live Preview Box */}
        <Card
          elevation={0}
          sx={{
            mb: 3.5,
            p: 3,
            borderRadius: 3,
            border: "1px solid #bbf7d0",
            bgcolor: "#f0fdf4",
            boxShadow: "0 4px 16px rgba(6, 78, 59, 0.04)",
          }}
        >
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems="center" spacing={2}>
            <Box>
              <Typography variant="subtitle2" fontWeight={800} color="#065f46" sx={{ letterSpacing: 0.5 }}>
                LIVE SEQUENCING PREVIEW
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Next members registered will automatically receive numbers in this format:
              </Typography>
            </Box>

            <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
              <Chip
                label={`Next: ${sample1}`}
                sx={{
                  bgcolor: "#064e3b",
                  color: "#ffffff",
                  fontWeight: 800,
                  fontSize: "0.9rem",
                  py: 2.2,
                  px: 1,
                  borderRadius: 2,
                }}
              />
              <Chip
                label={`+1: ${sample2}`}
                sx={{
                  bgcolor: "#ffffff",
                  color: "#065f46",
                  border: "1px solid #bbf7d0",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  py: 2.2,
                  borderRadius: 2,
                }}
              />
              <Chip
                label={`+2: ${sample3}`}
                sx={{
                  bgcolor: "#ffffff",
                  color: "#0369a1",
                  border: "1px solid #bae6fd",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  py: 2.2,
                  borderRadius: 2,
                }}
              />
            </Stack>
          </Stack>
        </Card>

        <Stack spacing={3}>
          {/* Card 1: Core Format Rules */}
          <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}>
            <CardContent sx={{ p: 3.5 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2.5, color: "text.primary" }}>
                General Numbering Rules
              </Typography>

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Global Prefix"
                    placeholder="e.g. RC-"
                    value={config.prefix}
                    onChange={(e) => setConfig((prev) => ({ ...prev, prefix: e.target.value.toUpperCase() }))}
                    helperText="Fixed prefix preceding the sequential digits"
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

                <Grid size={{ xs: 12, md: 4 }}>
                  <FormControl fullWidth>
                    <InputLabel>Digit Padding Length</InputLabel>
                    <Select
                      label="Digit Padding Length"
                      value={config.padding}
                      onChange={(e) => setConfig((prev) => ({ ...prev, padding: Number(e.target.value) }))}
                    >
                      <MenuItem value={4}>4 Digits (e.g. 0001)</MenuItem>
                      <MenuItem value={5}>5 Digits (e.g. 00001)</MenuItem>
                      <MenuItem value={6}>6 Digits (e.g. 000001 - Standard)</MenuItem>
                      <MenuItem value={7}>7 Digits (e.g. 0000001)</MenuItem>
                      <MenuItem value={8}>8 Digits (e.g. 00000001)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Optional Suffix"
                    placeholder="e.g. /2026"
                    value={config.suffix}
                    onChange={(e) => setConfig((prev) => ({ ...prev, suffix: e.target.value }))}
                    helperText="Appended to the end of the number (optional)"
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Next Sequence Starting Number"
                    value={config.nextNumber}
                    onChange={(e) => setConfig((prev) => ({ ...prev, nextNumber: Math.max(1, Number(e.target.value)) }))}
                    helperText="Current active sequence counter for the next registered member"
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <IconHash size={18} style={{ color: "#064e3b" }} />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: 2,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      height: "100%",
                    }}
                  >
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>
                        CURRENT REGISTERED MEMBERS
                      </Typography>
                      <Typography variant="h5" fontWeight={800} color="#064e3b">
                        {totalMembers} Total Profiles
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<IconRefresh size={16} />}
                      onClick={() => setConfig((prev) => ({ ...prev, nextNumber: totalMembers + 1 }))}
                      sx={{ textTransform: "none", fontWeight: 700, borderColor: "#cbd5e1" }}
                    >
                      Sync Next ID
                    </Button>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Card 2: Tier-Specific Custom Prefixes */}
          <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}>
            <CardContent sx={{ p: 3.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Box>
                  <Typography variant="h6" fontWeight={700} color="text.primary">
                    Category-Specific Prefixes
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Apply distinct prefix codes for Normal, Special, and Executive tiers
                  </Typography>
                </Box>

                <FormControlLabel
                  control={
                    <Switch
                      checked={config.enableCategoryPrefix}
                      onChange={(e) => setConfig((prev) => ({ ...prev, enableCategoryPrefix: e.target.checked }))}
                      color="primary"
                    />
                  }
                  label={
                    <Typography variant="body2" fontWeight={700}>
                      {config.enableCategoryPrefix ? "Enabled" : "Disabled"}
                    </Typography>
                  }
                />
              </Stack>

              <Divider sx={{ my: 2.5 }} />

              {config.enableCategoryPrefix ? (
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Normal Member Prefix"
                      placeholder="e.g. RC-"
                      value={config.normalPrefix}
                      onChange={(e) => setConfig((prev) => ({ ...prev, normalPrefix: e.target.value.toUpperCase() }))}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Special Member Prefix"
                      placeholder="e.g. RCS-"
                      value={config.specialPrefix}
                      onChange={(e) => setConfig((prev) => ({ ...prev, specialPrefix: e.target.value.toUpperCase() }))}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Other Tier Prefix"
                      placeholder="e.g. RCO-"
                      value={config.otherPrefix}
                      onChange={(e) => setConfig((prev) => ({ ...prev, otherPrefix: e.target.value.toUpperCase() }))}
                    />
                  </Grid>
                </Grid>
              ) : (
                <Box p={2} bgcolor="#f8fafc" borderRadius={2} border="1px solid #e2e8f0">
                  <Typography variant="body2" color="text.secondary">
                    Standard global prefix (<strong>{config.prefix}</strong>) is currently applied across all member categories. Enable the switch above to configure tier-specific codes.
                  </Typography>
                </Box>
              )}
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

            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                size="large"
                startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <IconDeviceFloppy size={20} />}
                onClick={() => handleSave(false)}
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
                {saving ? "Saving Changes..." : "Save Settings"}
              </Button>
            </Stack>
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
