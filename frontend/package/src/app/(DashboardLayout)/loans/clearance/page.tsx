"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  InputAdornment,
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
  Tooltip,
} from "@mui/material";
import {
  IconCertificate,
  IconRefresh,
  IconArrowLeft,
  IconPrinter,
  IconCheck,
  IconSearch,
  IconShieldCheck,
  IconAward,
  IconEye,
  IconCoins,
  IconBuildingBank,
} from "@tabler/icons-react";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import LoanClearanceCertificateModal, {
  ClearanceCertificateData,
} from "@/components/loans/LoanClearanceCertificateModal";
import CertificateService from "@/services/certificate.service";

export default function LoanClearancePage() {
  const router = useRouter();
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "cleared" | "active">("all");
  const [issuedRegistry, setIssuedRegistry] = useState<Record<string, ClearanceCertificateData>>({});

  // Certificate Modal State
  const [selectedCertificate, setSelectedCertificate] = useState<ClearanceCertificateData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchClearance = () => {
    setLoading(true);
    fetch("/api/loans")
      .then((res) => res.json())
      .then((data) => {
        setLoans(Array.isArray(data) ? data : []);
        setIssuedRegistry(CertificateService.getAllIssuedCertificates());
      })
      .catch((err) => console.warn("Error fetching loans for clearance:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchClearance();
  }, []);

  // Handle Certificate Generation / Preview
  const handleIssueCertificate = async (loan: any) => {
    try {
      // If loan detail has more data (e.g. national ID), try fetching full loan details
      let fullLoanData = loan;
      try {
        const detailRes = await fetch(`/api/loans/${loan.id}`).then((r) => r.json());
        if (detailRes && detailRes.id) {
          fullLoanData = { ...loan, ...detailRes };
        }
      } catch {
        // Fallback to existing loan list data
      }

      const certData = CertificateService.issueOrGetCertificate(fullLoanData);
      setIssuedRegistry(CertificateService.getAllIssuedCertificates());
      setSelectedCertificate(certData);
      setModalOpen(true);
    } catch (err) {
      console.warn("Failed to generate certificate:", err);
    }
  };

  // Metrics
  const stats = useMemo(() => {
    let clearedCount = 0;
    let clearedPrincipal = 0;
    let activeCount = 0;

    loans.forEach((l) => {
      const isCleared = Number(l.outstanding_balance || 0) <= 0 || l.status === "closed";
      if (isCleared) {
        clearedCount++;
        clearedPrincipal += Number(l.principal_amount || 0);
      } else {
        activeCount++;
      }
    });

    const issuedCount = Object.keys(issuedRegistry).length;

    return {
      clearedCount,
      clearedPrincipal,
      activeCount,
      issuedCount,
    };
  }, [loans, issuedRegistry]);

  // Filtered Loans
  const filteredLoans = useMemo(() => {
    return loans.filter((l) => {
      const isCleared = Number(l.outstanding_balance || 0) <= 0 || l.status === "closed";
      if (filterMode === "cleared" && !isCleared) return false;
      if (filterMode === "active" && isCleared) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const loanNo = (l.loan_number || "").toLowerCase();
        const mName = (l.member_name || "").toLowerCase();
        const mNo = (l.membership_number || "").toLowerCase();
        const pName = (l.product_name || "").toLowerCase();
        if (!loanNo.includes(q) && !mName.includes(q) && !mNo.includes(q) && !pName.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [loans, filterMode, searchQuery]);

  return (
    <PageContainer
      title="Loan Clearance Certificates - Royal SACCO"
      description="Generate and issue official tamper-proof loan clearance certificates upon full repayment"
    >
      <Container maxWidth={false} sx={{ px: { xs: 1.5, md: 3 }, py: 2 }}>
        <Stack spacing={3}>
          {/* Executive Hero Banner */}
          <Paper
            elevation={0}
            className="no-print"
            sx={{
              p: { xs: 2.5, sm: 3.5 },
              borderRadius: 3.5,
              background: "linear-gradient(135deg, #064e3b 0%, #047857 50%, #059669 100%)",
              color: "#ffffff",
              boxShadow: "0 10px 28px rgba(6, 78, 59, 0.25)",
            }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2.5}
              alignItems={{ xs: "flex-start", md: "center" }}
              justifyContent="space-between"
            >
              <Stack direction="row" spacing={2.5} alignItems="center">
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: 2.5,
                    bgcolor: "rgba(255, 255, 255, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  }}
                >
                  <IconAward size={30} stroke={2.5} />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight={900} sx={{ color: "#ffffff", letterSpacing: "-0.5px" }}>
                    Loan Clearance Certificates
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#a7f3d0", fontWeight: 500, mt: 0.3 }}>
                    Official SACCO legal instruments confirming zero outstanding liabilities, guarantor discharge, and collateral release
                  </Typography>
                </Box>
              </Stack>

              <Stack direction="row" spacing={1.5}>
                <Button
                  variant="outlined"
                  startIcon={<IconRefresh size={18} />}
                  onClick={fetchClearance}
                  sx={{
                    color: "#ffffff",
                    borderColor: "rgba(255,255,255,0.4)",
                    borderRadius: 2,
                    fontWeight: 700,
                    textTransform: "none",
                    "&:hover": {
                      borderColor: "#ffffff",
                      bgcolor: "rgba(255,255,255,0.1)",
                    },
                  }}
                >
                  Refresh
                </Button>
                <Button
                  variant="contained"
                  startIcon={<IconArrowLeft size={18} />}
                  onClick={() => router.push("/loans")}
                  sx={{
                    bgcolor: "#ffffff",
                    color: "#064e3b",
                    borderRadius: 2,
                    fontWeight: 800,
                    textTransform: "none",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    "&:hover": { bgcolor: "#f0fdf4" },
                  }}
                >
                  Back To Loans
                </Button>
              </Stack>
            </Stack>
          </Paper>

          {/* Executive Stats Row */}
          <Grid container spacing={2.5} className="no-print">
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 2.5,
                  border: "1px solid #e2e8f0",
                  bgcolor: "#ffffff",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                }}
              >
                <Box sx={{ height: 4, bgcolor: "#059669" }} />
                <CardContent sx={{ p: 2.5 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                      CLEARED FACILITIES
                    </Typography>
                    <Box sx={{ p: 0.75, borderRadius: 1.5, bgcolor: "#ecfdf5", color: "#059669" }}>
                      <IconCheck size={18} />
                    </Box>
                  </Stack>
                  <Typography variant="h5" fontWeight={800} color="#0f172a" mt={1}>
                    {stats.clearedCount} Loans
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                    Zero outstanding balance
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 2.5,
                  border: "1px solid #e2e8f0",
                  bgcolor: "#ffffff",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                }}
              >
                <Box sx={{ height: 4, bgcolor: "#b45309" }} />
                <CardContent sx={{ p: 2.5 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                      TOTAL LIQUIDATED DEBT
                    </Typography>
                    <Box sx={{ p: 0.75, borderRadius: 1.5, bgcolor: "#fef3c7", color: "#b45309" }}>
                      <IconCoins size={18} />
                    </Box>
                  </Stack>
                  <Typography variant="h5" fontWeight={800} color="#0f172a" mt={1}>
                    KES {stats.clearedPrincipal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                    Principal fully settled
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 2.5,
                  border: "1px solid #e2e8f0",
                  bgcolor: "#ffffff",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                }}
              >
                <Box sx={{ height: 4, bgcolor: "#2563eb" }} />
                <CardContent sx={{ p: 2.5 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                      ORIGINAL CERTIFICATES ISSUED
                    </Typography>
                    <Box sx={{ p: 0.75, borderRadius: 1.5, bgcolor: "#eff6ff", color: "#2563eb" }}>
                      <IconCertificate size={18} />
                    </Box>
                  </Stack>
                  <Typography variant="h5" fontWeight={800} color="#2563eb" mt={1}>
                    {stats.issuedCount} Certificates
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                    Encrypted digital originals
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 2.5,
                  border: "1px solid #e2e8f0",
                  bgcolor: "#ffffff",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                }}
              >
                <Box sx={{ height: 4, bgcolor: "#d97706" }} />
                <CardContent sx={{ p: 2.5 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                      ACTIVE IN-PROGRESS
                    </Typography>
                    <Box sx={{ p: 0.75, borderRadius: 1.5, bgcolor: "#fffbeb", color: "#d97706" }}>
                      <IconBuildingBank size={18} />
                    </Box>
                  </Stack>
                  <Typography variant="h5" fontWeight={800} color="#0f172a" mt={1}>
                    {stats.activeCount} Loans
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                    Ongoing amortization
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Clearance Registry Table */}
          <Paper
            elevation={0}
            className="no-print"
            sx={{
              borderRadius: 3.5,
              border: "1px solid #e2e8f0",
              bgcolor: "#ffffff",
              boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.05)",
              overflow: "hidden",
            }}
          >
            {/* Table Search & Filter Bar */}
            <Box sx={{ p: 2.5, borderBottom: "1px solid #e2e8f0", bgcolor: "#f8fafc" }}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", sm: "center" }}
                spacing={2}
              >
                <Stack direction="row" spacing={1}>
                  <Chip
                    label="All Accounts"
                    onClick={() => setFilterMode("all")}
                    color={filterMode === "all" ? "primary" : "default"}
                    sx={{ fontWeight: 700 }}
                  />
                  <Chip
                    label={`Cleared (${stats.clearedCount})`}
                    onClick={() => setFilterMode("cleared")}
                    color={filterMode === "cleared" ? "success" : "default"}
                    sx={{ fontWeight: 700 }}
                  />
                  <Chip
                    label={`Active (${stats.activeCount})`}
                    onClick={() => setFilterMode("active")}
                    color={filterMode === "active" ? "warning" : "default"}
                    sx={{ fontWeight: 700 }}
                  />
                </Stack>

                <TextField
                  size="small"
                  placeholder="Search by loan #, member name, or product..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <IconSearch size={16} color="#64748b" />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{ width: { xs: "100%", sm: 340 } }}
                />
              </Stack>
            </Box>

            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" py={10}>
                <CircularProgress color="primary" />
              </Box>
            ) : filteredLoans.length === 0 ? (
              <Box textAlign="center" py={8}>
                <IconCertificate size={48} color="#94a3b8" />
                <Typography variant="h6" fontWeight={700} sx={{ color: "#475569", mt: 1.5 }}>
                  No Matching Loan Accounts Found
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748b", mt: 0.5 }}>
                  Loans that are fully repaid will appear here ready for professional clearance certification.
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table sx={{ minWidth: 900 }}>
                  <TableHead sx={{ bgcolor: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800, color: "#1e293b", py: 2 }}>Loan #</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: "#1e293b", py: 2 }}>Member Particulars</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: "#1e293b", py: 2 }}>Loan Product</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: "#1e293b", py: 2 }} align="right">
                        Principal Granted
                      </TableCell>
                      <TableCell sx={{ fontWeight: 800, color: "#1e293b", py: 2 }} align="right">
                        Balance
                      </TableCell>
                      <TableCell sx={{ fontWeight: 800, color: "#1e293b", py: 2 }} align="center">
                        Clearance Status
                      </TableCell>
                      <TableCell sx={{ fontWeight: 800, color: "#1e293b", py: 2 }} align="center">
                        Official Action
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredLoans.map((l) => {
                      const isCleared = Number(l.outstanding_balance || 0) <= 0 || l.status === "closed";
                      const loanNumber = l.loan_number || `LN-${l.id}`;
                      const hasExistingCert = !!issuedRegistry[loanNumber];
                      const certRecord = issuedRegistry[loanNumber];

                      const memberDisplayName =
                        l.member_name ||
                        (l.member ? `${l.member.first_name || ""} ${l.member.other_names || ""}`.trim() : "") ||
                        `Member #${l.member_id || l.member || "N/A"}`;

                      const membershipNo =
                        l.membership_number ||
                        l.member?.membership_number ||
                        `RC-${String(l.member_id || l.member || 1).padStart(6, "0")}`;

                      return (
                        <TableRow
                          key={l.id}
                          hover
                          sx={{ transition: "all 0.2s ease", "&:hover": { bgcolor: "#f8fafc" } }}
                        >
                          <TableCell sx={{ fontWeight: 800, fontFamily: "monospace", color: "#065f46" }}>
                            {loanNumber}
                          </TableCell>

                          <TableCell>
                            <Typography variant="body2" fontWeight={800} color="#0f172a">
                              {memberDisplayName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                              {membershipNo} • {l.member_phone || "Mobile on file"}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            <Typography variant="body2" fontWeight={600} color="#334155">
                              {l.product_name || "Member Loan"}
                            </Typography>
                          </TableCell>

                          <TableCell align="right" sx={{ fontWeight: 800, fontFamily: "monospace", color: "#0f172a" }}>
                            KES {Number(l.principal_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </TableCell>

                          <TableCell
                            align="right"
                            sx={{
                              color: isCleared ? "#059669" : "#dc2626",
                              fontWeight: 900,
                              fontFamily: "monospace",
                            }}
                          >
                            KES {Number(l.outstanding_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </TableCell>

                          <TableCell align="center">
                            {hasExistingCert ? (
                              <Tooltip title={`Issued with Serial: ${certRecord.certificateNumber}`}>
                                <Chip
                                  icon={<IconAward size={14} color="#047857" />}
                                  label="Official Certificate Issued"
                                  size="small"
                                  sx={{
                                    fontSize: "0.72rem",
                                    fontWeight: 800,
                                    bgcolor: "#ecfdf5",
                                    color: "#047857",
                                    border: "1px solid #a7f3d0",
                                  }}
                                />
                              </Tooltip>
                            ) : isCleared ? (
                              <Chip
                                icon={<IconCheck size={14} color="#059669" />}
                                label="Cleared • Ready to Issue"
                                size="small"
                                sx={{
                                  fontSize: "0.72rem",
                                  fontWeight: 800,
                                  bgcolor: "#ecfdf5",
                                  color: "#059669",
                                  border: "1px solid #a7f3d0",
                                }}
                              />
                            ) : (
                              <Chip
                                label="Active In-Progress"
                                size="small"
                                sx={{
                                  fontSize: "0.72rem",
                                  fontWeight: 800,
                                  bgcolor: "#fffbeb",
                                  color: "#d97706",
                                  border: "1px solid #fde68a",
                                }}
                              />
                            )}
                          </TableCell>

                          <TableCell align="center">
                            {isCleared ? (
                              <Button
                                size="small"
                                variant="contained"
                                startIcon={hasExistingCert ? <IconEye size={16} /> : <IconPrinter size={16} />}
                                onClick={() => handleIssueCertificate(l)}
                                sx={{
                                  fontWeight: 800,
                                  borderRadius: 2,
                                  fontSize: "0.75rem",
                                  textTransform: "none",
                                  bgcolor: hasExistingCert ? "#064e3b" : "#059669",
                                  color: "#ffffff",
                                  boxShadow: hasExistingCert
                                    ? "0 2px 8px rgba(6, 78, 59, 0.3)"
                                    : "0 2px 8px rgba(5, 150, 105, 0.3)",
                                  "&:hover": {
                                    bgcolor: hasExistingCert ? "#043e2f" : "#047857",
                                  },
                                }}
                              >
                                {hasExistingCert ? "View Original Certificate" : "Issue Certificate"}
                              </Button>
                            ) : (
                              <Button
                                size="small"
                                variant="outlined"
                                disabled
                                sx={{
                                  fontWeight: 700,
                                  borderRadius: 2,
                                  fontSize: "0.72rem",
                                  textTransform: "none",
                                }}
                              >
                                Not Cleared
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Stack>
      </Container>

      {/* Official Certificate Modal with Exclusive Print CSS */}
      <LoanClearanceCertificateModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        certificate={selectedCertificate}
      />
    </PageContainer>
  );
}
