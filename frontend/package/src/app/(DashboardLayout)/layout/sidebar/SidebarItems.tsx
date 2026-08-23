"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Collapse,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  IconChevronDown,
  IconChevronRight,
  IconBuildingBank,
} from "@tabler/icons-react";
import { getMenuItems, MenuItem as MenuItemType, MenuLink } from "./MenuItems";
import { usePermissions } from "@/hooks/usePermissions";

export default function SidebarItems() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { loading, permissions, isSuperuser } = usePermissions();

  // Keep track of open accordion sections
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    "members-menu": true,
    "jinue-loans": true,
    "collections": false,
    "administration": false,
  });

  // Automatically open the section that contains the active route
  useEffect(() => {
    if (pathname) {
      if (pathname.startsWith("/members")) {
        setOpenSections((prev) => ({ ...prev, "members-menu": true }));
      } else if (pathname.startsWith("/loans")) {
        setOpenSections((prev) => ({ ...prev, "jinue-loans": true }));
      } else if (pathname.startsWith("/collections")) {
        setOpenSections((prev) => ({ ...prev, "collections": true }));
      } else if (pathname.startsWith("/administration") || pathname.startsWith("/settings")) {
        setOpenSections((prev) => ({ ...prev, "administration": true }));
      }
    }
  }, [pathname]);

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  if (loading) {
    return null;
  }

  const menuItems = getMenuItems(permissions, isSuperuser);

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#064e3b", // Deep SACCO Forest Green
        color: "#ffffff",
      }}
    >
      {/* Brand Header */}
      <Box
        component={Link}
        href="/dashboard"
        sx={{
          p: 2.5,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          textDecoration: "none",
          borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
        }}
      >
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: 2.5,
            bgcolor: "rgba(255, 255, 255, 0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#34d399",
            flexShrink: 0,
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          }}
        >
          <IconBuildingBank size={26} stroke={2.2} />
        </Box>
        <Box>
          <Typography
            variant="subtitle1"
            fontWeight={900}
            sx={{
              color: "#ffffff",
              letterSpacing: "0.5px",
              lineHeight: 1.1,
              fontSize: "1.1rem",
            }}
          >
            ROYAL SACCO
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "#a7f3d0",
              fontSize: "0.7rem",
              fontWeight: 700,
              letterSpacing: "0.5px",
            }}
          >
            MEMBER &amp; LOAN SYSTEM
          </Typography>
        </Box>
      </Box>

      {/* Navigation List */}
      <Box sx={{ flex: 1, overflowY: "auto", py: 2, px: 1.5 }}>
        <List disablePadding>
          {menuItems.map((item: MenuItemType) => {
            if ("navlabel" in item && item.navlabel) {
              return (
                <Typography
                  key={item.subheader}
                  variant="caption"
                  sx={{
                    px: 2,
                    pt: 2.5,
                    pb: 0.8,
                    display: "block",
                    color: "#6ee7b7",
                    fontSize: "0.72rem",
                    fontWeight: 900,
                    letterSpacing: "1.2px",
                    textTransform: "uppercase",
                  }}
                >
                  {item.subheader}
                </Typography>
              );
            }

            if ("id" in item) {
              const linkItem = item as MenuLink;
              const hasChildren = linkItem.children && linkItem.children.length > 0;
              const Icon = linkItem.icon;
              const isOpen = openSections[linkItem.id];
              const isDirectActive = pathname === linkItem.href;

              // Top-level Accordion Item with Submenu
              if (hasChildren) {
                const isChildActive = linkItem.children?.some((child) => {
                  if (!child.href) return false;
                  if (pathname === child.href) return true;
                  const basePath = child.href.split("?")[0];
                  if (basePath === "/loans" && (pathname === "/loans" || (pathname.startsWith("/loans/") && pathname !== "/loans/apply"))) return true;
                  if (basePath === "/members" && (pathname === "/members" || (pathname.startsWith("/members/") && pathname !== "/members/new"))) return true;
                  return pathname === basePath;
                });

                return (
                  <Box key={linkItem.id} sx={{ mb: 0.8 }}>
                    <ListItemButton
                      onClick={() => toggleSection(linkItem.id)}
                      sx={{
                        py: 1.1,
                        px: 1.5,
                        borderRadius: 2,
                        color: "#ffffff",
                        bgcolor: isChildActive ? "rgba(255, 255, 255, 0.1)" : "transparent",
                        borderLeft: isChildActive ? "3px solid #34d399" : "3px solid transparent",
                        "&:hover": {
                          bgcolor: "rgba(255, 255, 255, 0.15)",
                        },
                      }}
                    >
                      {Icon && (
                        <ListItemIcon sx={{ minWidth: 32, color: isChildActive ? "#34d399" : "#ffffff" }}>
                          <Icon size={20} stroke={2} />
                        </ListItemIcon>
                      )}
                      <ListItemText
                        primary={linkItem.title}
                        primaryTypographyProps={{
                          fontSize: "0.94rem",
                          fontWeight: isChildActive ? 800 : 600,
                          color: "#ffffff",
                        }}
                      />
                      {isOpen ? (
                        <IconChevronDown size={17} color="#34d399" />
                      ) : (
                        <IconChevronRight size={17} color="rgba(255,255,255,0.7)" />
                      )}
                    </ListItemButton>

                    <Collapse in={isOpen} timeout="auto" unmountOnExit>
                      <List component="div" disablePadding sx={{ pl: 1.5, mt: 0.4 }}>
                        {linkItem.children?.map((child) => {
                          const isSubActive = (() => {
                            if (!child.href) return false;
                            const queryStr = searchParams.toString();
                            const currentUrl = pathname + (queryStr ? `?${queryStr}` : "");
                            if (currentUrl === child.href) return true;
                            if (child.href === "/loans" && pathname === "/loans" && !queryStr) return true;
                            if (child.href === "/members" && pathname === "/members" && !queryStr) return true;
                            return false;
                          })();

                          return (
                            <ListItemButton
                              key={child.id}
                              component={Link}
                              href={child.href || "#"}
                              sx={{
                                py: 0.85,
                                px: 1.5,
                                my: 0.3,
                                borderRadius: 2,
                                color: isSubActive ? "#ffffff" : "rgba(255, 255, 255, 0.82)",
                                bgcolor: isSubActive ? "rgba(52, 211, 153, 0.22)" : "transparent",
                                borderLeft: isSubActive ? "3px solid #34d399" : "3px solid transparent",
                                boxShadow: isSubActive ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
                                transition: "all 0.2s ease",
                                "&:hover": {
                                  bgcolor: isSubActive ? "rgba(52, 211, 153, 0.28)" : "rgba(255, 255, 255, 0.12)",
                                  color: "#ffffff",
                                },
                              }}
                            >
                              <ListItemIcon sx={{ minWidth: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                {isSubActive ? (
                                  <Box
                                    sx={{
                                      width: 9,
                                      height: 9,
                                      borderRadius: "50%",
                                      bgcolor: "#34d399",
                                      boxShadow: "0 0 10px #34d399, 0 0 4px #ffffff",
                                    }}
                                  />
                                ) : (
                                  <Box
                                    sx={{
                                      width: 6,
                                      height: 6,
                                      borderRadius: "50%",
                                      border: "1.5px solid rgba(255, 255, 255, 0.45)",
                                    }}
                                  />
                                )}
                              </ListItemIcon>
                              <ListItemText
                                primary={child.title}
                                primaryTypographyProps={{
                                  fontSize: "0.87rem",
                                  fontWeight: isSubActive ? 800 : 500,
                                  color: isSubActive ? "#ffffff" : "rgba(255, 255, 255, 0.85)",
                                }}
                              />
                            </ListItemButton>
                          );
                        })}
                      </List>
                    </Collapse>
                  </Box>
                );
              }

              // Top-level Single Link Item
              return (
                <ListItemButton
                  key={linkItem.id}
                  component={Link}
                  href={linkItem.href || "#"}
                  sx={{
                    py: 1.1,
                    px: 1.5,
                    mb: 0.8,
                    borderRadius: 2,
                    color: "#ffffff",
                    bgcolor: isDirectActive ? "rgba(52, 211, 153, 0.22)" : "transparent",
                    borderLeft: isDirectActive ? "3px solid #34d399" : "3px solid transparent",
                    boxShadow: isDirectActive ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
                    "&:hover": {
                      bgcolor: isDirectActive ? "rgba(52, 211, 153, 0.28)" : "rgba(255, 255, 255, 0.12)",
                    },
                  }}
                >
                  {Icon && (
                    <ListItemIcon sx={{ minWidth: 32, color: isDirectActive ? "#34d399" : "#ffffff" }}>
                      <Icon size={20} stroke={2} />
                    </ListItemIcon>
                  )}
                  <ListItemText
                    primary={linkItem.title}
                    primaryTypographyProps={{
                      fontSize: "0.94rem",
                      fontWeight: isDirectActive ? 800 : 600,
                      color: "#ffffff",
                    }}
                  />
                </ListItemButton>
              );
            }

            return null;
          })}
        </List>
      </Box>

      {/* Subtle Dark Green Footer */}
      <Box sx={{ p: 2, borderTop: "1px solid rgba(255, 255, 255, 0.12)", bgcolor: "rgba(0,0,0,0.15)" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="caption" sx={{ color: "#a7f3d0", fontSize: "0.72rem", fontWeight: 700 }}>
            Royal SACCO Core
          </Typography>
          <Typography variant="caption" sx={{ color: "#34d399", fontSize: "0.72rem", fontWeight: 900 }}>
            v1.0 Pro
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}