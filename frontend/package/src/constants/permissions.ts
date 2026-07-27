export const PERMISSIONS = {
  VIEW_MEMBERS: "view_members",
  CREATE_MEMBERS: "create_members",
  EDIT_MEMBERS: "edit_members",
  DELETE_MEMBERS: "delete_members",

  APPROVE_MEMBERS: "approve_members",

  ACTIVATE_MEMBERS: "activate_members",
  DEACTIVATE_MEMBERS: "deactivate_members",

  MANAGE_USERS: "manage_users",
  MANAGE_ROLES: "manage_roles",
} as const;

export type Permission =
  (typeof PERMISSIONS)[keyof typeof PERMISSIONS];