export interface MemberFormData {
  first_name: string;
  other_names: string;
  national_id: string;
  phone_number: string;
  email: string;
  physical_address: string;
  occupation: string;
  kra_pin: string;
  category: number | "";
}

export interface ValidationErrors {
  [key: string]: string;
}

export function validateMember(
  values: MemberFormData
): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!values.first_name.trim()) {
    errors.first_name = "First name is required.";
  }

  if (!values.other_names.trim()) {
    errors.other_names = "Other names are required.";
  }

  if (!values.national_id.trim()) {
    errors.national_id = "National ID is required.";
  }

  if (!values.phone_number.trim()) {
    errors.phone_number = "Phone number is required.";
  }

  if (!values.category) {
    errors.category = "Member category is required.";
  }

  if (
    values.email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)
  ) {
    errors.email = "Invalid email address.";
  }

  return errors;
}