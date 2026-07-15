import api from "@/services/api";

import {
  Member,
  CreateMemberRequest,
  UpdateMemberRequest,
} from "@/interfaces/member";

class MemberService {
  async getAll(): Promise<Member[]> {
    const { data } = await api.get<Member[]>("/members/");
    return data;
  }

  async getById(id: number): Promise<Member> {
    const { data } = await api.get<Member>(
      `/members/${id}/`
    );

    return data;
  }

  async create(
    member: CreateMemberRequest
  ): Promise<Member> {
    const { data } = await api.post<Member>(
      "/members/",
      member
    );

    return data;
  }

  async update(
    id: number,
    member: UpdateMemberRequest
  ): Promise<Member> {
    const { data } = await api.patch<Member>(
      `/members/${id}/`,
      member
    );

    return data;
  }

  async delete(id: number): Promise<void> {
    await api.delete(`/members/${id}/`);
  }

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

  async activate(id: number): Promise<Member> {
    const { data } = await api.post<Member>(
      `/members/${id}/activate/`
    );

    return data;
  }

  async deactivate(id: number): Promise<Member> {
    const { data } = await api.post<Member>(
      `/members/${id}/deactivate/`
    );

    return data;
  }

  async convert(id: number): Promise<Member> {
    const { data } = await api.post<Member>(
      `/members/${id}/convert/`
    );

    return data;
  }
}

export default new MemberService();