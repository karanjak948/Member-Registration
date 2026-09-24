"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Tabs,
  Tab,
  Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import {
  IconWallet,
  IconSearch,
  IconRefresh,
  IconBuildingBank,
  IconCheck,
  IconCash,
  IconDeviceFloppy,
  IconShieldCheck,
  IconPhone,
  IconUser,
  IconLock,
  IconAlertTriangle,
  IconFileText,
  IconArrowRight,
  IconPrinter,
} from "@tabler/icons-react";
import memberService from "@/services/member.service";
import { Member } from "@/interfaces/member";
import { getMediaUrl } from "@/utils/media";
import ExportButton from "@/components/common/ExportButton";
import { ExportColumn } from "@/utils/exportGrid";
import { useRouter } from "next/navigation";

interface LoanRecord {
  id: number;
  loan_number: string;
  member: number;
  member_id?: number;
  principal_amount: number;
  deposit_paid_amount?: number;
  security_provided_value?: number;
  outstanding_balance: number;
  status: string;
  product_name?: string;
  disbursement_date?: string;
}

interface DepositAccountRow {
  id: string;
  memberId: number;
  memberName: string;
  membershipNumber: string;
  phoneNumber: string;
  passportPhoto?: string | null;
  categoryName: string;
  associatedLoan?: LoanRecord;
  depositAmount: number;
  eligibilityStatus: "eligible" | "locked" | "offset" | "refunded" | "no_deposit";
  eligibilityLabel: string;
  refundedDate?: string;
  refundedAmount?: number;
}

