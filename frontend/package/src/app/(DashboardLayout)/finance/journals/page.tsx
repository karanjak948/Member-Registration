"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
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
  TextField,
  Typography,
  Chip,
  Button,
  Tabs,
  Tab,
  MenuItem,
  Alert,
  IconButton,
  Tooltip,
  InputAdornment,
} from "@mui/material";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import api from "@/services/api";
import journalService, { JournalEntryLine } from "@/services/journal.service";
import {
  IconPlus,
  IconReceipt2,
  IconBook2,
  IconFilter,
  IconDeviceFloppy,
  IconCopy,
  IconFileSpreadsheet,
  IconFileTypePdf,
  IconPrinter,
  IconCheck,
  IconAlertCircle,
  IconRefresh,
  IconBuildingBank,
  IconArrowUpRight,
  IconArrowDownLeft,
  IconCalendarEvent,
  IconFileText,
  IconScale,
  IconShieldCheck,
  IconInfoCircle,
  IconSearch,
  IconRotate,
  IconTable,
  IconSparkles,
} from "@tabler/icons-react";

interface LedgerAccountOption {
  id: number;
  account_code: string;
  account_name: string;
  account_type: string;
}

export default function GeneralJournalEntriesPage() {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [accounts, setAccounts] = useState<LedgerAccountOption[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  const todayStr = new Date().toISOString().split("T")[0];
  const [currentJvNo, setCurrentJvNo] = useState<string>("79400");

  // Tab 1: General Journal Entries Form (Money From & Money To)
  const [moneyFrom, setMoneyFrom] = useState({
    account_id: "",
    particular: "",
    document_no: "",
    transaction_date: todayStr,
    debit: "",
    credit: "",
    jv_no: "",
  });

  const [moneyTo, setMoneyTo] = useState({
    account_id: "",
    particular: "",
    document_no: "",
    transaction_date: todayStr,
    debit: "",
    credit: "",
    jv_no: "",
  });

  // Tab 3: Brought Forward Form
  const [bfData, setBfData] = useState({
    account_no: "",
    particular: "Balance Brought Forward",
    document_no: "",
    transaction_date: todayStr,
    debit: "",
    credit: "",
    jv_no: "",
  });

  // Tab 2: Journal Transactions List state
  const [entriesList, setEntriesList] = useState<JournalEntryLine[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [filterAccount, setFilterAccount] = useState<string>("ALL");
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [filterDateTo, setFilterDateTo] = useState<string>("");
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const rowsPerPage = 12;

  // Alerts & Notifications
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Load Accounts and Next JVNO
  const initData = async () => {
    setLoadingAccounts(true);
    try {
      const [accRes, jvRes] = await Promise.all([
        api.get("/ledger-accounts/"),
        journalService.getNextJvNo(),
      ]);
      const list = Array.isArray(accRes.data) ? accRes.data : accRes.data?.results || [];
      setAccounts(list);
      setCurrentJvNo(jvRes);
      setMoneyFrom((prev) => ({ ...prev, jv_no: jvRes }));
      setMoneyTo((prev) => ({ ...prev, jv_no: jvRes }));
      setBfData((prev) => ({ ...prev, jv_no: jvRes }));
    } catch (err) {
      console.warn("Failed to load initial journal setup:", err);
    } finally {
      setLoadingAccounts(false);
    }
  };

  useEffect(() => {
    initData();
  }, []);

  // Fetch Journal Transactions List
  const fetchJournalEntries = async () => {
    setListLoading(true);
    try {
      const data = await journalService.getJournalEntriesList({
        account_no: filterAccount === "ALL" ? undefined : filterAccount,
        date_from: filterDateFrom || undefined,
        date_to: filterDateTo || undefined,
        search: searchFilter || undefined,
      });
      setEntriesList(data.entries || []);
      setPage(1);
    } catch (err) {
      console.error("Failed to load journal transactions:", err);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 1) {
      fetchJournalEntries();
    }
  }, [activeTab]);

  // Balance calculation for Tab 1
  const balanceInfo = useMemo(() => {
    const fromD = parseFloat(moneyFrom.debit) || 0;
    const fromC = parseFloat(moneyFrom.credit) || 0;
    const toD = parseFloat(moneyTo.debit) || 0;
    const toC = parseFloat(moneyTo.credit) || 0;

    const totalDebits = fromD + toD;
    const totalCredits = fromC + toC;
    const diff = Math.abs(totalDebits - totalCredits);
    const isBalanced = totalDebits > 0 && totalCredits > 0 && Math.abs(diff) < 0.001;

    return {
      totalDebits,
      totalCredits,
      diff,
      isBalanced,
      hasInput: totalDebits > 0 || totalCredits > 0,
    };
  }, [moneyFrom, moneyTo]);

  // Submit General Journal Entry (Tab 1)
  const handleSaveGeneralJournal = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!moneyFrom.account_id || !moneyTo.account_id) {
      setFeedback({ type: "error", message: "Please select valid accounts for both Money From and Money To legs." });
      return;
    }

    if (!balanceInfo.isBalanced) {
      setFeedback({
        type: "error",
        message: `Unbalanced journal entry! Total Debits (KES ${balanceInfo.totalDebits.toLocaleString()}) must equal Total Credits (KES ${balanceInfo.totalCredits.toLocaleString()}). Difference: KES ${balanceInfo.diff.toLocaleString()}`,
      });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await journalService.postGeneralJournal({
        jv_no: moneyFrom.jv_no || currentJvNo,
        transaction_date: moneyFrom.transaction_date,
        document_no: moneyFrom.document_no,
        description: moneyFrom.particular || "General Journal Entry",
        money_from: {
          account_id: moneyFrom.account_id,
          particular: moneyFrom.particular,
          document_no: moneyFrom.document_no,
          transaction_date: moneyFrom.transaction_date,
          debit: moneyFrom.debit || 0,
          credit: moneyFrom.credit || 0,
        },
        money_to: {
          account_id: moneyTo.account_id,
          particular: moneyTo.particular,
          document_no: moneyTo.document_no,
          transaction_date: moneyTo.transaction_date,
          debit: moneyTo.debit || 0,
          credit: moneyTo.credit || 0,
        },
      });

      setFeedback({ type: "success", message: res.message || `Journal entry ${currentJvNo} posted successfully to General Ledger!` });

      // Refresh next JVNO and reset form
      const nextJv = await journalService.getNextJvNo();
      setCurrentJvNo(nextJv);
      setMoneyFrom({
        account_id: "",
        particular: "",
        document_no: "",
        transaction_date: todayStr,
        debit: "",
        credit: "",
        jv_no: nextJv,
      });
      setMoneyTo({
        account_id: "",
        particular: "",
        document_no: "",
        transaction_date: todayStr,
        debit: "",
        credit: "",
        jv_no: nextJv,
      });
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.response?.data?.error || "Failed to post general journal entry.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Brought Forward (Tab 3)
  const handleSaveBroughtForward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bfData.account_no) {
      setFeedback({ type: "error", message: "Please select an Account No." });
      return;
    }
    const d = parseFloat(bfData.debit) || 0;
    const c = parseFloat(bfData.credit) || 0;
    if (d <= 0 && c <= 0) {
      setFeedback({ type: "error", message: "Please enter either a Debit or Credit opening balance amount." });
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await journalService.postBroughtForward({
        account_no: bfData.account_no,
        particular: bfData.particular,
        document_no: bfData.document_no,
        transaction_date: bfData.transaction_date,
        debit: bfData.debit || 0,
        credit: bfData.credit || 0,
        jv_no: bfData.jv_no || currentJvNo,
      });

      setFeedback({ type: "success", message: res.message || "Brought forward balance saved successfully!" });
      const nextJv = await journalService.getNextJvNo();
      setCurrentJvNo(nextJv);
      setBfData({
        account_no: "",
        particular: "Balance Brought Forward",
        document_no: "",
        transaction_date: todayStr,
        debit: "",
        credit: "",
        jv_no: nextJv,
      });
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.response?.data?.error || "Failed to save brought forward balance.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Export handlers for Tab 2
  const handleCopy = () => {
    if (!entriesList.length) return;
    const text = entriesList
      .map(
        (e) =>
          `${e.index}\t${e.account_no}\t${e.jv_no}\t${e.particular}\t${e.document_no}\t${e.transaction_date}\t${e.debit}\t${e.credit}`
      )
      .join("\n");
    navigator.clipboard.writeText(text);
    setFeedback({ type: "success", message: "Copied table rows to clipboard." });
  };

  const handleExportCSV = () => {
    if (!entriesList.length) return;
    const headers = ["#", "Account No", "Jv No", "Particular", "Document No", "Transaction Date", "Debit", "Credit"];
    const rows = entriesList.map((e) => [
      e.index,
      `"${(e.account_no || "").replace(/"/g, '""')}"`,
      e.jv_no,
      `"${(e.particular || "").replace(/"/g, '""')}"`,
      e.document_no,
      e.transaction_date,
      e.debit,
      e.credit,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `journal_entries_list_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const paginatedEntries = useMemo(() => {
    return entriesList.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  }, [entriesList, page]);

  const totalPages = Math.ceil(entriesList.length / rowsPerPage) || 1;

  // Cumulative totals for Tab 2
  const { totalListDebit, totalListCredit } = useMemo(() => {
    let d = 0;
    let c = 0;
    entriesList.forEach((e) => {
      d += parseFloat(e.debit?.toString() || "0") || 0;
      c += parseFloat(e.credit?.toString() || "0") || 0;
    });
    return { totalListDebit: d, totalListCredit: c };
  }, [entriesList]);

  return (
    <PageContainer
      title="JIMANAGE :: GENERAL JOURNAL ENTRIES"
      description="SACCO General Journal Entries, Double-entry posting desk, and Brought Forward opening balances"
    >
      <Box sx={{ p: { xs: 1.5, sm: 3 }, bgcolor: "#f8fafc", minHeight: "100vh" }}>
        {/* ============================================================ */}
        {/* EXECUTIVE HERO HEADER BANNER                                 */}
        {/* ============================================================ */}
        <Box
          sx={{
            mb: 3.5,
            p: { xs: 2.5, md: 3.5 },
            borderRadius: 3.5,
            background: "linear-gradient(135deg, #064E3B 0%, #065F46 45%, #0F172A 100%)",
            color: "#ffffff",
            boxShadow: "0 14px 34px -8px rgba(6, 78, 59, 0.4)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Subtle background glow decorative circle */}
          <Box
            sx={{
              position: "absolute",
              top: -60,
              right: -60,
              width: 220,
              height: 220,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={{ xs: 2.5, md: 3 }}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
            position="relative"
            zIndex={1}
          >
            {/* Left Header info */}
            <Box sx={{ flex: 1 }}>
              <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
                <Box
                  sx={{
                    p: 0.9,
                    bgcolor: "rgba(255, 255, 255, 0.15)",
                    borderRadius: 2,
                    display: "flex",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(255, 255, 255, 0.25)",
                  }}
                >
                  <IconBuildingBank size={24} color="#6ee7b7" />
                </Box>
                <Typography
                  variant="caption"
                  fontWeight={800}
                  sx={{ color: "#a7f3d0", letterSpacing: "1.2px", textTransform: "uppercase" }}
                >
                  ROYAL SACCO :: GENERAL LEDGER DESK
                </Typography>
              </Stack>

              <Typography
                variant="h3"
                fontWeight={800}
                sx={{
                  color: "#ffffff",
                  letterSpacing: "-0.5px",
                  fontSize: { xs: "1.5rem", md: "2.0rem" },
                  mb: 0.7,
                }}
              >
                {activeTab === 0
                  ? "JIMANAGE :: GENERAL JOURNAL ENTRIES"
                  : activeTab === 1
                  ? "JIMANAGE :: JOURNAL ENTRIES LIST"
                  : "Account BF :: Opening Balances"}
              </Typography>

              <Typography
                variant="body2"
                sx={{ color: "#cbd5e1", maxWidth: 720, lineHeight: 1.6, mb: 2 }}
              >
                Double-entry General Journal voucher desk with real-time debit/credit reconciliation, sequential JV numbering, and brought-forward opening balances.
              </Typography>

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                  size="small"
                  icon={<IconShieldCheck size={14} style={{ color: "#ffffff" }} />}
                  label="Double-Entry Enforced"
                  sx={{ bgcolor: "#059669", color: "#ffffff", fontWeight: 700, border: "1px solid #34d399" }}
                />
                <Chip
                  size="small"
                  icon={<IconScale size={14} style={{ color: "#ffffff" }} />}
                  label={`Next JV: #${currentJvNo}`}
                  sx={{ bgcolor: "rgba(255, 255, 255, 0.15)", color: "#fef08a", fontWeight: 700, border: "1px solid rgba(255,255,255,0.25)" }}
                />
                <Chip
                  size="small"
                  icon={<IconSparkles size={14} style={{ color: "#ffffff" }} />}
                  label="Audit Trail Locked"
                  sx={{ bgcolor: "rgba(255, 255, 255, 0.12)", color: "#e2e8f0", fontWeight: 600 }}
                />
              </Stack>
            </Box>

            {/* Right Action buttons */}
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Button
                component={Link}
                href="/finance"
                variant="contained"
                size="medium"
                startIcon={<IconBuildingBank size={18} />}
                sx={{
                  borderRadius: 2.5,
                  bgcolor: "rgba(255, 255, 255, 0.15)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  color: "#ffffff",
                  textTransform: "none",
                  fontWeight: 700,
                  px: 2.5,
                  py: 1,
                  "&:hover": {
                    bgcolor: "rgba(255, 255, 255, 0.25)",
                    transform: "translateY(-1px)",
                  },
                  transition: "all 0.2s ease",
                }}
              >
                Finance Ledger
              </Button>
              <Tooltip title="Refresh Chart of Accounts & JV Voucher Number">
                <IconButton
                  onClick={initData}
                  sx={{
                    bgcolor: "rgba(255, 255, 255, 0.15)",
                    border: "1px solid rgba(255, 255, 255, 0.25)",
                    color: "#ffffff",
                    "&:hover": { bgcolor: "rgba(255, 255, 255, 0.25)" },
                    p: 1.2,
                  }}
                >
                  <IconRotate size={20} />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </Box>

        {feedback && (
          <Alert
            severity={feedback.type}
            sx={{
              mb: 3,
              borderRadius: 3,
              fontWeight: 600,
              boxShadow: "0 4px 14px rgba(0,0,0,0.05)",
              border: `1px solid ${feedback.type === "success" ? "#a7f3d0" : "#fecdd3"}`,
            }}
            onClose={() => setFeedback(null)}
          >
            {feedback.message}
          </Alert>
        )}

        {/* ============================================================ */}
        {/* EXECUTIVE SEGMENTED PILL TABS                                */}
        {/* ============================================================ */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1.5px solid #e2e8f0",
            bgcolor: "#ffffff",
            p: 0.8,
            mb: 3,
            boxShadow: "0 4px 20px rgba(15, 23, 42, 0.04)",
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_, v) => {
              setActiveTab(v);
              setFeedback(null);
            }}
            sx={{
              minHeight: 48,
              "& .MuiTabs-indicator": { display: "none" },
              "& .MuiTab-root": {
                fontWeight: 700,
                fontSize: "0.92rem",
                textTransform: "none",
                minHeight: 48,
                px: { xs: 2, sm: 3.5 },
                py: 1,
                borderRadius: 2.2,
                color: "#475569",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                mr: 1,
                "&:hover": {
                  bgcolor: "#f1f5f9",
                  color: "#0f172a",
                },
                "&.Mui-selected": {
                  background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                  color: "#ffffff !important",
                  fontWeight: 800,
                  boxShadow: "0 6px 18px rgba(5, 150, 105, 0.35)",
                },
              },
            }}
          >
            <Tab
              icon={<IconPlus size={18} />}
              iconPosition="start"
              label="Journal Entries +"
            />
            <Tab
              icon={<IconReceipt2 size={18} />}
              iconPosition="start"
              label="Journal Transactions 🗎"
            />
            <Tab
              icon={<IconBook2 size={18} />}
              iconPosition="start"
              label="Brought Forward 🗎"
            />
          </Tabs>
        </Paper>

        {/* ============================================================ */}
        {/* TAB 1: JOURNAL ENTRIES + (Money From & Money To)             */}
        {/* ============================================================ */}
        {activeTab === 0 && (
          <Card
            elevation={0}
            sx={{
              borderRadius: 3.5,
              border: "1.5px solid #e2e8f0",
              boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
              p: { xs: 2.5, sm: 4 },
              bgcolor: "#ffffff",
            }}
          >
            <form onSubmit={handleSaveGeneralJournal}>
              {/* SECTION 1: Money From (Credit Source) */}
              <Box
                sx={{
                  mb: 4,
                  p: { xs: 2, sm: 3 },
                  borderRadius: 3,
                  background: "linear-gradient(180deg, #fffdf7 0%, #ffffff 100%)",
                  border: "1.5px solid #fed7aa",
                  boxShadow: "0 6px 20px -4px rgba(245, 158, 11, 0.08)",
                }}
              >
                {/* Section Header */}
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  spacing={1.5}
                  mb={3}
                  pb={1.5}
                  borderBottom="1px dashed #fde68a"
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box
                      sx={{
                        width: 38,
                        height: 38,
                        borderRadius: "10px",
                        bgcolor: "#fef3c7",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#d97706",
                        border: "1px solid #fde68a",
                      }}
                    >
                      <IconArrowUpRight size={22} />
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight={800} color="#78350f">
                        Money From
                      </Typography>
                      <Typography variant="caption" color="#92400e">
                        Source of Funds • Credit Outflow Leg
                      </Typography>
                    </Box>
                  </Stack>

                  <Chip
                    size="small"
                    label="Credit Leg (CR): Decreases Asset or Increases Liability/Income"
                    sx={{
                      bgcolor: "#fef3c7",
                      color: "#92400e",
                      fontWeight: 700,
                      fontSize: "0.76rem",
                      border: "1px solid #fde68a",
                    }}
                  />
                </Stack>

                <Grid container spacing={2.5}>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Typography variant="caption" fontWeight={800} color="#334155" textTransform="uppercase" letterSpacing={0.5} mb={0.8} display="block">
                      Account No <span style={{ color: "#ef4444" }}>*</span>
                    </Typography>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      value={moneyFrom.account_id}
                      onChange={(e) => setMoneyFrom({ ...moneyFrom, account_id: e.target.value })}
                      required
                      slotProps={{
                        input: {
                          sx: {
                            borderRadius: 2,
                            bgcolor: "#ffffff",
                            fontWeight: 600,
                            "&.Mui-focused": {
                              borderColor: "#f59e0b",
                            },
                          },
                        },
                      }}
                    >
                      <MenuItem value="">[select source account]</MenuItem>
                      {accounts.map((acc) => (
                        <MenuItem key={acc.id} value={acc.id}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                            <span><strong>{acc.account_code}</strong> - {acc.account_name}</span>
                            <Chip size="small" label={acc.account_type} sx={{ ml: 1, fontSize: "0.68rem", height: 20 }} />
                          </Box>
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12, md: 3 }}>
                    <Typography variant="caption" fontWeight={800} color="#334155" textTransform="uppercase" letterSpacing={0.5} mb={0.8} display="block">
                      Particular / Description <span style={{ color: "#ef4444" }}>*</span>
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="e.g. Stationery purchase via bank"
                      value={moneyFrom.particular}
                      onChange={(e) => setMoneyFrom({ ...moneyFrom, particular: e.target.value })}
                      required
                      slotProps={{
                        input: {
                          sx: { borderRadius: 2, bgcolor: "#ffffff" },
                        },
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 3 }}>
                    <Typography variant="caption" fontWeight={800} color="#334155" textTransform="uppercase" letterSpacing={0.5} mb={0.8} display="block">
                      Document No <span style={{ color: "#ef4444" }}>*</span>
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="e.g. DOC-2026-001"
                      value={moneyFrom.document_no}
                      onChange={(e) => setMoneyFrom({ ...moneyFrom, document_no: e.target.value })}
                      required
                      slotProps={{
                        input: {
                          sx: { borderRadius: 2, bgcolor: "#ffffff", fontFamily: "monospace" },
                        },
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 3 }}>
                    <Typography variant="caption" fontWeight={800} color="#334155" textTransform="uppercase" letterSpacing={0.5} mb={0.8} display="block">
                      Transaction Date <span style={{ color: "#ef4444" }}>*</span>
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      value={moneyFrom.transaction_date}
                      onChange={(e) => setMoneyFrom({ ...moneyFrom, transaction_date: e.target.value })}
                      required
                      slotProps={{
                        input: {
                          sx: { borderRadius: 2, bgcolor: "#ffffff" },
                        },
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <Typography variant="caption" fontWeight={800} color="#64748b" textTransform="uppercase" letterSpacing={0.5} mb={0.8} display="block">
                      Debit Amount (KES)
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      placeholder="0.00"
                      value={moneyFrom.debit}
                      onChange={(e) => setMoneyFrom({ ...moneyFrom, debit: e.target.value, credit: "" })}
                      slotProps={{
                        input: {
                          startAdornment: <InputAdornment position="start"><Typography variant="caption" fontWeight={800} color="#94a3b8">KES</Typography></InputAdornment>,
                          sx: { borderRadius: 2, bgcolor: "#ffffff" },
                        },
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <Typography variant="caption" fontWeight={800} color="#d97706" textTransform="uppercase" letterSpacing={0.5} mb={0.8} display="block">
                      Credit Amount (KES) ★
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      placeholder="0.00"
                      value={moneyFrom.credit}
                      onChange={(e) => setMoneyFrom({ ...moneyFrom, credit: e.target.value, debit: "" })}
                      slotProps={{
                        input: {
                          startAdornment: <InputAdornment position="start"><Typography variant="caption" fontWeight={800} color="#d97706">KES</Typography></InputAdornment>,
                          sx: {
                            borderRadius: 2,
                            bgcolor: "#fffbeb",
                            fontWeight: 700,
                            borderColor: "#f59e0b",
                          },
                        },
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <Typography variant="caption" fontWeight={800} color="#334155" textTransform="uppercase" letterSpacing={0.5} mb={0.8} display="block">
                      Official Voucher No (JVNO)
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      value={moneyFrom.jv_no || currentJvNo}
                      onChange={(e) => setMoneyFrom({ ...moneyFrom, jv_no: e.target.value })}
                      slotProps={{
                        input: {
                          startAdornment: <InputAdornment position="start"><IconReceipt2 size={16} color="#38bdf8" /></InputAdornment>,
                          sx: {
                            fontFamily: "monospace",
                            fontWeight: 800,
                            color: "#38bdf8",
                            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                            borderRadius: 2,
                            border: "1px solid rgba(56, 189, 248, 0.3)",
                            "& input": { color: "#38bdf8" },
                          },
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* SECTION 2: Money To (Debit Destination) */}
              <Box
                sx={{
                  mb: 4,
                  p: { xs: 2, sm: 3 },
                  borderRadius: 3,
                  background: "linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%)",
                  border: "1.5px solid #a7f3d0",
                  boxShadow: "0 6px 20px -4px rgba(16, 185, 129, 0.08)",
                }}
              >
                {/* Section Header */}
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  spacing={1.5}
                  mb={3}
                  pb={1.5}
                  borderBottom="1px dashed #bbf7d0"
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box
                      sx={{
                        width: 38,
                        height: 38,
                        borderRadius: "10px",
                        bgcolor: "#dcfce7",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#059669",
                        border: "1px solid #bbf7d0",
                      }}
                    >
                      <IconArrowDownLeft size={22} />
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight={800} color="#065f46">
                        Money To
                      </Typography>
                      <Typography variant="caption" color="#047857">
                        Destination of Funds • Debit Inflow Leg
                      </Typography>
                    </Box>
                  </Stack>

                  <Chip
                    size="small"
                    label="Debit Leg (DR): Increases Asset/Expense or Decreases Liability"
                    sx={{
                      bgcolor: "#dcfce7",
                      color: "#065f46",
                      fontWeight: 700,
                      fontSize: "0.76rem",
                      border: "1px solid #bbf7d0",
                    }}
                  />
                </Stack>

                <Grid container spacing={2.5}>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Typography variant="caption" fontWeight={800} color="#334155" textTransform="uppercase" letterSpacing={0.5} mb={0.8} display="block">
                      Account No <span style={{ color: "#ef4444" }}>*</span>
                    </Typography>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      value={moneyTo.account_id}
                      onChange={(e) => setMoneyTo({ ...moneyTo, account_id: e.target.value })}
                      required
                      slotProps={{
                        input: {
                          sx: {
                            borderRadius: 2,
                            bgcolor: "#ffffff",
                            fontWeight: 600,
                            "&.Mui-focused": {
                              borderColor: "#10b981",
                            },
                          },
                        },
                      }}
                    >
                      <MenuItem value="">[select destination account]</MenuItem>
                      {accounts.map((acc) => (
                        <MenuItem key={acc.id} value={acc.id}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                            <span><strong>{acc.account_code}</strong> - {acc.account_name}</span>
                            <Chip size="small" label={acc.account_type} sx={{ ml: 1, fontSize: "0.68rem", height: 20 }} />
                          </Box>
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12, md: 3 }}>
                    <Typography variant="caption" fontWeight={800} color="#334155" textTransform="uppercase" letterSpacing={0.5} mb={0.8} display="block">
                      Particular / Description <span style={{ color: "#ef4444" }}>*</span>
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="e.g. Stationery purchase via bank"
                      value={moneyTo.particular}
                      onChange={(e) => setMoneyTo({ ...moneyTo, particular: e.target.value })}
                      required
                      slotProps={{
                        input: {
                          sx: { borderRadius: 2, bgcolor: "#ffffff" },
                        },
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 3 }}>
                    <Typography variant="caption" fontWeight={800} color="#334155" textTransform="uppercase" letterSpacing={0.5} mb={0.8} display="block">
                      Document No <span style={{ color: "#ef4444" }}>*</span>
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="e.g. DOC-2026-001"
                      value={moneyTo.document_no}
                      onChange={(e) => setMoneyTo({ ...moneyTo, document_no: e.target.value })}
                      required
                      slotProps={{
                        input: {
                          sx: { borderRadius: 2, bgcolor: "#ffffff", fontFamily: "monospace" },
                        },
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 3 }}>
                    <Typography variant="caption" fontWeight={800} color="#334155" textTransform="uppercase" letterSpacing={0.5} mb={0.8} display="block">
                      Transaction Date <span style={{ color: "#ef4444" }}>*</span>
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      value={moneyTo.transaction_date}
                      onChange={(e) => setMoneyTo({ ...moneyTo, transaction_date: e.target.value })}
                      required
                      slotProps={{
                        input: {
                          sx: { borderRadius: 2, bgcolor: "#ffffff" },
                        },
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <Typography variant="caption" fontWeight={800} color="#059669" textTransform="uppercase" letterSpacing={0.5} mb={0.8} display="block">
                      Debit Amount (KES) ★
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      placeholder="0.00"
                      value={moneyTo.debit}
                      onChange={(e) => setMoneyTo({ ...moneyTo, debit: e.target.value, credit: "" })}
                      slotProps={{
                        input: {
                          startAdornment: <InputAdornment position="start"><Typography variant="caption" fontWeight={800} color="#059669">KES</Typography></InputAdornment>,
                          sx: {
                            borderRadius: 2,
                            bgcolor: "#ecfdf5",
                            fontWeight: 700,
                            borderColor: "#10b981",
                          },
                        },
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <Typography variant="caption" fontWeight={800} color="#64748b" textTransform="uppercase" letterSpacing={0.5} mb={0.8} display="block">
                      Credit Amount (KES)
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      placeholder="0.00"
                      value={moneyTo.credit}
                      onChange={(e) => setMoneyTo({ ...moneyTo, credit: e.target.value, debit: "" })}
                      slotProps={{
                        input: {
                          startAdornment: <InputAdornment position="start"><Typography variant="caption" fontWeight={800} color="#94a3b8">KES</Typography></InputAdornment>,
                          sx: { borderRadius: 2, bgcolor: "#ffffff" },
                        },
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <Typography variant="caption" fontWeight={800} color="#334155" textTransform="uppercase" letterSpacing={0.5} mb={0.8} display="block">
                      Official Voucher No (JVNO)
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      value={moneyTo.jv_no || currentJvNo}
                      onChange={(e) => setMoneyTo({ ...moneyTo, jv_no: e.target.value })}
                      slotProps={{
                        input: {
                          startAdornment: <InputAdornment position="start"><IconReceipt2 size={16} color="#38bdf8" /></InputAdornment>,
                          sx: {
                            fontFamily: "monospace",
                            fontWeight: 800,
                            color: "#38bdf8",
                            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                            borderRadius: 2,
                            border: "1px solid rgba(56, 189, 248, 0.3)",
                            "& input": { color: "#38bdf8" },
                          },
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* ============================================================ */}
              {/* DYNAMIC BALANCE RECONCILIATION BANNER                        */}
              {/* ============================================================ */}
              <Box
                sx={{
                  p: 3,
                  mb: 3.5,
                  borderRadius: 3,
                  background: balanceInfo.isBalanced
                    ? "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)"
                    : "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)",
                  border: `1.5px solid ${balanceInfo.isBalanced ? "#34d399" : "#fb7185"}`,
                  boxShadow: balanceInfo.isBalanced
                    ? "0 10px 28px -6px rgba(16, 185, 129, 0.25)"
                    : "0 10px 28px -6px rgba(244, 63, 94, 0.2)",
                  transition: "all 0.3s ease",
                }}
              >
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", md: "center" }}
                  spacing={2}
                >
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box
                      sx={{
                        width: 46,
                        height: 46,
                        borderRadius: "50%",
                        bgcolor: balanceInfo.isBalanced ? "#059669" : "#e11d48",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: balanceInfo.isBalanced
                          ? "0 4px 14px rgba(5, 150, 105, 0.4)"
                          : "0 4px 14px rgba(225, 29, 72, 0.4)",
                      }}
                    >
                      {balanceInfo.isBalanced ? <IconCheck size={26} /> : <IconAlertCircle size={26} />}
                    </Box>

                    <Box>
                      <Typography
                        variant="h6"
                        fontWeight={800}
                        color={balanceInfo.isBalanced ? "#065f46" : "#9f1239"}
                      >
                        {balanceInfo.isBalanced
                          ? "Double-Entry Balanced & Ready for Posting"
                          : "General Ledger Entry is Out of Balance"}
                      </Typography>
                      <Typography
                        variant="body2"
                        color={balanceInfo.isBalanced ? "#047857" : "#be123c"}
                      >
                        {balanceInfo.isBalanced
                          ? "Debits and Credits reconcile perfectly. This voucher complies with SACCO accounting standards."
                          : "General ledger posting requires Total Debits to equal Total Credits before submission."}
                      </Typography>
                    </Box>
                  </Stack>

                  {/* Summary Metric Badges */}
                  <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Paper
                      elevation={0}
                      sx={{
                        px: 2,
                        py: 0.8,
                        borderRadius: 2,
                        bgcolor: "#ffffff",
                        border: "1px solid #a7f3d0",
                        textAlign: "center",
                      }}
                    >
                      <Typography variant="caption" color="#059669" fontWeight={700} display="block">
                        TOTAL DEBITS
                      </Typography>
                      <Typography variant="body1" fontWeight={800} color="#047857">
                        KES {balanceInfo.totalDebits.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </Typography>
                    </Paper>

                    <Paper
                      elevation={0}
                      sx={{
                        px: 2,
                        py: 0.8,
                        borderRadius: 2,
                        bgcolor: "#ffffff",
                        border: "1px solid #fed7aa",
                        textAlign: "center",
                      }}
                    >
                      <Typography variant="caption" color="#d97706" fontWeight={700} display="block">
                        TOTAL CREDITS
                      </Typography>
                      <Typography variant="body1" fontWeight={800} color="#b45309">
                        KES {balanceInfo.totalCredits.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </Typography>
                    </Paper>

                    {!balanceInfo.isBalanced && (
                      <Paper
                        elevation={0}
                        sx={{
                          px: 2,
                          py: 0.8,
                          borderRadius: 2,
                          bgcolor: "#ffe4e6",
                          border: "1px solid #f43f5e",
                          textAlign: "center",
                        }}
                      >
                        <Typography variant="caption" color="#e11d48" fontWeight={700} display="block">
                          VARIANCE (DIFF)
                        </Typography>
                        <Typography variant="body1" fontWeight={800} color="#be123c">
                          KES {balanceInfo.diff.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </Typography>
                      </Paper>
                    )}

                    <Chip
                      label={balanceInfo.isBalanced ? "BALANCED ✓" : "OUT OF BALANCE"}
                      sx={{
                        fontWeight: 800,
                        fontSize: "0.82rem",
                        height: 36,
                        px: 1.5,
                        bgcolor: balanceInfo.isBalanced ? "#059669" : "#e11d48",
                        color: "#ffffff",
                        boxShadow: balanceInfo.isBalanced
                          ? "0 4px 12px rgba(5, 150, 105, 0.35)"
                          : "0 4px 12px rgba(225, 29, 72, 0.35)",
                      }}
                    />
                  </Stack>
                </Stack>
              </Box>

              {/* ACTION BUTTONS BAR */}
              <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "stretch", sm: "center" }}
                spacing={2}
                pt={2}
                borderTop="1px solid #f1f5f9"
              >
                <Typography variant="caption" color="text.secondary">
                  🔒 Transaction will post atomically with unique sequence voucher <strong>JV-{moneyFrom.jv_no || currentJvNo}</strong>.
                </Typography>

                <Stack direction="row" spacing={2}>
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={() => {
                      setMoneyFrom({
                        account_id: "",
                        particular: "",
                        document_no: "",
                        transaction_date: todayStr,
                        debit: "",
                        credit: "",
                        jv_no: currentJvNo,
                      });
                      setMoneyTo({
                        account_id: "",
                        particular: "",
                        document_no: "",
                        transaction_date: todayStr,
                        debit: "",
                        credit: "",
                        jv_no: currentJvNo,
                      });
                    }}
                    sx={{
                      borderRadius: 2.5,
                      borderColor: "#cbd5e1",
                      color: "#64748b",
                      textTransform: "none",
                      fontWeight: 700,
                      px: 3,
                      "&:hover": { borderColor: "#94a3b8", bgcolor: "#f8fafc" },
                    }}
                  >
                    Reset Form
                  </Button>

                  <Button
                    type="submit"
                    variant="contained"
                    disabled={submitting || !balanceInfo.isBalanced}
                    startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <IconDeviceFloppy size={20} />}
                    sx={{
                      borderRadius: 2.5,
                      background: balanceInfo.isBalanced
                        ? "linear-gradient(135deg, #059669 0%, #047857 100%)"
                        : "#94a3b8",
                      boxShadow: balanceInfo.isBalanced
                        ? "0 10px 24px -4px rgba(5, 150, 105, 0.45)"
                        : "none",
                      color: "#ffffff",
                      fontWeight: 800,
                      textTransform: "none",
                      px: 4,
                      py: 1.2,
                      fontSize: "0.95rem",
                      "&:hover": {
                        background: balanceInfo.isBalanced
                          ? "linear-gradient(135deg, #047857 0%, #065f46 100%)"
                          : "#94a3b8",
                        transform: balanceInfo.isBalanced ? "translateY(-1px)" : "none",
                      },
                      transition: "all 0.2s ease",
                    }}
                  >
                    {submitting ? "Posting to General Ledger..." : "Save General Journal Entry"}
                  </Button>
                </Stack>
              </Stack>
            </form>
          </Card>
        )}

        {/* ============================================================ */}
        {/* TAB 2: JOURNAL TRANSACTIONS 🗎 (JIMANAGE :: JOURNAL LIST)     */}
        {/* ============================================================ */}
        {activeTab === 1 && (
          <Card
            elevation={0}
            sx={{
              borderRadius: 3.5,
              border: "1.5px solid #e2e8f0",
              boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
              p: { xs: 2.5, sm: 4 },
              bgcolor: "#ffffff",
            }}
          >
            {/* Filter Bar with elevated styling */}
            <Box
              sx={{
                p: 2.5,
                mb: 3,
                borderRadius: 3,
                bgcolor: "#f8fafc",
                border: "1.5px solid #e2e8f0",
              }}
            >
              <Grid container spacing={2} alignItems="flex-end">
                <Grid size={{ xs: 12, md: 3.5 }}>
                  <Typography variant="caption" fontWeight={800} color="#334155" textTransform="uppercase" letterSpacing={0.5} mb={0.7} display="block">
                    Account No
                  </Typography>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    value={filterAccount}
                    onChange={(e) => setFilterAccount(e.target.value)}
                    slotProps={{
                      input: {
                        sx: { borderRadius: 2, bgcolor: "#ffffff", fontWeight: 600 },
                      },
                    }}
                  >
                    <MenuItem value="ALL">[select one / all accounts]</MenuItem>
                    {accounts.map((acc) => (
                      <MenuItem key={acc.id} value={acc.account_code}>
                        <strong>{acc.account_code}</strong> - {acc.account_name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
                  <Typography variant="caption" fontWeight={800} color="#334155" textTransform="uppercase" letterSpacing={0.5} mb={0.7} display="block">
                    Date From
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                    slotProps={{
                      input: {
                        sx: { borderRadius: 2, bgcolor: "#ffffff" },
                      },
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
                  <Typography variant="caption" fontWeight={800} color="#334155" textTransform="uppercase" letterSpacing={0.5} mb={0.7} display="block">
                    Date To
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                    slotProps={{
                      input: {
                        sx: { borderRadius: 2, bgcolor: "#ffffff" },
                      },
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 2 }}>
                  <Typography variant="caption" fontWeight={800} color="#334155" textTransform="uppercase" letterSpacing={0.5} mb={0.7} display="block">
                    Keyword Search
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="JV / Doc / Note"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    slotProps={{
                      input: {
                        startAdornment: <InputAdornment position="start"><IconSearch size={16} color="#94a3b8" /></InputAdornment>,
                        sx: { borderRadius: 2, bgcolor: "#ffffff" },
                      },
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 1.5 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={fetchJournalEntries}
                    startIcon={<IconFilter size={18} />}
                    sx={{
                      background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                      boxShadow: "0 4px 14px rgba(5, 150, 105, 0.35)",
                      fontWeight: 800,
                      textTransform: "none",
                      borderRadius: 2,
                      height: 40,
                      "&:hover": {
                        background: "linear-gradient(135deg, #047857 0%, #065f46 100%)",
                      },
                    }}
                  >
                    Filter
                  </Button>
                </Grid>
              </Grid>
            </Box>

            {/* Quick KPI Strip */}
            <Grid container spacing={2} mb={3}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    bgcolor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: "#e0f2fe", color: "#0284c7" }}>
                    <IconReceipt2 size={24} />
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                      TRANSACTIONS FOUND
                    </Typography>
                    <Typography variant="h6" fontWeight={800} color="#0f172a">
                      {entriesList.length} Entries
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    bgcolor: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: "#dcfce7", color: "#059669" }}>
                    <IconArrowDownLeft size={24} />
                  </Box>
                  <Box>
                    <Typography variant="caption" color="#059669" fontWeight={700}>
                      TOTAL DEBIT VALUE
                    </Typography>
                    <Typography variant="h6" fontWeight={800} color="#065f46">
                      KES {totalListDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    bgcolor: "#fffbeb",
                    border: "1px solid #fde68a",
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: "#fef3c7", color: "#d97706" }}>
                    <IconArrowUpRight size={24} />
                  </Box>
                  <Box>
                    <Typography variant="caption" color="#b45309" fontWeight={700}>
                      TOTAL CREDIT VALUE
                    </Typography>
                    <Typography variant="h6" fontWeight={800} color="#78350f">
                      KES {totalListCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>

            {/* Export Toolbar */}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "center" }}
              spacing={1.5}
              mb={2.5}
            >
              <Typography variant="subtitle2" fontWeight={800} color="#334155">
                Audit Ledger Records
              </Typography>

              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleCopy}
                  startIcon={<IconCopy size={16} />}
                  sx={{
                    color: "#334155",
                    borderColor: "#cbd5e1",
                    bgcolor: "#ffffff",
                    "&:hover": { bgcolor: "#f8fafc" },
                    textTransform: "none",
                    fontWeight: 700,
                    borderRadius: 2,
                  }}
                >
                  Copy
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleExportCSV}
                  startIcon={<IconFileSpreadsheet size={16} />}
                  sx={{
                    bgcolor: "#059669",
                    "&:hover": { bgcolor: "#047857" },
                    textTransform: "none",
                    fontWeight: 700,
                    borderRadius: 2,
                    boxShadow: "0 2px 8px rgba(5, 150, 105, 0.25)",
                  }}
                >
                  CSV
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleExportCSV}
                  startIcon={<IconTable size={16} />}
                  sx={{
                    bgcolor: "#16a34a",
                    "&:hover": { bgcolor: "#15803d" },
                    textTransform: "none",
                    fontWeight: 700,
                    borderRadius: 2,
                    boxShadow: "0 2px 8px rgba(22, 163, 74, 0.25)",
                  }}
                >
                  Excel
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => window.print()}
                  startIcon={<IconFileTypePdf size={16} />}
                  sx={{
                    bgcolor: "#dc2626",
                    "&:hover": { bgcolor: "#b91c1c" },
                    textTransform: "none",
                    fontWeight: 700,
                    borderRadius: 2,
                    boxShadow: "0 2px 8px rgba(220, 38, 38, 0.25)",
                  }}
                >
                  PDF
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => window.print()}
                  startIcon={<IconPrinter size={16} />}
                  sx={{
                    bgcolor: "#4f46e5",
                    "&:hover": { bgcolor: "#4338ca" },
                    textTransform: "none",
                    fontWeight: 700,
                    borderRadius: 2,
                    boxShadow: "0 2px 8px rgba(79, 70, 229, 0.25)",
                  }}
                >
                  Print
                </Button>
              </Stack>
            </Stack>

            {/* Table with rich styling */}
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{
                borderRadius: 3,
                border: "1.5px solid #e2e8f0",
                overflow: "hidden",
                boxShadow: "0 6px 20px rgba(0,0,0,0.03)",
              }}
            >
              <Table size="small">
                <TableHead sx={{ background: "linear-gradient(135deg, #064E3B 0%, #065F46 45%, #0F172A 100%)" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, color: "#ffffff", fontSize: "0.75rem", width: 50, letterSpacing: 0.8, textTransform: "uppercase" }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: "#ffffff", fontSize: "0.75rem", letterSpacing: 0.8, textTransform: "uppercase" }}>Account No</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: "#ffffff", fontSize: "0.75rem", letterSpacing: 0.8, textTransform: "uppercase" }}>Jv No</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: "#ffffff", fontSize: "0.75rem", letterSpacing: 0.8, textTransform: "uppercase" }}>Particular</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: "#ffffff", fontSize: "0.75rem", letterSpacing: 0.8, textTransform: "uppercase" }}>Document No</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: "#ffffff", fontSize: "0.75rem", letterSpacing: 0.8, textTransform: "uppercase" }}>Transaction Date</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: "#ffffff", fontSize: "0.75rem", letterSpacing: 0.8, textTransform: "uppercase" }}>Debit (KES)</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: "#ffffff", fontSize: "0.75rem", letterSpacing: 0.8, textTransform: "uppercase" }}>Credit (KES)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {listLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                        <CircularProgress size={32} sx={{ color: "#059669" }} />
                        <Typography variant="body2" color="text.secondary" mt={1} fontWeight={600}>
                          Fetching General Ledger vouchers...
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : paginatedEntries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 6, bgcolor: "#fafafa" }}>
                        <Typography variant="body2" color="#64748b" fontWeight={700}>
                          No journal transactions match the selected filters.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedEntries.map((e, idx) => (
                      <TableRow
                        key={e.id}
                        hover
                        sx={{
                          bgcolor: idx % 2 === 0 ? "#ffffff" : "#f8fafc",
                          "&:hover": { bgcolor: "rgba(16, 185, 129, 0.05)" },
                        }}
                      >
                        <TableCell sx={{ color: "#64748b", fontSize: "0.82rem", fontWeight: 700 }}>
                          {e.index}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800, color: "#0f172a", fontSize: "0.85rem" }}>
                          {e.account_no}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={e.jv_no}
                            sx={{
                              fontFamily: "monospace",
                              fontWeight: 800,
                              color: "#1d4ed8",
                              bgcolor: "#eff6ff",
                              border: "1px solid #bfdbfe",
                              borderRadius: 1.5,
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.84rem", color: "#334155", maxWidth: 280 }}>
                          {e.particular}
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" sx={{ fontFamily: "monospace", fontWeight: 700, color: "#475569", bgcolor: "#f1f5f9", px: 1, py: 0.3, borderRadius: 1 }}>
                            {e.document_no}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.82rem", color: "#475569" }}>
                          {e.transaction_date}
                        </TableCell>
                        <TableCell align="right">
                          {e.debit !== "0.00" ? (
                            <Chip
                              size="small"
                              label={`+ ${parseFloat(e.debit?.toString() || "0").toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                              sx={{
                                fontWeight: 800,
                                color: "#047857",
                                bgcolor: "#ecfdf5",
                                border: "1px solid #a7f3d0",
                              }}
                            />
                          ) : (
                            <span style={{ color: "#94a3b8" }}>—</span>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {e.credit !== "0.00" ? (
                            <Chip
                              size="small"
                              label={`- ${parseFloat(e.credit?.toString() || "0").toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                              sx={{
                                fontWeight: 800,
                                color: "#b45309",
                                bgcolor: "#fffbeb",
                                border: "1px solid #fde68a",
                              }}
                            />
                          ) : (
                            <span style={{ color: "#94a3b8" }}>—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Table pagination & footer summary */}
              <Box
                sx={{
                  p: 2.5,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderTop: "1.5px solid #e2e8f0",
                  bgcolor: "#f8fafc",
                }}
              >
                <Typography variant="caption" fontWeight={700} color="#475569">
                  Showing {entriesList.length === 0 ? "0 to 0 of 0 entries" : `${(page - 1) * rowsPerPage + 1} to ${Math.min(page * rowsPerPage, entriesList.length)} of ${entriesList.length} total entries`}
                </Typography>
                {entriesList.length > rowsPerPage && (
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                      sx={{ textTransform: "none", borderRadius: 2, borderColor: "#cbd5e1", fontWeight: 700 }}
                    >
                      Previous
                    </Button>
                    <Typography variant="body2" sx={{ alignSelf: "center", px: 1, fontWeight: 700, color: "#334155" }}>
                      Page {page} of {totalPages}
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={page === totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      sx={{ textTransform: "none", borderRadius: 2, borderColor: "#cbd5e1", fontWeight: 700 }}
                    >
                      Next
                    </Button>
                  </Stack>
                )}
              </Box>
            </TableContainer>
          </Card>
        )}

        {/* ============================================================ */}
        {/* TAB 3: BROUGHT FORWARD 🗎 (Account BF)                         */}
        {/* ============================================================ */}
        {activeTab === 2 && (
          <Card
            elevation={0}
            sx={{
              borderRadius: 3.5,
              border: "1.5px solid #e2e8f0",
              boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
              p: { xs: 2.5, sm: 4 },
              bgcolor: "#ffffff",
            }}
          >
            {/* Informational Header */}
            <Box
              sx={{
                mb: 4,
                p: 3,
                borderRadius: 3,
                background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)",
                color: "#ffffff",
                boxShadow: "0 10px 25px -5px rgba(67, 56, 202, 0.3)",
              }}
            >
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "flex-start", sm: "center" }}>
                <Box
                  sx={{
                    p: 1.2,
                    borderRadius: 2.5,
                    bgcolor: "rgba(255, 255, 255, 0.15)",
                    border: "1px solid rgba(255, 255, 255, 0.25)",
                    display: "flex",
                  }}
                >
                  <IconBook2 size={28} color="#a5b4fc" />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={800} color="#ffffff">
                    Account Brought Forward (BF) Opening Balances
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#e0e7ff" }}>
                    Configure the opening balance for any Chart of Accounts ledger item. The system automatically creates an offset entry against <strong>3000 Opening Balance Equity</strong>.
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <form onSubmit={handleSaveBroughtForward}>
              <Box
                sx={{
                  p: 3,
                  mb: 4,
                  borderRadius: 3,
                  bgcolor: "#f8fafc",
                  border: "1.5px solid #e2e8f0",
                }}
              >
                <Grid container spacing={2.5} sx={{ mb: 2 }}>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Typography variant="caption" fontWeight={800} color="#334155" textTransform="uppercase" letterSpacing={0.5} mb={0.8} display="block">
                      Account No <span style={{ color: "#ef4444" }}>*</span>
                    </Typography>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      value={bfData.account_no}
                      onChange={(e) => setBfData({ ...bfData, account_no: e.target.value })}
                      required
                      slotProps={{
                        input: {
                          sx: { borderRadius: 2, bgcolor: "#ffffff", fontWeight: 600 },
                        },
                      }}
                    >
                      <MenuItem value="">[select ledger account]</MenuItem>
                      {accounts.map((acc) => (
                        <MenuItem key={acc.id} value={acc.id}>
                          <strong>{acc.account_code}</strong> - {acc.account_name} ({acc.account_type})
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12, md: 3 }}>
                    <Typography variant="caption" fontWeight={800} color="#334155" textTransform="uppercase" letterSpacing={0.5} mb={0.8} display="block">
                      Particular / Description <span style={{ color: "#ef4444" }}>*</span>
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      value={bfData.particular}
                      onChange={(e) => setBfData({ ...bfData, particular: e.target.value })}
                      required
                      slotProps={{
                        input: {
                          sx: { borderRadius: 2, bgcolor: "#ffffff" },
                        },
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 3 }}>
                    <Typography variant="caption" fontWeight={800} color="#334155" textTransform="uppercase" letterSpacing={0.5} mb={0.8} display="block">
                      Document No <span style={{ color: "#ef4444" }}>*</span>
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="e.g. BF-2026-001"
                      value={bfData.document_no}
                      onChange={(e) => setBfData({ ...bfData, document_no: e.target.value })}
                      required
                      slotProps={{
                        input: {
                          sx: { borderRadius: 2, bgcolor: "#ffffff", fontFamily: "monospace" },
                        },
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 3 }}>
                    <Typography variant="caption" fontWeight={800} color="#334155" textTransform="uppercase" letterSpacing={0.5} mb={0.8} display="block">
                      Transaction Date <span style={{ color: "#ef4444" }}>*</span>
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      value={bfData.transaction_date}
                      onChange={(e) => setBfData({ ...bfData, transaction_date: e.target.value })}
                      required
                      slotProps={{
                        input: {
                          sx: { borderRadius: 2, bgcolor: "#ffffff" },
                        },
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <Typography variant="caption" fontWeight={800} color="#059669" textTransform="uppercase" letterSpacing={0.5} mb={0.8} display="block">
                      Opening Debit Balance (KES)
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      placeholder="0.00"
                      value={bfData.debit}
                      onChange={(e) => setBfData({ ...bfData, debit: e.target.value, credit: "" })}
                      slotProps={{
                        input: {
                          startAdornment: <InputAdornment position="start"><Typography variant="caption" fontWeight={800} color="#059669">KES</Typography></InputAdornment>,
                          sx: { borderRadius: 2, bgcolor: "#ecfdf5", fontWeight: 700 },
                        },
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <Typography variant="caption" fontWeight={800} color="#d97706" textTransform="uppercase" letterSpacing={0.5} mb={0.8} display="block">
                      Opening Credit Balance (KES)
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      placeholder="0.00"
                      value={bfData.credit}
                      onChange={(e) => setBfData({ ...bfData, credit: e.target.value, debit: "" })}
                      slotProps={{
                        input: {
                          startAdornment: <InputAdornment position="start"><Typography variant="caption" fontWeight={800} color="#d97706">KES</Typography></InputAdornment>,
                          sx: { borderRadius: 2, bgcolor: "#fffbeb", fontWeight: 700 },
                        },
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <Typography variant="caption" fontWeight={800} color="#334155" textTransform="uppercase" letterSpacing={0.5} mb={0.8} display="block">
                      JVNO Reference
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      value={bfData.jv_no || currentJvNo}
                      onChange={(e) => setBfData({ ...bfData, jv_no: e.target.value })}
                      slotProps={{
                        input: {
                          startAdornment: <InputAdornment position="start"><IconReceipt2 size={16} color="#38bdf8" /></InputAdornment>,
                          sx: {
                            fontFamily: "monospace",
                            fontWeight: 800,
                            color: "#38bdf8",
                            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                            borderRadius: 2,
                            "& input": { color: "#38bdf8" },
                          },
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>

              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  type="submit"
                  variant="contained"
                  disabled={submitting}
                  startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <IconDeviceFloppy size={20} />}
                  sx={{
                    background: "linear-gradient(135deg, #4338ca 0%, #3730a3 100%)",
                    boxShadow: "0 8px 24px -4px rgba(67, 56, 202, 0.4)",
                    color: "#ffffff",
                    fontWeight: 800,
                    textTransform: "none",
                    borderRadius: 2.5,
                    px: 4,
                    py: 1.2,
                    fontSize: "0.95rem",
                    "&:hover": {
                      background: "linear-gradient(135deg, #3730a3 0%, #312e81 100%)",
                      transform: "translateY(-1px)",
                    },
                    transition: "all 0.2s ease",
                  }}
                >
                  {submitting ? "Saving Opening Balance..." : "Save Brought Forward Balance"}
                </Button>
              </Stack>
            </form>
          </Card>
        )}
      </Box>
    </PageContainer>
  );
}
