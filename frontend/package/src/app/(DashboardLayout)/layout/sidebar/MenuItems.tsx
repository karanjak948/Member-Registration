import {
  IconLayoutDashboard,
  IconUserPlus,
  IconUsers,
  IconReportAnalytics,
  IconUser,
  IconSettings,
  IconUsersGroup,
  IconUserShield,
} from "@tabler/icons-react";

import type { ElementType } from "react";

import { PERMISSIONS, type Permission } from "@/constants/permissions";

// ============================================================
// MENU TYPES
// ============================================================

export interface NavLabel {
  navlabel: true;
  subheader: string;
}

export interface MenuLink {
  id: string;
  title: string;
  icon?: ElementType;
  href?: string;
  children?: MenuLink[];
}

export type MenuItem = NavLabel | MenuLink;

// ============================================================
// MENU ITEMS
// ============================================================

export function getMenuItems(permissions: Permission[] = []): MenuItem[] {
  const can = (permission: Permission): boolean =>
    permissions.includes(permission);

  const items: MenuItem[] = [];

  // ============================================================
  // MAIN
  // ============================================================

  items.push({
    navlabel: true,
    subheader: "MAIN",
  });

  // Dashboard - Always visible
  items.push({
    id: "dashboard",
    title: "Dashboard",
    icon: IconLayoutDashboard,
    href: "/dashboard",
  });

  // ============================================================
  // MEMBER MANAGEMENT
  // ============================================================

  if (can(PERMISSIONS.VIEW_MEMBERS)) {
    items.push({
      navlabel: true,
      subheader: "MEMBER MANAGEMENT",
    });

    // Members
    items.push({
      id: "members",
      title: "Members",
      icon: IconUsers,
      href: "/members",
    });

    // Register Member
    if (can(PERMISSIONS.CREATE_MEMBERS)) {
      items.push({
        id: "register-member",
        title: "Register Member",
        icon: IconUserPlus,
        href: "/members/new",
      });
    }
  }

  // ============================================================
  // REPORTS
  // ============================================================

  // TODO: Add VIEW_REPORTS permission to backend when reports module is ready
  // For now, show reports if user can view members
  if (can(PERMISSIONS.VIEW_MEMBERS)) {
    items.push({
      navlabel: true,
      subheader: "REPORTS",
    });

    items.push({
      id: "reports",
      title: "Reports",
      icon: IconReportAnalytics,
      href: "/reports",
    });
  }

  // ============================================================
  // ADMINISTRATION (Conditional)
  // ============================================================

  const canManageUsers = can(PERMISSIONS.MANAGE_USERS);
  const canManageRoles = can(PERMISSIONS.MANAGE_ROLES);

  if (canManageUsers || canManageRoles) {
    items.push({
      navlabel: true,
      subheader: "ADMINISTRATION",
    });

    const adminChildren: MenuLink[] = [];

    if (canManageUsers) {
      adminChildren.push({
        id: "administration-users",
        title: "Users",
        icon: IconUsersGroup,
        href: "/administration/users",
      });
    }

    if (canManageRoles) {
      adminChildren.push({
        id: "administration-roles",
        title: "Roles",
        icon: IconUserShield,
        href: "/administration/roles",
      });
    }

    if (adminChildren.length > 0) {
      items.push({
        id: "administration",
        title: "Administration",
        icon: IconUserShield,
        children: adminChildren,
      });
    }
  }

  // ============================================================
  // ACCOUNT
  // ============================================================

  items.push({
    navlabel: true,
    subheader: "ACCOUNT",
  });

  // Profile - Always visible
  items.push({
    id: "profile",
    title: "Profile",
    icon: IconUser,
    href: "/profile",
  });

  // Settings - Always visible
  items.push({
    id: "settings",
    title: "Settings",
    icon: IconSettings,
    href: "/settings",
  });

  return items;
}

// ============================================================
// LEGACY EXPORT
// ============================================================

// Returns all menu items without RBAC filtering
export default getMenuItems([]);
