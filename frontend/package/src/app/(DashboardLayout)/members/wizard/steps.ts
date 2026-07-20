export const EDIT_MEMBER_STEPS = [
  "Member Details",
  "Next of Kin",
  "Vehicle Details",
  "Guarantor",
  "Review Changes",
] as const;

export type EditMemberStep =
  (typeof EDIT_MEMBER_STEPS)[number];

export interface MemberWizardData {
  member: {
    first_name: string;
    other_names: string;
    national_id: string;
    phone_number: string;
    email: string;
    physical_address: string;
    occupation: string;
    kra_pin: string;
    category: number | "";
    passport_photo: File | string | null;
  };

  nextOfKin: {
    id?: number;
    first_name: string;
    other_names: string;
    relationship: string;
    national_id: string;
    phone_number: string;
    physical_address: string;
    is_primary: boolean;
  };

  vehicle: {
    id?: number;
    registration_number: string;
    make: string;
    model: string;
    year: number | null;
    color: string;
    engine_number: string;
    chassis_number: string;
  };

  guarantor: {
    id?: number;
    first_name: string;
    other_names: string;
    national_id: string;
    phone_number: string;
    relationship: string;
    guarantor_member: number | null;
  };
}