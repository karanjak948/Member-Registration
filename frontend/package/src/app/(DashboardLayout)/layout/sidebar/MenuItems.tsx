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
  IconPigMoney,
  IconBook2,
  IconCoins,
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
  isSuperuserOrAdmin: boolean = false
): MenuItem[] {
  const can = (permission: Permission): boolean =>
    isSuperuserOrAdmin || permissions.includes(permission);

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
  const memberChildren: MenuLink[] = [];
  if (can(PERMISSIONS.CREATE_MEMBERS)) {
    memberChildren.push({
      id: "register-member",
      title: "Register Member",
      icon: IconUserPlus,
      href: "/members/new",
    });
  }
  if (can(PERMISSIONS.VIEW_MEMBERS)) {
    memberChildren.push(
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
        id: "other-guarantors",
        title: "Other Guarantors",
        icon: IconId,
        href: "/members?category=Other%20Guarantors",
      }
    );
  }
  if (memberChildren.length > 0) {
    items.push({
      id: "members-menu",
      title: "Members",
      icon: IconUsers,
      children: memberChildren,
    });
  }

  // ============================================================
  // JINUE LOANS
  // ============================================================
  const loanChildren: MenuLink[] = [];
  if (can(PERMISSIONS.VIEW_LOAN_PRODUCTS)) {
    loanChildren.push({
      id: "loan-products-tier",
      title: "Loan Products & Tiers",
      icon: IconSettings,
      href: "/loan-products",
    });
  }
  if (can(PERMISSIONS.CREATE_LOAN_PRODUCTS)) {
    loanChildren.push({
      id: "new-loan-product",
      title: "Create Loan Product",
      icon: IconPlus,
      href: "/loan-products/new",
    });
  }
  if (can(PERMISSIONS.VIEW_LOANS)) {
    loanChildren.push({
      id: "all-loans",
      title: "All Loans Portfolio",
      icon: IconCoin,
      href: "/loans",
    });
  }
  if (can(PERMISSIONS.APPLY_LOANS)) {
    loanChildren.push({
      id: "new-loan-app",
      title: "New Loan Application",
      icon: IconPlus,
      href: "/loans/apply",
    });
  }
  if (can(PERMISSIONS.VIEW_LOANS)) {
    loanChildren.push({
      id: "pending-loans",
      title: "Pending Applications",
      icon: IconChecklist,
      href: "/loans?status=pending",
    });
  }
  if (can(PERMISSIONS.APPROVE_LOANS)) {
    loanChildren.push({
      id: "loan-approval",
      title: "Loan Approval",
      icon: IconCoin,
      href: "/loans?status=approval",
    });
  }
  if (can(PERMISSIONS.DISBURSE_LOANS)) {
    loanChildren.push({
      id: "loan-disbursement",
      title: "Loan Disbursement",
      icon: IconCash,
      href: "/loans?status=disbursement",
    });
  }
  if (can(PERMISSIONS.VIEW_LOANS)) {
    loanChildren.push(
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
      }
    );
  }
  if (loanChildren.length > 0) {
    items.push({
      id: "jinue-loans",
      title: "Jinue Loans",
      icon: IconBriefcase,
      children: loanChildren,
    });
  }

  // ============================================================
  // COLLECTIONS
  // ============================================================
  if (can(PERMISSIONS.VIEW_COLLECTIONS)) {
    items.push({
      id: "collections",
      title: "Collections",
      icon: IconWallet,
      children: [
        {
          id: "receive-payment",
          title: "Receive Collections",
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
  }

  // ============================================================
  // MPA (Member Personal Account / Savings)
  // ============================================================
  const savingsChildren: MenuLink[] = [];
  if (can(PERMISSIONS.VIEW_SAVINGS)) {
    savingsChildren.push({
      id: "savings-payments",
      title: "Savings Payments",
      icon: IconCoin,
      href: "/savings",
    });
  }
  if (can(PERMISSIONS.CREATE_SAVINGS)) {
    savingsChildren.push({
      id: "new-savings-payment",
      title: "New Payment Entry",
      icon: IconPlus,
      href: "/savings/new",
    });
  }
  if (savingsChildren.length > 0) {
    items.push({
      id: "mpa",
      title: "MPA",
      icon: IconPigMoney,
      href: "/savings",
      children: savingsChildren,
    });
  }

  // ============================================================
  // SHARES CAPITAL
  // ============================================================
  const sharesChildren: MenuLink[] = [];
  if (can(PERMISSIONS.VIEW_SHARES)) {
    sharesChildren.push({
      id: "shares-register",
      title: "Shares Register",
      icon: IconCoins,
      href: "/shares",
    });
  }
  if (can(PERMISSIONS.CREATE_SHARES)) {
    sharesChildren.push({
      id: "new-share-payment",
      title: "Create Shares Payment",
      icon: IconPlus,
      href: "/shares/new",
    });
  }
  if (sharesChildren.length > 0) {
    items.push({
      id: "shares",
      title: "Shares",
      icon: IconCoins,
      href: "/shares",
      children: sharesChildren,
    });
  }

  // ============================================================
  // FINANCE
  // ============================================================
  if (can(PERMISSIONS.VIEW_FINANCE)) {
    const financeChildren: MenuLink[] = [];
    if (can(PERMISSIONS.VIEW_LEDGER)) {
      financeChildren.push({
        id: "finance-ledger",
        title: "Ledger",
        icon: IconBook2,
        href: "/finance?tab=ledger",
      });
    }
    if (can(PERMISSIONS.POST_JOURNAL_ENTRY) || can(PERMISSIONS.VIEW_FINANCE)) {
      financeChildren.push({
        id: "finance-journals",
        title: "General Journal Entries",
        icon: IconReceipt,
        href: "/finance/journals",
      });
    }
    if (can(PERMISSIONS.MANAGE_LEDGER_ACCOUNTS) || can(PERMISSIONS.VIEW_FINANCE)) {
      financeChildren.push({
        id: "finance-accounts",
        title: "Ledger Accounts",
        icon: IconReceipt,
        href: "/finance?tab=accounts",
      });
    }
    financeChildren.push(
      {
        id: "finance-audit",
        title: "Audit Log",
        icon: IconSearch,
        href: "/finance?tab=audit",
      },
      {
        id: "finance-income-report",
        title: "Fee & Income Report",
        icon: IconCoin,
        href: "/finance?tab=income-report",
      }
    );
    items.push({
      id: "finance",
      title: "Finance",
      icon: IconBuildingBank,
      href: "/finance",
      children: financeChildren,
    });
  }

  // ============================================================
  // SMS
  // ============================================================
  if (can(PERMISSIONS.VIEW_MEMBERS)) {
    items.push({
      id: "sms",
      title: "SMS",
      icon: IconMessage2,
      href: "/sms",
    });
  }

  // ============================================================
  // REPORTS
  // ============================================================
  if (can(PERMISSIONS.VIEW_REPORTS)) {
    const reportChildren: MenuLink[] = [
      {
        id: "reports-overview",
        title: "Portfolio & Analytics",
        icon: IconReportAnalytics,
        href: "/reports?tab=performance",
      },
    ];
    if (can(PERMISSIONS.VIEW_INCOME_REPORT) || can(PERMISSIONS.VIEW_REPORTS)) {
      reportChildren.push({
        id: "reports-income",
        title: "Fee & Income Report",
        icon: IconCoin,
        href: "/reports?tab=income",
      });
    }
    if (can(PERMISSIONS.VIEW_LOAN_BALANCES_REPORT) || can(PERMISSIONS.VIEW_REPORTS)) {
      reportChildren.push({
        id: "reports-loan-balances",
        title: "Loan Balances Report",
        icon: IconCash,
        href: "/reports?tab=loans",
      });
    }
    if (can(PERMISSIONS.VIEW_SAVINGS_BALANCES_REPORT) || can(PERMISSIONS.VIEW_REPORTS)) {
      reportChildren.push({
        id: "reports-savings-balances",
        title: "Savings Balances Report",
        icon: IconPigMoney,
        href: "/reports?tab=savings",
      });
    }
    reportChildren.push({
      id: "reports-mpesa",
      title: "M-Pesa Transaction Logs",
      icon: IconReceipt,
      href: "/reports?tab=mpesa",
    });

    items.push({
      id: "reports",
      title: "Reports",
      icon: IconReportAnalytics,
      href: "/reports",
      children: reportChildren,
    });
  }

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

  if (can(PERMISSIONS.VIEW_SETTINGS) || can(PERMISSIONS.MANAGE_SETTINGS) || can(PERMISSIONS.MANAGE_USERS)) {
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