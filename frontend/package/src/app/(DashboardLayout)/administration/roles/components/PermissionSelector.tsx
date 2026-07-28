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
  // Initialize expandedModules with a lazy initializer
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    () => new Set()
  );

  // Group permissions by module
  const groupedPermissions = useMemo(() => {
    const grouped = permissions.reduce<GroupedPermissions>((acc, permission) => {
      const module = permission.module || "Other";
      if (!acc[module]) {
        acc[module] = [];
      }
      acc[module].push(permission);
      return acc;
    }, {});

    // Sort permissions within each module
    Object.keys(grouped).forEach((module) => {
      grouped[module].sort((a, b) => a.name.localeCompare(b.name));
    });

    return grouped;
  }, [permissions]);

  // Filter permissions by search
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
          permission.module.toLowerCase().includes(keyword)
      );

      if (filtered.length > 0) {
        result[module] = filtered;
      }
    });

    // Sort modules alphabetically
    const sortedResult: GroupedPermissions = {};
    Object.keys(result)
      .sort((a, b) => a.localeCompare(b))
      .forEach((module) => {
        sortedResult[module] = result[module];
      });

    return sortedResult;
  }, [groupedPermissions, search]);

  // Get all permission IDs
  const allPermissionIds = useMemo(() => {
    return permissions.map((p) => p.id);
  }, [permissions]);

  // Get selected IDs for a module
  const getModuleSelectedIds = (modulePermissions: Permission[]) => {
    return modulePermissions
      .filter((p) => value.includes(p.id))
      .map((p) => p.id);
  };

  // Toggle a single permission
  const togglePermission = (permissionId: number) => {
    if (value.includes(permissionId)) {
      onChange(value.filter((id) => id !== permissionId));
    } else {
      onChange([...value, permissionId]);
    }
  };

  // Select all permissions in a module
  const selectModule = (modulePermissions: Permission[]) => {
    const moduleIds = modulePermissions.map((p) => p.id);
    const newSelection = [...value];
    moduleIds.forEach((id) => {
      if (!newSelection.includes(id)) {
        newSelection.push(id);
      }
    });
    onChange(newSelection);
  };

  // Clear all permissions in a module
  const clearModule = (modulePermissions: Permission[]) => {
    const moduleIds = modulePermissions.map((p) => p.id);
    onChange(value.filter((id) => !moduleIds.includes(id)));
  };

  // Select all permissions
  const selectAll = () => {
    onChange(allPermissionIds);
  };

  // Clear all permissions
  const clearAll = () => {
    onChange([]);
  };

  // Check if all permissions in a module are selected
  const isModuleFullySelected = (modulePermissions: Permission[]) => {
    const moduleIds = modulePermissions.map((p) => p.id);
    return moduleIds.every((id) => value.includes(id));
  };

  // Check if some permissions in a module are selected
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

  // Helper to highlight search matches
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) =>
      regex.test(part) ? (
        <Box component="span" key={index} sx={{ bgcolor: "warning.light", fontWeight: 600 }}>
          {part}
        </Box>
      ) : (
        part
      )
    );
  };

  if (loading) {
    return (
      <Stack spacing={2}>
        <Typography variant="h6" fontWeight={600}>
          Permissions
        </Typography>
        <Paper variant="outlined" sx={{ p: 1, borderRadius: 2 }}>
          <Stack spacing={1}>
            <Skeleton variant="rounded" height={48} />
            <Skeleton variant="rounded" height={48} />
            <Skeleton variant="rounded" height={48} />
            <Skeleton variant="rounded" height={48} />
          </Stack>
        </Paper>
      </Stack>
    );
  }

  const hasPermissions = permissions.length > 0;
  const hasSearchResults = Object.keys(filteredGroupedPermissions).length > 0;

  return (
    <Stack spacing={2}>
      {/* Sticky Header */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 2,
          bgcolor: "background.paper",
          pt: 0,
          pb: 2,
        }}
      >
        {/* Header */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          gap={1}
          sx={{ mb: 2 }}
        >
          <Typography variant="h6" fontWeight={600}>
            Permissions
          </Typography>

          <Chip
            color="primary"
            variant="outlined"
            size="small"
            label={`${totalSelected} of ${permissions.length} selected`}
          />
        </Stack>

        {/* Search and Actions */}
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <TextField
            size="small"
            placeholder="Search permissions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />,
                endAdornment: search && (
                  <Box
                    component="button"
                    onClick={() => setSearch("")}
                    sx={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      color: "text.secondary",
                      p: 0.5,
                      borderRadius: "50%",
                      "&:hover": {
                        bgcolor: "action.hover",
                      },
                    }}
                  >
                    <ClearIcon fontSize="small" />
                  </Box>
                ),
              },
            }}
            sx={{ flex: 1, minWidth: 200 }}
          />

          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<SelectAllIcon />}
              onClick={selectAll}
              disabled={!hasPermissions}
            >
              Select All
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              startIcon={<ClearIcon />}
              onClick={clearAll}
              disabled={!hasPermissions}
            >
              Clear All
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Permission List */}
      <Paper
        variant="outlined"
        sx={{
          maxHeight: 420,
          overflow: "auto",
          borderRadius: 2,
        }}
      >
        {!hasPermissions ? (
          <Box py={6} textAlign="center">
            <Typography variant="body2" color="text.secondary">
              No permissions available.
            </Typography>
          </Box>
        ) : !hasSearchResults ? (
          <Box py={6} textAlign="center">
            <SearchIcon sx={{ fontSize: 40, color: "text.secondary", mb: 1 }} />
            <Typography variant="body1" fontWeight={500}>
              No permissions match "{search}"
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Try another search term.
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
                    "&:before": {
                      display: "none",
                    },
                    borderBottom: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      minHeight: 44,
                      "& .MuiAccordionSummary-content": {
                        alignItems: "center",
                        my: 0.5,
                      },
                    }}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1}
                      sx={{ width: "100%" }}
                    >
                      <Checkbox
                        size="small"
                        checked={fullySelected}
                        indeterminate={partiallySelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleModule(modulePermissions);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        sx={{ mr: 1 }}
                      />
                      <Typography fontWeight={600} variant="body1">
                        {module}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                        {modulePermissions.length} permissions • {selectedCount} selected
                      </Typography>
                    </Stack>
                  </AccordionSummary>

                  <AccordionDetails sx={{ p: 0 }}>
                    <List disablePadding dense>
                      {modulePermissions.map((permission) => {
                        const checked = value.includes(permission.id);

                        return (
                          <ListItemButton
                            key={permission.id}
                            onClick={() => togglePermission(permission.id)}
                            sx={{
                              pl: 6,
                              "&:hover": {
                                backgroundColor: "action.hover",
                              },
                            }}
                            dense
                          >
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              <Checkbox
                                edge="start"
                                checked={checked}
                                size="small"
                              />
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                search.trim() ? (
                                  highlightText(permission.name, search)
                                ) : (
                                  permission.name
                                )
                              }
                              secondary={permission.code}
                              primaryTypographyProps={{
                                variant: "body2",
                                fontWeight: 500,
                              }}
                              secondaryTypographyProps={{
                                variant: "caption",
                                color: "text.secondary",
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