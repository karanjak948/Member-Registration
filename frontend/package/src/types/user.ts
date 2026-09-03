// ============================================================
// PERMISSIONS
// ============================================================

export interface Permission {
  id: number;
  code: string;
  name: string;
  description: string;
  module?: string;
}

// ============================================================
// ROLE
// ============================================================

export interface RoleSummary {
  id: number;
  name: string;
  description: string;
  is_system_role: boolean;
}

// ============================================================
// ORGANIZATION USER
// ============================================================

export interface OrganizationUser {
  id: number;

  user_id: number;

  username: string;

  email: string;

  first_name: string;

  last_name: string;

  role: RoleSummary;

  permissions: Permission[];

  is_active: boolean;

  created_at: string;

  updated_at: string;
}

// ============================================================
// CREATE USER REQUEST
// ============================================================

export interface CreateOrganizationUserRequest {
  username: string;

  email: string;

  first_name: string;

  last_name: string;

  password: string;

  confirm_password: string;

  role_id: number;
}

// ============================================================
// UPDATE USER REQUEST
// ============================================================

export interface UpdateOrganizationUserRequest {
  first_name?: string;

  last_name?: string;

  email?: string;

  role_id?: number;

  is_active?: boolean;

  password?: string;
}