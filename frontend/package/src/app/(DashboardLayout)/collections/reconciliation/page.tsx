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
import { IconRefresh, IconPlus, IconCheck, IconX, IconDatabase } from "@tabler/icons-react";

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
    item.account_name.toLowerCase().includes(accountFilter.toLowerCase()) ||
    item.description.toLowerCase().includes(accountFilter.toLowerCase())
  );

  const totalIn = ledger.reduce((acc, cur) => acc + Number(cur.money_in || 0), 0);
  const totalOut = ledger.reduce((acc, cur) => acc + Number(cur.money_out || 0), 0);

  return (
    <PageContainer title="M-Pesa Reconciliation & Ledger - Royal SACCO" description="Reconcile M-Pesa statements and audit ledger">
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" fontWeight={700} color="text.primary">
              M-Pesa &amp; Bank Reconciliation
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Review ledger transactions, audit money flow, and reconcile M-Pesa receipts against loan accounts
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<IconPlus size={18} />}
              onClick={() => setModalOpen(true)}
              sx={{ textTransform: "none", fontWeight: 700 }}
            >
              Manual Entry
            </Button>
            <Button
              variant="outlined"
              startIcon={<IconRefresh size={18} />}
              onClick={fetchLedger}
              disabled={loading}
              sx={{ textTransform: "none" }}
            >
              Refresh
            </Button>
          </Stack>
        </Stack>

        {/* Summary Metric Strip */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ bgcolor: "success.light", borderRadius: 2 }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="caption" color="success.dark" fontWeight={700}>TOTAL COLLECTIONS IN</Typography>
                <Typography variant="h5" fontWeight={800} color="success.dark" mt={0.5}>
                  KES {totalIn.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ bgcolor: "error.light", borderRadius: 2 }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="caption" color="error.dark" fontWeight={700}>TOTAL DISBURSEMENTS OUT</Typography>
                <Typography variant="h5" fontWeight={800} color="error.dark" mt={0.5}>
                  KES {totalOut.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ bgcolor: "primary.light", borderRadius: 2 }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="caption" color="primary.dark" fontWeight={700}>NET RECONCILED BALANCE</Typography>
                <Typography variant="h5" fontWeight={800} color="primary.dark" mt={0.5}>
                  KES {(totalIn - totalOut).toLocaleString()}
                </Typography>
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
              <TextField
                size="small"
                placeholder="Filter by account or notes..."
                value={accountFilter}
                onChange={(e) => setAccountFilter(e.target.value)}
                sx={{ width: 260 }}
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
                  No ledger transactions recorded yet. Use &quot;Manual Entry&quot; to post a test transaction.
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: "grey.100" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Txn Date</TableCell>
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
                      <TableRow key={row.id} hover>
                        <TableCell>{row.transaction_date}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{row.account_name}</TableCell>
                        <TableCell>{row.description}</TableCell>
                        <TableCell align="right" sx={{ color: row.money_in ? "success.main" : "text.secondary", fontWeight: 700 }}>
                          {row.money_in ? `+${Number(row.money_in).toLocaleString()}` : "-"}
                        </TableCell>
                        <TableCell align="right" sx={{ color: row.money_out ? "error.main" : "text.secondary", fontWeight: 700 }}>
                          {row.money_out ? `-${Number(row.money_out).toLocaleString()}` : "-"}
                        </TableCell>
                        <TableCell align="center">
                          {row.related_loan_id ? `Loan #${row.related_loan_id}` : "-"}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={row.is_reversed ? "Reversed" : "Reconciled"}
                            size="small"
                            color={row.is_reversed ? "error" : "success"}
                            sx={{ fontSize: "0.7rem" }}
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
