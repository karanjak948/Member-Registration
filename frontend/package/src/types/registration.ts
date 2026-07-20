export interface MemberState {
  first_name: string;
  other_names: string;
  national_id: string;
  phone_number: string;
  email: string;
  physical_address: string;
  occupation: string;
  kra_pin: string;
  category: number | "";
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