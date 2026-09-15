"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  IconDatabase,
  IconSearch,
  IconRefresh,
  IconEye,
  IconCopy,
  IconCheck,
  IconAlertCircle,
} from "@tabler/icons-react";

export interface MpesaWebhookItem {
  id: number;
  unique_serial: number | null;
  mpesa_payload: string | null;
  transID: string | null;
  verify_url: string | null;
  status: "received" | "verified" | "processed" | "failed";
  message: string | null;
  verification_response: string | null;
  createdon: string;
  ipaddress: string | null;
}

export default function MpesaWebhooksView() {
  const [webhooks, setWebhooks] = useState<MpesaWebhookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedWebhook, setSelectedWebhook] = useState<MpesaWebhookItem | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const fetchWebhooks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "ALL") params.append("status", statusFilter);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());

      const res = await fetch(`/api/mpesa/raw-webhooks?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setWebhooks(Array.isArray(data) ? data : data?.results || []);
      }
    } catch (err) {
      console.error("Failed to load webhook logs:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  const filtered = webhooks.filter((w) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (w.transID || "").toLowerCase().includes(q) ||
      (w.ipaddress || "").toLowerCase().includes(q) ||
      (w.message || "").toLowerCase().includes(q)
    );
  });

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusBadge = (st: string) => {
    switch (st.toLowerCase()) {
      case "processed":
      case "verified":
        return <Chip label={st.toUpperCase()} size="small" sx={{ bgcolor: "#ecfdf5", color: "#065f46", fontWeight: 700 }} />;
      case "received":
        return <Chip label="RECEIVED" size="small" sx={{ bgcolor: "#eff6ff", color: "#1d4ed8", fontWeight: 700 }} />;
      case "failed":
      default:
        return <Chip label="FAILED" size="small" sx={{ bgcolor: "#fef2f2", color: "#b91c1c", fontWeight: 700 }} />;
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      {/* Controls */}
      <Card sx={{ borderRadius: 3, border: "1px solid #e2e8f0", mb: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
        <CardContent sx={{ p: 2.5 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 5 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search TransID, Client IP, Message..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(0);
                }}
                InputProps={{
                  startAdornment: <IconSearch size={18} style={{ marginRight: 8, color: "#64748b" }} />,
                }}
              />
            </Grid>

            <Grid size={{ xs: 8, md: 4 }}>
              <Select
                fullWidth
                size="small"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="ALL">All Webhook Statuses</MenuItem>
                <MenuItem value="processed">Processed</MenuItem>
                <MenuItem value="received">Received</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
              </Select>
            </Grid>

            <Grid size={{ xs: 4, md: 3 }} textAlign="right">
              <Button
                variant="outlined"
                size="small"
                startIcon={<IconRefresh size={16} />}
                onClick={fetchWebhooks}
                sx={{ textTransform: "none", fontWeight: 700 }}
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Table */}
      <Card sx={{ borderRadius: 3, border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
        <TableContainer component={Paper} elevation={0}>
          <Table size="small">
            <TableHead sx={{ bgcolor: "#f8fafc" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, color: "#0f172a" }}>Timestamp</TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#0f172a" }}>TransID</TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#0f172a" }}>Client IP</TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#0f172a" }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#0f172a" }}>Message / Outcome</TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#0f172a" }} align="right">
                  Payload
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <IconDatabase size={40} color="#cbd5e1" />
                    <Typography variant="body2" color="text.secondary" mt={1}>
                      No webhook callback logs recorded.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((wh) => (
                  <TableRow key={wh.id} hover>
                    <TableCell sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}>
                      {new Date(wh.createdon).toLocaleString("en-GB")}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, fontFamily: "monospace" }}>
                      {wh.transID || wh.unique_serial ? `#${wh.unique_serial}` : "—"}
                    </TableCell>
                    <TableCell sx={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#64748b" }}>
                      {wh.ipaddress || "—"}
                    </TableCell>
                    <TableCell>{getStatusBadge(wh.status)}</TableCell>
                    <TableCell sx={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <Typography variant="caption" color="text.secondary">
                        {wh.message || "OK"}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedWebhook(wh);
                          setDetailsOpen(true);
                        }}
                        sx={{ bgcolor: "#f1f5f9" }}
                      >
                        <IconEye size={15} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filtered.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        {selectedWebhook && (
          <>
            <DialogTitle component="div" sx={{ pb: 1, borderBottom: "1px solid #e2e8f0" }}>
              <Typography variant="h6" fontWeight={800} color="#0f172a">
                Incoming Webhook Payload #{selectedWebhook.id}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                IP: {selectedWebhook.ipaddress} • Received: {new Date(selectedWebhook.createdon).toLocaleString()}
              </Typography>
            </DialogTitle>
            <DialogContent sx={{ pt: 2.5 }}>
              <Typography variant="caption" fontWeight={800} color="text.secondary" textTransform="uppercase">
                Raw JSON Payload:
              </Typography>
              <Box
                component="pre"
                sx={{
                  mt: 1,
                  p: 2,
                  bgcolor: "#0f172a",
                  color: "#38bdf8",
                  borderRadius: 2,
                  fontSize: "0.78rem",
                  fontFamily: "monospace",
                  overflowX: "auto",
                  maxHeight: 320,
                }}
              >
                {(() => {
                  try {
                    return JSON.stringify(JSON.parse(selectedWebhook.mpesa_payload || "{}"), null, 2);
                  } catch {
                    return selectedWebhook.mpesa_payload || "(empty)";
                  }
                })()}
              </Box>

              {selectedWebhook.verification_response && (
                <Box mt={2}>
                  <Typography variant="caption" fontWeight={800} color="text.secondary" textTransform="uppercase">
                    Relay Verification Response:
                  </Typography>
                  <Box
                    component="pre"
                    sx={{
                      mt: 1,
                      p: 1.5,
                      bgcolor: "#1e293b",
                      color: "#a7f3d0",
                      borderRadius: 1.5,
                      fontSize: "0.75rem",
                      fontFamily: "monospace",
                      overflowX: "auto",
                    }}
                  >
                    {selectedWebhook.verification_response}
                  </Box>
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 2, borderTop: "1px solid #e2e8f0" }}>
              <Button
                startIcon={<IconCopy size={16} />}
                onClick={() => copyToClipboard(selectedWebhook.mpesa_payload || "")}
                sx={{ textTransform: "none" }}
              >
                Copy Payload
              </Button>
              <Button onClick={() => setDetailsOpen(false)} sx={{ textTransform: "none" }}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
