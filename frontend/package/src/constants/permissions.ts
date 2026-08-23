export const PERMISSIONS = {
  VIEW_MEMBERS: "view_members",
  CREATE_MEMBERS: "create_members",
  EDIT_MEMBERS: "edit_members",
  DELETE_MEMBERS: "delete_members",

  APPROVE_MEMBERS: "approve_members",
  REJECT_MEMBERS: "reject_members",

  ACTIVATE_MEMBERS: "activate_members",
  DEACTIVATE_MEMBERS: "deactivate_members",

  COMPLETE_REGISTRATION: "complete_registration_members",

  MANAGE_USERS: "manage_users",
  MANAGE_ROLES: "manage_roles",

  // Loan Permissions
  APPLY_LOANS: "apply_loans",
  APPROVE_LOANS: "approve_loans",
  DISBURSE_LOANS: "disburse_loans",
  REJECT_LOANS: "reject_loans",
  DELETE_LOANS: "delete_loans",
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];