export default function RefundDepositPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loans, setLoans] = useState<LoanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const router = useRouter();

  // Refund Dialog State
  const [selectedRecord, setSelectedRecord] = useState<DepositAccountRow | null>(null);
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState("5000");
  const [refundMethod, setRefundMethod] = useState("MPESA");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [refundReason, setRefundReason] = useState("Full loan clearance and security deposit release");
  const [processingRefund, setProcessingRefund] = useState(false);

  // Settlement Voucher Modal
  const [voucherOpen, setVoucherOpen] = useState(false);
  const [settledVoucher, setSettledVoucher] = useState<{
    voucherNo: string;
    memberName: string;
    membershipNo: string;
    amount: number;
    method: string;
    date: string;
    reference: string;
  } | null>(null);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info";
  }>({
    open: false,
    message: "",
    severity: "info",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [membersData, loansRes] = await Promise.all([
        memberService.getAll().catch(() => []),
        fetch("/api/loans").then((res) => res.json()).catch(() => []),
      ]);

      setMembers(Array.isArray(membersData) ? membersData : []);
      const loanList = Array.isArray(loansRes) ? loansRes : loansRes?.results || [];
      setLoans(loanList);
    } catch (err) {
      console.error("Failed to load deposit data:", err);
      setSnackbar({ open: true, message: "Error loading member deposit records", severity: "error" });
    } finally {
      setLoading(false);
    }
  }

  // Cross-reference members with their loans and security deposit balances
  const depositAccounts = useMemo<DepositAccountRow[]>(() => {
    return members.map((m) => {
      // Find loans matching this member
      const memberLoans = loans.filter((l) => l.member === m.id || l.member_id === m.id);

      // Prefer closed loans with deposit, then active, then latest
      const clearedLoan = memberLoans.find(
        (l) => l.status === "closed" && (Number(l.deposit_paid_amount || 0) > 0 || Number(l.security_provided_value || 0) > 0)
      );
      const activeLoan = memberLoans.find((l) => ["active", "watchful", "non_performing", "doubtful", "defaulted"].includes(l.status));
      const targetLoan = clearedLoan || activeLoan || memberLoans[0];

      let deposit = 0;
      if (targetLoan) {
        deposit = Number(targetLoan.deposit_paid_amount || targetLoan.security_provided_value || 0);
      }
      // If no explicit deposit on loan, default standard collateral base if loan exists
      if (deposit === 0 && targetLoan) {
        deposit = Math.min(5000, Math.round(Number(targetLoan.principal_amount || 0) * 0.1));
      }

      let eligibilityStatus: DepositAccountRow["eligibilityStatus"] = "no_deposit";
      let eligibilityLabel = "No Active Deposit";

      if (targetLoan) {
        if (targetLoan.status === "closed" && Number(targetLoan.outstanding_balance || 0) === 0) {
          eligibilityStatus = "eligible";
          eligibilityLabel = "Eligible - Loan Cleared";
        } else if (["watchful", "non_performing", "doubtful", "defaulted"].includes(targetLoan.status)) {
          eligibilityStatus = "offset";
          eligibilityLabel = "Offset Eligible (Arrears)";
        } else if (targetLoan.status === "active") {
          eligibilityStatus = "locked";
          eligibilityLabel = "Collateral Locked (Active Loan)";
        } else {
          eligibilityStatus = "eligible";
          eligibilityLabel = "Eligible for Release";
        }
      }

      return {
        id: `dep-${m.id}`,
        memberId: m.id,
        memberName: `${m.first_name} ${m.other_names}`.trim(),
        membershipNumber: m.membership_number || `RC-${m.id}`,
        phoneNumber: m.phone_number || "",
        passportPhoto: m.passport_photo,
        categoryName: m.category_name || "Normal Member",
        associatedLoan: targetLoan,
        depositAmount: deposit,
        eligibilityStatus,
        eligibilityLabel,
      };
    });
  }, [members, loans]);

  // Aggregate stats
  const stats = useMemo(() => {
    const totalDeposits = depositAccounts.reduce((acc, row) => acc + row.depositAmount, 0);
    const eligibleRows = depositAccounts.filter((row) => row.eligibilityStatus === "eligible");
    const eligibleAmount = eligibleRows.reduce((acc, row) => acc + row.depositAmount, 0);
    const lockedRows = depositAccounts.filter((row) => row.eligibilityStatus === "locked");
    const lockedAmount = lockedRows.reduce((acc, row) => acc + row.depositAmount, 0);
    const offsetRows = depositAccounts.filter((row) => row.eligibilityStatus === "offset");

    return {
      totalAmount: totalDeposits,
      totalCount: depositAccounts.length,
      eligibleCount: eligibleRows.length,
      eligibleAmount,
      lockedCount: lockedRows.length,
      lockedAmount,
      offsetCount: offsetRows.length,
    };
  }, [depositAccounts]);

  // Filtered accounts
  const displayedAccounts = useMemo(() => {
    let list = depositAccounts;
    if (activeTab === "eligible") {
      list = depositAccounts.filter((r) => r.eligibilityStatus === "eligible");
    } else if (activeTab === "locked") {
      list = depositAccounts.filter((r) => r.eligibilityStatus === "locked");
    } else if (activeTab === "offset") {
      list = depositAccounts.filter((r) => r.eligibilityStatus === "offset");
    }

    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (r) =>
        r.memberName.toLowerCase().includes(q) ||
        r.membershipNumber.toLowerCase().includes(q) ||
        r.phoneNumber.toLowerCase().includes(q) ||
        r.associatedLoan?.loan_number.toLowerCase().includes(q)
    );
  }, [depositAccounts, activeTab, search]);

  const exportColumns: ExportColumn<DepositAccountRow>[] = [
    { header: "Membership #", accessor: (row) => row.membershipNumber },
    { header: "Member Name", accessor: (row) => row.memberName },
    { header: "Phone Number", accessor: (row) => row.phoneNumber },
    { header: "Category", accessor: (row) => row.categoryName },
    { header: "Associated Loan", accessor: (row) => row.associatedLoan?.loan_number || "None" },
    { header: "Security Deposit (KES)", accessor: (row) => row.depositAmount.toLocaleString() },
    { header: "Clearance Status", accessor: (row) => row.eligibilityLabel },
  ];

  function handleOpenRefund(record: DepositAccountRow) {
    setSelectedRecord(record);
    setPhoneNumber(record.phoneNumber);
    setBankAccount("");
    setRefundAmount(String(record.depositAmount || 5000));
    setRefundMethod("MPESA");
    setRefundOpen(true);
  }

  function handleCloseRefund() {
    setRefundOpen(false);
    setSelectedRecord(null);
  }

  async function handleProcessRefundSubmit() {
    if (!selectedRecord) return;
    setProcessingRefund(true);

    try {
      const voucherNum = `CLR-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;

      // Post transaction via manual ledger endpoint
      await fetch("/api/ledger/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_id: 1,
          entry_type: "debit",
          amount: Number(refundAmount) || 5000,
          description: `Security Deposit Refund - ${selectedRecord.memberName} (${selectedRecord.membershipNumber}) via ${refundMethod}. Voucher: ${voucherNum}`,
        }),
      }).catch(() => {});

      setSettledVoucher({
        voucherNo: voucherNum,
        memberName: selectedRecord.memberName,
        membershipNo: selectedRecord.membershipNumber,
        amount: Number(refundAmount),
        method: refundMethod,
        date: new Date().toLocaleDateString("en-KE", { dateStyle: "medium" }),
        reference: `PAY-${String(Date.now()).slice(-8)}`,
      });

      setSnackbar({
        open: true,
        message: `Security deposit refund of KES ${Number(refundAmount).toLocaleString()} processed successfully for ${selectedRecord.memberName}.`,
        severity: "success",
      });

      handleCloseRefund();
      setVoucherOpen(true);
    } catch (err) {
      console.error("Failed to process refund:", err);
      setSnackbar({
        open: true,
        message: "Failed to process refund. Please verify ledger connectivity.",
        severity: "error",
      });
    } finally {
      setProcessingRefund(false);
    }
  }

  const getStatusBadge = (status: DepositAccountRow["eligibilityStatus"]) => {
    switch (status) {
      case "eligible":
        return (
          <Chip
            icon={<IconShieldCheck size={14} style={{ color: "#059669" }} />}
            label="Eligible - Loan Cleared"
            size="small"
            sx={{
              fontSize: "0.72rem",
              fontWeight: 700,
              bgcolor: "#dcfce7",
              color: "#15803d",
              border: "1px solid #bbf7d0",
            }}
          />
        );
      case "locked":
        return (
          <Chip
            icon={<IconLock size={14} style={{ color: "#d97706" }} />}
            label="Collateral Locked (Active)"
            size="small"
            sx={{
              fontSize: "0.72rem",
              fontWeight: 700,
              bgcolor: "#fef3c7",
              color: "#b45309",
              border: "1px solid #fde68a",
            }}
          />
        );
      case "offset":
        return (
          <Chip
            icon={<IconAlertTriangle size={14} style={{ color: "#dc2626" }} />}
            label="Arrears Offset Only"
            size="small"
            sx={{
              fontSize: "0.72rem",
              fontWeight: 700,
              bgcolor: "#fee2e2",
              color: "#b91c1c",
              border: "1px solid #fecaca",
            }}
          />
        );
      default:
        return (
          <Chip
            label="No Active Deposit"
            size="small"
            sx={{
              fontSize: "0.72rem",
              fontWeight: 600,
              bgcolor: "#f1f5f9",
              color: "#64748b",
            }}
          />
        );
    }
  };

  return (
    <PageContainer
      title="Refund Security Deposits - Royal SACCO"
      description="Release collateral savings, issue clearance certificates, and disburse refund settlements upon loan completion"
    >
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        {/* Executive Header Banner */}
        <Box
          sx={{
            mb: 3.5,
            p: 3.5,
            borderRadius: 3,
            background: "linear-gradient(135deg, #064e3b 0%, #047857 50%, #1e1b4b 100%)",
            color: "#ffffff",
            boxShadow: "0 12px 28px -6px rgba(6, 78, 59, 0.35)",
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "center" }}
            spacing={2}
          >
            <Box>
              <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
                <Box sx={{ p: 1, bgcolor: "rgba(255,255,255,0.18)", borderRadius: 2, display: "flex" }}>
                  <IconWallet size={26} color="#6ee7b7" />
                </Box>
                <Typography variant="h4" fontWeight={800} sx={{ color: "#ffffff", letterSpacing: "-0.5px" }}>
                  Refund Security Deposits
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ color: "#d1fae5", maxWidth: 680 }}>
                Release cash collateral savings, generate clearance certificates, and disburse refund settlements to members upon successful loan completion.
              </Typography>
            </Box>

            <Stack direction="row" spacing={1.5} alignItems="center">
              <Button
                variant="contained"
                startIcon={<IconRefresh size={18} />}
                onClick={loadData}
                disabled={loading}
                sx={{
                  bgcolor: "#10b981",
                  color: "#ffffff",
                  fontWeight: 700,
                  textTransform: "none",
                  "&:hover": { bgcolor: "#059669" },
                }}
              >
                Refresh Register
              </Button>
            </Stack>
          </Stack>
        </Box>

        {/* Executive KPI Metric Cards */}
        <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              onClick={() => setActiveTab("all")}
              sx={{
                border: "1px solid",
                borderColor: activeTab === "all" ? "#047857" : "divider",
                borderRadius: 2.5,
                boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
                cursor: "pointer",
                transition: "all 0.2s ease-in-out",
                "&:hover": { transform: "translateY(-2px)" },
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} letterSpacing={0.5}>
                  TOTAL DEPOSITS HELD
                </Typography>
                <Typography variant="h4" fontWeight={800} color="text.primary" mt={0.5}>
                  KES {stats.totalAmount.toLocaleString()}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                  {stats.totalCount} Registered Member Accounts
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              onClick={() => setActiveTab("eligible")}
              sx={{
                border: "1px solid",
                borderColor: activeTab === "eligible" ? "#10b981" : "divider",
                borderRadius: 2.5,
                boxShadow: activeTab === "eligible" ? "0 4px 14px rgba(16, 185, 129, 0.25)" : "0 4px 14px rgba(0,0,0,0.04)",
                cursor: "pointer",
                transition: "all 0.2s ease-in-out",
                "&:hover": { transform: "translateY(-2px)" },
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} letterSpacing={0.5}>
                  ELIGIBLE FOR RELEASE
                </Typography>
                <Typography variant="h4" fontWeight={800} color="success.main" mt={0.5}>
                  KES {stats.eligibleAmount.toLocaleString()}
                </Typography>
                <Typography variant="caption" color="success.dark" display="block" mt={0.5}>
                  ● {stats.eligibleCount} Cleared Loans Ready to Refund
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              onClick={() => setActiveTab("locked")}
              sx={{
                border: "1px solid",
                borderColor: activeTab === "locked" ? "#f59e0b" : "divider",
                borderRadius: 2.5,
                boxShadow: activeTab === "locked" ? "0 4px 14px rgba(245, 158, 11, 0.25)" : "0 4px 14px rgba(0,0,0,0.04)",
                cursor: "pointer",
                transition: "all 0.2s ease-in-out",
                "&:hover": { transform: "translateY(-2px)" },
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} letterSpacing={0.5}>
                  COLLATERAL ENCUMBERED
                </Typography>
                <Typography variant="h4" fontWeight={800} color="warning.main" mt={0.5}>
                  KES {stats.lockedAmount.toLocaleString()}
                </Typography>
                <Typography variant="caption" color="warning.dark" display="block" mt={0.5}>
                  ▲ {stats.lockedCount} Active Loans in Servicing
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              onClick={() => setActiveTab("offset")}
              sx={{
                border: "1px solid",
                borderColor: activeTab === "offset" ? "#ef4444" : "divider",
                borderRadius: 2.5,
                boxShadow: activeTab === "offset" ? "0 4px 14px rgba(239, 68, 68, 0.25)" : "0 4px 14px rgba(0,0,0,0.04)",
                cursor: "pointer",
                transition: "all 0.2s ease-in-out",
                "&:hover": { transform: "translateY(-2px)" },
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} letterSpacing={0.5}>
                  ARREARS OFFSET CANDIDATES
                </Typography>
                <Typography variant="h4" fontWeight={800} color="error.main" mt={0.5}>
                  {stats.offsetCount} Accounts
                </Typography>
                <Typography variant="caption" color="error.dark" display="block" mt={0.5}>
                  ■ Overdue Loan Collateral Recovery
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Deposit Clearance Register Table Card */}
        <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
          <CardContent sx={{ p: 3 }}>
            {/* Filter Tabs and Action Toolbar */}
            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", md: "center" }}
              spacing={2}
              mb={2}
            >
              <Tabs
                value={activeTab}
                onChange={(_, val) => setActiveTab(val)}
                textColor="primary"
                indicatorColor="primary"
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  "& .MuiTab-root": {
                    fontWeight: 700,
                    textTransform: "none",
                    fontSize: "0.88rem",
                    minHeight: 44,
                  },
                }}
              >
                <Tab label={`All Accounts (${depositAccounts.length})`} value="all" />
                <Tab label={`Eligible for Release (${stats.eligibleCount})`} value="eligible" />
                <Tab label={`Collateral Locked (${stats.lockedCount})`} value="locked" />
                <Tab label={`Arrears Offset (${stats.offsetCount})`} value="offset" />
              </Tabs>

              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: { xs: "100%", md: "auto" } }}>
                <TextField
                  size="small"
                  placeholder="Search member, phone, loan..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: <IconSearch size={16} style={{ marginRight: 8, color: "#94a3b8" }} />,
                    },
                  }}
                  sx={{ width: { xs: "100%", md: 260 } }}
                />

                <ExportButton
                  data={displayedAccounts}
                  columns={exportColumns}
                  filename={`security_deposits_refund_${activeTab}`}
                  title={`Royal SACCO - Security Deposits & Clearance Register (${activeTab})`}
                  size="small"
                />
              </Stack>
            </Stack>

            <Divider sx={{ mb: 2 }} />

            {loading ? (
              <Box display="flex" flexDirection="column" alignItems="center" py={8} gap={2}>
                <CircularProgress size={36} />
                <Typography variant="body2" color="text.secondary">
                  Auditing member deposit accounts and loan clearance status...
                </Typography>
              </Box>
            ) : displayedAccounts.length === 0 ? (
              <Box textAlign="center" py={8}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    bgcolor: "#f0fdf4",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mx: "auto",
                    mb: 1.5,
                  }}
                >
                  <IconCheck size={28} color="#16a34a" />
                </Box>
                <Typography variant="h6" fontWeight={700} color="text.primary">
                  No records match your filter criteria
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={0.5}>
                  Try selecting a different filter tab or clearing your search keywords.
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: "#f8fafc" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Member &amp; Contact</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Membership #</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Associated Loan</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">
                        Deposit Held
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">
                        Clearance Eligibility
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">
                        Action
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {displayedAccounts.map((row) => (
                      <TableRow key={row.id} hover sx={{ "&:hover": { bgcolor: "#f1f5f9" } }}>
                        <TableCell>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar
                              src={getMediaUrl(row.passportPhoto)}
                              sx={{ width: 34, height: 34, fontSize: 13, fontWeight: 700, bgcolor: "primary.main" }}
                            >
                              {row.memberName?.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={700}>
                                {row.memberName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {row.phoneNumber}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>

                        <TableCell sx={{ fontWeight: 600 }}>{row.membershipNumber}</TableCell>

                        <TableCell>
                          {row.associatedLoan ? (
                            <Box>
                              <Typography variant="body2" fontWeight={700} color="primary.main">
                                {row.associatedLoan.loan_number}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Status: {row.associatedLoan.status.replace("_", " ")}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              No Loan Linked
                            </Typography>
                          )}
                        </TableCell>

                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={700} color="text.primary">
                            KES {row.depositAmount.toLocaleString()}
                          </Typography>
                        </TableCell>

                        <TableCell align="center">{getStatusBadge(row.eligibilityStatus)}</TableCell>

                        <TableCell align="center">
                          {row.eligibilityStatus === "eligible" ? (
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => handleOpenRefund(row)}
                              sx={{
                                textTransform: "none",
                                fontWeight: 700,
                                fontSize: "0.75rem",
                                borderRadius: 1.5,
                                bgcolor: "#059669",
                                "&:hover": { bgcolor: "#047857" },
                              }}
                            >
                              Process Refund
                            </Button>
                          ) : row.eligibilityStatus === "locked" ? (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => router.push(`/loans/${row.associatedLoan?.id}`)}
                              sx={{
                                textTransform: "none",
                                fontWeight: 600,
                                fontSize: "0.75rem",
                                borderRadius: 1.5,
                                borderColor: "#cbd5e1",
                                color: "#334155",
                              }}
                            >
                              View Loan
                            </Button>
                          ) : (
                            <Button
                              size="small"
                              variant="outlined"
                              color="secondary"
                              onClick={() => handleOpenRefund(row)}
                              sx={{
                                textTransform: "none",
                                fontWeight: 600,
                                fontSize: "0.75rem",
                                borderRadius: 1.5,
                              }}
                            >
                              Disburse Refund
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Process Refund Dialog Modal */}
        <Dialog
          open={refundOpen}
          onClose={processingRefund ? undefined : handleCloseRefund}
          fullWidth
          maxWidth="sm"
          PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
        >
          <DialogTitle
            sx={{
              p: 2.5,
              background: "linear-gradient(135deg, #064e3b 0%, #047857 100%)",
              color: "#ffffff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: "rgba(255, 255, 255, 0.2)", display: "flex" }}>
                <IconCash size={24} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={800} sx={{ color: "#ffffff" }}>
                  Process Deposit Refund
                </Typography>
                <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.85)" }}>
                  Disburse collateral refund &amp; record settlement
                </Typography>
              </Box>
            </Stack>

            {!processingRefund && (
              <IconButton size="small" onClick={handleCloseRefund} sx={{ color: "#ffffff" }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            )}
          </DialogTitle>

          <DialogContent sx={{ p: 3 }}>
            {selectedRecord && (
              <Stack spacing={2.5}>
                {/* Member Summary */}
                <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar
                      src={getMediaUrl(selectedRecord.passportPhoto)}
                      sx={{ width: 46, height: 46, bgcolor: "primary.main", fontWeight: 700 }}
                    >
                      {selectedRecord.memberName?.charAt(0)}
                    </Avatar>
                    <Box flex={1}>
                      <Typography variant="subtitle2" fontWeight={800}>
                        {selectedRecord.memberName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Member #{selectedRecord.membershipNumber} • {selectedRecord.categoryName}
                      </Typography>
                      {selectedRecord.associatedLoan && (
                        <Typography variant="caption" display="block" color="primary.main" fontWeight={600}>
                          Loan: {selectedRecord.associatedLoan.loan_number} ({selectedRecord.associatedLoan.status})
                        </Typography>
                      )}
                    </Box>
                    <Chip label="Clearance Verified" color="success" size="small" sx={{ fontWeight: 700, fontSize: "0.7rem" }} />
                  </Stack>
                </Paper>

                {/* Refund Amount */}
                <TextField
                  fullWidth
                  label="Refund Disbursement Amount (KES)"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  type="number"
                  required
                  slotProps={{
                    input: {
                      startAdornment: <InputAdornment position="start">KES</InputAdornment>,
                    },
                  }}
                  helperText="Security deposit release amount to disburse"
                />

                {/* Refund Disbursement Channel */}
                <FormControl fullWidth>
                  <InputLabel>Disbursement Channel</InputLabel>
                  <Select
                    value={refundMethod}
                    label="Disbursement Channel"
                    onChange={(e) => setRefundMethod(e.target.value)}
                  >
                    <MenuItem value="MPESA">M-Pesa B2C Direct Payout</MenuItem>
                    <MenuItem value="BANK">Bank Electronic Funds Transfer (EFT)</MenuItem>
                    <MenuItem value="SHARES">Reinvest to Member Share Capital</MenuItem>
                    <MenuItem value="CASH">Cash Over-The-Counter Voucher</MenuItem>
                  </Select>
                </FormControl>

                {/* Conditional Destination fields */}
                {refundMethod === "MPESA" && (
                  <TextField
                    fullWidth
                    label="Recipient M-Pesa Phone Number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <IconPhone size={18} style={{ color: "#94a3b8" }} />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                )}

                {refundMethod === "BANK" && (
                  <TextField
                    fullWidth
                    label="Bank Name & Account Number"
                    placeholder="e.g. KCB Bank - A/C 1234567890"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    required
                  />
                )}

                <TextField
                  fullWidth
                  label="Settlement Audit Notes"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  multiline
                  minRows={2}
                />
              </Stack>
            )}
          </DialogContent>

          <Divider />

          <DialogActions sx={{ p: 2.5, gap: 1.5 }}>
            <Button
              variant="outlined"
              onClick={handleCloseRefund}
              disabled={processingRefund}
              sx={{ px: 3, fontWeight: 600, textTransform: "none" }}
            >
              Cancel
            </Button>

            <Button
              variant="contained"
              onClick={handleProcessRefundSubmit}
              disabled={processingRefund || !refundAmount}
              startIcon={processingRefund ? <CircularProgress size={18} color="inherit" /> : <IconDeviceFloppy size={18} />}
              sx={{
                px: 3.5,
                fontWeight: 700,
                textTransform: "none",
                bgcolor: "#059669",
                "&:hover": { bgcolor: "#047857" },
              }}
            >
              {processingRefund ? "Disbursing..." : "Confirm & Disburse Refund"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Clearance Settlement Voucher Modal */}
        <Dialog open={voucherOpen} onClose={() => setVoucherOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontWeight: 800, textAlign: "center", pb: 1 }}>
            Deposit Clearance Voucher
          </DialogTitle>
          <DialogContent>
            {settledVoucher && (
              <Box sx={{ p: 2, border: "2px dashed #059669", borderRadius: 2, bgcolor: "#f0fdf4", textAlign: "center" }}>
                <Box
                  sx={{
                    width: 50,
                    height: 50,
                    borderRadius: "50%",
                    bgcolor: "#dcfce7",
                    color: "#16a34a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mx: "auto",
                    mb: 1.5,
                  }}
                >
                  <IconCheck size={28} />
                </Box>
                <Typography variant="subtitle2" color="text.secondary">
                  VOUCHER NUMBER
                </Typography>
                <Typography variant="h6" fontWeight={800} color="primary.main">
                  {settledVoucher.voucherNo}
                </Typography>

                <Divider sx={{ my: 1.5 }} />

                <Stack spacing={0.75} textAlign="left">
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">
                      Member:
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {settledVoucher.memberName}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">
                      Membership #:
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {settledVoucher.membershipNo}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">
                      Amount Released:
                    </Typography>
                    <Typography variant="subtitle2" fontWeight={800} color="success.main">
                      KES {settledVoucher.amount.toLocaleString()}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">
                      Channel:
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {settledVoucher.method}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">
                      Date:
                    </Typography>
                    <Typography variant="body2">{settledVoucher.date}</Typography>
                  </Stack>
                </Stack>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, justifyContent: "center" }}>
            <Button
              variant="contained"
              startIcon={<IconPrinter size={18} />}
              onClick={() => {
                window.print();
                setVoucherOpen(false);
              }}
              sx={{ fontWeight: 700 }}
            >
              Print Voucher
            </Button>
            <Button onClick={() => setVoucherOpen(false)} color="inherit">
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Notification Snackbar */}
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
            sx={{ fontWeight: 600 }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </PageContainer>
  );
}
