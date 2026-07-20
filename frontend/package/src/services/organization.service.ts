import api from "@/lib/api";

import { Organization } from "@/interfaces/organization";

class OrganizationService {
  /**
   * Get organization profile
   */
  async get(): Promise<Organization> {
    const response = await api.get("/organization/");

    return response.data;
  }

  /**
   * Update organization details
   */
  async update(
    data: Partial<Organization>
  ): Promise<Organization> {
    const response = await api.patch(
      "/organization/",
      data
    );

    return response.data;
  }

  /**
   * Upload organization logo
   */
  async uploadLogo(
    file: File
  ): Promise<Organization> {
    const formData = new FormData();

    formData.append("logo", file);

    const response = await api.patch(
      "/organization/logo/",
      formData,
      {
        headers: {
          "Content-Type":
            "multipart/form-data",
        },
      }
    );

    return response.data;
  }

  /**
   * Remove organization logo
   */
  async removeLogo(): Promise<void> {
    await api.delete(
      "/organization/logo/"
    );
  }
}

export default new OrganizationService();