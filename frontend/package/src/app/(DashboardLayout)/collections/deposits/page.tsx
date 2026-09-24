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
import ExportButton from "@/components/common/ExportButton";
import { ExportColumn } from "@/utils/exportGrid";

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

  const exportColumns: ExportColumn<Member>[] = [
    { header: "Membership #", accessor: (row) => row.membership_number || `RC-${row.id}` },
    { header: "Member Name", accessor: (row) => `${row.first_name} ${row.other_names}`.trim() },
    { header: "National ID", accessor: (row) => row.national_id || "N/A" },
    { header: "Phone Number", accessor: (row) => row.phone_number || "N/A" },
    { header: "Category", accessor: (row) => row.category_name || "General" },
    { header: "Deposit Status", accessor: () => "Active Held" },
  ];

  return (
    <PageContainer title="Security Deposits - Royal SACCO" description="Manage member security deposits & collateral savings">
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        {/* Header Banner */}
        <Box
          sx={{
            mb: 3.5,
            p: 3.5,
            borderRadius: 3,
            background: "linear-gradient(135deg, #022c22 0%, #064e3b 60%, #0f172a 100%)",
            color: "#ffffff",
            boxShadow: "0 12px 28px -6px rgba(2, 44, 34, 0.35)",
          }}
        >
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }} spacing={2}>
            <Box>
              <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
                <Box sx={{ p: 1, bgcolor: "rgba(255,255,255,0.18)", borderRadius: 2, display: "flex" }}>
                  <IconBuildingBank size={26} color="#6ee7b7" />
                </Box>
                <Typography variant="h4" fontWeight={800} sx={{ color: "#ffffff", letterSpacing: "-0.5px" }}>
                  Member Security Deposits
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ color: "#d1fae5", maxWidth: 680 }}>
                Track mandatory security deposits, savings multipliers, and collateral reserves pledged against active member loan portfolios.
              </Typography>
            </Box>

            <Button
              variant="outlined"
              startIcon={<IconRefresh size={18} />}
              onClick={loadMembers}
              disabled={loading}
              sx={{
                borderColor: "rgba(255,255,255,0.4)",
                color: "#ffffff",
                fontWeight: 600,
                textTransform: "none",
                "&:hover": { borderColor: "#ffffff", bgcolor: "rgba(255,255,255,0.1)" },
              }}
            >
              Refresh Data
            </Button>
          </Stack>
        </Box>

        {/* Metric Cards */}
        <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card
              elevation={0}
              sx={{
                bgcolor: "#ffffff",
                border: "1px solid #e2e8f0",
                borderTop: "3px solid #059669",
                borderRadius: 2.5,
                boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" sx={{ color: "#065f46", fontWeight: 700, letterSpacing: 0.5 }}>
                      TOTAL MEMBERS WITH DEPOSITS
                    </Typography>
                    <Typography variant="h4" fontWeight={800} sx={{ color: "#047857", mt: 0.5 }}>
                      {members.length} Members
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" mt={0.25}>
                      Active collateralized accounts
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.5, bgcolor: "#ecfdf5", color: "#059669", borderRadius: 2 }}>
                    <IconShieldCheck size={26} />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card
              elevation={0}
              sx={{
                bgcolor: "#ffffff",
                border: "1px solid #e2e8f0",
                borderTop: "3px solid #0284c7",
                borderRadius: 2.5,
                boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" sx={{ color: "#0369a1", fontWeight: 700, letterSpacing: 0.5 }}>
                      COLLATERAL COVERAGE RATIO
                    </Typography>
                    <Typography variant="h4" fontWeight={800} sx={{ color: "#0f172a", mt: 0.5 }}>
                      100% Backed
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" mt={0.25}>
                      Statutory SACCO guarantee
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.5, bgcolor: "#f0f9ff", color: "#0284c7", borderRadius: 2 }}>
                    <IconLock size={26} />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card
              elevation={0}
              sx={{
                bgcolor: "#ffffff",
                border: "1px solid #e2e8f0",
                borderTop: "3px solid #d97706",
                borderRadius: 2.5,
                boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" sx={{ color: "#b45309", fontWeight: 700, letterSpacing: 0.5 }}>
                      SAVINGS MULTIPLIER
                    </Typography>
                    <Typography variant="h4" fontWeight={800} sx={{ color: "#b45309", mt: 0.5 }}>
                      3x Limit
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" mt={0.25}>
                      Borrowing capacity multiplier
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.5, bgcolor: "#fffbeb", color: "#d97706", borderRadius: 2 }}>
                    <IconWallet size={26} />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Member Deposit Registry Table */}
        <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2.5, boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2} mb={2.5}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ p: 1, bgcolor: "#ecfdf5", borderRadius: 1.5, color: "#059669", display: "flex" }}>
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
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: { xs: "100%", sm: "auto" } }}>
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
                  sx={{ width: { xs: "100%", sm: 260 } }}
                />
                <ExportButton
                  data={filtered}
                  columns={exportColumns}
                  filename="member_security_deposits"
                  title="Royal SACCO - Member Security Deposits Registry"
                  size="small"
                />
              </Stack>
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
              <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: "#f8fafc" }}>
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
                              sx={{ width: 32, height: 32, fontSize: 13, fontWeight: 700, bgcolor: "#059669" }}
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
                            sx={{
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              bgcolor: "#ecfdf5",
                              color: "#065f46",
                              border: "1px solid #a7f3d0",
                            }}
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
