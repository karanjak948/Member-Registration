"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";

import { MemberCategory } from "@/interfaces/category";
import categoryService from "@/services/category.service";

import CategoryDataGrid from "@/components/settings/CategoryDataGrid";
import CategoryDialog from "@/components/settings/CategoryDialog";
import DeleteCategoryDialog from "@/components/settings/DeleteCategoryDialog";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<MemberCategory[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);

  const [selectedCategory, setSelectedCategory] =
    useState<MemberCategory | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      setLoading(true);

      const data = await categoryService.getAll();

      setCategories(data);
    } catch {
      setError("Failed to load categories.");
    } finally {
      setLoading(false);
    }
  }

  const filteredCategories = useMemo(() => {
    const value = search.toLowerCase();

    return categories.filter(
      (category) =>
        category.name
          .toLowerCase()
          .includes(value) ||
        category.code
          .toLowerCase()
          .includes(value)
    );
  }, [categories, search]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        py={8}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth={false}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4">
          Member Categories
        </Typography>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setSelectedCategory(null);
            setDialogOpen(true);
          }}
        >
          New Category
        </Button>
      </Stack>

      <TextField
        fullWidth
        placeholder="Search categories..."
        value={search}
        onChange={(e) =>
          setSearch(e.target.value)
        }
        sx={{ mb: 3 }}
      />

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
        >
          {error}
        </Alert>
      )}

      <CategoryDataGrid
        categories={filteredCategories}
        loading={loading}
        onView={(category) => {
          setSelectedCategory(category);
          setDialogOpen(true);
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

      <CategoryDialog
        open={dialogOpen}
        category={selectedCategory}
        onClose={() => {
          setDialogOpen(false);
          setSelectedCategory(null);
        }}
        onSaved={loadCategories}
      />

      <DeleteCategoryDialog
        open={deleteOpen}
        category={selectedCategory}
        onClose={() => {
          setDeleteOpen(false);
          setSelectedCategory(null);
        }}
        onDeleted={loadCategories}
      />
    </Container>
  );
}