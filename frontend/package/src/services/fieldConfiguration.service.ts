import api from "@/services/api";
import { FieldConfiguration } from "@/interfaces/fieldConfiguration";

class FieldConfigurationService {
  private readonly baseUrl = "/field-configurations/";

  async getAll(categoryId?: number): Promise<FieldConfiguration[]> {
    const params = categoryId ? { category: categoryId } : {};
    const response = await api.get<FieldConfiguration[]>(this.baseUrl, { params });
    return response.data;
  }

  async getById(id: number): Promise<FieldConfiguration> {
    const response = await api.get<FieldConfiguration>(`${this.baseUrl}${id}/`);
    return response.data;
  }

  async create(data: Partial<FieldConfiguration>): Promise<FieldConfiguration> {
    const response = await api.post<FieldConfiguration>(this.baseUrl, data);
    return response.data;
  }

  async update(id: number, data: Partial<FieldConfiguration>): Promise<FieldConfiguration> {
    const response = await api.put<FieldConfiguration>(`${this.baseUrl}${id}/`, data);
    return response.data;
  }

  async patch(id: number, data: Partial<FieldConfiguration>): Promise<FieldConfiguration> {
    const response = await api.patch<FieldConfiguration>(`${this.baseUrl}${id}/`, data);
    return response.data;
  }

  async delete(id: number): Promise<void> {
    await api.delete(`${this.baseUrl}${id}/`);
  }
}

const fieldConfigurationService = new FieldConfigurationService();
export default fieldConfigurationService;
