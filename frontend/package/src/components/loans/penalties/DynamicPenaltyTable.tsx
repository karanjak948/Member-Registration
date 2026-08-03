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
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={3}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="h6" fontWeight={600}>
                Loan Product Penalties
              </Typography>

              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAdd}
              >
                Add Penalty
              </Button>
            </Stack>

            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Penalty Name</TableCell>

                  <TableCell>Trigger</TableCell>

                  <TableCell>Basis</TableCell>

                  <TableCell align="right">Value</TableCell>

                  <TableCell>Ledger Account</TableCell>

                  <TableCell align="center">Active</TableCell>

                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {fields.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No penalties added.
                    </TableCell>
                  </TableRow>
                ) : (
                  fields.map((penalty, index) => (
                    <TableRow key={penalty.id}>
                      <TableCell>{penalty.penalty_name}</TableCell>

                      <TableCell>{penalty.trigger}</TableCell>

                      <TableCell>{penalty.basis}</TableCell>

                      <TableCell align="right">{penalty.value}</TableCell>

                      <TableCell>{penalty.ledger_account_name}</TableCell>

                      <TableCell align="center">
                        {penalty.is_active ? "Yes" : "No"}
                      </TableCell>

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
