export interface RegistrationCategoryState {
  id: number;
  name: string;
  code: string;
}

export interface MemberState {
  first_name: string;
  other_names: string;
  national_id: string;
  phone_number: string;
  email: string;
  physical_address: string;
  occupation: string;
  kra_pin: string;

  /*
   * Foreign-key value submitted to Django.
   */
  category: number | "";

  /*
   * Category metadata used by the registration workflow.
   *
   * This avoids fragile logic based on database IDs or
   * display names.
   */
  category_details: RegistrationCategoryState | null;

  passport_photo: File | null;
}

export interface NextOfKinState {
  first_name: string;
  other_names: string;
  relationship: string;
  national_id: string;
  phone_number: string;
  physical_address: string;
  is_primary: boolean;
}

export interface VehicleState {
  registration_number: string;
  make: string;
  model: string;
  year: number | null;
  color: string;
  engine_number: string;
  chassis_number: string;
}

export interface GuarantorState {
  first_name: string;
  other_names: string;
  national_id: string;
  phone_number: string;
  relationship: string;
  guarantor_member: number | null;
}

export interface RegistrationState {
  currentStep: number;

  member: MemberState;

  nextOfKin: NextOfKinState;

  vehicle: VehicleState;

  guarantor: GuarantorState;
}