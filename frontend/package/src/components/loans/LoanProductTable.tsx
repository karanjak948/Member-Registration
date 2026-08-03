"use client";

import { useRouter } from "next/navigation";

import {
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";

import { DataGrid, GridColDef } from "@mui/x-data-grid";

import { LoanProduct } from "@/interfaces/loanProduct";

interface Props {
  products: LoanProduct[];
  loading?: boolean;
}

export default function LoanProductTable({ products, loading = false }: Props) {
  const router = useRouter();

  const columns: GridColDef[] = [
    {
      field: "product_code",
      headerName: "Code",
      flex: 1,
    },
    {
      field: "product_name",
      headerName: "Product",
      flex: 2,
    },
    {
      field: "interest_rate",
      headerName: "Interest %",
      flex: 1,
    },
    {
      field: "repayment_frequency",
      headerName: "Repayment",
      flex: 1,
    },
    {
      field: "is_active",
      headerName: "Status",
      flex: 1,
      renderCell: (params) => (
        <Chip
          label={params.value ? "Active" : "Inactive"}
          color={params.value ? "success" : "default"}
          size="small"
        />
      ),
    },
  ];

  return (
    <Card>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" mb={3}>
          <Typography variant="h5">Loan Products</Typography>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => router.push("/loan-products/new")}
          >
            New Product
          </Button>
        </Stack>

        <DataGrid
          autoHeight
          rows={products}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
          pageSizeOptions={[10, 20, 50]}
        />
      </CardContent>
    </Card>
  );
}
