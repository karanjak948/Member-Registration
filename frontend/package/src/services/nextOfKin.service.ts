import api from "@/services/api";

import { NextOfKin } from "@/interfaces/nextOfKin";

class NextOfKinService {
  async getAll(): Promise<NextOfKin[]> {
    const { data } = await api.get<NextOfKin[]>("/next-of-kin/");
    return data;
  }

  async getByMember(memberId: number): Promise<NextOfKin | null> {
    const { data } = await api.get<NextOfKin[]>(
      `/next-of-kin/?member=${memberId}`
    );

    return data.length > 0 ? data[0] : null;
  }

  async create(payload: Partial<NextOfKin>): Promise<NextOfKin> {
    const { data } = await api.post<NextOfKin>(
      "/next-of-kin/",
      payload
    );

    return data;
  }

  async update(
    id: number,
    payload: Partial<NextOfKin>
  ): Promise<NextOfKin> {
    const { data } = await api.patch<NextOfKin>(
      `/next-of-kin/${id}/`,
      payload
    );

    return data;
  }

  async delete(id: number): Promise<void> {
    await api.delete(`/next-of-kin/${id}/`);
  }
}

export default new NextOfKinService();