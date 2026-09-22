"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

import { useParams } from "next/navigation";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import {
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Stack,
  CircularProgress,
  Alert,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { IconPhoneCall, IconMessage, IconCheck } from "@tabler/icons-react";

interface LoanData {
  loan_number?: string;
  member_id?: string;
  principal_amount?: number;
  outstanding_balance?: number;
  status?: string;
}

export default function FollowUpPage() {
  const { id } = useParams() as { id: string };
  const { data: session, status } = useSession();
  const [loan, setLoan] = useState<LoanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLoan = async () => {
      try {
        const rawBase =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const apiBase = rawBase.replace(/\/+$/, ""); // ensure no trailing slash
        const res = await fetch(`${apiBase}/loans/${id}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
          },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setLoan(data);
      } catch (e) {
        console.error(e);
        setError("Failed to load loan details.");
      } finally {
        setLoading(false);
      }
    };
    if (id && session?.accessToken) fetchLoan();
  }, [id]);

  const handleCall = () => {
    alert("Calling member – feature to integrate with telephony service.");
  };
  const handleSms = () => {
    alert("Sending SMS – feature to integrate with messaging service.");
  };
  const handleResolve = () => {
    alert("Marking loan as resolved – implement API call.");
  };

  return (
    <PageContainer title="Follow Up" description="Loan follow‑up actions">
      <Box
        sx={{ py: 4, background: "linear-gradient(135deg, #1e1b4b, #312e81)" }}
      >
        <Box sx={{ maxWidth: 900, mx: "auto", px: 2 }}>
          <Card elevation={3} sx={{ borderRadius: 3, overflow: "hidden" }}>
            <CardContent
              sx={{ background: "rgba(255,255,255,0.05)", color: "#fff" }}
            >
              {loading && <CircularProgress color="inherit" />}
              {error && <Alert severity="error">{error}</Alert>}
              {loan && (
                <>
                  <Typography variant="h5" gutterBottom>
                    Follow‑Up for Loan #{loan.loan_number ?? id}
                  </Typography>

                  {/* REMOVED 'item' PROP. Added 'size' prop as per MUI v6+ */}
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography>
                        Member ID: {loan.member_id ?? "-"}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography>
                        Principal: KES{" "}
                        {Number(loan.principal_amount || 0).toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography>
                        Outstanding: KES{" "}
                        {Number(loan.outstanding_balance || 0).toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography>
                        Status: {loan.status?.replace("_", " ") ?? "-"}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<IconPhoneCall size={18} />}
                      onClick={handleCall}
                    >
                      Call Member
                    </Button>
                    <Button
                      variant="contained"
                      color="secondary"
                      startIcon={<IconMessage size={18} />}
                      onClick={handleSms}
                    >
                      Send SMS
                    </Button>
                    <Button
                      variant="outlined"
                      color="success"
                      startIcon={<IconCheck size={18} />}
                      onClick={handleResolve}
                    >
                      Mark as Resolved
                    </Button>
                  </Stack>
                </>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>
    </PageContainer>
  );
}
