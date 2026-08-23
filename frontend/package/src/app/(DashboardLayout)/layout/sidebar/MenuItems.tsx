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
  IconSearch,
  IconId,
  IconFileText,
  IconCoin,
  IconCalendarEvent,
  IconCertificate,
  IconBuildingBank,
  IconMessage2,
  IconChecklist,
  IconRefresh,
  IconAlertCircle,
  IconWallet,
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

export function getMenuItems(
  permissions: Permission[] = [],
  isSuperuser: boolean = false
): MenuItem[] {
  const can = (permission: Permission): boolean =>
    isSuperuser || permissions.includes(permission);

  const items: MenuItem[] = [];

  // ============================================================
  // DASHBOARD
  // ============================================================
  items.push({
    id: "dashboard",
    title: "Dashboard",
    icon: IconLayoutDashboard,
    href: "/dashboard",
  });

  // ============================================================
  // MEMBERS
  // ============================================================
  items.push({
    id: "members-menu",
    title: "Members",
    icon: IconUsers,
    children: [
      {
        id: "register-member",
        title: "Register Member",
        icon: IconUserPlus,
        href: "/members/new",
      },
      {
        id: "all-members",
        title: "All Members Directory",
        icon: IconUsers,
        href: "/members",
      },
      {
        id: "normal-members",
        title: "Normal Members",
        icon: IconUser,
        href: "/members?category=Normal%20Member",
      },
      {
        id: "special-members",
        title: "Special Members",
        icon: IconUsersGroup,
        href: "/members?category=Special%20Member",
      },
      {
        id: "other-members",
        title: "Other Members",
        icon: IconId,
        href: "/members?category=Other%20Member",
      },
    ],
  });

  // ============================================================
  // JINUE LOANS
  // ============================================================
  items.push({
    id: "jinue-loans",
    title: "Jinue Loans",
    icon: IconBriefcase,
    children: [
      {
        id: "all-loans",
        title: "All Loans Portfolio",
        icon: IconCoin,
        href: "/loans",
      },
      {
        id: "new-loan-app",
        title: "New Loan Application",
        icon: IconPlus,
        href: "/loans/apply",
      },
      {
        id: "pending-loans",
        title: "Pending Applications",
        icon: IconChecklist,
        href: "/loans?status=pending",
      },
      {
        id: "loan-approval",
        title: "Loan Approval",
        icon: IconCoin,
        href: "/loans?status=approval",
      },
      {
        id: "loan-disbursement",
        title: "Loan Disbursement",
        icon: IconCash,
        href: "/loans?status=disbursement",
      },
      {
        id: "active-loans",
        title: "Active Loans",
        icon: IconReceipt,
        href: "/loans?status=active",
      },
      {
        id: "repayment-schedule",
        title: "Weekly Repayment Schedule",
        icon: IconCalendarEvent,
        href: "/loans/schedule",
      },
      {
        id: "loan-completion",
        title: "Loan Completion",
        icon: IconCertificate,
        href: "/loans?status=completed",
      },
      {
        id: "loan-clearance",
        title: "Loan Clearance Certificate",
        icon: IconFileText,
        href: "/loans/clearance",
      },
    ],
  });

  // ============================================================
  // COLLECTIONS
  // ============================================================
  items.push({
    id: "collections",
    title: "Collections",
    icon: IconWallet,
    children: [
      {
        id: "receive-payment",
        title: "Receive Payment",
        icon: IconCash,
        href: "/collections/receive",
      },
      {
        id: "mpesa-reconciliation",
        title: "M-Pesa Reconciliation",
        icon: IconRefresh,
        href: "/collections/reconciliation",
      },
      {
        id: "repayment-allocation",
        title: "Repayment Allocation",
        icon: IconCoin,
        href: "/collections/allocation",
      },
      {
        id: "security-deposits",
        title: "Security Deposits",
        icon: IconBuildingBank,
        href: "/collections/deposits",
      },
      {
        id: "penalties",
        title: "Penalties",
        icon: IconAlertCircle,
        href: "/collections/penalties",
      },
      {
        id: "arrears-management",
        title: "Arrears Management",
        icon: IconAlertCircle,
        href: "/collections/arrears",
      },
      {
        id: "refund-security-deposit",
        title: "Refund Security Deposit",
        icon: IconWallet,
        href: "/collections/refunds",
      },
    ],
  });

  // ============================================================
  // FINANCE
  // ============================================================
  items.push({
    id: "finance",
    title: "Finance",
    icon: IconBuildingBank,
    href: "/finance",
  });

  // ============================================================
  // SMS
  // ============================================================
  items.push({
    id: "sms",
    title: "SMS",
    icon: IconMessage2,
    href: "/sms",
  });

  // ============================================================
  // REPORTS
  // ============================================================
  items.push({
    id: "reports",
    title: "Reports",
    icon: IconReportAnalytics,
    href: "/reports",
  });

  // ============================================================
  // ADMINISTRATION (Guarded by RBAC permissions)
  // ============================================================
  const adminChildren: MenuLink[] = [];

  if (can(PERMISSIONS.MANAGE_USERS)) {
    adminChildren.push({
      id: "administration-users",
      title: "Users",
      icon: IconUsersGroup,
      href: "/administration/users",
    });
  }

  if (can(PERMISSIONS.MANAGE_ROLES)) {
    adminChildren.push({
      id: "administration-roles",
      title: "Roles",
      icon: IconUserShield,
      href: "/administration/roles",
    });
  }

  if (can(PERMISSIONS.MANAGE_USERS) || can(PERMISSIONS.MANAGE_ROLES)) {
    adminChildren.push({
      id: "settings",
      title: "Settings",
      icon: IconSettings,
      href: "/settings",
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

  return items;
}

export default getMenuItems([]);