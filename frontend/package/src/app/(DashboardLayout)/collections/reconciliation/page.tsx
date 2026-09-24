"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
} from "@mui/material";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import {
  IconRefresh,
  IconPlus,
  IconCheck,
  IconX,
  IconDatabase,
  IconBuildingBank,
  IconArrowDownLeft,
  IconArrowUpRight,
} from "@tabler/icons-react";
import ExportButton from "@/components/common/ExportButton";
import { ExportColumn } from "@/utils/exportGrid";

interface LedgerItem {
  id: number;
  account_name: string;
  description: string;
  money_in: string | null;
  money_out: string | null;
  related_loan_id: number | null;
  transaction_date: string;
  is_reversed: boolean;
  created_at: string;
}

export default function ReconciliationPage() {
  const [ledger, setLedger] = useState<LedgerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountFilter, setAccountFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [newTxn, setNewTxn] = useState({
    account_name: "M-PESA Collection Account",
    description: "",
    money_in: "",
    money_out: "",
    related_loan_id: "",
    transaction_date: new Date().toISOString().split("T")[0],
  });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    fetchLedger();
  }, []);

  async function fetchLedger() {
    setLoading(true);
    try {
      const res = await fetch("/api/ledger");
      if (res.ok) {
        const data = await res.json();
        setLedger(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to load ledger:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateManualTxn(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/ledger/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_name: newTxn.account_name,
          description: newTxn.description,
          money_in: newTxn.money_in ? Number(newTxn.money_in) : null,
          money_out: newTxn.money_out ? Number(newTxn.money_out) : null,
          related_loan_id: newTxn.related_loan_id ? Number(newTxn.related_loan_id) : null,
          transaction_date: newTxn.transaction_date,
        }),
      });

      if (res.ok) {
        setToast({ open: true, message: "Ledger transaction recorded successfully.", severity: "success" });
        setModalOpen(false);
        setNewTxn({
          account_name: "M-PESA Collection Account",
          description: "",
          money_in: "",
          money_out: "",
          related_loan_id: "",
          transaction_date: new Date().toISOString().split("T")[0],
        });
        fetchLedger();
      } else {
        const err = await res.json().catch(() => ({}));
        setToast({ open: true, message: err.detail || "Failed to record transaction", severity: "error" });
      }
    } catch (err) {
      console.error(err);
      setToast({ open: true, message: "Error submitting transaction", severity: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = ledger.filter((item) =>
    (item.account_name || "").toLowerCase().includes(accountFilter.toLowerCase()) ||
    (item.description || "").toLowerCase().includes(accountFilter.toLowerCase())
  );

  const exportColumns: ExportColumn<LedgerItem>[] = [
    { header: "Txn Date", accessor: (row) => row.transaction_date || "N/A" },
    { header: "Account Name", accessor: (row) => row.account_name || "N/A" },
    { header: "Description", accessor: (row) => row.description || "N/A" },
    { header: "Money In (KES)", accessor: (row) => Number(row.money_in || 0).toLocaleString() },
    { header: "Money Out (KES)", accessor: (row) => Number(row.money_out || 0).toLocaleString() },
    { header: "Loan Ref", accessor: (row) => (row.related_loan_id ? `LN #${row.related_loan_id}` : "N/A") },
    { header: "Status", accessor: (row) => (row.is_reversed ? "Reversed" : "Reconciled") },
  ];

  const totalIn = ledger.reduce((acc, cur) => acc + Number(cur.money_in || 0), 0);
  const totalOut = ledger.reduce((acc, cur) => acc + Number(cur.money_out || 0), 0);

  return (
    <PageContainer title="M-Pesa Reconciliation & Ledger - Royal SACCO" description="Reconcile M-Pesa statements and audit ledger">
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        {/* Executive Header Banner */}
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
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "center" }}
            spacing={2}
          >
            <Box>
              <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
                <Box sx={{ p: 1, bgcolor: "rgba(255,255,255,0.18)", borderRadius: 2, display: "flex" }}>
                  <IconDatabase size={26} color="#6ee7b7" />
                </Box>
                <Typography variant="h4" fontWeight={800} sx={{ color: "#ffffff", letterSpacing: "-0.5px" }}>
                  M-Pesa &amp; Bank Reconciliation
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ color: "#d1fae5", maxWidth: 680 }}>
                Review real-time ledger entries, audit inflow &amp; outflow settlement streams, and reconcile M-Pesa receipts against loan accounts.
              </Typography>
            </Box>

            <Stack direction="row" spacing={1.5} alignItems="center">
              <Button
                variant="contained"
                startIcon={<IconPlus size={18} />}
                onClick={() => setModalOpen(true)}
                sx={{
                  bgcolor: "#10b981",
                  color: "#ffffff",
                  fontWeight: 700,
                  textTransform: "none",
                  "&:hover": { bgcolor: "#059669" },
                }}
              >
                Manual Entry
              </Button>
              <Button
                variant="outlined"
                startIcon={<IconRefresh size={18} />}
                onClick={fetchLedger}
                disabled={loading}
                sx={{
                  borderColor: "rgba(255,255,255,0.4)",
                  color: "#ffffff",
                  fontWeight: 600,
                  textTransform: "none",
                  "&:hover": { borderColor: "#ffffff", bgcolor: "rgba(255,255,255,0.1)" },
                }}
              >
                Refresh
              </Button>
            </Stack>
          </Stack>
        </Box>

        {/* Executive High-Contrast Metric Cards */}
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
                      TOTAL COLLECTIONS IN
                    </Typography>
                    <Typography variant="h4" fontWeight={800} sx={{ color: "#047857", mt: 0.5 }}>
                      KES {totalIn.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" mt={0.25}>
                      Total Verified Cash &amp; M-Pesa Inflow
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.5, bgcolor: "#ecfdf5", color: "#059669", borderRadius: 2 }}>
                    <IconArrowDownLeft size={24} />
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
                borderTop: "3px solid #dc2626",
                borderRadius: 2.5,
                boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" sx={{ color: "#991b1b", fontWeight: 700, letterSpacing: 0.5 }}>
                      TOTAL DISBURSEMENTS OUT
                    </Typography>
                    <Typography variant="h4" fontWeight={800} sx={{ color: "#b91c1c", mt: 0.5 }}>
                      KES {totalOut.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" mt={0.25}>
                      Loan Payouts &amp; Deposit Refunds
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.5, bgcolor: "#fef2f2", color: "#dc2626", borderRadius: 2 }}>
                    <IconArrowUpRight size={24} />
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
                      NET RECONCILED POSITION
                    </Typography>
                    <Typography variant="h4" fontWeight={800} sx={{ color: "#0f172a", mt: 0.5 }}>
                      KES {(totalIn - totalOut).toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" mt={0.25}>
                      Net Operating Settlement Balance
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.5, bgcolor: "#f0f9ff", color: "#0284c7", borderRadius: 2 }}>
                    <IconBuildingBank size={24} />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Ledger Table */}
        <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ p: 1, bgcolor: "primary.light", borderRadius: 1.5, color: "primary.main", display: "flex" }}>
                  <IconDatabase size={22} />
                </Box>
                <Typography variant="h6" fontWeight={700}>
                  General Ledger Transactions ({ledger.length})
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <TextField
                  size="small"
                  placeholder="Filter by account or notes..."
                  value={accountFilter}
                  onChange={(e) => setAccountFilter(e.target.value)}
                  sx={{ width: 240 }}
                />
                <ExportButton
                  data={filtered}
                  columns={exportColumns}
                  filename="mpesa_bank_reconciliation"
                  title="Royal SACCO - M-Pesa & Bank Reconciliation Ledger"
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
                  No ledger transactions recorded yet. Use &quot;Manual Entry&quot; to post a test transaction.
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: "#f8fafc" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Txn Date</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Account Name</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Money In (KES)</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Money Out (KES)</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Loan Ref</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filtered.map((row) => (
                      <TableRow key={row.id} hover sx={{ "&:hover": { bgcolor: "#f1f5f9" } }}>
                        <TableCell sx={{ color: "text.secondary", fontSize: "0.82rem" }}>{row.transaction_date}</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: "text.primary" }}>{row.account_name}</TableCell>
                        <TableCell sx={{ fontSize: "0.85rem" }}>{row.description}</TableCell>
                        <TableCell align="right" sx={{ color: row.money_in ? "#059669" : "text.secondary", fontWeight: 800 }}>
                          {row.money_in ? `+KES ${Number(row.money_in).toLocaleString()}` : "-"}
                        </TableCell>
                        <TableCell align="right" sx={{ color: row.money_out ? "#dc2626" : "text.secondary", fontWeight: 800 }}>
                          {row.money_out ? `-KES ${Number(row.money_out).toLocaleString()}` : "-"}
                        </TableCell>
                        <TableCell align="center">
                          {row.related_loan_id ? (
                            <Typography variant="caption" fontWeight={700} color="primary.main">
                              Loan #{row.related_loan_id}
                            </Typography>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={row.is_reversed ? "Reversed" : "Reconciled"}
                            size="small"
                            sx={{
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              bgcolor: row.is_reversed ? "#fee2e2" : "#ecfdf5",
                              color: row.is_reversed ? "#991b1b" : "#065f46",
                              border: row.is_reversed ? "1px solid #fecaca" : "1px solid #a7f3d0",
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

      {/* Manual Entry Modal */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Record Manual Ledger Transaction</DialogTitle>
        <form onSubmit={handleCreateManualTxn}>
          <DialogContent dividers>
            <Stack spacing={2.5}>
              <TextField
                fullWidth
                label="Account Name *"
                value={newTxn.account_name}
                onChange={(e) => setNewTxn({ ...newTxn, account_name: e.target.value })}
                required
              />
              <TextField
                fullWidth
                label="Description / Narration *"
                value={newTxn.description}
                onChange={(e) => setNewTxn({ ...newTxn, description: e.target.value })}
                placeholder="e.g. M-Pesa Paybill daily bulk batch sync"
                required
              />
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Money In (KES)"
                    value={newTxn.money_in}
                    onChange={(e) => setNewTxn({ ...newTxn, money_in: e.target.value })}
                    placeholder="e.g. 50000"
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Money Out (KES)"
                    value={newTxn.money_out}
                    onChange={(e) => setNewTxn({ ...newTxn, money_out: e.target.value })}
                    placeholder="e.g. 0"
                  />
                </Grid>
              </Grid>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Transaction Date *"
                    value={newTxn.transaction_date}
                    onChange={(e) => setNewTxn({ ...newTxn, transaction_date: e.target.value })}
                    slotProps={{ inputLabel: { shrink: true } }}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Related Loan ID (Optional)"
                    value={newTxn.related_loan_id}
                    onChange={(e) => setNewTxn({ ...newTxn, related_loan_id: e.target.value })}
                  />
                </Grid>
              </Grid>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setModalOpen(false)} sx={{ textTransform: "none" }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              sx={{ textTransform: "none", fontWeight: 700 }}
            >
              {submitting ? "Saving..." : "Save Transaction"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert severity={toast.severity} onClose={() => setToast({ ...toast, open: false })}>
          {toast.message}
        </Alert>
      </Snackbar>
    </PageContainer>
  );
}
