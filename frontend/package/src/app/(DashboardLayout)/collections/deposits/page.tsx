"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Chip,
  Avatar,
} from "@mui/material";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import { IconBuildingBank, IconLock, IconRefresh, IconSearch, IconShieldCheck, IconWallet } from "@tabler/icons-react";
import memberService from "@/services/member.service";
import { Member } from "@/interfaces/member";
import { getMediaUrl } from "@/utils/media";

export default function SecurityDepositsPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadMembers();
  }, []);

  async function loadMembers() {
    setLoading(true);
    try {
      const data = await memberService.getAll();
      setMembers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = members.filter((m) =>
    `${m.first_name} ${m.other_names}`.toLowerCase().includes(search.toLowerCase()) ||
    m.membership_number?.toLowerCase().includes(search.toLowerCase()) ||
    m.national_id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageContainer title="Security Deposits - Royal SACCO" description="Manage member security deposits & collateral savings">
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        {/* Header Banner */}
        <Box
          sx={{
            mb: 4,
            p: 3,
            borderRadius: 3,
            background: "linear-gradient(135deg, #064e3b 0%, #0f766e 60%, #1e3a8a 100%)",
            color: "#ffffff",
            boxShadow: "0 10px 25px -5px rgba(6, 78, 59, 0.25)",
          }}
        >
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }} spacing={2}>
            <Box>
              <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
                <Box sx={{ p: 1, bgcolor: "rgba(255,255,255,0.15)", borderRadius: 2, display: "flex" }}>
                  <IconBuildingBank size={26} color="#6ee7b7" />
                </Box>
                <Typography variant="h4" fontWeight={800} sx={{ color: "#ffffff", letterSpacing: "-0.5px" }}>
                  Member Security Deposits
                </Typography>
              </Stack>
              <Typography variant="body1" sx={{ color: "#cbd5e1", maxWidth: 650 }}>
                Track mandatory security deposits, savings multipliers, and collateral held against active loan accounts.
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={<IconRefresh size={18} />}
              onClick={loadMembers}
              disabled={loading}
              sx={{
                bgcolor: "rgba(255, 255, 255, 0.2)",
                color: "#ffffff",
                backdropFilter: "blur(10px)",
                fontWeight: 700,
                textTransform: "none",
                "&:hover": { bgcolor: "rgba(255, 255, 255, 0.3)" },
              }}
            >
              Refresh Data
            </Button>
          </Stack>
        </Box>

        {/* Metric Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>TOTAL MEMBERS WITH DEPOSITS</Typography>
                    <Typography variant="h4" fontWeight={800} color="success.main" mt={0.5}>
                      {members.length} Members
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.5, bgcolor: "success.light", color: "success.main", borderRadius: 2 }}>
                    <IconShieldCheck size={28} />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>COLLATERAL COVERAGE RATIO</Typography>
                    <Typography variant="h4" fontWeight={800} color="primary.main" mt={0.5}>
                      100% Backed
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.5, bgcolor: "primary.light", color: "primary.main", borderRadius: 2 }}>
                    <IconLock size={28} />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>SAVINGS MULTIPLIER</Typography>
                    <Typography variant="h4" fontWeight={800} color="warning.main" mt={0.5}>
                      3x Limit
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.5, bgcolor: "warning.light", color: "warning.main", borderRadius: 2 }}>
                    <IconWallet size={28} />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Member Deposit Registry Table */}
        <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2} mb={2.5}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ p: 1, bgcolor: "success.light", borderRadius: 1.5, color: "success.main", display: "flex" }}>
                  <IconLock size={22} />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    Member Deposit Registry ({members.length})
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Individual member deposit balances and clearance eligibility
                  </Typography>
                </Box>
              </Stack>
              <TextField
                size="small"
                placeholder="Search member name / number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: <IconSearch size={16} style={{ marginRight: 8, color: "#94a3b8" }} />,
                  },
                }}
                sx={{ width: { xs: "100%", sm: 280 } }}
              />
            </Stack>

            <Divider sx={{ mb: 2 }} />

            {loading ? (
              <Box display="flex" justifyContent="center" py={8}>
                <CircularProgress />
              </Box>
            ) : filtered.length === 0 ? (
              <Box textAlign="center" py={6}>
                <Typography variant="body2" color="text.secondary">
                  No members found matching search.
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: "grey.100" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Member</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Membership #</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>National ID</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Phone Number</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Deposit Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filtered.map((m) => (
                      <TableRow key={m.id} hover>
                        <TableCell>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar
                              src={getMediaUrl(m.passport_photo)}
                              sx={{ width: 32, height: 32, fontSize: 13, fontWeight: 700, bgcolor: "primary.main" }}
                            >
                              {m.first_name?.charAt(0)}
                            </Avatar>
                            <Typography variant="body2" fontWeight={600}>
                              {m.first_name} {m.other_names}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{m.membership_number || `RC-${m.id}`}</TableCell>
                        <TableCell>{m.national_id}</TableCell>
                        <TableCell>{m.phone_number}</TableCell>
                        <TableCell>{m.category_name || "General"}</TableCell>
                        <TableCell align="center">
                          <Chip
                            label="Active Held"
                            size="small"
                            color="success"
                            sx={{ fontSize: "0.72rem", fontWeight: 700 }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Box>
    </PageContainer>
  );
}
