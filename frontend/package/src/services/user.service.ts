import api from "@/services/api";

import {
  OrganizationUser,
  CreateOrganizationUserRequest,
  UpdateOrganizationUserRequest,
} from "@/types/user";

/**
 * Organization User Service
 *
 * Encapsulates all API interactions related to
 * organization user management.
 */
class UserService {
  /**
   * Get all users in the current organization.
   */
  async getUsers(): Promise<OrganizationUser[]> {
    const response = await api.get<OrganizationUser[]>("/users/");

    return response.data;
  }

  /**
   * Get a single organization user.
   */
  async getUser(
    id: number
  ): Promise<OrganizationUser> {
    const response =
      await api.get<OrganizationUser>(
        `/users/${id}/`
      );

    return response.data;
  }

  /**
   * Create a new organization user.
   */
  async createUser(
    payload: CreateOrganizationUserRequest
  ): Promise<OrganizationUser> {
    const response =
      await api.post<OrganizationUser>(
        "/users/",
        payload
      );

    return response.data;
  }

  /**
   * Update organization user details.
   */
  async updateUser(
    id: number,
    payload: UpdateOrganizationUserRequest
  ): Promise<OrganizationUser> {
    const response = await api.patch<OrganizationUser>(
      `/users/${id}/`,
      payload
    );

    return response.data;
  }

  /**
   * Activate a user.
   */
  async activateUser(
    id: number
  ): Promise<OrganizationUser> {
    return this.updateUser(id, {
      is_active: true,
    });
  }

  /**
   * Deactivate a user.
   */
  async deactivateUser(
    id: number
  ): Promise<OrganizationUser> {
    return this.updateUser(id, {
      is_active: false,
    });
  }

  /**
   * Delete user.
   *
   * Reserved for future implementation.
   * The current backend does not expose
   * DELETE /users/{id}/.
   */
  async deleteUser(
    id: number
  ): Promise<void> {
    throw new Error(
      "Delete user is not yet implemented by the backend."
    );
  }
}

export default new UserService();