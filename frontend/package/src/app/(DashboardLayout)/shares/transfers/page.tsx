"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
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
  Chip,
  Button,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Snackbar,
  IconButton,
  Tooltip,
} from "@mui/material";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import ExportButton from "@/components/common/ExportButton";
import { ExportColumn } from "@/utils/exportGrid";
import sharesService from "@/services/shares.service";
import memberService from "@/services/member.service";
import {
  IconArrowLeft,
  IconCheck,
  IconTrash,
  IconRefresh,
  IconSend,
  IconBuildingBank,
  IconCoins,
} from "@tabler/icons-react";

interface ShareTransferItem {
  id: number;
  from_member: number;
  from_member_name: string;
  from_member_no: string;
  to_member: number | null;
  to_member_name: string;
  to_member_no: string;
  share_type: string;
  share_type_display: string;
  number_of_shares: string | number;
  shares_amount: string | number;
  total_amount: string | number;
  date_transferred: string;
  remarks: string;
  is_active: boolean;
  created_at: string;
}

const SHARE_TYPES = [
  { value: "ordinary", label: "Ordinary Shares" },
  { value: "preference", label: "Preference Shares" },
  { value: "capital", label: "Capital Shares" },
];

export default function SharesTransferPage() {
  const [transfers, setTransfers] = useState<ShareTransferItem[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Form Fields matching Screenshot 5
  const [fromMember, setFromMember] = useState("");
  const [toMember, setToMember] = useState("");
  const [shareType, setShareType] = useState("ordinary");
  const [noOfShares, setNoOfShares] = useState("");
  const [sharesAmount, setSharesAmount] = useState("100.00");
  const [dateTransferred, setDateTransferred] = useState(new Date().toISOString().split("T")[0]);
  const [remarks, setRemarks] = useState("");

  // Auto-calculated Total
  const calculatedTotal = useMemo(() => {
    const count = parseFloat(noOfShares) || 0;
    const price = parseFloat(sharesAmount) || 0;
    return (count * price).toFixed(2);
  }, [noOfShares, sharesAmount]);

  // Snackbar Notification
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" | "info" }>({
    open: false,
    message: "",
    severity: "info",
  });

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const data = await sharesService.getTransfers();
      setTransfers(data);
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "Failed to load share transfers.", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await memberService.getAll();
      setMembers(Array.isArray(res) ? res : (res as any)?.results || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTransfers();
    fetchMembers();
  }, []);

  const handleCancelForm = () => {
    setFromMember("");
    setToMember("");
    setShareType("ordinary");
    setNoOfShares("");
    setSharesAmount("100.00");
    setDateTransferred(new Date().toISOString().split("T")[0]);
    setRemarks("");
    setFormError("");
  };

  const handleSaveTransfer = async () => {
    setFormError("");
    if (!fromMember) {
      setFormError("Please select the 'From Member'.");
      return;
    }
    if (!noOfShares || parseFloat(noOfShares) <= 0) {
      setFormError("Please enter a valid number of shares.");
      return;
    }
    if (!sharesAmount || parseFloat(sharesAmount) <= 0) {
      setFormError("Please enter a valid share amount/price.");
      return;
    }
    if (!dateTransferred) {
      setFormError("Please select the date transferred.");
      return;
    }

    setSubmitting(true);
    try {
      await sharesService.createTransfer({
        from_member: Number(fromMember),
        to_member: toMember ? Number(toMember) : null,
        share_type: shareType,
        number_of_shares: noOfShares,
        shares_amount: sharesAmount,
        date_transferred: dateTransferred,
        remarks: remarks || undefined,
      });

      setSnackbar({ open: true, message: "Share transfer / withdrawal saved successfully!", severity: "success" });
      handleCancelForm();
      fetchTransfers();
    } catch (err: any) {
      console.error(err);
      let errMsg = "Failed to process share transfer.";
      const data = err?.response?.data;
      if (typeof data === "string") {
        errMsg = data;
      } else if (data && typeof data === "object") {
        const msgs: string[] = [];
        for (const [k, v] of Object.entries(data)) {
          const prefix = k === "detail" || k === "error" || k === "non_field_errors" ? "" : `${k.replace(/_/g, " ")}: `;
          if (Array.isArray(v)) {
            msgs.push(`${prefix}${v.join(", ")}`);
          } else if (typeof v === "string") {
            msgs.push(`${prefix}${v}`);
          }
        }
        if (msgs.length > 0) errMsg = msgs.join(" | ");
      } else if (err?.message) {
        errMsg = err.message;
      }
      setFormError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (id: number) => {
    if (!window.confirm("Are you sure you want to reverse / cancel this share transfer?")) return;
    try {
      await sharesService.deleteTransfer(id);
      setSnackbar({ open: true, message: "Share transfer reversed successfully.", severity: "success" });
      fetchTransfers();
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "Failed to reverse share transfer.", severity: "error" });
    }
  };

  const filteredTransfers = useMemo(() => {
    if (!searchQuery.trim()) return transfers;
    const q = searchQuery.toLowerCase();
    return transfers.filter(
      (t) =>
        t.from_member_name.toLowerCase().includes(q) ||
        (t.from_member_no && t.from_member_no.toLowerCase().includes(q)) ||
        (t.to_member_name && t.to_member_name.toLowerCase().includes(q)) ||
        (t.remarks && t.remarks.toLowerCase().includes(q))
    );
  }, [transfers, searchQuery]);

  const exportColumns: ExportColumn[] = [
    { header: "#", key: "id" },
    { header: "From Member", key: "from_member_name" },
    { header: "To Member", key: "to_member_name" },
    { header: "Share Type", key: "share_type_display" },
    { header: "No Of Shares", key: "number_of_shares" },
    { header: "Share Price (KES)", key: "shares_amount" },
    { header: "Total Amount (KES)", key: "total_amount" },
    { header: "Date Transferred", key: "date_transferred" },
    { header: "Remarks", key: "remarks" },
  ];

  const exportData = useMemo(() => {
    return filteredTransfers.map((t, idx) => ({
      id: idx + 1,
      from_member_name: `${t.from_member_name} (${t.from_member_no || "—"})`,
      to_member_name: t.to_member_name || "SACCO Pool",
      share_type_display: t.share_type_display || t.share_type,
      number_of_shares: t.number_of_shares,
      shares_amount: t.shares_amount,
      total_amount: Number(t.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 }),
      date_transferred: t.date_transferred,
      remarks: t.remarks || "—",
    }));
  }, [filteredTransfers]);

  return (
    <PageContainer title="Shares Transfer" description="SACCO member share transfers and withdrawal redemptions">
      <Box sx={{ width: "100%", pb: 5 }}>
        {/* Header Banner */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            background: "linear-gradient(135deg, #022c22 0%, #064e3b 50%, #0f172a 100%)",
            color: "#ffffff",
            borderRadius: 3,
            boxShadow: "0 10px 25px -5px rgba(2, 44, 34, 0.4)",
          }}
        >
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2}>
            <Box>
              <Stack direction="row" spacing={1.5} alignItems="center" mb={0.5}>
                <Button
                  component={Link}
                  href="/shares"
                  variant="outlined"
                  size="small"
                  startIcon={<IconArrowLeft size={16} />}
                  sx={{
                    color: "#ffffff",
                    borderColor: "rgba(255,255,255,0.4)",
                    bgcolor: "rgba(255,255,255,0.08)",
                    fontWeight: 700,
                    borderRadius: 2,
                    textTransform: "none",
                    "&:hover": { borderColor: "#ffffff", bgcolor: "rgba(255,255,255,0.18)" },
                  }}
                >
                  Back to Shares
                </Button>
              </Stack>
              <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: "-0.5px", color: "#ffffff", mt: 1 }}>
                JIMANAGE :: SHARES TRANSFER
              </Typography>
              <Typography variant="body2" sx={{ color: "#d1fae5", mt: 0.5, fontWeight: 500 }}>
                Transfer share capital between members or redeem shares to the SACCO capital pool upon member exit
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {/* JIMANAGE :: SHARES TRANSFER FORM (matching Screenshot 5) */}
        <Card elevation={0} sx={{ mb: 4, border: "1px solid #e2e8f0", borderRadius: 3, overflow: "hidden" }}>
          <Box sx={{ p: 2, bgcolor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
            <Typography variant="subtitle1" fontWeight={800} color="#1e293b">
              JIMANAGE :: SHARES TRANSFER FORM
            </Typography>
          </Box>
          <CardContent sx={{ p: 3 }}>
            {formError && (
              <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
                {formError}
              </Alert>
            )}

            <Grid container spacing={3}>
              {/* From Member* */}
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth size="small" required>
                  <InputLabel>From Member*</InputLabel>
                  <Select
                    label="From Member*"
                    value={fromMember}
                    onChange={(e) => setFromMember(e.target.value)}
                  >
                    <MenuItem value="">[select one]</MenuItem>
                    {members.map((m) => (
                      <MenuItem key={m.id} value={m.id}>
                        {m.full_name || `${m.first_name} ${m.other_names}`} ({m.membership_number})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* To Member* */}
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>To Member*</InputLabel>
                  <Select
                    label="To Member*"
                    value={toMember}
                    onChange={(e) => setToMember(e.target.value)}
                  >
                    <MenuItem value="">[select one / SACCO Pool]</MenuItem>
                    {members
                      .filter((m) => String(m.id) !== String(fromMember))
                      .map((m) => (
                        <MenuItem key={m.id} value={m.id}>
                          {m.full_name || `${m.first_name} ${m.other_names}`} ({m.membership_number})
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Shares* */}
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth size="small" required>
                  <InputLabel>Shares*</InputLabel>
                  <Select
                    label="Shares*"
                    value={shareType}
                    onChange={(e) => setShareType(e.target.value)}
                  >
                    {SHARE_TYPES.map((st) => (
                      <MenuItem key={st.value} value={st.value}>
                        {st.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* No Of Shares* */}
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  required
                  type="number"
                  label="No Of Shares*"
                  placeholder="0.00"
                  value={noOfShares}
                  onChange={(e) => setNoOfShares(e.target.value)}
                />
              </Grid>

              {/* Shares Amount* */}
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  required
                  type="number"
                  label="Shares Amount*"
                  placeholder="100.00"
                  value={sharesAmount}
                  onChange={(e) => setSharesAmount(e.target.value)}
                />
              </Grid>

              {/* Total* */}
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Total*"
                  value={`KES ${calculatedTotal}`}
                  InputProps={{ readOnly: true }}
                  sx={{ bgcolor: "#f8fafc" }}
                />
              </Grid>

              {/* Date Transferred* */}
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  required
                  type="date"
                  label="Date Transferred*"
                  InputLabelProps={{ shrink: true }}
                  value={dateTransferred}
                  onChange={(e) => setDateTransferred(e.target.value)}
                />
              </Grid>

              {/* Remarks */}
              <Grid size={{ xs: 12, md: 8 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Remarks"
                  placeholder="Transfer / withdrawal remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </Grid>
            </Grid>

            {/* Form Action Buttons matching Screenshot 5 */}
            <Stack direction="row" spacing={2} justifyContent="flex-start" sx={{ mt: 3.5 }}>
              <Button
                variant="contained"
                onClick={handleCancelForm}
                disabled={submitting}
                sx={{
                  bgcolor: "#dc2626",
                  color: "#ffffff",
                  fontWeight: 700,
                  textTransform: "none",
                  borderRadius: 2,
                  px: 3,
                  "&:hover": { bgcolor: "#b91c1c" },
                }}
              >
                cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSaveTransfer}
                disabled={submitting}
                startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <IconCheck size={18} />}
                sx={{
                  bgcolor: "#16a34a",
                  color: "#ffffff",
                  fontWeight: 700,
                  textTransform: "none",
                  borderRadius: 2,
                  px: 3.5,
                  "&:hover": { bgcolor: "#15803d" },
                }}
              >
                {submitting ? "Saving..." : "Save"}
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Transfer History Table with Universal Export suite */}
        <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, overflow: "hidden" }}>
          <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2, bgcolor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
            <ExportButton
              data={exportData}
              columns={exportColumns}
              filename="shares_transfers"
              title="Share Capital Transfers & Withdrawals"
              size="small"
            />

            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <TextField
                size="small"
                placeholder="Search member, remarks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ width: 280, bgcolor: "#ffffff" }}
              />
              <IconButton onClick={fetchTransfers} color="primary" sx={{ border: "1px solid #cbd5e1", bgcolor: "#ffffff" }}>
                <IconRefresh size={18} />
              </IconButton>
            </Box>
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: "#f1f5f9" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, color: "#475569" }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: "#475569" }}>From Member</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: "#475569" }}>To Member</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: "#475569" }}>Share Type</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: "#475569", textAlign: "right" }}>No Of Shares</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: "#475569", textAlign: "right" }}>Share Price</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: "#475569", textAlign: "right" }}>Total Amount</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: "#475569" }}>Date Transferred</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: "#475569" }}>Remarks</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: "#475569", textAlign: "center" }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} sx={{ textAlign: "center", py: 5 }}>
                      <CircularProgress size={32} />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Loading share transfers...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : filteredTransfers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} sx={{ textAlign: "center", py: 5 }}>
                      <Typography variant="body2" color="text.secondary">
                        No share transfer or withdrawal records found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransfers.map((item, idx) => (
                    <TableRow key={item.id} hover sx={{ opacity: item.is_active ? 1 : 0.6 }}>
                      <TableCell sx={{ fontWeight: 600 }}>{idx + 1}</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#1e293b" }}>
                        {item.from_member_name} ({item.from_member_no || "—"})
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: item.to_member ? "#0284c7" : "#059669" }}>
                        {item.to_member ? `${item.to_member_name} (${item.to_member_no})` : "SACCO Pool (Redemption)"}
                      </TableCell>
                      <TableCell>
                        <Chip label={item.share_type_display || item.share_type} size="small" sx={{ fontWeight: 700, bgcolor: "#e0f2fe", color: "#0369a1" }} />
                      </TableCell>
                      <TableCell sx={{ textAlign: "right", fontWeight: 700 }}>{item.number_of_shares}</TableCell>
                      <TableCell sx={{ textAlign: "right" }}>KES {Number(item.shares_amount).toFixed(2)}</TableCell>
                      <TableCell sx={{ textAlign: "right", fontWeight: 800, color: "#0f172a" }}>
                        KES {Number(item.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>{item.date_transferred}</TableCell>
                      <TableCell sx={{ color: "#64748b", maxWidth: 200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {item.remarks || "—"}
                      </TableCell>
                      <TableCell sx={{ textAlign: "center" }}>
                        {item.is_active && (
                          <Tooltip title="Cancel / Reverse Transfer">
                            <IconButton size="small" color="error" onClick={() => handleDeactivate(item.id)}>
                              <IconTrash size={16} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        {/* Global Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={5000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </PageContainer>
  );
}
