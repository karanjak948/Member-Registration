"use client";

import { useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Stack,
  TextField,
  Typography,
  Tooltip,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import SearchIcon from "@mui/icons-material/Search";

import {
  DataGrid,
  GridColDef,
} from "@mui/x-data-grid";

import { LoanProduct } from "@/interfaces/loanProduct";

interface Props {
  products: LoanProduct[];
  loading?: boolean;
}

export default function LoanProductTable({
  products,
  loading = false,
}: Props) {
  const router = useRouter();

  const [search, setSearch] = useState("");

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return products;
    }

    return products.filter((product) =>
      [
        product.product_code,
        product.product_name,
        product.repayment_frequency,
      ]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [products, search]);

  const columns: GridColDef[] = [
    {
      field: "product_code",
      headerName: "Code",
      flex: 1,
      minWidth: 120,
    },
    {
      field: "product_name",
      headerName: "Product",
      flex: 2,
      minWidth: 220,
    },
    {
      field: "interest_rate",
      headerName: "Interest %",
      flex: 1,
      minWidth: 120,
      valueFormatter: (value) => `${value}%`,
    },
    {
      field: "repayment_frequency",
      headerName: "Repayment",
      flex: 1,
      minWidth: 140,
    },
    {
      field: "is_active",
      headerName: "Status",
      flex: 1,
      minWidth: 120,
      renderCell: (params) => (
        <Chip
          label={params.value ? "Active" : "Inactive"}
          color={params.value ? "success" : "default"}
          size="small"
        />
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      sortable: false,
      filterable: false,
      width: 120,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={1}>
          <Tooltip title="View">
            <IconButton
              color="primary"
              onClick={() =>
                router.push(
                  `/loan-products/${row.id}`
                )
              }
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Edit">
            <IconButton
              color="secondary"
              onClick={() =>
                router.push(
                  `/loan-products/${row.id}/edit`
                )
              }
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <Card>
      <CardContent>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Typography
            variant="h5"
            fontWeight={700}
          >
            Loan Products
          </Typography>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() =>
              router.push(
                "/loan-products/new"
              )
            }
          >
            New Product
          </Button>
        </Stack>

        <Box mb={3}>
          <TextField
            fullWidth
            placeholder="Search loan products..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            InputProps={{
              startAdornment: (
                <SearchIcon
                  sx={{ mr: 1 }}
                  fontSize="small"
                />
              ),
            }}
          />
        </Box>

        <DataGrid
          autoHeight
          rows={filteredProducts}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
          pageSizeOptions={[10, 20, 50]}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 10,
                page: 0,
              },
            },
          }}
        />
      </CardContent>
    </Card>
  );
}