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

  // Loan Products Permissions
  VIEW_LOAN_PRODUCTS: "view_loan_products",
  CREATE_LOAN_PRODUCTS: "create_loan_products",
  EDIT_LOAN_PRODUCTS: "edit_loan_products",
  DELETE_LOAN_PRODUCTS: "delete_loan_products",
  TOGGLE_LOAN_PRODUCTS: "toggle_loan_products",

  // Loan Permissions
  VIEW_LOANS: "view_loans",
  APPLY_LOANS: "apply_loans",
  APPROVE_LOANS: "approve_loans",
  DISBURSE_LOANS: "disburse_loans",
  REJECT_LOANS: "reject_loans",
  DELETE_LOANS: "delete_loans",

  // Collections Permissions
  VIEW_COLLECTIONS: "view_collections",
  RECEIVE_PAYMENTS: "receive_payments",
  ALLOCATE_COLLECTIONS: "allocate_collections",
  MANAGE_RECONCILIATION: "manage_reconciliation",

  // Savings / MPA Permissions
  VIEW_SAVINGS: "view_savings",
  CREATE_SAVINGS: "create_savings",
  EDIT_SAVINGS: "edit_savings",
  DELETE_SAVINGS: "delete_savings",

  // Shares Permissions
  VIEW_SHARES: "view_shares",
  CREATE_SHARES: "create_shares",
  EDIT_SHARES: "edit_shares",
  DELETE_SHARES: "delete_shares",

  // Finance & General Ledger Permissions
  VIEW_FINANCE: "view_finance",
  VIEW_LEDGER: "view_ledger",
  MANAGE_LEDGER_ACCOUNTS: "manage_ledger_accounts",
  POST_JOURNAL_ENTRY: "post_journal_entry",

  // Reports Permissions
  VIEW_REPORTS: "view_reports",
  EXPORT_REPORTS: "export_reports",
  VIEW_INCOME_REPORT: "view_income_report",
  VIEW_LOAN_BALANCES_REPORT: "view_loan_balances_report",
  VIEW_SAVINGS_BALANCES_REPORT: "view_savings_balances_report",

  // Administration Permissions
  MANAGE_USERS: "manage_users",
  MANAGE_ROLES: "manage_roles",

  // Settings Permissions
  VIEW_SETTINGS: "view_settings",
  MANAGE_SETTINGS: "manage_settings",
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];