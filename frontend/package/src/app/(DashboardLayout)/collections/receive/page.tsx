"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
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
import ExportButton from "@/components/common/ExportButton";

interface LoanItem {
  id: number;
  loan_number: string;
  member_id: number;
  principal_amount: string;
  outstanding_balance: string;
  principal_balance?: string;
  interest_balance?: string;
  status: string;
}

export default function ReceivePaymentPage() {
  return (
    <Suspense fallback={<Box p={4} display="flex" justifyContent="center"><CircularProgress /></Box>}>
      <ReceivePaymentContent />
    </Suspense>
  );
}

function ReceivePaymentContent() {
  const searchParams = useSearchParams();
  const initialLoanId = searchParams.get("loan_id") || searchParams.get("loanId") || "";

  const [loans, setLoans] = useState<LoanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoanId, setSelectedLoanId] = useState<number | "">(
    initialLoanId ? Number(initialLoanId) : ""
  );
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMode, setPaymentMode] = useState("MPESA");
  const [mpesaRef, setMpesaRef] = useState("");
  const [notes, setNotes] = useState("");
  const [isEarlySettlement, setIsEarlySettlement] = useState(false);
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
          const activeLoans = list.filter((l: any) => l.status === "active");
          if (initialLoanId && list.some((l: any) => l.id === Number(initialLoanId))) {
            setSelectedLoanId(Number(initialLoanId));
          } else if (!selectedLoanId) {
            setSelectedLoanId(activeLoans.length > 0 ? activeLoans[0].id : list[0].id);
          }
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
          is_early_settlement: isEarlySettlement,
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

  const [statusTab, setStatusTab] = useState<string>("active");

  const filteredLoans = loans.filter((l) => {
    const matchesSearch =
      l.loan_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(l.member_id).includes(searchTerm);
    if (!matchesSearch) return false;

    if (statusTab === "active") return l.status === "active";
    if (statusTab === "in_arrears") return l.status === "in_arrears" || l.status === "overdue";
    if (statusTab === "closed") return l.status === "closed";
    return true;
  });

  return (
    <PageContainer title="Receive Payment - Collections" description="Record Loan Repayments & Collections">
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
                  <IconCash size={26} color="#6ee7b7" />
                </Box>
                <Typography variant="h4" fontWeight={800} sx={{ color: "#ffffff", letterSpacing: "-0.5px" }}>
                  Receive Payment &amp; Collections
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ color: "#d1fae5", maxWidth: 680 }}>
                Record loan repayments, settle M-Pesa collections, and execute principal early-payoff waivers via the Jiinue Loan Engine.
              </Typography>
            </Box>

            <Button
              variant="outlined"
              startIcon={<IconRefresh size={18} />}
              onClick={fetchLoans}
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
        </Box>

        <Grid container spacing={3}>
          {/* Payment Form */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Card
              elevation={0}
              sx={{
                bgcolor: "#ffffff",
                border: "1px solid #e2e8f0",
                borderTop: "3px solid #059669",
                borderRadius: 2.5,
                boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
                  <Box sx={{ p: 1, bgcolor: "#ecfdf5", borderRadius: 1.5, color: "#059669", display: "flex" }}>
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
                      onChange={(e) => {
                        setSelectedLoanId(Number(e.target.value));
                        setIsEarlySettlement(false);
                      }}
                      disabled={loading || loans.length === 0}
                      helperText={loans.length === 0 && !loading ? "No active loans found on Loan Engine" : ""}
                    >
                      {loans.map((loan) => (
                        <MenuItem key={loan.id} value={loan.id}>
                          {loan.loan_number} (Member #{loan.member_id} - Bal: KES {Number(loan.outstanding_balance || 0).toLocaleString()}) - [{loan.status.replace("_", " ").toUpperCase()}]
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
                            <Typography variant="caption" fontWeight={700} color={Number(selectedLoan.outstanding_balance || 0) > 0 ? "error.main" : "success.main"}>
                              KES {Number(selectedLoan.outstanding_balance || 0).toLocaleString()}
                            </Typography>
                          </Stack>
                        </Stack>
                      </Box>
                    )}

                    {selectedLoan && selectedLoan.status === "active" && Number(selectedLoan.outstanding_balance || 0) > 0 && (
                      <Paper
                        elevation={0}
                        sx={{
                          p: 1.5,
                          bgcolor: "#ecfdf5",
                          border: "1px solid #a7f3d0",
                          borderRadius: 2,
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="caption" fontWeight={800} sx={{ color: "#065f46", display: "block" }}>
                              Early Loan Settlement / Full Clearance
                            </Typography>
                            <Typography variant="caption" sx={{ color: "#047857", fontSize: "0.72rem" }}>
                              {Number(selectedLoan.principal_balance || 0) > 0
                                ? `Clear principal (KES ${Number(selectedLoan.principal_balance).toLocaleString()}) & waive unaccrued interest`
                                : "Clear full outstanding balance"}
                            </Typography>
                          </Box>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => {
                              const payoffAmount = selectedLoan.principal_balance && Number(selectedLoan.principal_balance) > 0
                                ? String(selectedLoan.principal_balance)
                                : String(selectedLoan.outstanding_balance);
                              setAmountPaid(payoffAmount);
                              setIsEarlySettlement(true);
                            }}
                            sx={{
                              fontSize: "0.72rem",
                              fontWeight: 800,
                              bgcolor: "#059669",
                              color: "#ffffff",
                              textTransform: "none",
                              borderRadius: 1.5,
                              px: 1.5,
                              "&:hover": { bgcolor: "#047857" },
                            }}
                          >
                            Payoff
                          </Button>
                        </Stack>
                      </Paper>
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
                      size="large"
                      disabled={submitting || loans.length === 0}
                      startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <IconCheck size={18} />}
                      sx={{
                        textTransform: "none",
                        fontWeight: 700,
                        py: 1.4,
                        bgcolor: "#059669",
                        color: "#ffffff",
                        boxShadow: "0 4px 14px rgba(5, 150, 105, 0.35)",
                        "&:hover": { bgcolor: "#047857" },
                      }}
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
            <Card
              elevation={0}
              sx={{
                bgcolor: "#ffffff",
                border: "1px solid #e2e8f0",
                borderTop: "3px solid #0284c7",
                borderRadius: 2.5,
                boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
                height: "100%",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1.5} mb={2}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box sx={{ p: 1, bgcolor: "#f0f9ff", borderRadius: 1.5, color: "#0284c7", display: "flex" }}>
                      <IconReceipt size={22} />
                    </Box>
                    <Typography variant="h6" fontWeight={700}>
                      Loan Accounts ({filteredLoans.length})
                    </Typography>
                  </Stack>

                  <Stack direction="row" spacing={1} alignItems="center" sx={{ width: { xs: "100%", sm: "auto" } }}>
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
                      sx={{ width: { xs: "100%", sm: 180 } }}
                    />
                    <ExportButton
                      data={filteredLoans}
                      columns={[
                        { header: "Loan #", key: "loan_number" },
                        { header: "Member ID", accessor: (r) => `Member #${r.member_id}` },
                        { header: "Principal (KES)", accessor: (r) => Number(r.principal_amount || 0).toLocaleString() },
                        { header: "Outstanding Balance (KES)", accessor: (r) => Number(r.outstanding_balance || 0).toLocaleString() },
                        { header: "Status", key: "status" },
                      ]}
                      filename="Loans_Collections_Registry"
                      title="Active Loans Collections Registry"
                      size="small"
                    />
                  </Stack>
                </Stack>

                {/* Filter Tabs */}
                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                  {[
                    { label: "Active Servicing", value: "active" },
                    { label: "In Arrears", value: "in_arrears" },
                    { label: "All Accounts", value: "all" },
                  ].map((tab) => (
                    <Button
                      key={tab.value}
                      size="small"
                      variant={statusTab === tab.value ? "contained" : "outlined"}
                      onClick={() => setStatusTab(tab.value)}
                      sx={{
                        textTransform: "none",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        borderRadius: 2,
                        ...(statusTab === tab.value
                          ? { bgcolor: "#059669", color: "#ffffff", "&:hover": { bgcolor: "#047857" } }
                          : { borderColor: "#cbd5e1", color: "#64748b" }),
                      }}
                    >
                      {tab.label}
                    </Button>
                  ))}
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
                  <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: "#f8fafc" }}>
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
                        {filteredLoans.map((l) => {
                          const isAct = l.status === "active";
                          const isPending = l.status?.includes("pending");
                          const isClosed = l.status === "closed";

                          return (
                            <TableRow key={l.id} hover selected={l.id === Number(selectedLoanId)}>
                              <TableCell sx={{ fontWeight: 700 }}>{l.loan_number}</TableCell>
                              <TableCell sx={{ color: "text.secondary" }}>Member #{l.member_id}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600 }}>KES {Number(l.principal_amount || 0).toLocaleString()}</TableCell>
                              <TableCell align="right" sx={{ color: Number(l.outstanding_balance || 0) > 0 ? "#dc2626" : "#059669", fontWeight: 800 }}>
                                KES {Number(l.outstanding_balance || 0).toLocaleString()}
                              </TableCell>
                              <TableCell align="center">
                                <Chip
                                  label={l.status?.replace("_", " ") || "ACTIVE"}
                                  size="small"
                                  sx={{
                                    textTransform: "capitalize",
                                    fontSize: "0.72rem",
                                    fontWeight: 700,
                                    bgcolor: isAct ? "#ecfdf5" : isPending ? "#fffbeb" : isClosed ? "#f1f5f9" : "#fef2f2",
                                    color: isAct ? "#065f46" : isPending ? "#92400e" : isClosed ? "#475569" : "#991b1b",
                                    border: isAct ? "1px solid #a7f3d0" : isPending ? "1px solid #fde68a" : isClosed ? "1px solid #e2e8f0" : "1px solid #fecaca",
                                  }}
                                />
                              </TableCell>
                              <TableCell align="center">
                                <Button
                                  size="small"
                                  variant={l.id === Number(selectedLoanId) ? "contained" : "outlined"}
                                  onClick={() => setSelectedLoanId(l.id)}
                                  sx={{
                                    textTransform: "none",
                                    fontSize: "0.75rem",
                                    fontWeight: 700,
                                    borderRadius: 1.5,
                                    px: 1.5,
                                    ...(l.id === Number(selectedLoanId)
                                      ? { bgcolor: "#059669", color: "#ffffff", "&:hover": { bgcolor: "#047857" } }
                                      : { borderColor: "#cbd5e1", color: "#059669", "&:hover": { borderColor: "#059669", bgcolor: "#ecfdf5" } }),
                                  }}
                                >
                                  {l.id === Number(selectedLoanId) ? "Selected" : "Select"}
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
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
