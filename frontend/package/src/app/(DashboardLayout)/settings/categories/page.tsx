"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import { MemberCategory } from "@/interfaces/category";
import categoryService from "@/services/category.service";

import CategoryDataGrid from "@/components/settings/CategoryDataGrid";
import CategoryDialog from "@/components/settings/CategoryDialog";
import ViewCategoryDialog from "@/components/settings/ViewCategoryDialog";
import DeleteCategoryDialog from "@/components/settings/DeleteCategoryDialog";
import {
  IconFolders,
  IconPlus,
  IconSearch,
  IconCategory,
  IconShieldCheck,
  IconUsers,
  IconArrowLeft,
} from "@tabler/icons-react";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<MemberCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<MemberCategory | null>(null);

  useEffect(() => {
    void loadCategories();
  }, []);

  async function loadCategories() {
    try {
      setLoading(true);
      setError("");
      const data = await categoryService.getAll();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load categories:", err);
      setError("Failed to load member categories. Please check backend connection.");
    } finally {
      setLoading(false);
    }
  }

  const filteredCategories = useMemo(() => {
    const value = search.trim().toLowerCase();
    return categories.filter(
      (category) =>
        category.name.toLowerCase().includes(value) ||
        category.code.toLowerCase().includes(value) ||
        (category.description && category.description.toLowerCase().includes(value))
    );
  }, [categories, search]);

  return (
    <PageContainer
      title="Member Categories - Royal SACCO"
      description="Configure membership tiers, eligibility categories, and classifications"
    >
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        {/* Executive Hero Banner */}
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
                  <IconFolders size={28} color="#6ee7b7" />
                </Box>
                <Typography variant="h4" fontWeight={800} sx={{ color: "#ffffff", letterSpacing: "-0.5px" }}>
                  Member Categories &amp; Tiers
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ color: "#a7f3d0" }}>
                Manage member classifications, registration tiers, and operational rules across the SACCO
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={<IconPlus size={18} />}
              onClick={() => {
                setSelectedCategory(null);
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
              New Category
            </Button>
          </Stack>
        </Box>

        {/* 3 KPI Summary Cards */}
        <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #e2e8f0", bgcolor: "#ffffff" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: 0.5 }}>
                    CONFIGURED CATEGORIES
                  </Typography>
                  <Typography variant="h4" fontWeight={800} color="#064e3b" sx={{ mt: 0.5 }}>
                    {categories.length}
                  </Typography>
                </Box>
                <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: "rgba(6, 78, 59, 0.1)", color: "#064e3b" }}>
                  <IconCategory size={24} />
                </Box>
              </Stack>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <Card elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #e2e8f0", bgcolor: "#ffffff" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: 0.5 }}>
                    DEFAULT CLASSIFICATION
                  </Typography>
                  <Typography variant="h5" fontWeight={800} color="#0284c7" sx={{ mt: 0.5 }}>
                    NORMAL MEMBER
                  </Typography>
                </Box>
                <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: "rgba(2, 132, 199, 0.1)", color: "#0284c7" }}>
                  <IconUsers size={24} />
                </Box>
              </Stack>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <Card elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #e2e8f0", bgcolor: "#ffffff" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: 0.5 }}>
                    CLASSIFICATION POLICY
                  </Typography>
                  <Typography variant="h5" fontWeight={800} color="#059669" sx={{ mt: 0.5 }}>
                    ACTIVE &amp; ENFORCED
                  </Typography>
                </Box>
                <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: "rgba(16, 185, 129, 0.1)", color: "#059669" }}>
                  <IconShieldCheck size={24} />
                </Box>
              </Stack>
            </Card>
          </Grid>
        </Grid>

        {/* Search & DataGrid Card */}
        <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
          <CardContent sx={{ p: 3 }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "center" }}
              spacing={2}
              mb={2.5}
            >
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Membership Tiers Register ({categories.length})
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Active member category codes used in loan limits, rates, and registration workflows
                </Typography>
              </Box>

              <TextField
                size="small"
                placeholder="Search category name, code..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
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

            <Divider sx={{ mb: 2 }} />

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {loading ? (
              <Box display="flex" justifyContent="center" py={8}>
                <CircularProgress sx={{ color: "#064e3b" }} />
              </Box>
            ) : (
              <CategoryDataGrid
                categories={filteredCategories}
                loading={loading}
                onView={(category) => {
                  setSelectedCategory(category);
                  setViewOpen(true);
                }}
                onEdit={(category) => {
                  setSelectedCategory(category);
                  setDialogOpen(true);
                }}
                onDelete={(category) => {
                  setSelectedCategory(category);
                  setDeleteOpen(true);
                }}
              />
            )}
          </CardContent>
        </Card>

        {/* Bottom Navigation & Actions Bar */}
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
              setSelectedCategory(null);
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
            New Category
          </Button>
        </Box>

        {/* View Category Details Modal */}
        <ViewCategoryDialog
          open={viewOpen}
          category={selectedCategory}
          onClose={() => {
            setViewOpen(false);
            setSelectedCategory(null);
          }}
          onEdit={(category) => {
            setViewOpen(false);
            setSelectedCategory(category);
            setDialogOpen(true);
          }}
        />

        {/* Create/Edit Category Dialog */}
        <CategoryDialog
          open={dialogOpen}
          category={selectedCategory}
          onClose={() => {
            setDialogOpen(false);
            setSelectedCategory(null);
          }}
          onSaved={loadCategories}
        />

        {/* Delete Category Dialog */}
        <DeleteCategoryDialog
          open={deleteOpen}
          category={selectedCategory}
          onClose={() => {
            setDeleteOpen(false);
            setSelectedCategory(null);
          }}
          onDeleted={loadCategories}
        />
      </Box>
    </PageContainer>
  );
}