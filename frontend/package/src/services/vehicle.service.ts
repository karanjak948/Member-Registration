import api from "@/services/api";

import { Vehicle } from "@/interfaces/vehicle";

class VehicleService {
  async getAll(): Promise<Vehicle[]> {
    const { data } = await api.get<Vehicle[]>("/vehicles/");
    return data;
  }

  async getByMember(memberId: number): Promise<Vehicle | null> {
    const records = await this.getAllByMember(memberId);
    return records.length > 0 ? records[0] : null;
  }

  async getAllByMember(memberId: number): Promise<Vehicle[]> {
    const { data } = await api.get(
      `/vehicles/?member=${memberId}`
    );

    const records = Array.isArray(data)
      ? data
      : data.results ?? [];

    return records;
  }

  async create(payload: Partial<Vehicle>): Promise<Vehicle> {
    const { data } = await api.post<Vehicle>(
      "/vehicles/",
      payload
    );

    return data;
  }

  async update(
    id: number,
    payload: Partial<Vehicle>
  ): Promise<Vehicle> {
    const { data } = await api.patch<Vehicle>(
      `/vehicles/${id}/`,
      payload
    );

    return data;
  }

  async delete(id: number): Promise<void> {
    await api.delete(`/vehicles/${id}/`);
  }
}

export default new VehicleService();