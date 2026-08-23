import { Member } from "@/interfaces/member";

import {
  MemberState,
  RegistrationCategoryState,
} from "@/types/registration";

/**
 * Maps the API Member model into the Redux MemberState.
 *
 * This is the single source of truth for converting
 * backend member responses into frontend registration state.
 */
export function memberToState(
  member: Member
): MemberState {
  const categoryCode =
    member.category_code?.trim().toUpperCase() ||
    (member.category_name?.toLowerCase().includes("normal")
      ? "NORMAL"
      : member.category_name?.toLowerCase().includes("special")
      ? "SPECIAL"
      : member.category_name?.toLowerCase().includes("other")
      ? "OTHER"
      : member.category === 1 || String(member.category) === "1"
      ? "NORMAL"
      : "");

  const categoryDetails: RegistrationCategoryState | null =
    member.category
      ? {
          id: member.category,
          name: member.category_name,
          code: categoryCode,
        }
      : null;

  return {
    id: member.id,

    membership_number:
      member.membership_number,

    first_name:
      member.first_name,

    other_names:
      member.other_names,

    national_id:
      member.national_id,

    phone_number:
      member.phone_number,

    email:
      member.email ?? "",

    physical_address:
      member.physical_address ?? "",

    occupation:
      member.occupation ?? "",

    kra_pin:
      member.kra_pin ?? "",

    category:
      member.category ?? "",

    category_details:
      categoryDetails,

    passport_photo:
      member.passport_photo,

    status:
      member.status,

    registration_stage:
      member.registration_stage,

    created_by:
      member.created_by,

    created_by_username:
      member.created_by_username ?? "",

    created_at:
      member.created_at,

    updated_by:
      member.updated_by,

    updated_by_username:
      member.updated_by_username ?? "",

    updated_at:
      member.updated_at,

    approved_by:
      member.approved_by,

    approved_by_username:
      member.approved_by_username ?? "",

    approved_at:
      member.approved_at,

    rejected_by:
      member.rejected_by,

    rejected_by_username:
      member.rejected_by_username ?? "",

    rejected_at:
      member.rejected_at,

    activated_by:
      member.activated_by,

    activated_by_username:
      member.activated_by_username ?? "",

    activated_at:
      member.activated_at,
  };
}