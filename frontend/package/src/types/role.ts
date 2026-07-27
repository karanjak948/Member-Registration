// ============================================================
// PERMISSION
// ============================================================

export interface Permission {
  id: number;

  code: string;

  name: string;

  description: string;
}

// ============================================================
// ROLE
// ============================================================

export interface Role {
  id: number;

  name: string;

  description: string;

  is_system_role: boolean;

  permissions: Permission[];

  created_at: string;

  updated_at: string;
}

// ============================================================
// CREATE ROLE
// ============================================================

export interface CreateRoleRequest {
  name: string;

  description: string;

  permission_ids: number[];
}

// ============================================================
// UPDATE ROLE
// ============================================================

export interface UpdateRoleRequest {
  name?: string;

  description?: string;

  permission_ids?: number[];
}