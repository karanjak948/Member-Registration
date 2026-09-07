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
} from "@mui/material";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
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
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [accounts, setAccounts] = useState<LedgerAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedTxns, setExpandedTxns] = useState<Record<number, boolean>>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const [txRes, accRes] = await Promise.all([
        fetch("/api/ledger").then((r) => r.json()).catch(() => []),
        fetch("/api/ledger-accounts").then((r) => r.json()).catch(() => []),
      ]);
      setTransactions(Array.isArray(txRes) ? txRes : []);
      setAccounts(Array.isArray(accRes) ? accRes : []);
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

  // Financial Metrics
  const metrics = useMemo(() => {
    let totalDisbursed = 0;
    let totalCashOut = 0;
    let totalCashIn = 0;
    let totalRevenue = 0;

    transactions.forEach((tx) => {
      tx.entries?.forEach((e) => {
        const amt = Number(e.amount || 0);
        if (e.account_code === "1200" && e.entry_type === "debit") {
          totalDisbursed += amt;
        }
        if (e.account_code === "1010") {
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
    };
  }, [transactions]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return transactions;
    const q = searchQuery.toLowerCase();
    return transactions.filter(
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
  }, [transactions, searchQuery]);

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
                onChange={(_, v) => setTabValue(v)}
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
                  icon={<IconReceipt2 size={18} />}
                  iconPosition="start"
                  label={`General Journal (${filteredTransactions.length})`}
                />
                <Tab
                  icon={<IconBook2 size={18} />}
                  iconPosition="start"
                  label={`Chart of Accounts (${accounts.length})`}
                />
              </Tabs>

              {tabValue === 0 && (
                <TextField
                  size="small"
                  placeholder="Search journal entries..."
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
                            </TableRow>

                            {/* Collapsible Double-Entry Details */}
                            <TableRow key={`${tx.id}-detail`}>
                              <TableCell colSpan={8} sx={{ py: 0, px: 3, bgcolor: "#f8fafc" }}>
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
            ) : (
              /* TAB 2: Chart of Accounts */
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
