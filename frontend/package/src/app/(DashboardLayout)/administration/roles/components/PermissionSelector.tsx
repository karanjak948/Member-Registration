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
import {
  IconUsers,
  IconCoins,
  IconShieldCheck,
  IconBuildingBank,
  IconReceipt,
} from "@tabler/icons-react";

interface PermissionSelectorProps {
  permissions: Permission[];
  value: number[];
  onChange: (permissionIds: number[]) => void;
  loading?: boolean;
}

interface GroupedPermissions {
  [module: string]: Permission[];
}

const moduleConfig: Record<string, { color: string; bg: string; border: string; icon: any }> = {
  Members: { color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", icon: IconUsers },
  Loans: { color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", icon: IconCoins },
  Roles: { color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe", icon: IconShieldCheck },
  Users: { color: "#d97706", bg: "#fffbeb", border: "#fde68a", icon: IconBuildingBank },
  Collections: { color: "#0d9488", bg: "#f0fdfa", border: "#99f6e4", icon: IconReceipt },
};

export default function PermissionSelector({
  permissions,
  value,
  onChange,
  loading = false,
}: PermissionSelectorProps) {
  const [search, setSearch] = useState("");
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    () => new Set(["Members", "Loans", "Roles", "Users", "Collections"])
  );

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

    return result;
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
        <Typography variant="caption" fontWeight={800} color="#4338ca">
          ASSIGNED PERMISSIONS MATRIX
        </Typography>
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
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
    <Stack spacing={2.5}>
      {/* Header and Controls */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={2}
      >
        <Box>
          <Typography variant="caption" sx={{ fontWeight: 800, color: "#4338ca", letterSpacing: "0.5px" }}>
            ASSIGNED PERMISSIONS MATRIX
          </Typography>
          <Typography variant="body2" color="#64748b" fontWeight={500}>
            Toggle modules or individual rights to grant operational capabilities
          </Typography>
        </Box>

        <Chip
          color={totalSelected > 0 ? "indigo" as any : "default"}
          size="small"
          label={`${totalSelected} of ${permissions.length} Selected`}
          sx={{
            fontWeight: 900,
            fontSize: "0.82rem",
            bgcolor: totalSelected > 0 ? "#e0e7ff" : "#f1f5f9",
            color: totalSelected > 0 ? "#4338ca" : "#64748b",
            border: `1px solid ${totalSelected > 0 ? "#c7d2fe" : "#cbd5e1"}`,
            py: 0.5,
            px: 1,
          }}
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
              startAdornment: <SearchIcon sx={{ mr: 1, color: "#4f46e5", fontSize: 20 }} />,
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
              sx: { borderRadius: 2.5, fontWeight: 600 },
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
            sx={{
              textTransform: "none",
              fontWeight: 800,
              borderRadius: 2,
              color: "#4338ca",
              borderColor: "#c7d2fe",
              "&:hover": { bgcolor: "#e0e7ff" },
            }}
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
            sx={{ textTransform: "none", fontWeight: 800, borderRadius: 2 }}
          >
            Clear All
          </Button>
        </Stack>
      </Stack>

      {/* Permission List Accordions */}
      <Paper
        elevation={0}
        sx={{
          maxHeight: 460,
          overflowY: "auto",
          borderRadius: 3,
          border: "1px solid #e2e8f0",
          bgcolor: "#ffffff",
        }}
      >
        {!hasPermissions ? (
          <Box py={6} textAlign="center">
            <Typography variant="body2" color="text.secondary" fontWeight={600}>
              No permissions available in catalogue.
            </Typography>
          </Box>
        ) : !hasSearchResults ? (
          <Box py={6} textAlign="center">
            <Typography variant="body2" color="text.secondary" fontWeight={600}>
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
              const cfg = moduleConfig[module] || { color: "#4f46e5", bg: "#f5f3ff", border: "#ddd6fe", icon: IconShieldCheck };
              const ModuleIcon = cfg.icon;

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
                    expandIcon={<ExpandMoreIcon sx={{ color: cfg.color }} />}
                    sx={{
                      minHeight: 52,
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
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Checkbox
                          size="small"
                          checked={fullySelected}
                          indeterminate={partiallySelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleModule(modulePermissions);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          sx={{
                            color: cfg.color,
                            "&.Mui-checked": { color: cfg.color },
                          }}
                        />

                        <Box
                          sx={{
                            p: 0.75,
                            borderRadius: 1.5,
                            bgcolor: cfg.bg,
                            color: cfg.color,
                            display: "flex",
                            border: `1px solid ${cfg.border}`,
                          }}
                        >
                          <ModuleIcon size={18} />
                        </Box>

                        <Typography fontWeight={900} variant="body2" sx={{ color: "#0f172a" }}>
                          {module} Module
                        </Typography>
                      </Stack>

                      <Chip
                        size="small"
                        label={`${selectedCount} of ${modulePermissions.length} selected`}
                        sx={{
                          fontSize: "0.75rem",
                          fontWeight: 800,
                          bgcolor: selectedCount > 0 ? cfg.bg : "#f1f5f9",
                          color: selectedCount > 0 ? cfg.color : "#94a3b8",
                          border: `1px solid ${selectedCount > 0 ? cfg.border : "#e2e8f0"}`,
                        }}
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
                              pl: 5.5,
                              pr: 2.5,
                              py: 1,
                              bgcolor: checked ? cfg.bg : "transparent",
                              borderLeft: checked ? `4px solid ${cfg.color}` : "4px solid transparent",
                              "&:hover": {
                                bgcolor: checked ? cfg.bg : "#f8fafc",
                              },
                            }}
                            dense
                          >
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              <Checkbox
                                edge="start"
                                checked={checked}
                                size="small"
                                sx={{
                                  color: "#cbd5e1",
                                  "&.Mui-checked": { color: cfg.color },
                                }}
                              />
                            </ListItemIcon>
                            <ListItemText
                              primary={permission.name}
                              secondary={permission.description || permission.code}
                              primaryTypographyProps={{
                                variant: "body2",
                                fontWeight: checked ? 800 : 600,
                                color: checked ? cfg.color : "#1e293b",
                              }}
                              secondaryTypographyProps={{
                                variant: "caption",
                                color: "#64748b",
                                fontWeight: 500,
                              }}
                            />
                            <Chip
                              label={permission.code}
                              size="small"
                              variant="outlined"
                              sx={{
                                fontSize: "0.7rem",
                                fontWeight: 700,
                                fontFamily: "monospace",
                                color: checked ? cfg.color : "#64748b",
                                borderColor: checked ? cfg.border : "#e2e8f0",
                                bgcolor: checked ? "#ffffff" : "transparent",
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