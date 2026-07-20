export interface Member {
  id: number;

  membership_number: string;

  category?: {
    id: number;
    name: string;
    code: string;
  };

  first_name: string;

  other_names: string;

  national_id: string;

  phone_number: string;

  email: string;

  physical_address?: string;

  occupation?: string;

  passport_photo?: string | null;

  kra_pin?: string | null;

  status:
    | "ACTIVE"
    | "INACTIVE"
    | "SUSPENDED";

  registration_stage:
    | "DATA_CAPTURE_PENDING"
    | "APPROVED"
    | "REJECTED"
    | "ACTIVE";

  created_by?: number;

  created_at: string;

  updated_at: string;
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