export interface RegistrationCategoryState {
  id: number;
  name: string;
  code: string;
}

/* =========================================================
   MEMBER
========================================================= */

export interface MemberState {
  /*
   * Null while creating.
   * Populated when editing.
   */
  id: number | null;

  membership_number: string;

  first_name: string;
  other_names: string;
  national_id: string;
  phone_number: string;
  email: string;
  physical_address: string;
  occupation: string;
  kra_pin: string;

  category: number | "";

  category_details: RegistrationCategoryState | null;

  /*
   * Existing photo:
   *     "/media/passports/abc.jpg"
   *
   * New upload:
   *     File
   */
  passport_photo: File | string | null;

  status: string;

  registration_stage: string;
}

/* =========================================================
   NEXT OF KIN
========================================================= */

export interface NextOfKinState {
  id: number | null;

  member: number | null;

  first_name: string;
  other_names: string;
  relationship: string;
  national_id: string;
  phone_number: string;
  physical_address: string;

  is_primary: boolean;
}

/* =========================================================
   VEHICLE
========================================================= */

export interface VehicleState {
  id: number | null;

  member: number | null;

  registration_number: string;
  make: string;
  model: string;

  year: number | null;

  color: string;

  engine_number: string;
  chassis_number: string;
}

/* =========================================================
   GUARANTOR
========================================================= */

export interface GuarantorState {
  id: number | null;

  member: number | null;

  first_name: string;
  other_names: string;

  national_id: string;

  phone_number: string;

  relationship: string;

  guarantor_member: number | null;
}

/* =========================================================
   REGISTRATION
========================================================= */

export interface RegistrationState {
  currentStep: number;

  member: MemberState;

  nextOfKin: NextOfKinState;

  vehicle: VehicleState;

  guarantor: GuarantorState;
}