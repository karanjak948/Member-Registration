import api from "@/services/api";

import { Member } from "@/interfaces/member";

/**
 * Organization Member Service
 *
 * Encapsulates all API interactions related to
 * organization member management and workflow.
 */
class MemberService {
  /**
   * Get all members.
   */
  async getAll(): Promise<Member[]> {
    const { data } = await api.get<Member[]>("/members/");
    return data;
  }

  /**
   * Get one member.
   */
  async getById(id: number): Promise<Member> {
    const { data } = await api.get<Member>(
      `/members/${id}/`
    );

    return data;
  }

  /**
   * Create member.
   */
  async create(member: FormData): Promise<Member> {
    try {
      const { data } = await api.post<Member>(
        "/members/",
        member
      );

      return data;
    } catch (error: any) {
      console.error("Failed to create member.");
      console.error("Status:", error.response?.status);
      console.error("Validation Errors:", error.response?.data);

      throw error;
    }
  }

  /**
   * Update member.
   */
  async update(
    id: number,
    member: FormData
  ): Promise<Member> {
    try {
      const { data } = await api.patch<Member>(
        `/members/${id}/`,
        member
      );

      return data;
    } catch (error: any) {
      console.error("Failed to update member.");
      console.error("Status:", error.response?.status);
      console.error("Validation Errors:", error.response?.data);

      throw error;
    }
  }

  /**
   * Delete member.
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/members/${id}/`);
  }

  // ==========================================================
  // MEMBER WORKFLOW
  // ==========================================================

  /**
   * Approve member.
   */
  async approve(
    id: number,
    remarks = ""
  ): Promise<Member> {
    const { data } = await api.post<Member>(
      `/members/${id}/approve/`,
      { remarks }
    );

    return data;
  }

  /**
   * Reject member.
   */
  async reject(
    id: number,
    remarks = ""
  ): Promise<Member> {
    const { data } = await api.post<Member>(
      `/members/${id}/reject/`,
      { remarks }
    );

    return data;
  }

  /**
   * Activate member.
   */
  async activate(
    id: number
  ): Promise<Member> {
    const { data } = await api.post<Member>(
      `/members/${id}/activate/`
    );

    return data;
  }

  /**
   * Deactivate member.
   */
  async deactivate(
    id: number
  ): Promise<Member> {
    const { data } = await api.post<Member>(
      `/members/${id}/deactivate/`
    );

    return data;
  }

  /**
   * Complete registration.
   *
   * Moves a member from APPROVED to ACTIVE registration stage
   * and sets status to ACTIVE.
   */
  async completeRegistration(
    id: number
  ): Promise<Member> {
    const { data } = await api.post<Member>(
      `/members/${id}/complete-registration/`
    );

    return data;
  }
}

export default new MemberService();