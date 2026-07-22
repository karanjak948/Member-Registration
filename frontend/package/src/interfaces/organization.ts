export interface Organization {
  id: number | null;

  name: string;

  code: string;

  email: string;

  phone_number: string;

  physical_address: string;

  website: string;

  logo: string | null;

  created_at: string | null;

  updated_at: string | null;

  is_configured?: boolean;
}