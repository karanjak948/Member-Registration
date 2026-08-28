"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  Alert,
} from "@mui/material";

import {
  IconArrowLeft,
  IconUserPlus,
  IconLink,
  IconShieldCheck,
  IconLock,
  IconMail,
  IconUser,
  IconEye,
  IconEyeOff,
  IconInfoCircle,
  IconSparkles,
  IconShieldLock,
  IconKey,
  IconCircleCheck,
} from "@tabler/icons-react";

import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import api from "@/services/api";
import roleService from "@/services/role.service";
import { Role } from "@/types/role";

type SnackbarSeverity = "success" | "error" | "warning" | "info";

export default function CreateAdminUserPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<number>(0); // 0 = Assign Existing, 1 = Create New
  const [loading, setLoading] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);
  const [formError, setFormError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: SnackbarSeverity;
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  // Tab 0: Assign Existing
  const [existingIdentifier, setExistingIdentifier] = useState("");
  const [existingRoleId, setExistingRoleId] = useState("");

  // Tab 1: Create New
  const [newUserData, setNewUserData] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirm_password: "",
    role_id: "",
  });

  useEffect(() => {
    async function loadRoles() {
      try {
        setRolesLoading(true);
        const data = await roleService.getRoles();
        const loadedRoles = Array.isArray(data) ? data : [];
        setRoles(loadedRoles);
        if (loadedRoles.length > 0) {
          const defaultRole =
            loadedRoles.find((r) => r.name.toLowerCase() === "member officer") ||
            loadedRoles[0];
          setExistingRoleId(String(defaultRole.id));
          setNewUserData((prev) => ({ ...prev, role_id: String(defaultRole.id) }));
        }
      } catch (err) {
        // Quiet fallback
      } finally {
        setRolesLoading(false);
      }
    }
    loadRoles();
  }, []);

  // Active selected role for live summary
  const selectedRole = useMemo(() => {
    const roleId = activeTab === 0 ? existingRoleId : newUserData.role_id;
    return roles.find((r) => String(r.id) === String(roleId)) || roles[0] || null;
  }, [activeTab, existingRoleId, newUserData.role_id, roles]);

  const handleAssignExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!existingIdentifier.trim()) {
      setFormError("Please enter the user's username or email address.");
      return;
    }
    if (!existingRoleId) {
      setFormError("Please select a role for this user.");
      return;
    }

    setLoading(true);
    setFormError("");

    try {
      const isEmail = existingIdentifier.includes("@");
      const payload: Record<string, any> = {
        role_id: Number(existingRoleId),
      };
      if (isEmail) {
        payload.email = existingIdentifier.trim().toLowerCase();
      } else {
        payload.username = existingIdentifier.trim();
      }

      await api.post("/users/", payload);

      setSnackbar({
        open: true,
        message: `User "${existingIdentifier}" successfully added to the organization!`,
        severity: "success",
      });

      setTimeout(() => {
        router.push("/administration/users");
        router.refresh();
      }, 1200);
    } catch (error: any) {
      const detail =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        "Failed to assign user. Please ensure the user has an existing account.";
      setFormError(detail);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newUserData.username.trim()) {
      setFormError("Username is required.");
      return;
    }
    if (!newUserData.email.trim()) {
      setFormError("Email address is required.");
      return;
    }
    if (!newUserData.password) {
      setFormError("Initial password is required.");
      return;
    }
    if (newUserData.password.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }
    if (newUserData.password !== newUserData.confirm_password) {
      setFormError("Passwords do not match.");
      return;
    }
    if (!newUserData.role_id) {
      setFormError("Please select an authorization role.");
      return;
    }

    setLoading(true);
    setFormError("");

    try {
      await api.post("/users/", {
        username: newUserData.username.trim(),
        first_name: newUserData.first_name.trim(),
        last_name: newUserData.last_name.trim(),
        email: newUserData.email.trim().toLowerCase(),
        password: newUserData.password,
        confirm_password: newUserData.confirm_password,
        role_id: Number(newUserData.role_id),
      });

      setSnackbar({
        open: true,
        message: "New staff account created and registered into organization!",
        severity: "success",
      });

      setTimeout(() => {
        router.push("/administration/users");
        router.refresh();
      }, 1200);
    } catch (error: any) {
      let errorMessage = "Failed to create user.";
      const responseData = error.response?.data;
      if (responseData) {
        if (typeof responseData === "string") {
          errorMessage = responseData;
        } else if (responseData.detail) {
          errorMessage = responseData.detail;
        } else {
          const firstKey = Object.keys(responseData)[0];
          if (firstKey && Array.isArray(responseData[firstKey])) {
            errorMessage = `${firstKey.replace(/_/g, " ")}: ${responseData[firstKey][0]}`;
          }
        }
      }
      setFormError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer
      title="Staff Provisioning - Royal SACCO"
      description="Add existing users or provision new staff accounts"
    >
      <Box sx={{ pb: 6 }}>
        {/* Navigation Back Button */}
        <Button
          startIcon={<IconArrowLeft size={18} />}
          onClick={() => router.push("/administration/users")}
          sx={{
            mb: 2.5,
            fontWeight: 700,
            textTransform: "none",
            color: "text.secondary",
            "&:hover": { color: "primary.main", bgcolor: "rgba(37, 99, 235, 0.08)" },
          }}
          disabled={loading}
        >
          Back to Staff Registry
        </Button>

        {/* Executive Hero Banner */}
        <Box
          sx={{
            mb: 4,
            p: { xs: 3, md: 4 },
            borderRadius: 3.5,
            background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 55%, #1d4ed8 100%)",
            color: "#ffffff",
            boxShadow: "0 16px 36px -8px rgba(15, 23, 42, 0.35)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Subtle Ambient Glow */}
          <Box
            sx={{
              position: "absolute",
              top: -60,
              right: -60,
              width: 200,
              height: 200,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(96, 165, 250, 0.3) 0%, rgba(37, 99, 235, 0) 70%)",
              filter: "blur(30px)",
              pointerEvents: "none",
            }}
          />

          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2}>
            <Box>
              <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
                <Box
                  sx={{
                    p: 1.2,
                    bgcolor: "rgba(255, 255, 255, 0.12)",
                    borderRadius: 2.5,
                    display: "flex",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                  }}
                >
                  <IconUserPlus size={28} color="#60a5fa" />
                </Box>
                <Typography variant="h4" fontWeight={800} sx={{ color: "#ffffff", letterSpacing: "-0.5px" }}>
                  Staff Onboarding &amp; Provisioning
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ color: "#cbd5e1", maxWidth: 620, lineHeight: 1.6 }}>
                Assign existing registered user accounts to this organization or provision brand new staff credentials with granular RBAC permissions.
              </Typography>
            </Box>

            <Chip
              icon={<IconSparkles size={16} color="#4ade80" />}
              label="SACCO Workspace Active"
              sx={{
                bgcolor: "rgba(34, 197, 94, 0.15)",
                color: "#4ade80",
                border: "1px solid rgba(34, 197, 94, 0.3)",
                fontWeight: 700,
                backdropFilter: "blur(8px)",
                px: 1,
              }}
            />
          </Stack>
        </Box>

        {/* Global Form Error Banner */}
        {formError && (
          <Alert
            severity="error"
            variant="filled"
            sx={{ mb: 3.5, borderRadius: 2.5, boxShadow: "0 6px 16px rgba(239, 68, 68, 0.2)" }}
            onClose={() => setFormError("")}
          >
            {formError}
          </Alert>
        )}

        {/* Main Dual Grid */}
        <Grid container spacing={3.5}>
          {/* Left Column: Form & Tabs (8 cols) */}
          <Grid size={{ xs: 12, lg: 8 }}>
            <Card
              sx={{
                borderRadius: 3.5,
                border: "1px solid",
                borderColor: "divider",
                boxShadow: "0 8px 30px rgba(0, 0, 0, 0.05)",
                overflow: "hidden",
              }}
            >
              {/* Modern Segmented Navigation Tabs */}
              <Box sx={{ borderBottom: "1px solid", borderColor: "divider", bgcolor: "#f8fafc" }}>
                <Tabs
                  value={activeTab}
                  onChange={(_, val) => {
                    setActiveTab(val);
                    setFormError("");
                  }}
                  variant="fullWidth"
                  sx={{
                    "& .MuiTabs-indicator": {
                      height: 3.5,
                      borderRadius: "3px 3px 0 0",
                      background: activeTab === 0 ? "linear-gradient(90deg, #2563eb, #3b82f6)" : "linear-gradient(90deg, #059669, #10b981)",
                    },
                  }}
                >
                  <Tab
                    icon={<IconLink size={20} />}
                    iconPosition="start"
                    label={
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography fontWeight={700} fontSize="0.95rem">
                          Assign Existing User
                        </Typography>
                        <Chip
                          label="No Password Required"
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: "0.68rem",
                            fontWeight: 700,
                            bgcolor: "rgba(37, 99, 235, 0.1)",
                            color: "#2563eb",
                            display: { xs: "none", sm: "inline-flex" },
                          }}
                        />
                      </Stack>
                    }
                    sx={{
                      py: 2.2,
                      textTransform: "none",
                      color: "text.secondary",
                      "&.Mui-selected": { color: "#2563eb" },
                    }}
                  />

                  <Tab
                    icon={<IconUserPlus size={20} />}
                    iconPosition="start"
                    label={
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography fontWeight={700} fontSize="0.95rem">
                          Create New Account
                        </Typography>
                        <Chip
                          label="New Credentials"
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: "0.68rem",
                            fontWeight: 700,
                            bgcolor: "rgba(16, 185, 129, 0.1)",
                            color: "#059669",
                            display: { xs: "none", sm: "inline-flex" },
                          }}
                        />
                      </Stack>
                    }
                    sx={{
                      py: 2.2,
                      textTransform: "none",
                      color: "text.secondary",
                      "&.Mui-selected": { color: "#059669" },
                    }}
                  />
                </Tabs>
              </Box>

              <CardContent sx={{ p: { xs: 3, md: 4.5 } }}>
                {/* ======================================================== */}
                {/* TAB 0: ASSIGN EXISTING USER                              */}
                {/* ======================================================== */}
                {activeTab === 0 && (
                  <form onSubmit={handleAssignExisting}>
                    {/* Information Banner */}
                    <Box
                      sx={{
                        p: 2.5,
                        mb: 4,
                        borderRadius: 2.5,
                        bgcolor: "rgba(37, 99, 235, 0.05)",
                        border: "1px solid rgba(37, 99, 235, 0.15)",
                        display: "flex",
                        gap: 2,
                        alignItems: "flex-start",
                      }}
                    >
                      <IconInfoCircle size={24} color="#2563eb" style={{ flexShrink: 0, marginTop: 2 }} />
                      <Box>
                        <Typography variant="subtitle2" fontWeight={700} color="#1e40af" mb={0.3}>
                          Instant Organization Linkage
                        </Typography>
                        <Typography variant="body2" color="#334155" lineHeight={1.5}>
                          Add a person who already has an account. You do <strong>not</strong> need their private password. Entering their email or username assigns them directly to this SACCO organization.
                        </Typography>
                      </Box>
                    </Box>

                    <Stack spacing={3.5}>
                      {/* Identifier Input */}
                      <TextField
                        fullWidth
                        required
                        label="User Email Address or Username"
                        placeholder="e.g. karanjak948@gmail.com or peter_kamau"
                        value={existingIdentifier}
                        onChange={(e) => {
                          setExistingIdentifier(e.target.value);
                          if (formError) setFormError("");
                        }}
                        disabled={loading}
                        slotProps={{
                          input: {
                            startAdornment: (
                              <InputAdornment position="start">
                                <IconMail size={20} color="#64748b" />
                              </InputAdornment>
                            ),
                          },
                        }}
                        helperText="Provide the exact email or username registered on the platform."
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2.5,
                            "&:hover fieldset": { borderColor: "#2563eb" },
                          },
                        }}
                      />

                      {/* Role Selector */}
                      <TextField
                        select
                        fullWidth
                        required
                        label="Assign Organization Role"
                        value={existingRoleId}
                        onChange={(e) => setExistingRoleId(e.target.value)}
                        disabled={loading || rolesLoading}
                        slotProps={{
                          input: {
                            startAdornment: (
                              <InputAdornment position="start">
                                <IconShieldCheck size={20} color="#2563eb" />
                              </InputAdornment>
                            ),
                          },
                        }}
                        helperText={rolesLoading ? "Loading roles..." : "Determines the permissions granted to this user."}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2.5,
                          },
                        }}
                      >
                        <MenuItem value="">
                          <em>Select an authorization role</em>
                        </MenuItem>
                        {roles.map((role) => (
                          <MenuItem key={role.id} value={role.id}>
                            <Stack direction="row" alignItems="center" spacing={1.5}>
                              <Typography fontWeight={700}>{role.name}</Typography>
                              {role.description && (
                                <Typography variant="caption" color="text.secondary">
                                  — {role.description}
                                </Typography>
                              )}
                            </Stack>
                          </MenuItem>
                        ))}
                      </TextField>

                      {/* Action Button */}
                      <Box sx={{ pt: 2, display: "flex", justifyContent: "flex-end" }}>
                        <Button
                          variant="contained"
                          type="submit"
                          size="large"
                          disabled={loading}
                          startIcon={
                            loading ? <CircularProgress size={20} color="inherit" /> : <IconLink size={20} />
                          }
                          sx={{
                            px: 4.5,
                            py: 1.5,
                            borderRadius: 2.5,
                            fontWeight: 700,
                            fontSize: "1rem",
                            textTransform: "none",
                            background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                            boxShadow: "0 6px 20px rgba(37, 99, 235, 0.35)",
                            "&:hover": {
                              background: "linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)",
                              boxShadow: "0 8px 24px rgba(37, 99, 235, 0.45)",
                            },
                          }}
                        >
                          {loading ? "Adding to Organization..." : "Add to Organization"}
                        </Button>
                      </Box>
                    </Stack>
                  </form>
                )}

                {/* ======================================================== */}
                {/* TAB 1: CREATE NEW USER                                   */}
                {/* ======================================================== */}
                {activeTab === 1 && (
                  <form onSubmit={handleCreateNew}>
                    {/* Information Banner */}
                    <Box
                      sx={{
                        p: 2.5,
                        mb: 4,
                        borderRadius: 2.5,
                        bgcolor: "rgba(16, 185, 129, 0.06)",
                        border: "1px solid rgba(16, 185, 129, 0.2)",
                        display: "flex",
                        gap: 2,
                        alignItems: "flex-start",
                      }}
                    >
                      <IconSparkles size={24} color="#059669" style={{ flexShrink: 0, marginTop: 2 }} />
                      <Box>
                        <Typography variant="subtitle2" fontWeight={700} color="#065f46" mb={0.3}>
                          Provision Brand New Account
                        </Typography>
                        <Typography variant="body2" color="#334155" lineHeight={1.5}>
                          Create a brand new staff account from scratch. Set an initial password for their first sign-in.
                        </Typography>
                      </Box>
                    </Box>

                    <Grid container spacing={3}>
                      {/* Username */}
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          required
                          label="Username"
                          placeholder="e.g. j_kamau"
                          value={newUserData.username}
                          onChange={(e) =>
                            setNewUserData((prev) => ({ ...prev, username: e.target.value }))
                          }
                          disabled={loading}
                          slotProps={{
                            input: {
                              startAdornment: (
                                <InputAdornment position="start">
                                  <IconUser size={20} color="#64748b" />
                                </InputAdornment>
                              ),
                            },
                          }}
                          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                        />
                      </Grid>

                      {/* Email */}
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          required
                          type="email"
                          label="Email Address"
                          placeholder="e.g. staff@royalltd.co.ke"
                          value={newUserData.email}
                          onChange={(e) =>
                            setNewUserData((prev) => ({ ...prev, email: e.target.value }))
                          }
                          disabled={loading}
                          slotProps={{
                            input: {
                              startAdornment: (
                                <InputAdornment position="start">
                                  <IconMail size={20} color="#64748b" />
                                </InputAdornment>
                              ),
                            },
                          }}
                          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                        />
                      </Grid>

                      {/* First Name */}
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          label="First Name"
                          placeholder="e.g. John"
                          value={newUserData.first_name}
                          onChange={(e) =>
                            setNewUserData((prev) => ({ ...prev, first_name: e.target.value }))
                          }
                          disabled={loading}
                          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                        />
                      </Grid>

                      {/* Last Name */}
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          label="Last Name"
                          placeholder="e.g. Kamau"
                          value={newUserData.last_name}
                          onChange={(e) =>
                            setNewUserData((prev) => ({ ...prev, last_name: e.target.value }))
                          }
                          disabled={loading}
                          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                        />
                      </Grid>

                      {/* Role Selector */}
                      <Grid size={{ xs: 12 }}>
                        <TextField
                          select
                          fullWidth
                          required
                          label="Assign Organization Role"
                          value={newUserData.role_id}
                          onChange={(e) =>
                            setNewUserData((prev) => ({ ...prev, role_id: e.target.value }))
                          }
                          disabled={loading || rolesLoading}
                          slotProps={{
                            input: {
                              startAdornment: (
                                <InputAdornment position="start">
                                  <IconShieldCheck size={20} color="#059669" />
                                </InputAdornment>
                              ),
                            },
                          }}
                          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                        >
                          <MenuItem value="">
                            <em>Select an authorization role</em>
                          </MenuItem>
                          {roles.map((role) => (
                            <MenuItem key={role.id} value={role.id}>
                              <Stack direction="row" alignItems="center" spacing={1.5}>
                                <Typography fontWeight={700}>{role.name}</Typography>
                                {role.description && (
                                  <Typography variant="caption" color="text.secondary">
                                    — {role.description}
                                  </Typography>
                                )}
                              </Stack>
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>

                      {/* Initial Password */}
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          required
                          label="Initial Password"
                          type={showPassword ? "text" : "password"}
                          value={newUserData.password}
                          onChange={(e) =>
                            setNewUserData((prev) => ({ ...prev, password: e.target.value }))
                          }
                          disabled={loading}
                          slotProps={{
                            input: {
                              startAdornment: (
                                <InputAdornment position="start">
                                  <IconLock size={20} color="#64748b" />
                                </InputAdornment>
                              ),
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton
                                    type="button"
                                    edge="end"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                  >
                                    {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                                  </IconButton>
                                </InputAdornment>
                              ),
                            },
                          }}
                          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                        />
                      </Grid>

                      {/* Confirm Password */}
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          required
                          label="Confirm Password"
                          type={showConfirmPassword ? "text" : "password"}
                          value={newUserData.confirm_password}
                          onChange={(e) =>
                            setNewUserData((prev) => ({ ...prev, confirm_password: e.target.value }))
                          }
                          disabled={loading}
                          slotProps={{
                            input: {
                              startAdornment: (
                                <InputAdornment position="start">
                                  <IconLock size={20} color="#64748b" />
                                </InputAdornment>
                              ),
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton
                                    type="button"
                                    edge="end"
                                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                                  >
                                    {showConfirmPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                                  </IconButton>
                                </InputAdornment>
                              ),
                            },
                          }}
                          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                        />
                      </Grid>
                    </Grid>

                    {/* Action Button */}
                    <Box sx={{ pt: 4, display: "flex", justifyContent: "flex-end" }}>
                      <Button
                        variant="contained"
                        type="submit"
                        size="large"
                        disabled={loading}
                        startIcon={
                          loading ? <CircularProgress size={20} color="inherit" /> : <IconUserPlus size={20} />
                        }
                        sx={{
                          px: 4.5,
                          py: 1.5,
                          borderRadius: 2.5,
                          fontWeight: 700,
                          fontSize: "1rem",
                          textTransform: "none",
                          background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                          boxShadow: "0 6px 20px rgba(5, 150, 105, 0.35)",
                          "&:hover": {
                            background: "linear-gradient(135deg, #047857 0%, #065f46 100%)",
                            boxShadow: "0 8px 24px rgba(5, 150, 105, 0.45)",
                          },
                        }}
                      >
                        {loading ? "Creating Account..." : "Create & Add to Organization"}
                      </Button>
                    </Box>
                  </form>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column: Dynamic Role Intelligence & Permissions Preview (4 cols) */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <Stack spacing={3}>
              {/* Role Summary Card */}
              <Card
                sx={{
                  borderRadius: 3.5,
                  border: "1px solid",
                  borderColor: "divider",
                  boxShadow: "0 8px 30px rgba(0, 0, 0, 0.05)",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    p: 2.5,
                    bgcolor: selectedRole?.name === "Owner" ? "rgba(147, 51, 234, 0.08)" : "rgba(37, 99, 235, 0.08)",
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <IconShieldLock
                      size={22}
                      color={selectedRole?.name === "Owner" ? "#9333ea" : "#2563eb"}
                    />
                    <Typography variant="subtitle1" fontWeight={800}>
                      Role Capabilities
                    </Typography>
                  </Stack>
                  {selectedRole && (
                    <Chip
                      label={selectedRole.name}
                      size="small"
                      sx={{
                        fontWeight: 800,
                        bgcolor: selectedRole.name === "Owner" ? "#9333ea" : "#2563eb",
                        color: "#ffffff",
                      }}
                    />
                  )}
                </Box>

                <CardContent sx={{ p: 3 }}>
                  <Typography variant="body2" color="text.secondary" mb={2.5}>
                    {selectedRole?.description || "Select a role to inspect its permissions and operational access scope."}
                  </Typography>

                  <Divider sx={{ mb: 2.5 }} />

                  <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ letterSpacing: 0.5, display: "block", mb: 2 }}>
                    GRANTED CAPABILITIES ({selectedRole?.permissions?.length || 0})
                  </Typography>

                  {selectedRole?.permissions && selectedRole.permissions.length > 0 ? (
                    <Stack spacing={1.5}>
                      {selectedRole.permissions.map((perm) => (
                        <Stack key={perm.id} direction="row" spacing={1.2} alignItems="center">
                          <IconCircleCheck size={18} color="#16a34a" style={{ flexShrink: 0 }} />
                          <Typography variant="body2" fontWeight={600} color="text.primary">
                            {perm.name}
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
                  ) : (
                    <Stack spacing={1.5}>
                      <Stack direction="row" spacing={1.2} alignItems="center">
                        <IconCircleCheck size={18} color="#16a34a" />
                        <Typography variant="body2" color="text.secondary">
                          Standard workspace privileges
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={1.2} alignItems="center">
                        <IconCircleCheck size={18} color="#16a34a" />
                        <Typography variant="body2" color="text.secondary">
                          Controlled member data views
                        </Typography>
                      </Stack>
                    </Stack>
                  )}
                </CardContent>
              </Card>

              {/* Security & Access Notice Card */}
              <Card
                sx={{
                  borderRadius: 3.5,
                  border: "1px solid rgba(245, 158, 11, 0.25)",
                  bgcolor: "rgba(245, 158, 11, 0.04)",
                  p: 3,
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center" mb={1.5}>
                  <IconKey size={22} color="#d97706" />
                  <Typography variant="subtitle2" fontWeight={800} color="#b45309">
                    Security Governance
                  </Typography>
                </Stack>
                <Typography variant="caption" color="#78350f" lineHeight={1.6}>
                  All staff actions are bound to the active organization tenant. Users assigned here cannot access or modify records belonging to other tenants.
                </Typography>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      </Box>

      {/* Modern Snackbar Toast */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4500}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          sx={{
            boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
            borderRadius: 2.5,
            fontWeight: 600,
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </PageContainer>
  );
}
