import api from "@/services/api";

import { MemberCategory } from "@/interfaces/category";

class CategoryService {
  async getAll(): Promise<MemberCategory[]> {
    const response = await api.get(
      "/member-categories/"
    );

    return response.data;
  }

  async getById(
    id: number
  ): Promise<MemberCategory> {
    const response = await api.get(
      `/member-categories/${id}/`
    );

    return response.data;
  }

  async create(
    data: Partial<MemberCategory>
  ): Promise<MemberCategory> {
    const response = await api.post(
      "/member-categories/",
      data
    );

    return response.data;
  }

  async update(
    id: number,
    data: Partial<MemberCategory>
  ): Promise<MemberCategory> {
    const response = await api.put(
      `/member-categories/${id}/`,
      data
    );

    return response.data;
  }

  async delete(
    id: number
  ): Promise<void> {
    await api.delete(
      `/member-categories/${id}/`
    );
  }
}

export default new CategoryService();