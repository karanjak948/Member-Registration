"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  InputAdornment,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { DataGrid, GridActionsCellItem, GridColDef } from "@mui/x-data-grid";

import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import { FieldConfiguration } from "@/interfaces/fieldConfiguration";
import { MemberCategory } from "@/interfaces/category";
import fieldConfigurationService from "@/services/fieldConfiguration.service";
import categoryService from "@/services/category.service";

import FieldConfigurationDialog from "@/components/settings/FieldConfigurationDialog";
import ViewFieldConfigurationDialog from "@/components/settings/ViewFieldConfigurationDialog";
import DeleteFieldConfigurationDialog from "@/components/settings/DeleteFieldConfigurationDialog";

import {
  IconAdjustmentsHorizontal,
  IconPlus,
  IconSearch,
  IconEye,
  IconEdit,
  IconTrash,
  IconCheck,
  IconX,
  IconShieldCheck,
  IconForms,
  IconAlertCircle,
  IconSortAscending,
  IconArrowLeft,
} from "@tabler/icons-react";

export default function FieldConfigurationPage() {
  const [fieldConfigs, setFieldConfigs] = useState<FieldConfiguration[]>([]);
  const [categories, setCategories] = useState<MemberCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<number | "ALL">("ALL");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedField, setSelectedField] = useState<FieldConfiguration | null>(null);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [fieldsData, categoriesData] = await Promise.all([
        fieldConfigurationService.getAll().catch(() => []),
        categoryService.getAll().catch(() => []),
      ]);

      setFieldConfigs(Array.isArray(fieldsData) ? fieldsData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (err) {
      console.error("Failed to load field configurations:", err);
      setError("Unable to load member field configurations. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Filter fields based on category tab & search query
  const filteredFields = useMemo(() => {
    let result = fieldConfigs;

    if (selectedCategoryTab !== "ALL") {
      result = result.filter((f) => f.category === selectedCategoryTab);
    }

    const query = search.trim().toLowerCase();
    if (query) {
      result = result.filter(
        (f) =>
          f.display_name.toLowerCase().includes(query) ||
          f.field_name.toLowerCase().includes(query) ||
          (f.category_name && f.category_name.toLowerCase().includes(query))
      );
    }

    return result;
  }, [fieldConfigs, selectedCategoryTab, search]);

  // Metric stats
  const totalRules = fieldConfigs.length;
  const mandatoryRules = fieldConfigs.filter((f) => f.is_required).length;
  const visibleRules = fieldConfigs.filter((f) => f.is_visible).length;

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        field: "display_order",
        headerName: "Order",
        width: 80,
        renderCell: (params) => (
          <Typography variant="body2" fontWeight={700} color="text.secondary">
            #{params.value ?? 0}
          </Typography>
        ),
      },
      {
        field: "display_name",
        headerName: "Field Label (UI)",
        flex: 1.3,
        minWidth: 200,
        renderCell: (params) => (
          <Stack spacing={0.2} justifyContent="center" sx={{ height: "100%" }}>
            <Typography variant="body2" fontWeight={800} color="#1e293b">
              {params.value}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace", fontSize: "0.72rem" }}>
              {params.row.field_name}
            </Typography>
          </Stack>
        ),
      },
      {
        field: "category_name",
        headerName: "Category Tier",
        width: 160,
        renderCell: (params) => (
          <Chip
            label={params.value || `Category #${params.row.category}`}
            size="small"
            sx={{
              bgcolor: "#f0fdf4",
              color: "#065f46",
              fontWeight: 800,
              border: "1px solid #bbf7d0",
              fontSize: "0.75rem",
            }}
          />
        ),
      },
      {
        field: "is_visible",
        headerName: "Visibility",
        width: 120,
        renderCell: (params) => (
          <Chip
            label={params.value ? "Visible" : "Hidden"}
            size="small"
            sx={{
              bgcolor: params.value ? "#f0fdf4" : "#fef2f2",
              color: params.value ? "#059669" : "#dc2626",
              border: "1px solid",
              borderColor: params.value ? "#bbf7d0" : "#fecaca",
              fontWeight: 700,
            }}
          />
        ),
      },
      {
        field: "is_required",
        headerName: "Mandatory",
        width: 130,
        renderCell: (params) => (
          <Chip
            label={params.value ? "Required *" : "Optional"}
            size="small"
            sx={{
              bgcolor: params.value ? "#fff1f2" : "#f8fafc",
              color: params.value ? "#dc2626" : "#64748b",
              border: "1px solid",
              borderColor: params.value ? "#fecaca" : "#e2e8f0",
              fontWeight: 800,
            }}
          />
        ),
      },
      {
        field: "is_enabled",
        headerName: "Status",
        width: 120,
        renderCell: (params) => (
          <Chip
            label={params.value ? "Enabled" : "Disabled"}
            size="small"
            sx={{
              bgcolor: params.value ? "#f0f9ff" : "#f1f5f9",
              color: params.value ? "#0284c7" : "#64748b",
              border: "1px solid",
              borderColor: params.value ? "#bae6fd" : "#cbd5e1",
              fontWeight: 700,
            }}
          />
        ),
      },
      {
        field: "actions",
        type: "actions",
        headerName: "Actions",
        width: 130,
        getActions: ({ row }) => [
          <GridActionsCellItem
            key="view"
            icon={
              <Tooltip title="View Field Rule Details">
                <Box sx={{ p: 0.5, borderRadius: 1, "&:hover": { bgcolor: "rgba(5, 150, 105, 0.1)" } }}>
                  <IconEye size={18} color="#059669" />
                </Box>
              </Tooltip>
            }
            label="View"
            onClick={() => {
              setSelectedField(row);
              setViewOpen(true);
            }}
            showInMenu={false}
          />,
          <GridActionsCellItem
            key="edit"
            icon={
              <Tooltip title="Edit Field Rule">
                <Box sx={{ p: 0.5, borderRadius: 1, "&:hover": { bgcolor: "rgba(2, 132, 199, 0.1)" } }}>
                  <IconEdit size={18} color="#0284c7" />
                </Box>
              </Tooltip>
            }
            label="Edit"
            onClick={() => {
              setSelectedField(row);
              setDialogOpen(true);
            }}
            showInMenu={false}
          />,
          <GridActionsCellItem
            key="delete"
            icon={
              <Tooltip title="Delete Field Rule">
                <Box sx={{ p: 0.5, borderRadius: 1, "&:hover": { bgcolor: "rgba(220, 38, 38, 0.1)" } }}>
                  <IconTrash size={18} color="#dc2626" />
                </Box>
              </Tooltip>
            }
            label="Delete"
            onClick={() => {
              setSelectedField(row);
              setDeleteOpen(true);
            }}
            showInMenu={false}
          />,
        ],
      },
    ],
    []
  );

  return (
    <PageContainer
      title="Member Field Configuration - Royal SACCO"
      description="Configure dynamic member registration form fields, requirements, and visibility"
    >
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        {/* Executive Hero Banner in Emerald Theme */}
        <Box
          sx={{
            mb: 3.5,
            p: 3.5,
            borderRadius: 3,
            background: "linear-gradient(135deg, #064e3b 0%, #047857 50%, #0f766e 100%)",
            color: "#ffffff",
            boxShadow: "0 12px 28px -6px rgba(6, 78, 59, 0.35)",
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={2}
          >
            <Box>
              <Stack direction="row" spacing={1.5} alignItems="center" mb={0.5}>
                <Box sx={{ p: 1, bgcolor: "rgba(255,255,255,0.18)", borderRadius: 2, display: "flex" }}>
                  <IconAdjustmentsHorizontal size={28} color="#6ee7b7" />
                </Box>
                <Typography variant="h4" fontWeight={800} sx={{ color: "#ffffff", letterSpacing: "-0.5px" }}>
                  Member Field Configuration
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ color: "#a7f3d0" }}>
                Control dynamic registration form fields, mandatory validation rules, and visibility by membership tier
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={<IconPlus size={18} />}
              onClick={() => {
                setSelectedField(null);
                setDialogOpen(true);
              }}
              sx={{
                bgcolor: "#10b981",
                color: "#ffffff",
                fontWeight: 700,
                px: 3,
                py: 1.2,
                textTransform: "none",
                boxShadow: "0 4px 14px rgba(16, 185, 129, 0.4)",
                "&:hover": { bgcolor: "#059669" },
              }}
            >
              Add Field Rule
            </Button>
          </Stack>
        </Box>

        {/* 3 Metric Cards */}
        <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #e2e8f0", bgcolor: "#ffffff" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: 0.5 }}>
                    CONFIGURED RULES
                  </Typography>
                  <Typography variant="h4" fontWeight={800} color="#064e3b" sx={{ mt: 0.5 }}>
                    {totalRules} Fields
                  </Typography>
                </Box>
                <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: "rgba(6, 78, 59, 0.1)", color: "#064e3b" }}>
                  <IconForms size={24} />
                </Box>
              </Stack>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <Card elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #e2e8f0", bgcolor: "#ffffff" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: 0.5 }}>
                    MANDATORY FIELDS
                  </Typography>
                  <Typography variant="h4" fontWeight={800} color="#dc2626" sx={{ mt: 0.5 }}>
                    {mandatoryRules} Required
                  </Typography>
                </Box>
                <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: "rgba(220, 38, 38, 0.1)", color: "#dc2626" }}>
                  <IconAlertCircle size={24} />
                </Box>
              </Stack>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <Card elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #e2e8f0", bgcolor: "#ffffff" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: 0.5 }}>
                    VISIBLE IN FORM
                  </Typography>
                  <Typography variant="h4" fontWeight={800} color="#0284c7" sx={{ mt: 0.5 }}>
                    {visibleRules} Active
                  </Typography>
                </Box>
                <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: "rgba(2, 132, 199, 0.1)", color: "#0284c7" }}>
                  <IconShieldCheck size={24} />
                </Box>
              </Stack>
            </Card>
          </Grid>
        </Grid>

        {/* Main Card with Category Filter Tabs & DataGrid */}
        <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
          <CardContent sx={{ p: 3 }}>
            {/* Category Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
              <Tabs
                value={selectedCategoryTab}
                onChange={(_, val) => setSelectedCategoryTab(val)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  "& .MuiTab-root": { fontWeight: 700, textTransform: "none", fontSize: "0.9rem" },
                  "& .Mui-selected": { color: "#064e3b" },
                  "& .MuiTabs-indicator": { bgcolor: "#064e3b", height: 3 },
                }}
              >
                <Tab label={`All Categories (${fieldConfigs.length})`} value="ALL" />
                {categories.map((cat) => {
                  const count = fieldConfigs.filter((f) => f.category === cat.id).length;
                  return (
                    <Tab
                      key={cat.id}
                      label={`${cat.name} (${count})`}
                      value={cat.id}
                    />
                  );
                })}
              </Tabs>
            </Box>

            {/* Toolbar */}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "center" }}
              spacing={2}
              mb={2.5}
            >
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Configured Form Fields ({filteredFields.length})
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Dynamic field rendering order and mandatory verification rules
                </Typography>
              </Box>

              <TextField
                size="small"
                placeholder="Search field label, identifier..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconSearch size={18} style={{ color: "#94a3b8" }} />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{ width: { xs: "100%", sm: 300 } }}
              />
            </Stack>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {loading ? (
              <Box display="flex" justifyContent="center" py={8}>
                <CircularProgress sx={{ color: "#064e3b" }} />
              </Box>
            ) : filteredFields.length === 0 ? (
              <Box textAlign="center" py={8}>
                <IconAdjustmentsHorizontal size={48} color="#94a3b8" />
                <Typography variant="subtitle1" fontWeight={700} color="text.secondary" mt={1}>
                  No field rules configured for this tier
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Click below to create dynamic registration fields and requirements
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<IconPlus size={18} />}
                  onClick={() => {
                    setSelectedField(null);
                    setDialogOpen(true);
                  }}
                  sx={{ bgcolor: "#064e3b", textTransform: "none", fontWeight: 700, "&:hover": { bgcolor: "#047857" } }}
                >
                  Add Field Rule
                </Button>
              </Box>
            ) : (
              <Box
                sx={{
                  width: "100%",
                  "& .MuiDataGrid-root": { border: "none" },
                  "& .MuiDataGrid-columnHeaders": { bgcolor: "#f8fafc", fontWeight: 700, borderBottom: "1px solid #e2e8f0" },
                  "& .MuiDataGrid-row": { borderBottom: "1px solid #f1f5f9", "&:hover": { bgcolor: "#f8fafc" } },
                }}
              >
                <DataGrid
                  rows={filteredFields}
                  columns={columns}
                  loading={loading}
                  disableRowSelectionOnClick
                  autoHeight
                  pageSizeOptions={[10, 25, 50]}
                  initialState={{
                    pagination: {
                      paginationModel: {
                        page: 0,
                        pageSize: 10,
                      },
                    },
                  }}
                />
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Bottom Navigation & Quick Actions Bar */}
        <Box display="flex" justifyContent="space-between" alignItems="center" pt={1} pb={2}>
          <Button
            component={Link}
            href="/settings"
            variant="outlined"
            startIcon={<IconArrowLeft size={18} />}
            sx={{
              px: 3,
              py: 1.2,
              fontWeight: 700,
              textTransform: "none",
              borderColor: "#cbd5e1",
              color: "#334155",
              "&:hover": { borderColor: "#94a3b8", bgcolor: "#f8fafc" },
            }}
          >
            Back to Settings
          </Button>

          <Button
            variant="contained"
            startIcon={<IconPlus size={18} />}
            onClick={() => {
              setSelectedField(null);
              setDialogOpen(true);
            }}
            sx={{
              bgcolor: "#064e3b",
              color: "#ffffff",
              fontWeight: 700,
              px: 3.5,
              py: 1.2,
              textTransform: "none",
              boxShadow: "0 4px 14px rgba(6, 78, 59, 0.25)",
              "&:hover": { bgcolor: "#047857" },
            }}
          >
            Add Field Rule
          </Button>
        </Box>

        {/* Create/Edit Dialog */}
        <FieldConfigurationDialog
          open={dialogOpen}
          fieldConfig={selectedField}
          categories={categories}
          defaultCategoryId={selectedCategoryTab === "ALL" ? categories[0]?.id : selectedCategoryTab}
          onClose={() => {
            setDialogOpen(false);
            setSelectedField(null);
          }}
          onSaved={loadData}
        />

        {/* Strictly Read-Only View Dialog */}
        <ViewFieldConfigurationDialog
          open={viewOpen}
          fieldConfig={selectedField}
          onClose={() => {
            setViewOpen(false);
            setSelectedField(null);
          }}
        />

        {/* Delete Dialog */}
        <DeleteFieldConfigurationDialog
          open={deleteOpen}
          fieldConfig={selectedField}
          onClose={() => {
            setDeleteOpen(false);
            setSelectedField(null);
          }}
          onDeleted={loadData}
        />
      </Box>
    </PageContainer>
  );
}
