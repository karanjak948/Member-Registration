"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

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
  Paper,
  Stack,
  Typography,
  Alert,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RefreshIcon from "@mui/icons-material/Refresh";

import loanService from "@/services/loan.service";
import { Loan } from "@/interfaces/loan";

const statusColors: Record<
  string,
  "default" | "primary" | "success" | "error" | "warning" | "info"
> = {
  pending_application: "warning",
  appraised: "info",
  approved: "primary",
  active: "success",
  watchful: "warning",
  non_performing: "error",
  doubtful: "error",
  closed: "default",
  written_off: "default",
  rejected: "error",
};

const statusLabels: Record<string, string> = {
  pending_application: "Pending",
  appraised: "Appraised",
  approved: "Approved",
  active: "Active",
  watchful: "Watchful",
  non_performing: "Non-Performing",
  doubtful: "Doubtful",
  closed: "Closed",
  written_off: "Written Off",
  rejected: "Rejected",
};

export default function LoanDetailPage() {
  const params = useParams();
  const router = useRouter();

  // Handle both numeric IDs and string loan numbers
  const identifier = params.id as string;
  const isNumericId = /^\d+$/.test(identifier);

  const [loan, setLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);

  const loadLoan = async () => {
    try {
      setLoading(true);
      setError("");
      setNotFound(false);

      console.log(`Loading loan with identifier: ${identifier}`);
      console.log(`Is numeric ID: ${isNumericId}`);

      // Try to fetch using the ID
      const loanId = isNumericId ? Number(identifier) : 0;

      if (loanId === 0) {
        // If it's not a number, try to find by loan number from the list
        // This would require fetching all loans first, which is inefficient
        // For now, show a user-friendly message
        setError(
          `Invalid loan identifier: "${identifier}". Please use a valid loan ID.`,
        );
        setLoading(false);
        return;
      }

      console.log(`Fetching loan with ID: ${loanId}`);
      const data = await loanService.getById(loanId);
      setLoan(data);
    } catch (err: any) {
      console.error("Failed to load loan details:", err);

      if (err.response?.status === 404) {
        setNotFound(true);
        setError(
          `Loan "${identifier}" not found. It may have been deleted or the ID is incorrect.`,
        );
      } else if (err.response?.status === 500) {
        setError(
          "The loan service is currently unavailable. Please try again later.",
        );
      } else {
        setError(
          err.message || "Unable to load loan details. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLoan();
  }, [identifier]);

  const formatCurrency = (amount: string | null) => {
    if (!amount) return "-";
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
    }).format(Number(amount));
  };

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-KE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" py={10}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Stack spacing={3} py={4}>
          <Alert severity={notFound ? "warning" : "error"}>{error}</Alert>
          <Box display="flex" gap={2}>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={loadLoan}
            >
              Retry
            </Button>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => router.push("/loans")}
            >
              Back to Loans
            </Button>
          </Box>
        </Stack>
      </Container>
    );
  }

  if (!loan) {
    return (
      <Container maxWidth="lg">
        <Stack spacing={3} py={4}>
          <Alert severity="warning">Loan not found.</Alert>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push("/loans")}
          >
            Back to Loans
          </Button>
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Stack spacing={3}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Loan Details
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {loan.loan_number}
            </Typography>
          </Box>
          <Box display="flex" gap={2}>
            <Button
              startIcon={<RefreshIcon />}
              variant="outlined"
              onClick={loadLoan}
              size="small"
            >
              Refresh
            </Button>
            <Button
              startIcon={<ArrowBackIcon />}
              variant="contained"
              onClick={() => router.push("/loans")}
            >
              Back to Loans
            </Button>
          </Box>
        </Box>

        {/* Status Banner */}
        <Paper
          sx={{
            p: 2,
            bgcolor: `${statusColors[loan.status] || "default"}.50`,
            borderRadius: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography fontWeight={600}>Status</Typography>
          <Chip
            label={statusLabels[loan.status] || loan.status}
            color={statusColors[loan.status] || "default"}
            sx={{ fontWeight: 600 }}
          />
        </Paper>

        {/* Loan Information */}
        <Card>
          <CardContent>
            <Stack spacing={3}>
              <Typography variant="h6" fontWeight={700}>
                Loan Information
              </Typography>

              <Divider />

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Loan Number
                  </Typography>
                  <Typography fontWeight={600}>{loan.loan_number}</Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Product ID
                  </Typography>
                  <Typography fontWeight={600}>
                    {loan.loan_product_id}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Principal Amount
                  </Typography>
                  <Typography fontWeight={600}>
                    {formatCurrency(loan.principal_amount)}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Outstanding Balance
                  </Typography>
                  <Typography fontWeight={600} color="primary.main">
                    {formatCurrency(loan.outstanding_balance)}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Application Date
                  </Typography>
                  <Typography fontWeight={600}>
                    {formatDate(loan.application_date)}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Disbursement Date
                  </Typography>
                  <Typography fontWeight={600}>
                    {formatDate(loan.disbursement_date)}
                  </Typography>
                </Grid>
              </Grid>
            </Stack>
          </CardContent>
        </Card>

        {/* Member & Guarantor */}
        <Card>
          <CardContent>
            <Stack spacing={3}>
              <Typography variant="h6" fontWeight={700}>
                Member Information
              </Typography>

              <Divider />

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Member ID
                  </Typography>
                  <Typography fontWeight={600}>{loan.member_id}</Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Guarantor Member ID
                  </Typography>
                  <Typography fontWeight={600}>
                    {loan.guarantor_member_id || "None"}
                  </Typography>
                </Grid>
              </Grid>
            </Stack>
          </CardContent>
        </Card>

        {/* Security & Deposit */}
        <Card>
          <CardContent>
            <Stack spacing={3}>
              <Typography variant="h6" fontWeight={700}>
                Security & Deposit
              </Typography>

              <Divider />

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Security Value
                  </Typography>
                  <Typography fontWeight={600}>
                    {formatCurrency(loan.security_provided_value)}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Deposit Paid
                  </Typography>
                  <Typography fontWeight={600}>
                    {formatCurrency(loan.deposit_paid_amount)}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="text.secondary">
                    Security Notes
                  </Typography>
                  <Typography fontWeight={600}>
                    {loan.security_provided_notes || "None"}
                  </Typography>
                </Grid>
              </Grid>
            </Stack>
          </CardContent>
        </Card>

        {/* Audit Info */}
        <Card>
          <CardContent>
            <Stack spacing={3}>
              <Typography variant="h6" fontWeight={700}>
                Audit Information
              </Typography>

              <Divider />

              <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="text.secondary">
                    Created At
                  </Typography>
                  <Typography fontWeight={600}>
                    {formatDate(loan.created_at)}
                  </Typography>
                </Grid>
              </Grid>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}
