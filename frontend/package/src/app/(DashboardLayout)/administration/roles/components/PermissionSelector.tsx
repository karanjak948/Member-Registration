"use client";

import { useMemo, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Checkbox,
  Chip,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SearchIcon from "@mui/icons-material/Search";
import SelectAllIcon from "@mui/icons-material/SelectAll";
import ClearIcon from "@mui/icons-material/Clear";
import { Permission } from "@/types/role";

interface PermissionSelectorProps {
  permissions: Permission[];
  value: number[];
  onChange: (permissionIds: number[]) => void;
  loading?: boolean;
}

interface GroupedPermissions {
  [module: string]: Permission[];
}

export default function PermissionSelector({
  permissions,
  value,
  onChange,
  loading = false,
}: PermissionSelectorProps) {
  const [search, setSearch] = useState("");
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    () => new Set(["Members", "Loans", "Roles", "Users"])
  );

  // Group permissions by normalized module name
  const groupedPermissions = useMemo(() => {
    const grouped = permissions.reduce<GroupedPermissions>((acc, permission) => {
      const rawModule = (permission.module || "General").trim();
      const module = rawModule.charAt(0).toUpperCase() + rawModule.slice(1).toLowerCase();
      if (!acc[module]) {
        acc[module] = [];
      }
      acc[module].push(permission);
      return acc;
    }, {});

    Object.keys(grouped).forEach((module) => {
      grouped[module].sort((a, b) => a.name.localeCompare(b.name));
    });

    return grouped;
  }, [permissions]);

  // Filter permissions by search query
  const filteredGroupedPermissions = useMemo(() => {
    if (!search.trim()) {
      return groupedPermissions;
    }

    const keyword = search.toLowerCase();
    const result: GroupedPermissions = {};

    Object.entries(groupedPermissions).forEach(([module, modulePermissions]) => {
      const filtered = modulePermissions.filter(
        (permission) =>
          permission.name.toLowerCase().includes(keyword) ||
          permission.code.toLowerCase().includes(keyword) ||
          permission.module?.toLowerCase().includes(keyword)
      );

      if (filtered.length > 0) {
        result[module] = filtered;
      }
    });

    const sortedResult: GroupedPermissions = {};
    Object.keys(result)
      .sort((a, b) => a.localeCompare(b))
      .forEach((module) => {
        sortedResult[module] = result[module];
      });

    return sortedResult;
  }, [groupedPermissions, search]);

  const allPermissionIds = useMemo(() => {
    return permissions.map((p) => p.id);
  }, [permissions]);

  const togglePermission = (permissionId: number) => {
    if (value.includes(permissionId)) {
      onChange(value.filter((id) => id !== permissionId));
    } else {
      onChange([...value, permissionId]);
    }
  };

  const getModulePermissionIds = (modulePermissions: Permission[]) => {
    return modulePermissions.map((p) => p.id);
  };

  const selectModule = (modulePermissions: Permission[]) => {
    const moduleIds = getModulePermissionIds(modulePermissions);
    const newSelected = Array.from(new Set([...value, ...moduleIds]));
    onChange(newSelected);
  };

  const clearModule = (modulePermissions: Permission[]) => {
    const moduleIds = getModulePermissionIds(modulePermissions);
    const newSelected = value.filter((id) => !moduleIds.includes(id));
    onChange(newSelected);
  };

  const getModuleSelectedIds = (modulePermissions: Permission[]) => {
    const moduleIds = getModulePermissionIds(modulePermissions);
    return moduleIds.filter((id) => value.includes(id));
  };

  const selectAll = () => {
    onChange(allPermissionIds);
  };

  const clearAll = () => {
    onChange([]);
  };

  const isModuleFullySelected = (modulePermissions: Permission[]) => {
    const moduleIds = modulePermissions.map((p) => p.id);
    return moduleIds.length > 0 && moduleIds.every((id) => value.includes(id));
  };

  const isModulePartiallySelected = (modulePermissions: Permission[]) => {
    const moduleIds = modulePermissions.map((p) => p.id);
    const selectedInModule = moduleIds.filter((id) => value.includes(id));
    return selectedInModule.length > 0 && selectedInModule.length < moduleIds.length;
  };

  const toggleModule = (modulePermissions: Permission[]) => {
    if (isModuleFullySelected(modulePermissions)) {
      clearModule(modulePermissions);
    } else {
      selectModule(modulePermissions);
    }
  };

  const toggleExpanded = (module: string) => {
    setExpandedModules((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(module)) {
        newSet.delete(module);
      } else {
        newSet.add(module);
      }
      return newSet;
    });
  };

  const totalSelected = value.length;

  if (loading) {
    return (
      <Stack spacing={2}>
        <Typography variant="subtitle2" fontWeight={700}>
          ASSIGNED PERMISSIONS
        </Typography>
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Stack spacing={1.5}>
            <Skeleton variant="rounded" height={44} />
            <Skeleton variant="rounded" height={44} />
            <Skeleton variant="rounded" height={44} />
          </Stack>
        </Paper>
      </Stack>
    );
  }

  const hasPermissions = permissions.length > 0;
  const hasSearchResults = Object.keys(filteredGroupedPermissions).length > 0;

  return (
    <Stack spacing={2}>
      {/* Header and Controls */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={2}
      >
        <Box>
          <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
            ASSIGNED PERMISSIONS MATRIX
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Toggle modules or individual permissions to grant operational rights
          </Typography>
        </Box>

        <Chip
          color={totalSelected > 0 ? "primary" : "default"}
          size="small"
          label={`${totalSelected} of ${permissions.length} Selected`}
          sx={{ fontWeight: 700 }}
        />
      </Stack>

      {/* Search and Action Bar */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems="center">
        <TextField
          size="small"
          placeholder="Filter permissions by name or code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary", fontSize: 20 }} />,
              endAdornment: search && (
                <Box
                  component="button"
                  onClick={() => setSearch("")}
                  sx={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    color: "text.secondary",
                  }}
                >
                  <ClearIcon fontSize="small" />
                </Box>
              ),
            },
          }}
          sx={{ flex: 1, width: { xs: "100%", sm: "auto" } }}
        />

        <Stack direction="row" spacing={1} sx={{ alignSelf: { xs: "stretch", sm: "auto" } }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<SelectAllIcon />}
            onClick={selectAll}
            disabled={!hasPermissions}
            sx={{ textTransform: "none", fontWeight: 600, flex: 1 }}
          >
            Select All
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="inherit"
            startIcon={<ClearIcon />}
            onClick={clearAll}
            disabled={!hasPermissions || totalSelected === 0}
            sx={{ textTransform: "none", fontWeight: 600, flex: 1 }}
          >
            Clear All
          </Button>
        </Stack>
      </Stack>

      {/* Permission List Accordions */}
      <Paper
        elevation={0}
        sx={{
          maxHeight: 440,
          overflow: "auto",
          borderRadius: 2,
          border: "1px solid #e2e8f0",
        }}
      >
        {!hasPermissions ? (
          <Box py={6} textAlign="center">
            <Typography variant="body2" color="text.secondary">
              No permissions available in catalogue.
            </Typography>
          </Box>
        ) : !hasSearchResults ? (
          <Box py={6} textAlign="center">
            <Typography variant="body2" color="text.secondary">
              No permissions match "{search}".
            </Typography>
          </Box>
        ) : (
          <List disablePadding dense>
            {Object.entries(filteredGroupedPermissions).map(([module, modulePermissions]) => {
              const isExpanded = expandedModules.has(module) || search.trim().length > 0;
              const fullySelected = isModuleFullySelected(modulePermissions);
              const partiallySelected = isModulePartiallySelected(modulePermissions);
              const selectedCount = getModuleSelectedIds(modulePermissions).length;

              return (
                <Accordion
                  key={module}
                  expanded={isExpanded}
                  onChange={() => toggleExpanded(module)}
                  disableGutters
                  elevation={0}
                  sx={{
                    "&:before": { display: "none" },
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      minHeight: 48,
                      bgcolor: isExpanded ? "#f8fafc" : "#ffffff",
                      "& .MuiAccordionSummary-content": {
                        alignItems: "center",
                        my: 0.5,
                      },
                    }}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ width: "100%", pr: 1 }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Checkbox
                          size="small"
                          checked={fullySelected}
                          indeterminate={partiallySelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleModule(modulePermissions);
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Typography fontWeight={700} variant="body2">
                          {module} Module
                        </Typography>
                      </Stack>

                      <Chip
                        size="small"
                        label={`${selectedCount} / ${modulePermissions.length} selected`}
                        color={selectedCount > 0 ? "primary" : "default"}
                        variant={selectedCount > 0 ? "filled" : "outlined"}
                        sx={{ fontSize: "0.7rem", height: 22, fontWeight: 700 }}
                      />
                    </Stack>
                  </AccordionSummary>

                  <AccordionDetails sx={{ p: 0, bgcolor: "#ffffff" }}>
                    <List disablePadding dense>
                      {modulePermissions.map((permission) => {
                        const checked = value.includes(permission.id);

                        return (
                          <ListItemButton
                            key={permission.id}
                            onClick={() => togglePermission(permission.id)}
                            sx={{
                              pl: 5,
                              pr: 2,
                              py: 0.8,
                              bgcolor: checked ? "rgba(37, 99, 235, 0.04)" : "transparent",
                              "&:hover": {
                                bgcolor: checked ? "rgba(37, 99, 235, 0.08)" : "#f8fafc",
                              },
                            }}
                            dense
                          >
                            <ListItemIcon sx={{ minWidth: 34 }}>
                              <Checkbox
                                edge="start"
                                checked={checked}
                                size="small"
                              />
                            </ListItemIcon>
                            <ListItemText
                              primary={permission.name}
                              secondary={permission.description || permission.code}
                              primaryTypographyProps={{
                                variant: "body2",
                                fontWeight: checked ? 700 : 500,
                                color: checked ? "primary.main" : "text.primary",
                              }}
                              secondaryTypographyProps={{
                                variant: "caption",
                                color: "text.secondary",
                              }}
                            />
                            <Chip
                              label={permission.code}
                              size="small"
                              variant="outlined"
                              sx={{
                                fontSize: "0.68rem",
                                height: 20,
                                color: "text.secondary",
                                borderColor: "#e2e8f0",
                              }}
                            />
                          </ListItemButton>
                        );
                      })}
                    </List>
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </List>
        )}
      </Paper>
    </Stack>
  );
}