import {
  IconLayoutDashboard,
  IconUserPlus,
  IconUsers,
  IconReportAnalytics,
  IconUser,
  IconSettings,
  IconUsersGroup,
  IconUserShield,
  IconCash,
  IconReceipt,
  IconPlus,
  IconBriefcase,
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
  // LOAN MANAGEMENT
  // ============================================================

  items.push({
    navlabel: true,
    subheader: "LOAN MANAGEMENT",
  });

  // ✅ PROFESSIONAL STRUCTURE: ONE dropdown "Loan Management" that contains everything
  items.push({
    id: "loan-management",
    title: "Loan Management",
    icon: IconBriefcase,

    children: [
      {
        id: "loans",
        title: "Loans",
        href: "/loans",
        icon: IconCash,
      },
      {
        id: "loan-products",
        title: "Loan Products",
        href: "/loan-products",
        icon: IconReceipt,
      },
      {
        id: "new-loan-product",
        title: "New Loan Product",
        href: "/loan-products/new",
        icon: IconPlus,
      },
      {
        id: "apply-loan",
        title: "Apply Loan",
        href: "/loans/apply",
        icon: IconCash,
      },
    ],
  });

  // ============================================================
  // REPORTS
  // ============================================================

  // TODO: Replace with PERMISSIONS.VIEW_REPORTS when reports module is ready
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