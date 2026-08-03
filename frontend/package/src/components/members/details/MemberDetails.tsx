"use client";

import { useState } from "react";

import { Stack } from "@mui/material";

import { Member } from "@/interfaces/member";

import MemberProfileCard from "./MemberProfileCard";
import MemberSummaryCard from "./MemberSummaryCard";
import AuditInformation from "@/components/members/AuditInformation";
import WorkflowToolbar from "./WorkflowToolbar";

import ApproveMemberDialog from "../ApproveMemberDialog";
import RejectMemberDialog from "../RejectMemberDialog";
import ActivateMemberDialog from "../ActivateMemberDialog";
import DeactivateMemberDialog from "../DeactivateMemberDialog";
import CompleteRegistrationDialog from "../CompleteRegistrationDialog";

interface Props {
  member: Member;
  onRefresh?: () => Promise<void>;
}

export default function MemberDetails({ member, onRefresh }: Props) {
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [activateOpen, setActivateOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);

  const handleDialogSuccess = async () => {
    if (onRefresh) {
      await onRefresh();
    }
    // Close all dialogs
    setApproveOpen(false);
    setRejectOpen(false);
    setActivateOpen(false);
    setDeactivateOpen(false);
    setCompleteOpen(false);
  };

  return (
    <Stack spacing={3}>
      <WorkflowToolbar
        memberId={member.id}
        onApprove={() => setApproveOpen(true)}
        onReject={() => setRejectOpen(true)}
        onActivate={() => setActivateOpen(true)}
        onDeactivate={() => setDeactivateOpen(true)}
        onCompleteRegistration={() => setCompleteOpen(true)}
      />

      <MemberSummaryCard member={member} />

      <MemberProfileCard member={member} />

      <AuditInformation member={member} />

      {/* Workflow Dialogs */}
      <ApproveMemberDialog
        open={approveOpen}
        member={member}
        onClose={() => setApproveOpen(false)}
        onSuccess={handleDialogSuccess}
      />

      <RejectMemberDialog
        open={rejectOpen}
        member={member}
        onClose={() => setRejectOpen(false)}
        onSuccess={handleDialogSuccess}
      />

      <ActivateMemberDialog
        open={activateOpen}
        member={member}
        onClose={() => setActivateOpen(false)}
        onSuccess={handleDialogSuccess}
      />

      <DeactivateMemberDialog
        open={deactivateOpen}
        member={member}
        onClose={() => setDeactivateOpen(false)}
        onSuccess={handleDialogSuccess}
      />

      <CompleteRegistrationDialog
        open={completeOpen}
        member={member}
        onClose={() => setCompleteOpen(false)}
        onSuccess={handleDialogSuccess}
      />
    </Stack>
  );
}
