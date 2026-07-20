export interface Organization {
  id: number;

  name: string;

  code: string;

  email: string;

  phone_number: string;

  physical_address: string;

  website?: string;

  logo?: string | null;

  created_at?: string;

  updated_at?: string;
}