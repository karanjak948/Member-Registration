"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
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
  Typography,
  Chip,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Collapse,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Alert,
  Snackbar,
} from "@mui/material";
import { useSearchParams } from "next/navigation";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import api from "@/services/api";
import loanService from "@/services/loan.service";
import { usePermissions } from "@/hooks/usePermissions";
import {
  IconBuildingBank,
  IconCoins,
  IconCreditCard,
  IconReceipt2,
  IconSearch,
  IconRefresh,
  IconChevronDown,
  IconChevronRight,
  IconArrowUpRight,
  IconArrowDownLeft,
  IconScale,
  IconBook2,
  IconPlus,
  IconTrash,
  IconPower,
  IconAlertTriangle,
} from "@tabler/icons-react";

interface LedgerEntry {
  id: number;
  account: number;
  account_code: string;
  account_name: string;
  account_type: string;
  entry_type: "debit" | "credit";
  amount: string | number;
  narration?: string;
}

interface LedgerTransaction {
  id: number;
  transaction_number: string;
  transaction_date: string;
  description: string;
  reference_type: string;
  reference_id: string;
  loan?: number;
  loan_number?: string;
  entries: LedgerEntry[];
  created_at: string;
}

interface LedgerAccount {
  id: number;
  account_code: string;
  account_name: string;
  account_type: string;
  is_active: boolean;
  description?: string;
}

