"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  IconPlus,
  IconEye,
  IconEdit,
  IconSearch,
  IconCategory,
  IconPercentage,
  IconCalendar,
  IconShieldCheck,
  IconCoins,
  IconArrowRight,
} from "@tabler/icons-react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { LoanProduct } from "@/interfaces/loanProduct";
import ExportButton from "@/components/common/ExportButton";

interface Props {
  products: LoanProduct[];
  loading?: boolean;
}

export default function LoanProductTable({ products, loading = false }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ACTIVE");

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !term ||
        [
          product.product_code,
          product.product_name,
          product.interest_method,
          product.repayment_frequency,
        ]
          .join(" ")
          .toLowerCase()
          .includes(term);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && product.is_active) ||
        (statusFilter === "INACTIVE" && !product.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [products, search, statusFilter]);

  // Compute KPI metrics
  const metrics = useMemo(() => {
    const totalCount = products.length;
    const activeCount = products.filter((p) => p.is_active).length;
    const rates = products.map((p) => Number(p.interest_rate) || 0).filter((r) => r > 0);
    const minRate = rates.length ? Math.min(...rates) : 0;
    const maxRate = rates.length ? Math.max(...rates) : 0;
    const maxTenor = Math.max(...products.map((p) => p.max_repayment_period || 0), 0);
    const requireGuarantors = products.filter((p) => p.requires_guarantor).length;

    return {
      totalCount,
      activeCount,
      rateRange: rates.length ? `${minRate}% - ${maxRate}% p.a.` : "—",
      maxTenor: maxTenor ? `${maxTenor} Months` : "—",
      requireGuarantors,
    };
  }, [products]);

  const exportColumns = useMemo(
    () => [
      { header: "Product Code", accessor: (p: LoanProduct) => p.product_code },
      { header: "Product Name", accessor: (p: LoanProduct) => p.product_name },
      { header: "Interest Rate (%)", accessor: (p: LoanProduct) => `${p.interest_rate}%` },
      { header: "Interest Method", accessor: (p: LoanProduct) => p.interest_method },
      { header: "Repayment Frequency", accessor: (p: LoanProduct) => p.repayment_frequency },
      { header: "Max Period", accessor: (p: LoanProduct) => `${p.max_repayment_period} Months` },
      { header: "Requires Guarantor", accessor: (p: LoanProduct) => (p.requires_guarantor ? "Yes" : "No") },
      { header: "Status", accessor: (p: LoanProduct) => (p.is_active ? "Active" : "Inactive") },
    ],
    [],
  );

  const columns: GridColDef[] = [
    {
      field: "product_code",
      headerName: "Product Code",
      flex: 1,
      minWidth: 140,
      renderCell: ({ value }) => (
        <Chip
          label={value}
          size="small"
          sx={{
            fontWeight: 800,
            fontFamily: "monospace",
            bgcolor: "#ecfdf5",
            color: "#065f46",
            border: "1px solid #a7f3d0",
            borderRadius: 1.5,
          }}
        />
      ),
    },
    {
      field: "product_name",
      headerName: "Product Name & Facility",
      flex: 2.2,
      minWidth: 260,
      renderCell: ({ row }) => (
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          sx={{ width: "100%", overflow: "hidden" }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              minWidth: 40,
              borderRadius: 2.5,
              bgcolor: "#ecfdf5",
              color: "#047857",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid #a7f3d0",
              boxShadow: "0 2px 6px rgba(4, 120, 87, 0.08)",
            }}
          >
            <IconCategory size={20} stroke={2} />
          </Box>
          <Box sx={{ minWidth: 0, overflow: "hidden" }}>
            <Typography
              variant="body2"
              fontWeight={800}
              noWrap
              sx={{
                color: "#0f172a",
                fontSize: "0.925rem",
                lineHeight: 1.35,
                cursor: "pointer",
                "&:hover": { color: "#047857" },
              }}
              onClick={() => router.push(`/loan-products/${row.id}`)}
            >
              {row.product_name}
            </Typography>
            <Typography
              variant="caption"
              noWrap
              sx={{
                color: "#64748b",
                fontSize: "0.75rem",
                lineHeight: 1.25,
                display: "block",
                mt: 0.25,
              }}
            >
              {row.interest_method === "reducing_balance" ? "Reducing Balance" : "Flat Rate"} &bull; v{row.version_number || 1}.0
            </Typography>
          </Box>
        </Stack>
      ),
    },
    {
      field: "interest_rate",
      headerName: "Interest Rate",
      flex: 1,
      minWidth: 140,
      renderCell: ({ value }) => (
        <Stack direction="row" spacing={0.8} alignItems="center" sx={{ height: "100%" }}>
          <Chip
            icon={<IconPercentage size={14} style={{ color: "#047857" }} />}
            label={`${Number(value).toFixed(2)}% p.a.`}
            size="small"
            sx={{
              fontWeight: 800,
              bgcolor: "#f0fdf4",
              color: "#047857",
              border: "1px solid #a7f3d0",
              borderRadius: 2,
            }}
          />
        </Stack>
      ),
    },
    {
      field: "max_repayment_period",
      headerName: "Max Tenor",
      flex: 1,
      minWidth: 140,
      renderCell: ({ row }) => (
        <Typography variant="body2" fontWeight={700} sx={{ color: "#334155" }}>
          {row.max_repayment_period} {row.repayment_frequency === "monthly" ? "Months" : row.repayment_frequency}
        </Typography>
      ),
    },
    {
      field: "requires_guarantor",
      headerName: "Guarantors",
      flex: 1,
      minWidth: 130,
      renderCell: ({ value, row }) => (
        <Chip
          label={value ? `Required (${row.min_guarantors || 1})` : "Not Required"}
          size="small"
          sx={{
            fontWeight: 700,
            fontSize: "0.75rem",
            bgcolor: value ? "#eff6ff" : "#f8fafc",
            color: value ? "#1d4ed8" : "#64748b",
            border: `1px solid ${value ? "#bfdbfe" : "#e2e8f0"}`,
            borderRadius: 2,
          }}
        />
      ),
    },
    {
      field: "is_active",
      headerName: "Status",
      flex: 1,
      minWidth: 120,
      renderCell: ({ value }) => (
        <Chip
          label={value ? "Active Tier" : "Archived"}
          size="small"
          sx={{
            fontWeight: 800,
            bgcolor: value ? "#ecfdf5" : "#f1f5f9",
            color: value ? "#047857" : "#64748b",
            border: `1px solid ${value ? "#a7f3d0" : "#cbd5e1"}`,
            borderRadius: 2,
          }}
        />
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      sortable: false,
      filterable: false,
      width: 140,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ height: "100%" }}>
          <Tooltip title="View Specification Dossier">
            <IconButton
              size="small"
              onClick={() => router.push(`/loan-products/${row.id}`)}
              sx={{
                color: "#059669",
                bgcolor: "#ecfdf5",
                border: "1px solid #a7f3d0",
                "&:hover": { bgcolor: "#d1fae5" },
              }}
            >
              <IconEye size={18} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Edit / Update Tier">
            <IconButton
              size="small"
              onClick={() => router.push(`/loan-products/${row.id}/edit`)}
              sx={{
                color: "#2563eb",
                bgcolor: "#eff6ff",
                border: "1px solid #bfdbfe",
                "&:hover": { bgcolor: "#dbeafe" },
              }}
            >
              <IconEdit size={18} />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <Container maxWidth={false} sx={{ px: { xs: 1.5, md: 3 }, py: 2 }}>
      <Stack spacing={3}>
        {/* Executive Hero Banner */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3.5 },
            borderRadius: 3.5,
            background: "linear-gradient(135deg, #064e3b 0%, #047857 50%, #059669 100%)",
            color: "#ffffff",
            boxShadow: "0 10px 28px rgba(6, 78, 59, 0.25)",
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2.5}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
          >
            <Stack direction="row" spacing={2.5} alignItems="center">
              <Box
                sx={{
                  width: 54,
                  height: 54,
                  borderRadius: 2.5,
                  bgcolor: "rgba(255, 255, 255, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}
              >
                <IconCategory size={32} stroke={2.2} />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={900} sx={{ color: "#ffffff", letterSpacing: "-0.5px" }}>
                  Loan Products & Credit Tiers
                </Typography>
                <Typography variant="body2" sx={{ color: "#a7f3d0", fontWeight: 500, mt: 0.3 }}>
                  Configure interest calculation engines, repayment schedules, collateral requirements, and tier limits.
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
              <Button
                variant="outlined"
                startIcon={<IconCoins size={18} />}
                onClick={() => router.push("/loans")}
                sx={{
                  bgcolor: "rgba(255, 255, 255, 0.12)",
                  color: "#ffffff",
                  fontWeight: 800,
                  borderRadius: 2.5,
                  px: 2.5,
                  py: 1.1,
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255, 255, 255, 0.25)",
                  "&:hover": { bgcolor: "rgba(255, 255, 255, 0.22)" },
                }}
              >
                Loan Portfolio
              </Button>

              <Button
                variant="contained"
                startIcon={<IconPlus size={18} />}
                onClick={() => router.push("/loan-products/new")}
                sx={{
                  bgcolor: "#ffffff",
                  color: "#065f46",
                  fontWeight: 900,
                  borderRadius: 2.5,
                  px: 3,
                  py: 1.1,
                  boxShadow: "0 4px 14px rgba(0,0,0,0.18)",
                  "&:hover": { bgcolor: "#f0fdf4" },
                }}
              >
                Create Loan Product
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {/* 4 Financial Stat KPI Cards */}
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border: "1px solid #e2e8f0",
                borderLeft: "5px solid #059669",
                bgcolor: "#ffffff",
                boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
              }}
            >
              <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                      Active Product Tiers
                    </Typography>
                    <Typography variant="h5" fontWeight={900} sx={{ color: "#065f46", mt: 0.5 }}>
                      {metrics.activeCount} <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>/ {metrics.totalCount} Total</span>
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: "#ecfdf5", color: "#059669" }}>
                    <IconCategory size={24} />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border: "1px solid #e2e8f0",
                borderLeft: "5px solid #2563eb",
                bgcolor: "#ffffff",
                boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
              }}
            >
              <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                      Interest Range
                    </Typography>
                    <Typography variant="h6" fontWeight={900} sx={{ color: "#1e3a8a", mt: 0.5, fontFamily: "monospace" }}>
                      {metrics.rateRange}
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: "#eff6ff", color: "#2563eb" }}>
                    <IconPercentage size={24} />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border: "1px solid #e2e8f0",
                borderLeft: "5px solid #7c3aed",
                bgcolor: "#ffffff",
                boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
              }}
            >
              <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                      Max Repayment Tenor
                    </Typography>
                    <Typography variant="h5" fontWeight={900} sx={{ color: "#6d28d9", mt: 0.5 }}>
                      {metrics.maxTenor}
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: "#f5f3ff", color: "#7c3aed" }}>
                    <IconCalendar size={24} />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border: "1px solid #e2e8f0",
                borderLeft: "5px solid #d97706",
                bgcolor: "#ffffff",
                boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
              }}
            >
              <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                      Guarantor Security
                    </Typography>
                    <Typography variant="h5" fontWeight={900} sx={{ color: "#b45309", mt: 0.5 }}>
                      {metrics.requireGuarantors} <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>Tiers Enforced</span>
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: "#fffbeb", color: "#d97706" }}>
                    <IconShieldCheck size={24} />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Search, Status Tabs & Action Toolbar */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 3,
            border: "1px solid #e2e8f0",
            bgcolor: "#ffffff",
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ xs: "stretch", md: "center" }}
            justifyContent="space-between"
          >
            <TextField
              size="small"
              placeholder="Search by code, product name, or interest method..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ flex: 1 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconSearch size={20} style={{ color: "#64748b" }} />
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius: 2.5,
                    bgcolor: "#f8fafc",
                    "& fieldset": { borderColor: "#cbd5e1" },
                    "&:hover fieldset": { borderColor: "#059669" },
                    "&.Mui-focused fieldset": { borderColor: "#059669", borderWidth: 2 },
                  },
                },
              }}
            />

            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              {(["ALL", "ACTIVE", "INACTIVE"] as const).map((key) => {
                const isActive = statusFilter === key;
                return (
                  <Chip
                    key={key}
                    label={key === "ALL" ? "All Products" : key === "ACTIVE" ? "Active" : "Archived"}
                    onClick={() => setStatusFilter(key)}
                    sx={{
                      fontWeight: 800,
                      cursor: "pointer",
                      px: 0.5,
                      bgcolor: isActive ? "#064e3b" : "#f1f5f9",
                      color: isActive ? "#ffffff" : "#475569",
                      border: `1px solid ${isActive ? "#064e3b" : "#cbd5e1"}`,
                      "&:hover": {
                        bgcolor: isActive ? "#047857" : "#e2e8f0",
                      },
                    }}
                  />
                );
              })}

              <ExportButton
                data={filteredProducts}
                columns={exportColumns}
                filename="royal_sacco_loan_products"
                title="Royal SACCO - Loan Products & Credit Tiers"
              />
            </Stack>
          </Stack>
        </Paper>

        {/* DataGrid Table */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3.5,
            border: "1px solid #e2e8f0",
            overflow: "hidden",
            boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
            bgcolor: "#ffffff",
          }}
        >
          <DataGrid
            autoHeight
            rowHeight={74}
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
            sx={{
              border: "none",
              "& .MuiDataGrid-columnHeaders": {
                bgcolor: "#f8fafc",
                borderBottom: "2px solid #e2e8f0",
                fontSize: "0.85rem",
                fontWeight: 800,
                color: "#334155",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                minHeight: "56px !important",
                maxHeight: "56px !important",
              },
              "& .MuiDataGrid-columnHeader": {
                outline: "none !important",
              },
              "& .MuiDataGrid-cell": {
                borderBottom: "1px solid #f1f5f9",
                display: "flex",
                alignItems: "center",
                outline: "none !important",
              },
              "& .MuiDataGrid-row:hover": {
                bgcolor: "#f0fdf4",
              },
            }}
          />
        </Paper>
      </Stack>
    </Container>
  );
}