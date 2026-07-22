import api from "@/lib/api";

import { Organization } from "@/interfaces/organization";

/**
 * Payload accepted when creating or updating
 * the authenticated user's organization.
 *
 * Server-controlled fields such as id, owner,
 * logo and timestamps are intentionally excluded.
 */
export type OrganizationUpdatePayload = Partial<
  Pick<
    Organization,
    | "name"
    | "code"
    | "email"
    | "phone_number"
    | "physical_address"
    | "website"
  >
>;

class OrganizationService {
  private readonly baseUrl = "/organization/";

  /**
   * Retrieve the organization belonging to the
   * currently authenticated user.
   *
   * If the user has not configured an organization yet,
   * the backend should return an empty organization
   * template with id = null.
   */
  async get(): Promise<Organization> {
    const response =
      await api.get<Organization>(
        this.baseUrl,
      );

    return response.data;
  }

  /**
   * Create or update the authenticated user's
   * organization.
   *
   * Backend behavior:
   *
   * - Existing organization -> update it
   * - No organization       -> create it
   *
   * Ownership must always be assigned server-side
   * from request.user.
   */
  async update(
    data: OrganizationUpdatePayload,
  ): Promise<Organization> {
    const response =
      await api.patch<Organization>(
        this.baseUrl,
        data,
      );

    return response.data;
  }

  /**
   * Upload or replace the logo belonging to the
   * authenticated user's organization.
   *
   * The organization must already exist before
   * a logo can be uploaded.
   */
  async uploadLogo(
    file: File,
  ): Promise<Organization> {
    const formData = new FormData();

    formData.append("logo", file);

    const response =
      await api.patch<Organization>(
        `${this.baseUrl}logo/`,
        formData,
      );

    return response.data;
  }

  /**
   * Remove the logo belonging to the authenticated
   * user's organization.
   */
  async removeLogo(): Promise<void> {
    await api.delete(
      `${this.baseUrl}logo/`,
    );
  }
}

const organizationService =
  new OrganizationService();

export default organizationService;