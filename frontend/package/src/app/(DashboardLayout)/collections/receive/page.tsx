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
  MenuItem,
  Stack,
  TextField,
  Typography,
  Alert,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from "@mui/material";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import { IconCash, IconReceipt, IconRefresh, IconCheck, IconSearch } from "@tabler/icons-react";

interface LoanItem {
  id: number;
  loan_number: string;
  member_id: number;
  principal_amount: string;
  outstanding_balance: string;
  status: string;
}

export default function ReceivePaymentPage() {
  const [loans, setLoans] = useState<LoanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoanId, setSelectedLoanId] = useState<number | "">("");
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMode, setPaymentMode] = useState("MPESA");
  const [mpesaRef, setMpesaRef] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  const [recentRepayments, setRecentRepayments] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchLoans();
  }, []);

  async function fetchLoans() {
    setLoading(true);
    try {
      const res = await fetch("/api/loans");
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setLoans(list);
        if (list.length > 0) {
          setSelectedLoanId(list[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load loans:", err);
    } finally {
      setLoading(false);
    }
  }

  const selectedLoan = loans.find((l) => l.id === Number(selectedLoanId));

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLoanId || !amountPaid || Number(amountPaid) <= 0) {
      setToast({
        open: true,
        message: "Please select a loan and enter a valid payment amount.",
        severity: "error",
      });
      return;
    }

    setSubmitting(true);
    try {
      const paymentNotes = `${paymentMode} ${mpesaRef ? `Ref: ${mpesaRef} ` : ""}- ${notes}`.trim();
      const res = await fetch(`/api/loans/${selectedLoanId}/repayments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payment_date: paymentDate,
          amount_paid: Number(amountPaid),
          notes: paymentNotes,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setToast({
          open: true,
          message: `Payment of KES ${Number(amountPaid).toLocaleString()} recorded successfully!`,
          severity: "success",
        });

        // Add to recent payments list
        setRecentRepayments((prev) => [
          {
            id: result.id || Date.now(),
            loan_number: selectedLoan?.loan_number || `LN-${selectedLoanId}`,
            member_id: selectedLoan?.member_id,
            amount_paid: amountPaid,
            payment_date: paymentDate,
            notes: paymentNotes,
          },
          ...prev,
        ]);

        // Reset inputs
        setAmountPaid("");
        setMpesaRef("");
        setNotes("");
        fetchLoans();
      } else {
        const err = await res.json().catch(() => ({}));
        setToast({
          open: true,
          message: err.detail || err.error || "Failed to record payment on Loan Engine.",
          severity: "error",
        });
      }
    } catch (err) {
      console.error(err);
      setToast({
        open: true,
        message: "Network error occurred while submitting payment.",
        severity: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const filteredLoans = loans.filter((l) =>
    l.loan_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(l.member_id).includes(searchTerm)
  );

  return (
    <PageContainer title="Receive Payment - Collections" description="Record Loan Repayments & Collections">
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" fontWeight={700} color="text.primary">
              Receive Payment &amp; Collections
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Record loan repayments, M-Pesa collections, and direct deposits via Jiinue Loan Engine
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<IconRefresh size={18} />}
            onClick={fetchLoans}
            disabled={loading}
            sx={{ textTransform: "none" }}
          >
            Refresh
          </Button>
        </Stack>

        <Grid container spacing={3}>
          {/* Payment Form */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
                  <Box sx={{ p: 1, bgcolor: "primary.light", borderRadius: 1.5, color: "primary.main", display: "flex" }}>
                    <IconCash size={22} />
                  </Box>
                  <Typography variant="h6" fontWeight={700}>
                    Record Repayment
                  </Typography>
                </Stack>

                <Divider sx={{ mb: 2.5 }} />

                <form onSubmit={handleRecordPayment}>
                  <Stack spacing={2.5}>
                    <TextField
                      select
                      fullWidth
                      label="Select Active Loan *"
                      value={selectedLoanId}
                      onChange={(e) => setSelectedLoanId(Number(e.target.value))}
                      disabled={loading || loans.length === 0}
                      helperText={loans.length === 0 && !loading ? "No active loans found on Loan Engine" : ""}
                    >
                      {loans.map((loan) => (
                        <MenuItem key={loan.id} value={loan.id}>
                          {loan.loan_number} (Member #{loan.member_id} - Bal: KES {Number(loan.outstanding_balance || 0).toLocaleString()})
                        </MenuItem>
                      ))}
                    </TextField>

                    {selectedLoan && (
                      <Box sx={{ p: 2, bgcolor: "grey.100", borderRadius: 1.5 }}>
                        <Stack spacing={1}>
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="caption" color="text.secondary">Loan Number:</Typography>
                            <Typography variant="caption" fontWeight={700}>{selectedLoan.loan_number}</Typography>
                          </Stack>
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="caption" color="text.secondary">Principal Amount:</Typography>
                            <Typography variant="caption" fontWeight={700}>KES {Number(selectedLoan.principal_amount || 0).toLocaleString()}</Typography>
                          </Stack>
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="caption" color="text.secondary">Outstanding Balance:</Typography>
                            <Typography variant="caption" fontWeight={700} color="error.main">KES {Number(selectedLoan.outstanding_balance || 0).toLocaleString()}</Typography>
                          </Stack>
                        </Stack>
                      </Box>
                    )}

                    <TextField
                      fullWidth
                      type="number"
                      label="Amount Paid (KES) *"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      placeholder="e.g. 5000"
                      required
                    />

                    <Grid container spacing={2}>
                      <Grid size={{ xs: 6 }}>
                        <TextField
                          fullWidth
                          type="date"
                          label="Payment Date *"
                          value={paymentDate}
                          onChange={(e) => setPaymentDate(e.target.value)}
                          slotProps={{ inputLabel: { shrink: true } }}
                          required
                        />
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <TextField
                          select
                          fullWidth
                          label="Mode of Payment"
                          value={paymentMode}
                          onChange={(e) => setPaymentMode(e.target.value)}
                        >
                          <MenuItem value="MPESA">M-Pesa</MenuItem>
                          <MenuItem value="BANK">Bank Transfer</MenuItem>
                          <MenuItem value="CASH">Cash Deposit</MenuItem>
                          <MenuItem value="CHEQUE">Cheque</MenuItem>
                        </TextField>
                      </Grid>
                    </Grid>

                    {paymentMode === "MPESA" && (
                      <TextField
                        fullWidth
                        label="M-Pesa Transaction Reference"
                        value={mpesaRef}
                        onChange={(e) => setMpesaRef(e.target.value)}
                        placeholder="e.g. QHX78291KL"
                      />
                    )}

                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Payment Notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Optional remarks or installment details..."
                    />

                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      size="large"
                      disabled={submitting || loans.length === 0}
                      startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <IconCheck size={18} />}
                      sx={{ textTransform: "none", fontWeight: 700, py: 1.3 }}
                    >
                      {submitting ? "Processing Repayment..." : "Confirm & Record Payment"}
                    </Button>
                  </Stack>
                </form>
              </CardContent>
            </Card>
          </Grid>

          {/* Loans Overview & Search */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, height: "100%" }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box sx={{ p: 1, bgcolor: "success.light", borderRadius: 1.5, color: "success.main", display: "flex" }}>
                      <IconReceipt size={22} />
                    </Box>
                    <Typography variant="h6" fontWeight={700}>
                      Active Loans in System ({loans.length})
                    </Typography>
                  </Stack>

                  <TextField
                    size="small"
                    placeholder="Search loan or member..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    slotProps={{
                      input: {
                        startAdornment: <IconSearch size={16} style={{ marginRight: 6, color: "#94a3b8" }} />,
                      },
                    }}
                    sx={{ width: 220 }}
                  />
                </Stack>

                <Divider sx={{ mb: 2 }} />

                {loading ? (
                  <Box display="flex" justifyContent="center" py={8}>
                    <CircularProgress />
                  </Box>
                ) : filteredLoans.length === 0 ? (
                  <Box textAlign="center" py={6}>
                    <Typography variant="body2" color="text.secondary">
                      No loan records matching criteria.
                    </Typography>
                  </Box>
                ) : (
                  <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: "grey.100" }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Loan #</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Member ID</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="right">Principal</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="right">Balance</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="center">Status</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="center">Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredLoans.map((l) => (
                          <TableRow key={l.id} hover selected={l.id === Number(selectedLoanId)}>
                            <TableCell sx={{ fontWeight: 600 }}>{l.loan_number}</TableCell>
                            <TableCell>Member #{l.member_id}</TableCell>
                            <TableCell align="right">KES {Number(l.principal_amount || 0).toLocaleString()}</TableCell>
                            <TableCell align="right" sx={{ color: "error.main", fontWeight: 700 }}>
                              KES {Number(l.outstanding_balance || 0).toLocaleString()}
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={l.status?.replace("_", " ") || "ACTIVE"}
                                size="small"
                                color={l.status === "active" ? "success" : "warning"}
                                sx={{ textTransform: "capitalize", fontSize: "0.7rem" }}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Button
                                size="small"
                                variant="text"
                                onClick={() => setSelectedLoanId(l.id)}
                                sx={{ textTransform: "none", fontSize: "0.75rem", fontWeight: 700 }}
                              >
                                Select
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

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
