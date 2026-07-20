export interface Guarantor {
  id: number;

  member: number;

  member_number: string;

  guarantor_member: number | null;

  guarantor_number: string;

  first_name: string;

  other_names: string;

  phone_number: string;

  national_id: string;

  relationship: string;

  created_at: string;

  updated_at: string;
}