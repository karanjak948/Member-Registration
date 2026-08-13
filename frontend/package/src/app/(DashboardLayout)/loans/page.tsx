"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
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
  IconButton,
  Tooltip,
  Alert,
  Button,
} from "@mui/material";

import {
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";

import { useLoans } from "@/hooks/useLoans";

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

export default function LoansPage() {
  const router = useRouter();
  const { loans, loading, error, refresh } = useLoans();
  const [search, setSearch] = useState("");

  // Debug: Log the loans data to see what IDs are available
  console.log("Loans data:", loans);
  console.log(
    "Loan IDs:",
    loans.map((l) => ({ id: l.id, loan_number: l.loan_number })),
  );

  const filteredLoans = loans.filter((loan) => {
    const searchLower = search.toLowerCase();
    return (
      loan.loan_number?.toLowerCase().includes(searchLower) ||
      loan.member_id?.toString().includes(searchLower) ||
      loan.status?.toLowerCase().includes(searchLower)
    );
  });

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

  const handleViewLoan = (loan: any) => {
    console.log("Viewing loan:", loan);
    console.log("Loan ID:", loan.id);
    console.log("Loan Number:", loan.loan_number);

    // Use the actual database ID
    const identifier = loan.id;
    console.log("Navigating to:", `/loans/${identifier}`);

    router.push(`/loans/${identifier}`);
  };

  if (loading) {
    return (
      <Container maxWidth={false}>
        <Box display="flex" justifyContent="center" py={10}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth={false}>
      <Stack spacing={3}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Loan Applications
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              View and manage all loan applications
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={refresh}
            size="small"
          >
            Refresh
          </Button>
        </Box>

        {/* Error */}
        {error && (
          <Alert severity="error" onClose={() => {}}>
            {error}
          </Alert>
        )}

        {/* Search */}
        <Card>
          <CardContent>
            <TextField
              fullWidth
              placeholder="Search by loan number, member ID, or status..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
            />
          </CardContent>
        </Card>

        {/* Results Count */}
        <Typography variant="body2" color="text.secondary">
          Showing {filteredLoans.length} loan
          {filteredLoans.length !== 1 ? "s" : ""}
        </Typography>

        {/* Table */}
        <Paper elevation={0} sx={{ borderRadius: 2, overflow: "hidden" }}>
          <TableContainer>
            <Table sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: "#f8fafc" }}>
                  <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Loan #</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Member ID</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Product</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Principal</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Outstanding</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>
                    Application Date
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, textAlign: "center" }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLoans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">
                        {search
                          ? "No loans match your search."
                          : "No loans found."}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLoans.map((loan) => (
                    <TableRow key={loan.id || loan.loan_number} hover>
                      <TableCell>
                        <Typography fontWeight={600} color="primary.main">
                          {loan.id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight={600}>
                          {loan.loan_number}
                        </Typography>
                      </TableCell>
                      <TableCell>{loan.member_id}</TableCell>
                      <TableCell>{loan.loan_product_id}</TableCell>
                      <TableCell>
                        {formatCurrency(loan.principal_amount)}
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight={600} color="primary.main">
                          {formatCurrency(loan.outstanding_balance)}
                        </Typography>
                      </TableCell>
                      <TableCell>{formatDate(loan.application_date)}</TableCell>
                      <TableCell>
                        <Chip
                          label={statusLabels[loan.status] || loan.status}
                          color={statusColors[loan.status] || "default"}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewLoan(loan)}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Stack>
    </Container>
  );
}