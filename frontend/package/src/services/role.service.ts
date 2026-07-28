import api from "@/services/api";

import {
  Role,
  CreateRoleRequest,
  UpdateRoleRequest,
} from "@/types/role";
import { Permission } from "@/types/role";

/**
 * Organization Role Service
 *
 * Encapsulates all API interactions related
 * to organization role management.
 */
class RoleService {
  /**
   * Get all roles.
   */
  async getRoles(): Promise<Role[]> {
    const response = await api.get("/roles/");

    return response.data as Role[];
  }

  /**
   * Get one role.
   */
  async getRole(
    id: number
  ): Promise<Role> {
    const response =
      await api.get<Role>(
        `/roles/${id}/`
      );

    return response.data;
  }

  /**
   * Create role.
   */
  async createRole(
    payload: CreateRoleRequest
  ): Promise<Role> {
    const response =
      await api.post<Role>(
        "/roles/",
        payload
      );

    return response.data;
  }

  /**
   * Update role.
   */
  async updateRole(
    id: number,
    payload: UpdateRoleRequest
  ): Promise<Role> {
    const response =
      await api.patch<Role>(
        `/roles/${id}/`,
        payload
      );

    return response.data;
  }

  /**
   * Delete role.
   */
  async deleteRole(
    id: number
  ): Promise<void> {
    await api.delete(
      `/roles/${id}/`
    );
  }

  /**
   * Get all permissions.
   */
  async getPermissions(): Promise<Permission[]> {
    const response = await api.get("/permissions/");

    // Handle both array and paginated responses
    const data = Array.isArray(response.data)
      ? response.data
      : (response.data?.results ?? []);

    return data as Permission[];
  }
}

export default new RoleService();