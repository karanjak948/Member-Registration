export interface Member {
  id: number;

  membership_number: string;

  organization: number;

  organization_name: string;

  category: number | null;

  category_name: string;

  first_name: string;

  other_names: string;

  national_id: string;

  phone_number: string;

  email: string | null;

  physical_address: string;

  occupation: string;

  passport_photo: string | null;

  kra_pin: string | null;

  status:
    | "ACTIVE"
    | "INACTIVE"
    | "SUSPENDED";

  registration_stage:
    | "DATA_CAPTURE_PENDING"
    | "APPROVED"
    | "REJECTED"
    | "ACTIVE";

  // Audit fields
  created_by: number | null;
  created_by_username: string | null;
  created_at: string | null;

  updated_by: number | null;
  updated_by_username: string | null;
  updated_at: string | null;

  approved_by: number | null;
  approved_by_username: string | null;
  approved_at: string | null;

  rejected_by: number | null;
  rejected_by_username: string | null;
  rejected_at: string | null;

  activated_by: number | null;
  activated_by_username: string | null;
  activated_at: string | null;
}

export interface CreateMemberRequest {
  category?: number;

  first_name: string;

  other_names: string;

  national_id: string;

  phone_number: string;

  email?: string;

  physical_address?: string;

  occupation?: string;

  kra_pin?: string;
}

export interface UpdateMemberRequest
  extends Partial<CreateMemberRequest> {}