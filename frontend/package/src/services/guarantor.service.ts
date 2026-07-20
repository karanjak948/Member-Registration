import api from "@/services/api";

import { Guarantor } from "@/interfaces/guarantor";

class GuarantorService {
  async getAll(): Promise<Guarantor[]> {
    const { data } = await api.get<Guarantor[]>("/guarantors/");
    return data;
  }

  async getByMember(memberId: number): Promise<Guarantor | null> {
    const { data } = await api.get<Guarantor[]>(
      `/guarantors/?member=${memberId}`
    );

    return data.length > 0 ? data[0] : null;
  }

  async create(payload: Partial<Guarantor>): Promise<Guarantor> {
    const { data } = await api.post<Guarantor>(
      "/guarantors/",
      payload
    );

    return data;
  }

  async update(
    id: number,
    payload: Partial<Guarantor>
  ): Promise<Guarantor> {
    const { data } = await api.patch<Guarantor>(
      `/guarantors/${id}/`,
      payload
    );

    return data;
  }

  async delete(id: number): Promise<void> {
    await api.delete(`/guarantors/${id}/`);
  }
}

export default new GuarantorService();