import { PERMISSIONS } from "@/constants/permissions";

export const navigation = [
  {
    id: "dashboard",
    title: "Dashboard",
    href: "/dashboard",
  },
  {
    id: "members",
    title: "Members",
    permissions: [PERMISSIONS.VIEW_MEMBERS, PERMISSIONS.CREATE_MEMBERS],
    children: [
      {
        id: "member-list",
        title: "Member List",
        href: "/members",
        permission: PERMISSIONS.VIEW_MEMBERS,
      },
      {
        id: "register-member",
        title: "Register Member",
        href: "/members/new",
        permission: PERMISSIONS.CREATE_MEMBERS,
      },
    ],
  },
  {
    id: "loans",
    title: "Loans",
    permissions: [PERMISSIONS.VIEW_LOANS, PERMISSIONS.VIEW_LOAN_PRODUCTS],
    children: [
      {
        id: "loan-products",
        title: "Loan Products",
        href: "/loan-products",
        permission: PERMISSIONS.VIEW_LOAN_PRODUCTS,
      },
      {
        id: "loan-list",
        title: "All Loans",
        href: "/loans",
        permission: PERMISSIONS.VIEW_LOANS,
      },
      {
        id: "loan-apply",
        title: "Apply Loan",
        href: "/loans/apply",
        permission: PERMISSIONS.APPLY_LOANS,
      },
    ],
  },
  {
    id: "collections",
    title: "Collections",
    permission: PERMISSIONS.VIEW_COLLECTIONS,
    href: "/collections/receive",
  },
  {
    id: "savings",
    title: "Savings",
    permissions: [PERMISSIONS.VIEW_SAVINGS, PERMISSIONS.CREATE_SAVINGS],
    children: [
      {
        id: "savings-list",
        title: "Savings Records",
        href: "/savings",
        permission: PERMISSIONS.VIEW_SAVINGS,
      },
      {
        id: "savings-new",
        title: "Record Payment",
        href: "/savings/new",
        permission: PERMISSIONS.CREATE_SAVINGS,
      },
    ],
  },
  {
    id: "shares",
    title: "Shares",
    permissions: [PERMISSIONS.VIEW_SHARES, PERMISSIONS.CREATE_SHARES],
    children: [
      {
        id: "shares-list",
        title: "Shares Register",
        href: "/shares",
        permission: PERMISSIONS.VIEW_SHARES,
      },
      {
        id: "shares-new",
        title: "Create Shares Payment",
        href: "/shares/new",
        permission: PERMISSIONS.CREATE_SHARES,
      },
    ],
  },
  {
    id: "finance",
    title: "Finance",
    permission: PERMISSIONS.VIEW_FINANCE,
    children: [
      {
        id: "finance-journals",
        title: "General Journal",
        href: "/finance/journals",
        permission: PERMISSIONS.POST_JOURNAL_ENTRY,
      },
      {
        id: "finance-ledger",
        title: "General Ledger",
        href: "/finance?tab=ledger",
        permission: PERMISSIONS.VIEW_LEDGER,
      },
    ],
  },
  {
    id: "reports",
    title: "Reports",
    permission: PERMISSIONS.VIEW_REPORTS,
    href: "/reports",
  },
  {
    id: "administration",
    title: "Administration",
    permissions: [PERMISSIONS.MANAGE_USERS, PERMISSIONS.MANAGE_ROLES],
    children: [
      {
        id: "users",
        title: "Users",
        href: "/administration/users",
        permission: PERMISSIONS.MANAGE_USERS,
      },
      {
        id: "roles",
        title: "Roles",
        href: "/administration/roles",
        permission: PERMISSIONS.MANAGE_ROLES,
      },
      {
        id: "settings",
        title: "Settings",
        href: "/settings",
        permission: PERMISSIONS.VIEW_SETTINGS,
      },
    ],
  },
];