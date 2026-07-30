"use client";

import { useParams } from "next/navigation";

import RegistrationWizard from "@/components/members/wizard/RegistrationWizard";

export default function EditMemberPage() {
  const params = useParams();

  const memberId = Number(params.id);

  return (
    <RegistrationWizard
      mode="edit"
      memberId={memberId}
    />
  );
}