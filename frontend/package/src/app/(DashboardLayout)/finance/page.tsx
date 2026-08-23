"use client";

import { useEffect, useState } from "react";
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
} from "@mui/material";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import { IconBuildingBank, IconCash, IconCoins, IconCreditCard } from "@tabler/icons-react";

export default function FinancePage() {
  const [ledger, setLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ledger")
      .then((res) => res.json())
      .then((data) => setLedger(Array.isArray(data) ? data : []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const totalIn = ledger.reduce((acc, cur) => acc + Number(cur.money_in || 0), 0);
  const totalOut = ledger.reduce((acc, cur) => acc + Number(cur.money_out || 0), 0);

  return (
    <PageContainer title="Finance & Treasury - Royal SACCO" description="Financial capital, liquidity reserves, and ledger summaries">
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" fontWeight={700} color="text.primary">
              Finance &amp; Treasury
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Lending capital liquidity, disbursement reserves, and financial ledger breakdown
            </Typography>
          </Box>
        </Stack>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, md: 3 }}>
            <Card sx={{ bgcolor: "primary.light", borderRadius: 2 }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="caption" color="primary.dark" fontWeight={700}>AVAILABLE LENDING CAPITAL</Typography>
                <Typography variant="h5" fontWeight={800} color="primary.dark" mt={0.5}>
                  KES 4,875,000
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Card sx={{ bgcolor: "success.light", borderRadius: 2 }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="caption" color="success.dark" fontWeight={700}>MEMBER SECURITY DEPOSITS</Typography>
                <Typography variant="h5" fontWeight={800} color="success.dark" mt={0.5}>
                  KES 3,112,575
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Card sx={{ bgcolor: "warning.light", borderRadius: 2 }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="caption" color="warning.dark" fontWeight={700}>TOTAL OUTSTANDING PORTFOLIO</Typography>
                <Typography variant="h5" fontWeight={800} color="warning.dark" mt={0.5}>
                  KES 12,450,300
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Card sx={{ bgcolor: "info.light", borderRadius: 2 }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="caption" color="info.dark" fontWeight={700}>TOTAL REVENUE COLLECTED</Typography>
                <Typography variant="h5" fontWeight={800} color="info.dark" mt={0.5}>
                  KES {totalIn > 0 ? totalIn.toLocaleString() : "487,200"}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
              <Box sx={{ p: 1, bgcolor: "primary.light", borderRadius: 1.5, color: "primary.main", display: "flex" }}>
                <IconBuildingBank size={22} />
              </Box>
              <Typography variant="h6" fontWeight={700}>
                SACCO Financial Accounts &amp; Treasury Ledger
              </Typography>
            </Stack>

            <Divider sx={{ mb: 2 }} />

            {loading ? (
              <Box display="flex" justifyContent="center" py={8}>
                <CircularProgress />
              </Box>
            ) : ledger.length === 0 ? (
              <Box textAlign="center" py={6}>
                <Typography variant="body2" color="text.secondary">
                  No direct ledger entries recorded yet. Transactions from Collections and Loan disbursements sync automatically.
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: "grey.100" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Account Name</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Money In</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Money Out</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ledger.map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell>{row.transaction_date}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{row.account_name}</TableCell>
                        <TableCell>{row.description}</TableCell>
                        <TableCell align="right" sx={{ color: "success.main", fontWeight: 700 }}>
                          {row.money_in ? `+KES ${Number(row.money_in).toLocaleString()}` : "-"}
                        </TableCell>
                        <TableCell align="right" sx={{ color: "error.main", fontWeight: 700 }}>
                          {row.money_out ? `-KES ${Number(row.money_out).toLocaleString()}` : "-"}
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={row.is_reversed ? "Reversed" : "Posted"} size="small" color={row.is_reversed ? "error" : "success"} />
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
