export const PERMISSIONS = {
  // Members Permissions
  VIEW_MEMBERS: "view_members",
  CREATE_MEMBERS: "create_members",
  EDIT_MEMBERS: "edit_members",
  DELETE_MEMBERS: "delete_members",

  APPROVE_MEMBERS: "approve_members",
  REJECT_MEMBERS: "reject_members",

  ACTIVATE_MEMBERS: "activate_members",
  DEACTIVATE_MEMBERS: "deactivate_members",

  COMPLETE_REGISTRATION: "complete_registration_members",

  // Administration Permissions
  MANAGE_USERS: "manage_users",
  MANAGE_ROLES: "manage_roles",

  // Loan Permissions
  VIEW_LOANS: "view_loans",
  APPLY_LOANS: "apply_loans",
  APPROVE_LOANS: "approve_loans",
  DISBURSE_LOANS: "disburse_loans",
  REJECT_LOANS: "reject_loans",
  DELETE_LOANS: "delete_loans",

  // Finance Permissions
  VIEW_FINANCE: "view_finance",
  VIEW_LEDGER: "view_ledger",
  MANAGE_LEDGER_ACCOUNTS: "manage_ledger_accounts",
  POST_JOURNAL_ENTRY: "post_journal_entry",

  // Savings / MPA Permissions
  VIEW_SAVINGS: "view_savings",
  CREATE_SAVINGS: "create_savings",
  EDIT_SAVINGS: "edit_savings",
  DELETE_SAVINGS: "delete_savings",
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];