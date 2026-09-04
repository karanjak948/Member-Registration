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
  IconScale,
  IconPlus,
  IconEdit,
  IconTrash,
  IconInbox,
} from "@tabler/icons-react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { LoanProductCreate } from "@/interfaces/loanProduct";
import { LoanProductPenaltyCreate } from "@/interfaces/loanPenalty";
import PenaltyDialog from "./PenaltyDialog";

export default function DynamicPenaltyTable() {
  const { control } = useFormContext<LoanProductCreate>();

  const { fields, append, update, remove } = useFieldArray({
    control,
    name: "penalties",
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

  function handleSave(penalty: LoanProductPenaltyCreate) {
    if (editingIndex === null) {
      append(penalty);
    } else {
      update(editingIndex, penalty);
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
        <Box sx={{ height: 4, bgcolor: "#dc2626" }} />
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
                    bgcolor: "#fee2e2",
                    color: "#dc2626",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 8px rgba(220, 38, 38, 0.12)",
                  }}
                >
                  <IconScale size={24} stroke={2} />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={700} color="#0f172a">
                    Loan Product Penalties ({fields.length})
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Dynamic default rates, overdue installment fines, and collection penalties
                  </Typography>
                </Box>
              </Stack>

              <Button
                variant="contained"
                startIcon={<IconPlus size={18} />}
                onClick={handleAdd}
                sx={{
                  bgcolor: "#dc2626",
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 700,
                  px: 2.5,
                  py: 1,
                  boxShadow: "0 4px 12px rgba(220, 38, 38, 0.25)",
                  "&:hover": { bgcolor: "#b91c1c" },
                }}
              >
                Add Penalty Rule
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
                  No penalties attached yet.
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Click "+ Add Penalty Rule" above to configure triggers and default rates.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ overflowX: "auto" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ "& th": { fontWeight: 700, color: "text.secondary", fontSize: "0.75rem", bgcolor: "#f8fafc" } }}>
                      <TableCell>PENALTY NAME</TableCell>
                      <TableCell>TRIGGER</TableCell>
                      <TableCell>BASIS</TableCell>
                      <TableCell align="right">VALUE</TableCell>
                      <TableCell>LEDGER ACCOUNT</TableCell>
                      <TableCell align="center">ACTIVE</TableCell>
                      <TableCell align="center">ACTIONS</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {fields.map((penalty, index) => (
                      <TableRow key={penalty.id} hover>
                        <TableCell sx={{ fontWeight: 600, color: "#0f172a" }}>
                          {penalty.penalty_name}
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
                          {penalty.trigger}
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
                          {penalty.basis}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: "#dc2626" }}>
                          {penalty.value}%
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
                          {penalty.ledger_account_name || "—"}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={penalty.is_active ? "Active" : "Disabled"}
                            size="small"
                            sx={{
                              bgcolor: penalty.is_active ? "#dcfce7" : "#f1f5f9",
                              color: penalty.is_active ? "#15803d" : "#64748b",
                              fontWeight: 700,
                              fontSize: "0.7rem",
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            <Tooltip title="Edit Penalty">
                              <IconButton size="small" onClick={() => handleEdit(index)} sx={{ color: "#3b82f6" }}>
                                <IconEdit size={18} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Remove Penalty">
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

      <PenaltyDialog
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
