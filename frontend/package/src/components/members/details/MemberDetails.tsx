import { Stack } from "@mui/material";

import { Member } from "@/interfaces/member";

import MemberProfileCard from "./MemberProfileCard";
import MemberSummaryCard from "./MemberSummaryCard";
import AuditInformation from "@/components/members/AuditInformation";

interface Props {
  member: Member;
}

export default function MemberDetails({
  member,
}: Props) {
  return (
    <Stack spacing={3}>
      <MemberSummaryCard
        member={member}
      />

      <MemberProfileCard
        member={member}
      />

      <AuditInformation
        member={member}
      />
    </Stack>
  );
}