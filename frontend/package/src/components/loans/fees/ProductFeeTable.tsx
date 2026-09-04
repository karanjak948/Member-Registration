"use client";

import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  IconReceiptTax,
  IconPlus,
  IconEdit,
  IconTrash,
  IconInbox,
} from "@tabler/icons-react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { LoanProductCreate } from "@/interfaces/loanProduct";
import { LoanProductFeeCreate } from "@/interfaces/loanFee";
import FeeDialog from "./FeeDialog";

export default function ProductFeeTable() {
  const { control } = useFormContext<LoanProductCreate>();

  const { fields, append, update, remove } = useFieldArray({
    control,
    name: "fees",
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  function handleAdd() {
    setEditingIndex(null);
    setDialogOpen(true);
  }

  function handleEdit(index: number) {
    setEditingIndex(index);
    setDialogOpen(true);
  }

  function handleSave(fee: LoanProductFeeCreate) {
    if (editingIndex === null) {
      append(fee);
    } else {
      update(editingIndex, fee);
    }

    setDialogOpen(false);
    setEditingIndex(null);
  }

  return (
    <>
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid #e2e8f0",
          bgcolor: "#ffffff",
          boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.04)",
          overflow: "hidden",
        }}
      >
        <Box sx={{ height: 4, bgcolor: "#6366f1" }} />
        <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
          <Stack spacing={3}>
            {/* Header with Add Button */}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "center" }}
              spacing={2}
            >
              <Stack direction="row" alignItems="center" spacing={1.75}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2.5,
                    bgcolor: "#eef2ff",
                    color: "#6366f1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 8px rgba(99, 102, 241, 0.12)",
                  }}
                >
                  <IconReceiptTax size={24} stroke={2} />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={700} color="#0f172a">
                    Product Fee Schedule ({fields.length})
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Processing charges, appraisal deductions, insurance, and legal fees
                  </Typography>
                </Box>
              </Stack>

              <Button
                variant="contained"
                startIcon={<IconPlus size={18} />}
                onClick={handleAdd}
                sx={{
                  bgcolor: "#6366f1",
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 700,
                  px: 2.5,
                  py: 1,
                  boxShadow: "0 4px 12px rgba(99, 102, 241, 0.25)",
                  "&:hover": { bgcolor: "#4f46e5" },
                }}
              >
                Add Fee Schedule
              </Button>
            </Stack>

            <Divider />

            {fields.length === 0 ? (
              <Box
                sx={{
                  py: 4,
                  textAlign: "center",
                  bgcolor: "#f8fafc",
                  borderRadius: 2.5,
                  border: "1px dashed #cbd5e1",
                }}
              >
                <Box sx={{ color: "#94a3b8", mb: 1, display: "flex", justifyContent: "center" }}>
                  <IconInbox size={36} stroke={1.5} />
                </Box>
                <Typography variant="body2" fontWeight={600} color="#64748b">
                  No fee schedules attached yet.
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Click "+ Add Fee Schedule" above to define loan processing fees or insurance charges.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ overflowX: "auto" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ "& th": { fontWeight: 700, color: "text.secondary", fontSize: "0.75rem", bgcolor: "#f8fafc" } }}>
                      <TableCell>FEE NAME</TableCell>
                      <TableCell>TYPE</TableCell>
                      <TableCell align="right">VALUE</TableCell>
                      <TableCell>CALCULATION BASIS</TableCell>
                      <TableCell>LEDGER ACCOUNT</TableCell>
                      <TableCell align="center">ACTIONS</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {fields.map((fee, index) => (
                      <TableRow key={fee.id} hover>
                        <TableCell sx={{ fontWeight: 600, color: "#0f172a" }}>
                          {fee.fee_name}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={fee.fee_type === "percentage" ? "Percentage" : "Fixed Amount"}
                            size="small"
                            sx={{
                              bgcolor: fee.fee_type === "percentage" ? "#eef2ff" : "#f1f5f9",
                              color: fee.fee_type === "percentage" ? "#4f46e5" : "#475569",
                              fontWeight: 700,
                              fontSize: "0.7rem",
                            }}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: "#047857" }}>
                          {fee.fee_type === "percentage"
                            ? `${fee.fee_value}%`
                            : `KES ${Number(fee.fee_value).toLocaleString()}`}
                        </TableCell>
                        <TableCell sx={{ color: "text.secondary", fontSize: "0.8rem" }}>
                          {fee.fee_basis}
                        </TableCell>
                        <TableCell sx={{ color: "text.secondary", fontSize: "0.8rem" }}>
                          {fee.ledger_account_name || "—"}
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            <Tooltip title="Edit Fee">
                              <IconButton size="small" onClick={() => handleEdit(index)} sx={{ color: "#3b82f6" }}>
                                <IconEdit size={18} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Remove Fee">
                              <IconButton size="small" onClick={() => remove(index)} sx={{ color: "#ef4444" }}>
                                <IconTrash size={18} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>

      <FeeDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingIndex(null);
        }}
        onSave={handleSave}
        initialValue={editingIndex !== null ? fields[editingIndex] : undefined}
      />
    </>
  );
}