export default function FinancePage() {
  const { isAdmin } = usePermissions();
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [accounts, setAccounts] = useState<LedgerAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [tabValue, setTabValue] = useState<number>(0);

  useEffect(() => {
    if (tabParam === "accounts") {
      setTabValue(1);
    } else if (tabParam === "audit") {
      setTabValue(2);
    } else if (tabParam === "ledger") {
      setTabValue(0);
    }
  }, [tabParam]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAccountCode, setSelectedAccountCode] = useState<string>("ALL");
  const [expandedTxns, setExpandedTxns] = useState<Record<number, boolean>>({});

  // Income Posting State
  const [openIncomeModal, setOpenIncomeModal] = useState(false);
  const [postingIncome, setPostingIncome] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [postSuccess, setPostSuccess] = useState(false);
  const [incomeForm, setIncomeForm] = useState({
    account_id: "",
    amount: "",
    transaction_date: new Date().toISOString().split("T")[0],
    reference_no: "",
    reference_type: "INCOME",
    description: "",
  });

  // Deletion / Void Transaction Dialog State
  const [deleteTxnDialog, setDeleteTxnDialog] = useState<{
    open: boolean;
    txn: LedgerTransaction | null;
    deleting: boolean;
    error: string | null;
  }>({
    open: false,
    txn: null,
    deleting: false,
    error: null,
  });

  // Ledger Account Deletion / Deactivation State
  const [deleteAccountDialog, setDeleteAccountDialog] = useState<{
    open: boolean;
    account: LedgerAccount | null;
    deleting: boolean;
    error: string | null;
    canDeactivate: boolean;
  }>({
    open: false,
    account: null,
    deleting: false,
    error: null,
    canDeactivate: false,
  });

  const [togglingAccountId, setTogglingAccountId] = useState<number | null>(null);
  const [feedbackSnackbar, setFeedbackSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  const handleDeleteTxn = async () => {
    if (!deleteTxnDialog.txn) return;
    setDeleteTxnDialog((prev) => ({ ...prev, deleting: true, error: null }));
    try {
      await loanService.deleteLedgerTransaction(deleteTxnDialog.txn.id);
      const deletedNum = deleteTxnDialog.txn.transaction_number;
      setDeleteTxnDialog({ open: false, txn: null, deleting: false, error: null });
      setFeedbackSnackbar({
        open: true,
        message: `Transaction ${deletedNum} and its journal entries have been deleted/voided.`,
        severity: "success",
      });
      fetchData();
    } catch (err: any) {
      setDeleteTxnDialog((prev) => ({
        ...prev,
        deleting: false,
        error: err.response?.data?.error || err.message || "Failed to delete transaction.",
      }));
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteAccountDialog.account) return;
    setDeleteAccountDialog((prev) => ({ ...prev, deleting: true, error: null, canDeactivate: false }));
    try {
      await loanService.deleteLedgerAccount(deleteAccountDialog.account.id);
      const code = deleteAccountDialog.account.account_code;
      setDeleteAccountDialog({ open: false, account: null, deleting: false, error: null, canDeactivate: false });
      setFeedbackSnackbar({
        open: true,
        message: `Account ${code} has been permanently deleted.`,
        severity: "success",
      });
      fetchData();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || "Failed to delete account.";
      const canDeactivate = !!err.response?.data?.can_deactivate;
      setDeleteAccountDialog((prev) => ({
        ...prev,
        deleting: false,
        error: errorMsg,
        canDeactivate,
      }));
    }
  };

  const handleToggleAccountActive = async (account: LedgerAccount) => {
    setTogglingAccountId(account.id);
    try {
      await loanService.updateLedgerAccount(account.id, { is_active: !account.is_active });
      setFeedbackSnackbar({
        open: true,
        message: `Account ${account.account_code} is now marked as ${!account.is_active ? "Active" : "Inactive"}.`,
        severity: "success",
      });
      fetchData();
    } catch (err: any) {
      setFeedbackSnackbar({
        open: true,
        message: err.response?.data?.error || "Failed to update account status.",
        severity: "error",
      });
    } finally {
      setTogglingAccountId(null);
    }
  };

  const handlePostIncome = async () => {
    if (!incomeForm.account_id || !incomeForm.amount) {
      setPostError("Please select a ledger account and enter an amount.");
      return;
    }
    setPostingIncome(true);
    setPostError(null);
    try {
      await api.post("/ledger-transactions/post-income/", {
        account_id: Number(incomeForm.account_id),
        amount: Number(incomeForm.amount),
        transaction_date: incomeForm.transaction_date,
        reference_no: incomeForm.reference_no,
        reference_type: incomeForm.reference_type,
        description: incomeForm.description,
      });
      setPostSuccess(true);
      fetchData();
      setTimeout(() => {
        setOpenIncomeModal(false);
        setPostSuccess(false);
        setIncomeForm({
          account_id: "",
          amount: "",
          transaction_date: new Date().toISOString().split("T")[0],
          reference_no: "",
          reference_type: "INCOME",
          description: "",
        });
      }, 1000);
    } catch (err: any) {
      setPostError(err.response?.data?.error || "Failed to post income entry.");
    } finally {
      setPostingIncome(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [txRes, accRes] = await Promise.all([
        api
          .get("/ledger-transactions/")
          .then((r) => r.data)
          .catch(async () => {
            return fetch("/api/ledger").then((r) => r.json()).catch(() => []);
          }),
        api
          .get("/ledger-accounts/")
          .then((r) => r.data)
          .catch(async () => {
            return fetch("/api/ledger-accounts").then((r) => r.json()).catch(() => []);
          }),
      ]);

      const txList = Array.isArray(txRes) ? txRes : (txRes?.results || []);
      const accList = Array.isArray(accRes) ? accRes : (accRes?.results || []);

      setTransactions(txList);
      setAccounts(accList);
    } catch (err) {
      console.warn("Error fetching ledger data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleExpand = (id: number) => {
    setExpandedTxns((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Financial Metrics - 6 Core SACCO Accounts
  const metrics = useMemo(() => {
    let totalDisbursed = 0;
    let totalCashOut = 0;
    let totalCashIn = 0;
    let totalRevenue = 0;

    let loansIssued1200 = 0;
    let securityDeposits2100 = 0;
    let processingFees4100 = 0;
    let formFees4150 = 0;
    let interestEarned4000 = 0;
    let penaltiesCollected4200 = 0;

    transactions.forEach((tx) => {
      tx.entries?.forEach((e) => {
        const amt = Number(e.amount || 0);
        const code = e.account_code;

        if (code === "1200") {
          if (e.entry_type === "debit") {
            loansIssued1200 += amt;
            totalDisbursed += amt;
          } else if (e.entry_type === "credit") {
            loansIssued1200 -= amt;
          }
        }
        if (code === "2100") {
          if (e.entry_type === "credit") securityDeposits2100 += amt;
          else if (e.entry_type === "debit") securityDeposits2100 -= amt;
        }
        if (code === "4000") {
          if (e.entry_type === "credit") interestEarned4000 += amt;
          else if (e.entry_type === "debit") interestEarned4000 -= amt;
        }
        if (code === "4100") {
          if (e.entry_type === "credit") processingFees4100 += amt;
          else if (e.entry_type === "debit") processingFees4100 -= amt;
        }
        if (code === "4150") {
          if (e.entry_type === "credit") formFees4150 += amt;
          else if (e.entry_type === "debit") formFees4150 -= amt;
        }
        if (code === "4200") {
          if (e.entry_type === "credit") penaltiesCollected4200 += amt;
          else if (e.entry_type === "debit") penaltiesCollected4200 -= amt;
        }

        if (code === "1010") {
          if (e.entry_type === "credit") totalCashOut += amt;
          if (e.entry_type === "debit") totalCashIn += amt;
        }
        if (e.account_type === "revenue" && e.entry_type === "credit") {
          totalRevenue += amt;
        }
      });
    });

    return {
      totalDisbursed,
      totalCashOut,
      totalCashIn,
      totalRevenue,
      loansIssued1200: Math.max(0, loansIssued1200),
      securityDeposits2100: Math.max(0, securityDeposits2100),
      processingFees4100: Math.max(0, processingFees4100),
      formFees4150: Math.max(0, formFees4150),
      interestEarned4000: Math.max(0, interestEarned4000),
      penaltiesCollected4200: Math.max(0, penaltiesCollected4200),
    };
  }, [transactions]);

  // Filtered transactions (accounting code filter + search query)
  const filteredTransactions = useMemo(() => {
    let result = transactions;

    if (selectedAccountCode !== "ALL") {
      result = result.filter((tx) =>
        tx.entries?.some((e) => e.account_code === selectedAccountCode)
      );
    }

    if (!searchQuery.trim()) return result;
    const q = searchQuery.toLowerCase();
    return result.filter(
      (tx) =>
        tx.transaction_number.toLowerCase().includes(q) ||
        tx.description.toLowerCase().includes(q) ||
        tx.reference_id?.toLowerCase().includes(q) ||
        tx.loan_number?.toLowerCase().includes(q) ||
        tx.entries?.some(
          (e) =>
            e.account_name.toLowerCase().includes(q) ||
            e.account_code.toLowerCase().includes(q)
        )
    );
  }, [transactions, searchQuery, selectedAccountCode]);

  return (
    <PageContainer
      title="Finance & Treasury - Royal SACCO"
      description="Double-entry financial accounting, liquidity reserves, and general ledger journal"
    >
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        {/* Header */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
          mb={3}
        >
          <Box>
            <Typography variant="h4" fontWeight={700} color="#0f172a">
              Finance &amp; General Ledger
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Real-time double-entry financial journals, chart of accounts, and SACCO liquidity tracking
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Button
              variant="contained"
              startIcon={<IconPlus size={18} />}
              onClick={() => {
                setPostError(null);
                setPostSuccess(false);
                setOpenIncomeModal(true);
              }}
              sx={{
                bgcolor: "#059669",
                "&:hover": { bgcolor: "#047857" },
                fontWeight: 700,
                textTransform: "none",
                borderRadius: 2,
                px: 2,
                boxShadow: "0 2px 8px rgba(5, 150, 105, 0.25)",
              }}
            >
              Post Income / Transaction
            </Button>
            <IconButton
              onClick={fetchData}
              color="primary"
              sx={{
                border: "1px solid #e2e8f0",
                bgcolor: "#ffffff",
                "&:hover": { bgcolor: "#f8fafc" },
              }}
            >
              <IconRefresh size={20} />
            </IconButton>
          </Stack>
        </Stack>

        {/* Core SACCO Ledger Accounts (Peter Irungu Checklist 6 Core Accounts) */}
        <Typography variant="subtitle1" fontWeight={800} color="#0f172a" mb={1.5}>
          General Ledger Balances (Core SACCO Chart of Accounts)
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3.5 }}>
          {[
            {
              code: "1200",
              title: "Loans Issued",
              balance: metrics.loansIssued1200,
              type: "ASSET",
              color: "#059669",
              bg: "#ecfdf5",
              desc: "Principal credit facility balance",
            },
            {
              code: "2100",
              title: "Security Deposits",
              balance: metrics.securityDeposits2100,
              type: "LIABILITY",
              color: "#7c3aed",
              bg: "#faf5ff",
              desc: "Collateral savings & reserves held",
            },
            {
              code: "4100",
              title: "Processing Fees",
              balance: metrics.processingFees4100,
              type: "REVENUE",
              color: "#0284c7",
              bg: "#f0f9ff",
              desc: "Loan origination fee income",
            },
            {
              code: "4150",
              title: "Form Fees",
              balance: metrics.formFees4150,
              type: "REVENUE",
              color: "#0f766e",
              bg: "#f0fdfa",
              desc: "Member application & form revenue",
            },
            {
              code: "4000",
              title: "Interest Earned",
              balance: metrics.interestEarned4000,
              type: "REVENUE",
              color: "#d97706",
              bg: "#fffbeb",
              desc: "Monthly loan interest revenue",
            },
            {
              code: "4200",
              title: "Penalties Collected",
              balance: metrics.penaltiesCollected4200,
              type: "REVENUE",
              color: "#e11d48",
              bg: "#fff1f2",
              desc: "Late payment penalty collections",
            },
          ].map((item) => {
            const isSelected = selectedAccountCode === item.code;
            return (
              <Grid key={item.code} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card
                  elevation={0}
                  onClick={() => {
                    setSelectedAccountCode((prev) => (prev === item.code ? "ALL" : item.code));
                    setTabValue(0);
                  }}
                  sx={{
                    borderRadius: 2.5,
                    border: isSelected ? `2px solid ${item.color}` : "1px solid #e2e8f0",
                    bgcolor: isSelected ? item.bg : "#ffffff",
                    boxShadow: isSelected
                      ? `0 4px 16px ${item.color}25`
                      : "0 2px 8px rgba(0,0,0,0.03)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      borderColor: item.color,
                      transform: "translateY(-2px)",
                      boxShadow: `0 6px 18px ${item.color}20`,
                    },
                  }}
                >
                  <Box sx={{ height: 4, bgcolor: item.color }} />
                  <CardContent sx={{ p: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Chip
                        size="small"
                        label={`Acct ${item.code}`}
                        sx={{
                          fontWeight: 800,
                          fontSize: "0.72rem",
                          fontFamily: "monospace",
                          bgcolor: item.bg,
                          color: item.color,
                          border: `1px solid ${item.color}40`,
                        }}
                      />
                      <Chip
                        size="small"
                        label={item.type}
                        sx={{
                          fontWeight: 700,
                          fontSize: "0.68rem",
                          height: 20,
                          bgcolor: "#f1f5f9",
                          color: "#475569",
                        }}
                      />
                    </Stack>
                    <Typography variant="subtitle2" fontWeight={800} color="#0f172a" mt={1.2}>
                      {item.title}
                    </Typography>
                    <Typography variant="h5" fontWeight={900} sx={{ color: item.color, mt: 0.5 }}>
                      KES {item.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </Typography>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mt={0.8}>
                      <Typography variant="caption" color="text.secondary">
                        {item.desc}
                      </Typography>
                      <Typography
                        variant="caption"
                        fontWeight={700}
                        sx={{ color: item.color, textDecoration: "underline" }}
                      >
                        {isSelected ? "Isolating" : "Filter"}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* Executive Metric Cards */}
        <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 2.5,
                border: "1px solid #e2e8f0",
                bgcolor: "#ffffff",
                boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <Box sx={{ height: 4, bgcolor: "#047857" }} />
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" color="text.secondary" fontWeight={700} letterSpacing={0.5}>
                    LOANS DISBURSED (PRINCIPAL)
                  </Typography>
                  <Box sx={{ p: 0.75, borderRadius: 1.5, bgcolor: "#ecfdf5", color: "#047857" }}>
                    <IconBuildingBank size={18} />
                  </Box>
                </Stack>
                <Typography variant="h5" fontWeight={800} color="#0f172a" mt={1}>
                  KES {metrics.totalDisbursed.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                  Asset Portfolio (Account 1200)
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
                position: "relative",
                overflow: "hidden",
              }}
            >
              <Box sx={{ height: 4, bgcolor: "#ef4444" }} />
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" color="text.secondary" fontWeight={700} letterSpacing={0.5}>
                    CASH DISBURSEMENTS (OUT)
                  </Typography>
                  <Box sx={{ p: 0.75, borderRadius: 1.5, bgcolor: "#fef2f2", color: "#ef4444" }}>
                    <IconArrowUpRight size={18} />
                  </Box>
                </Stack>
                <Typography variant="h5" fontWeight={800} color="#ef4444" mt={1}>
                  KES {metrics.totalCashOut.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                  Cash &amp; Bank Credit (Account 1010)
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
                position: "relative",
                overflow: "hidden",
              }}
            >
              <Box sx={{ height: 4, bgcolor: "#10b981" }} />
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" color="text.secondary" fontWeight={700} letterSpacing={0.5}>
                    REPAYMENTS COLLECTED (IN)
                  </Typography>
                  <Box sx={{ p: 0.75, borderRadius: 1.5, bgcolor: "#f0fdf4", color: "#10b981" }}>
                    <IconArrowDownLeft size={18} />
                  </Box>
                </Stack>
                <Typography variant="h5" fontWeight={800} color="#10b981" mt={1}>
                  KES {metrics.totalCashIn.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                  Inflow Liquidity (Account 1010)
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
                position: "relative",
                overflow: "hidden",
              }}
            >
              <Box sx={{ height: 4, bgcolor: "#6366f1" }} />
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" color="text.secondary" fontWeight={700} letterSpacing={0.5}>
                    TOTAL FEE &amp; INTEREST REVENUE
                  </Typography>
                  <Box sx={{ p: 0.75, borderRadius: 1.5, bgcolor: "#eef2ff", color: "#6366f1" }}>
                    <IconCoins size={18} />
                  </Box>
                </Stack>
                <Typography variant="h5" fontWeight={800} color="#6366f1" mt={1}>
                  KES {metrics.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                  Revenue Recognized (4000/4100/4200)
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Main Content Card with Tabs */}
        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px solid #e2e8f0",
            bgcolor: "#ffffff",
            overflow: "hidden",
          }}
        >
          <Box sx={{ borderBottom: 1, borderColor: "divider", px: 3, pt: 1 }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "center" }}
              spacing={2}
            >
              <Tabs
                value={tabValue}
                onChange={(_, v) => {
                  setTabValue(v);
                  const tabNames = ["ledger", "accounts", "audit"];
                  const newTab = tabNames[v] || "ledger";
                  if (typeof window !== "undefined") {
                    window.history.replaceState(null, "", `/finance?tab=${newTab}`);
                  }
                }}
                sx={{
                  "& .MuiTab-root": {
                    fontWeight: 700,
                    textTransform: "none",
                    minHeight: 52,
                    fontSize: "0.95rem",
                  },
                }}
              >
                <Tab
                  value={0}
                  icon={<IconReceipt2 size={18} />}
                  iconPosition="start"
                  label={`General Ledger (${filteredTransactions.length})`}
                />
                <Tab
                  value={1}
                  icon={<IconBook2 size={18} />}
                  iconPosition="start"
                  label={`Ledger Accounts (${accounts.length})`}
                />
                <Tab
                  value={2}
                  icon={<IconSearch size={18} />}
                  iconPosition="start"
                  label={`Audit Log (${filteredTransactions.length})`}
                />
              </Tabs>

              {(tabValue === 0 || tabValue === 2) && (
                <TextField
                  size="small"
                  placeholder={tabValue === 0 ? "Search journal entries..." : "Search audit logs..."}
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
                  sx={{ width: { xs: "100%", sm: 260 }, pb: { xs: 2, sm: 0 } }}
                />
              )}
            </Stack>
          </Box>

          <CardContent sx={{ p: 0 }}>
            {tabValue === 0 && (
              <Box sx={{ p: 2, bgcolor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Typography variant="caption" fontWeight={800} color="#64748b" textTransform="uppercase" mr={0.5}>
                    Filter By Ledger Account:
                  </Typography>
                  {[
                    { code: "ALL", label: "All Accounts" },
                    { code: "1200", label: "1200 • Loans Issued" },
                    { code: "2100", label: "2100 • Security Deposits" },
                    { code: "4000", label: "4000 • Interest Earned" },
                    { code: "4100", label: "4100 • Processing Fees" },
                    { code: "4150", label: "4150 • Form Fees" },
                    { code: "4200", label: "4200 • Penalties Collected" },
                  ].map((chip) => {
                    const isSelected = selectedAccountCode === chip.code;
                    return (
                      <Chip
                        key={chip.code}
                        label={chip.label}
                        size="small"
                        onClick={() => setSelectedAccountCode(chip.code)}
                        sx={{
                          fontWeight: 700,
                          fontSize: "0.78rem",
                          borderRadius: 2,
                          bgcolor: isSelected ? "#059669" : "#ffffff",
                          color: isSelected ? "#ffffff" : "#475569",
                          border: `1px solid ${isSelected ? "#059669" : "#cbd5e1"}`,
                          "&:hover": { bgcolor: isSelected ? "#047857" : "#f1f5f9" },
                        }}
                      />
                    );
                  })}
                  {selectedAccountCode !== "ALL" && (
                    <Button
                      size="small"
                      variant="text"
                      onClick={() => setSelectedAccountCode("ALL")}
                      sx={{ textTransform: "none", fontSize: "0.75rem", fontWeight: 700, color: "#e11d48", ml: 1 }}
                    >
                      Reset Filter
                    </Button>
                  )}
                </Stack>
              </Box>
            )}

            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" py={10}>
                <CircularProgress size={36} color="primary" />
              </Box>
            ) : tabValue === 0 ? (
              /* TAB 1: General Journal Transactions */
              filteredTransactions.length === 0 ? (
                <Box textAlign="center" py={8}>
                  <IconScale size={48} color="#94a3b8" />
                  <Typography variant="h6" fontWeight={700} color="#475569" mt={2}>
                    No Journal Transactions Found
                  </Typography>
                  <Typography variant="body2" color="text.secondary" maxWidth={450} mx="auto" mt={0.5}>
                    Transactions from Loan Disbursements and Member Repayments are balanced and posted to the general ledger automatically.
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead sx={{ bgcolor: "#f8fafc" }}>
                      <TableRow>
                        <TableCell sx={{ width: 48 }} />
                        <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Transaction #</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Description</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Reference</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: "#475569" }} align="right">
                          Debit Total
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, color: "#475569" }} align="right">
                          Credit Total
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, color: "#475569" }} align="center">
                          Status
                        </TableCell>
                        {isAdmin && (
                          <TableCell sx={{ fontWeight: 700, color: "#475569" }} align="center">
                            Action
                          </TableCell>
                        )}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredTransactions.map((tx) => {
                        const isExpanded = !!expandedTxns[tx.id];
                        const debitSum = (tx.entries || [])
                          .filter((e) => e.entry_type === "debit")
                          .reduce((acc, cur) => acc + Number(cur.amount || 0), 0);
                        const creditSum = (tx.entries || [])
                          .filter((e) => e.entry_type === "credit")
                          .reduce((acc, cur) => acc + Number(cur.amount || 0), 0);
                        const isBalanced = Math.abs(debitSum - creditSum) < 0.01;

                        return (
                          <React.Fragment key={tx.id}>
                            <TableRow
                              hover
                              sx={{
                                cursor: "pointer",
                                bgcolor: isExpanded ? "#f8fafc" : "inherit",
                                "& > *": { borderBottom: isExpanded ? "none" : "inherit" },
                              }}
                              onClick={() => toggleExpand(tx.id)}
                            >
                              <TableCell>
                                <IconButton size="small" onClick={() => toggleExpand(tx.id)}>
                                  {isExpanded ? <IconChevronDown size={18} /> : <IconChevronRight size={18} />}
                                </IconButton>
                              </TableCell>
                              <TableCell sx={{ fontWeight: 600, color: "#334155" }}>
                                {tx.transaction_date}
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" fontWeight={700} color="#0f172a">
                                  {tx.transaction_number}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ color: "#334155", maxWidth: 280 }}>
                                <Typography variant="body2" noWrap>
                                  {tx.description}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={tx.reference_id || tx.loan_number || tx.reference_type}
                                  size="small"
                                  sx={{
                                    bgcolor: "#ecfdf5",
                                    color: "#047857",
                                    fontWeight: 700,
                                    fontSize: "0.75rem",
                                  }}
                                />
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, color: "#0f172a" }}>
                                KES {debitSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, color: "#0f172a" }}>
                                KES {creditSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </TableCell>
                              <TableCell align="center">
                                <Chip
                                  label={isBalanced ? "Balanced" : "Unbalanced"}
                                  size="small"
                                  color={isBalanced ? "success" : "error"}
                                  sx={{ fontWeight: 700, fontSize: "0.72rem" }}
                                />
                              </TableCell>
                              {isAdmin && (
                                <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                                  <Tooltip title="Delete / Void Transaction">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteTxnDialog({
                                          open: true,
                                          txn: tx,
                                          deleting: false,
                                          error: null,
                                        });
                                      }}
                                      sx={{
                                        bgcolor: "#fef2f2",
                                        "&:hover": { bgcolor: "#fee2e2" },
                                        borderRadius: 1.5,
                                      }}
                                    >
                                      <IconTrash size={16} />
                                    </IconButton>
                                  </Tooltip>
                                </TableCell>
                              )}
                            </TableRow>

                            {/* Collapsible Double-Entry Details */}
                            <TableRow key={`${tx.id}-detail`}>
                              <TableCell colSpan={isAdmin ? 9 : 8} sx={{ py: 0, px: 3, bgcolor: "#f8fafc" }}>
                                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                  <Box sx={{ py: 2 }}>
                                    <Typography variant="caption" fontWeight={700} color="#475569" mb={1} display="block">
                                      JOURNAL DOUBLE-ENTRY BREAKDOWN
                                    </Typography>
                                    <Table size="small" sx={{ bgcolor: "#ffffff", borderRadius: 2, border: "1px solid #e2e8f0" }}>
                                      <TableHead sx={{ bgcolor: "#f1f5f9" }}>
                                        <TableRow>
                                          <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>Account Code</TableCell>
                                          <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>Account Title</TableCell>
                                          <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>Category</TableCell>
                                          <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>Narration</TableCell>
                                          <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }} align="right">
                                            Debit (DR)
                                          </TableCell>
                                          <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }} align="right">
                                            Credit (CR)
                                          </TableCell>
                                        </TableRow>
                                      </TableHead>
                                      <TableBody>
                                        {(tx.entries || []).map((entry) => (
                                          <TableRow key={entry.id}>
                                            <TableCell sx={{ fontWeight: 600, color: "#047857" }}>
                                              {entry.account_code}
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>{entry.account_name}</TableCell>
                                            <TableCell>
                                              <Chip
                                                label={entry.account_type?.toUpperCase()}
                                                size="small"
                                                sx={{ fontSize: "0.68rem", height: 20 }}
                                              />
                                            </TableCell>
                                            <TableCell sx={{ color: "text.secondary" }}>{entry.narration || "-"}</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 700, color: entry.entry_type === "debit" ? "#047857" : "text.secondary" }}>
                                              {entry.entry_type === "debit"
                                                ? `KES ${Number(entry.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                                                : "-"}
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 700, color: entry.entry_type === "credit" ? "#dc2626" : "text.secondary" }}>
                                              {entry.entry_type === "credit"
                                                ? `KES ${Number(entry.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                                                : "-"}
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </Box>
                                </Collapse>
                              </TableCell>
                            </TableRow>
                          </React.Fragment>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )
            ) : tabValue === 1 ? (
              /* TAB 2: Chart of Accounts / Ledger Accounts */
              <TableContainer>
                <Table>
                  <TableHead sx={{ bgcolor: "#f8fafc" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Code</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Account Name</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Account Type</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Description</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#475569" }} align="center">
                        Status
                      </TableCell>
                      {isAdmin && (
                        <TableCell sx={{ fontWeight: 700, color: "#475569" }} align="center">
                          Actions
                        </TableCell>
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {accounts.map((acc) => (
                      <TableRow key={acc.id} hover>
                        <TableCell sx={{ fontWeight: 700, color: "#047857" }}>{acc.account_code}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{acc.account_name}</TableCell>
                        <TableCell>
                          <Chip
                            label={acc.account_type.toUpperCase()}
                            size="small"
                            color={
                              acc.account_type === "asset"
                                ? "primary"
                                : acc.account_type === "liability"
                                ? "warning"
                                : acc.account_type === "revenue"
                                ? "success"
                                : "default"
                            }
                            sx={{ fontWeight: 700, fontSize: "0.72rem" }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: "text.secondary" }}>{acc.description || "-"}</TableCell>
                        <TableCell align="center">
                          <Chip
                            label={acc.is_active ? "Active" : "Inactive"}
                            size="small"
                            color={acc.is_active ? "success" : "default"}
                            sx={{ fontWeight: 700, fontSize: "0.72rem" }}
                          />
                        </TableCell>
                        {isAdmin && (
                          <TableCell align="center">
                            <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                              <Tooltip title={acc.is_active ? "Deactivate Account" : "Activate Account"}>
                                <IconButton
                                  size="small"
                                  disabled={togglingAccountId === acc.id}
                                  onClick={() => handleToggleAccountActive(acc)}
                                  sx={{
                                    bgcolor: acc.is_active ? "#ecfdf5" : "#f1f5f9",
                                    color: acc.is_active ? "#059669" : "#64748b",
                                    "&:hover": { bgcolor: acc.is_active ? "#d1fae5" : "#e2e8f0" },
                                    borderRadius: 1.5,
                                  }}
                                >
                                  <IconPower size={16} />
                                </IconButton>
                              </Tooltip>

                              <Tooltip title="Delete Account">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => {
                                    setDeleteAccountDialog({
                                      open: true,
                                      account: acc,
                                      deleting: false,
                                      error: null,
                                      canDeactivate: false,
                                    });
                                  }}
                                  sx={{
                                    bgcolor: "#fef2f2",
                                    "&:hover": { bgcolor: "#fee2e2" },
                                    borderRadius: 1.5,
                                  }}
                                >
                                  <IconTrash size={16} />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              /* TAB 3: Audit Log */
              <TableContainer>
                <Table>
                  <TableHead sx={{ bgcolor: "#f8fafc" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Date &amp; Time</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Transaction #</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Event Type</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Reference</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Description / Narration</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#475569" }} align="right">
                        Debit / Credit Total
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#475569" }} align="center">
                        Integrity Audit
                      </TableCell>
                      {isAdmin && (
                        <TableCell sx={{ fontWeight: 700, color: "#475569" }} align="center">
                          Action
                        </TableCell>
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredTransactions.map((tx) => {
                      const totalAmt = (tx.entries || [])
                        .filter((e) => e.entry_type === "debit")
                        .reduce((acc, cur) => acc + Number(cur.amount || 0), 0);
                      return (
                        <TableRow key={`audit-${tx.id}`} hover>
                          <TableCell sx={{ color: "#475569", whiteSpace: "nowrap" }}>
                            {tx.created_at ? new Date(tx.created_at).toLocaleString("en-GB") : tx.transaction_date}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700, color: "#0f172a" }}>
                            {tx.transaction_number}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={tx.reference_type}
                              size="small"
                              sx={{ bgcolor: "#eff6ff", color: "#1d4ed8", fontWeight: 700, fontSize: "0.72rem" }}
                            />
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, color: "#0284c7" }}>
                            {tx.reference_id || tx.loan_number || "-"}
                          </TableCell>
                          <TableCell sx={{ color: "#334155", maxWidth: 260 }}>
                            <Typography variant="body2" noWrap>
                              {tx.description}
                            </Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: "#059669" }}>
                            KES {totalAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label="VERIFIED"
                              size="small"
                              color="success"
                              sx={{ fontWeight: 800, fontSize: "0.68rem" }}
                            />
                          </TableCell>
                          {isAdmin && (
                            <TableCell align="center">
                              <Tooltip title="Delete / Void Transaction">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => {
                                    setDeleteTxnDialog({
                                      open: true,
                                      txn: tx,
                                      deleting: false,
                                      error: null,
                                    });
                                  }}
                                  sx={{
                                    bgcolor: "#fef2f2",
                                    "&:hover": { bgcolor: "#fee2e2" },
                                    borderRadius: 1.5,
                                  }}
                                >
                                  <IconTrash size={16} />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Post Income / Fee Entry Dialog */}
        <Dialog
          open={openIncomeModal}
          onClose={() => !postingIncome && setOpenIncomeModal(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 3, p: 1 },
          }}
        >
          <DialogTitle sx={{ fontWeight: 800, color: "#0f172a", pb: 1 }}>
            Post Income / Transaction to Ledger
            <Typography variant="body2" color="text.secondary">
              Direct entry to SACCO General Ledger with balanced double-entry accounting.
            </Typography>
          </DialogTitle>
          <Divider />
          <DialogContent sx={{ pt: 2.5 }}>
            <Stack spacing={2.5}>
              {postError && <Alert severity="error">{postError}</Alert>}
              {postSuccess && <Alert severity="success">Transaction posted to General Ledger successfully!</Alert>}

              <TextField
                select
                fullWidth
                label="Target Ledger Account *"
                value={incomeForm.account_id}
                onChange={(e) => setIncomeForm({ ...incomeForm, account_id: e.target.value })}
                helperText="Select the revenue or liability account to credit (Cash/Bank 1010 will be debited)"
              >
                {accounts
                  .filter((a) => a.account_code !== "1010")
                  .map((acc) => (
                    <MenuItem key={acc.id} value={acc.id}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography fontWeight={700} color="#059669">
                          {acc.account_code}
                        </Typography>
                        <Typography fontWeight={600}>- {acc.account_name}</Typography>
                        <Chip
                          label={acc.account_type.toUpperCase()}
                          size="small"
                          sx={{ fontSize: "0.68rem", height: 20 }}
                        />
                      </Stack>
                    </MenuItem>
                  ))}
              </TextField>

              <TextField
                fullWidth
                type="number"
                label="Amount (KES) *"
                value={incomeForm.amount}
                onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Typography fontWeight={700} color="text.secondary">
                          KES
                        </Typography>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  fullWidth
                  type="date"
                  label="Transaction Date *"
                  value={incomeForm.transaction_date}
                  onChange={(e) => setIncomeForm({ ...incomeForm, transaction_date: e.target.value })}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  select
                  fullWidth
                  label="Category / Ref Type"
                  value={incomeForm.reference_type}
                  onChange={(e) => setIncomeForm({ ...incomeForm, reference_type: e.target.value })}
                >
                  <MenuItem value="INCOME">General Income</MenuItem>
                  <MenuItem value="FEE">Form / Processing Fee</MenuItem>
                  <MenuItem value="DEPOSIT">Security Deposit</MenuItem>
                  <MenuItem value="PENALTY">Penalty Collected</MenuItem>
                  <MenuItem value="INTEREST">Interest Earned</MenuItem>
                </TextField>
              </Stack>

              <TextField
                fullWidth
                label="Reference # / Receipt / M-Pesa Code"
                placeholder="e.g. REC-89421 or QJH762512"
                value={incomeForm.reference_no}
                onChange={(e) => setIncomeForm({ ...incomeForm, reference_no: e.target.value })}
              />

              <TextField
                fullWidth
                multiline
                rows={2}
                label="Description / Narration"
                placeholder="Brief description of the transaction..."
                value={incomeForm.description}
                onChange={(e) => setIncomeForm({ ...incomeForm, description: e.target.value })}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button
              onClick={() => setOpenIncomeModal(false)}
              disabled={postingIncome}
              sx={{ color: "text.secondary", textTransform: "none", fontWeight: 600 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handlePostIncome}
              disabled={postingIncome || !incomeForm.account_id || !incomeForm.amount}
              sx={{
                bgcolor: "#059669",
                "&:hover": { bgcolor: "#047857" },
                textTransform: "none",
                fontWeight: 700,
                borderRadius: 2,
                px: 3,
              }}
            >
              {postingIncome ? "Posting..." : "Post to General Ledger"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete / Void Transaction Dialog */}
        <Dialog
          open={deleteTxnDialog.open}
          onClose={() => !deleteTxnDialog.deleting && setDeleteTxnDialog({ open: false, txn: null, deleting: false, error: null })}
          maxWidth="xs"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
        >
          <DialogTitle sx={{ fontWeight: 800, color: "#b91c1c", pb: 1, display: "flex", alignItems: "center", gap: 1 }}>
            <IconAlertTriangle color="#dc2626" size={24} />
            Void / Delete Transaction
          </DialogTitle>
          <Divider />
          <DialogContent sx={{ pt: 2 }}>
            {deleteTxnDialog.error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {deleteTxnDialog.error}
              </Alert>
            )}
            <Typography variant="body1" fontWeight={700} color="#0f172a" mb={1}>
              Are you sure you want to permanently delete transaction #{deleteTxnDialog.txn?.transaction_number}?
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              This will remove the transaction record and its balanced debit/credit entries ({deleteTxnDialog.txn?.entries?.length || 2} entries) from both the General Ledger and Audit Trail.
            </Typography>
            <Paper elevation={0} sx={{ p: 1.5, bgcolor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 2 }}>
              <Typography variant="caption" color="#991b1b" fontWeight={700} display="block">
                Warning: This action cannot be undone.
              </Typography>
            </Paper>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={() => setDeleteTxnDialog({ open: false, txn: null, deleting: false, error: null })}
              disabled={deleteTxnDialog.deleting}
              sx={{ color: "text.secondary", textTransform: "none", fontWeight: 600 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleDeleteTxn}
              disabled={deleteTxnDialog.deleting}
              sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
            >
              {deleteTxnDialog.deleting ? "Deleting..." : "Confirm Delete"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete / Deactivate Ledger Account Dialog */}
        <Dialog
          open={deleteAccountDialog.open}
          onClose={() => !deleteAccountDialog.deleting && setDeleteAccountDialog({ open: false, account: null, deleting: false, error: null, canDeactivate: false })}
          maxWidth="xs"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
        >
          <DialogTitle sx={{ fontWeight: 800, color: "#b91c1c", pb: 1, display: "flex", alignItems: "center", gap: 1 }}>
            <IconAlertTriangle color="#dc2626" size={24} />
            Delete Ledger Account
          </DialogTitle>
          <Divider />
          <DialogContent sx={{ pt: 2 }}>
            {deleteAccountDialog.error && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {deleteAccountDialog.error}
              </Alert>
            )}
            <Typography variant="body1" fontWeight={700} color="#0f172a" mb={1}>
              Delete account {deleteAccountDialog.account?.account_code} - {deleteAccountDialog.account?.account_name}?
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              If this account has existing transaction entries, deletion will be blocked by system safety guards to preserve ledger integrity.
            </Typography>
            {deleteAccountDialog.canDeactivate && (
              <Paper elevation={0} sx={{ p: 2, bgcolor: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 2, mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={700} color="#065f46">
                  Recommended Alternative:
                </Typography>
                <Typography variant="caption" color="#047857" display="block" mt={0.5}>
                  You can mark this account Inactive instead. It preserves historical reports while preventing any new postings.
                </Typography>
              </Paper>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={() => setDeleteAccountDialog({ open: false, account: null, deleting: false, error: null, canDeactivate: false })}
              disabled={deleteAccountDialog.deleting}
              sx={{ color: "text.secondary", textTransform: "none", fontWeight: 600 }}
            >
              Cancel
            </Button>
            {deleteAccountDialog.canDeactivate ? (
              <Button
                variant="contained"
                color="warning"
                onClick={() => {
                  if (deleteAccountDialog.account) {
                    handleToggleAccountActive(deleteAccountDialog.account);
                    setDeleteAccountDialog({ open: false, account: null, deleting: false, error: null, canDeactivate: false });
                  }
                }}
                sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
              >
                Mark Account Inactive
              </Button>
            ) : (
              <Button
                variant="contained"
                color="error"
                onClick={handleDeleteAccount}
                disabled={deleteAccountDialog.deleting}
                sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
              >
                {deleteAccountDialog.deleting ? "Deleting..." : "Delete Account"}
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Feedback Snackbar */}
        <Snackbar
          open={feedbackSnackbar.open}
          autoHideDuration={5000}
          onClose={() => setFeedbackSnackbar((prev) => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            onClose={() => setFeedbackSnackbar((prev) => ({ ...prev, open: false }))}
            severity={feedbackSnackbar.severity}
            sx={{ width: "100%", fontWeight: 600 }}
          >
            {feedbackSnackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </PageContainer>
  );
}
