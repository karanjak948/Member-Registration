"use client";

import { useState } from "react";

import {
  Button,
  Card,
  CardContent,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

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
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={3}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="h6" fontWeight={600}>
                Product Fees
              </Typography>

              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAdd}
              >
                Add Fee
              </Button>
            </Stack>

            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Fee Name</TableCell>

                  <TableCell>Type</TableCell>

                  <TableCell align="right">Value</TableCell>

                  <TableCell>Basis</TableCell>

                  <TableCell>Ledger Account</TableCell>

                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {fields.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No fees added.
                    </TableCell>
                  </TableRow>
                ) : (
                  fields.map((fee, index) => (
                    <TableRow key={fee.id}>
                      <TableCell>{fee.fee_name}</TableCell>

                      <TableCell>{fee.fee_type}</TableCell>

                      <TableCell align="right">{fee.fee_value}</TableCell>

                      <TableCell>{fee.fee_basis}</TableCell>

                      <TableCell>{fee.ledger_account_name}</TableCell>

                      <TableCell align="center">
                        <IconButton onClick={() => handleEdit(index)}>
                          <EditIcon />
                        </IconButton>

                        <IconButton color="error" onClick={() => remove(index)}>
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
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
