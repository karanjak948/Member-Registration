"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Snackbar,
  Typography,
} from "@mui/material";

import memberService from "@/services/member.service";

import { Member } from "@/interfaces/member";
import { useMembers } from "@/hooks/useMembers";

import MemberToolbar from "@/components/members/MemberToolbar";
import MemberDataGrid from "@/components/members/MemberDataGrid";

import ApproveMemberDialog from "@/components/members/ApproveMemberDialog";
import RejectMemberDialog from "@/components/members/RejectMemberDialog";
import ActivateMemberDialog from "@/components/members/ActivateMemberDialog";
import DeactivateMemberDialog from "@/components/members/DeactivateMemberDialog";
import CompleteRegistrationDialog from "@/components/members/CompleteRegistrationDialog";
import DeleteMemberDialog from "@/components/members/DeleteMemberDialog";

export default function MembersPage() {
  const router = useRouter();

  const { members, loading, error, refresh } = useMembers();

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("");

  const [stageFilter, setStageFilter] = useState("");

  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // ----------------------------------------------------
  // Dialog State
  // ----------------------------------------------------

  const [approveOpen, setApproveOpen] = useState(false);

  const [rejectOpen, setRejectOpen] = useState(false);

  const [activateOpen, setActivateOpen] = useState(false);

  const [deactivateOpen, setDeactivateOpen] = useState(false);

  const [completeRegistrationOpen, setCompleteRegistrationOpen] =
    useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);

  // ----------------------------------------------------
  // Action State (for delete only)
  // ----------------------------------------------------

  const [actionLoading, setActionLoading] = useState(false);

  const [actionError, setActionError] = useState("");

  // ----------------------------------------------------
  // Snackbar
  // ----------------------------------------------------

  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const [snackbarMessage, setSnackbarMessage] = useState("");

  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success",
  );

  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // ----------------------------------------------------
  // Filtering
  // ----------------------------------------------------

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const value = search.toLowerCase();

      const matchesSearch =
        member.membership_number?.toLowerCase().includes(value) ||
        member.first_name?.toLowerCase().includes(value) ||
        member.other_names?.toLowerCase().includes(value) ||
        member.phone_number?.toLowerCase().includes(value);

      const matchesStatus = !statusFilter || member.status === statusFilter;

      const matchesStage =
        !stageFilter || member.registration_stage === stageFilter;

      return matchesSearch && matchesStatus && matchesStage;
    });
  }, [members, search, statusFilter, stageFilter]);

  // ----------------------------------------------------
  // Helpers
  // ----------------------------------------------------

  const closeDialogs = () => {
    setApproveOpen(false);
    setRejectOpen(false);
    setActivateOpen(false);
    setDeactivateOpen(false);
    setCompleteRegistrationOpen(false);
    setDeleteOpen(false);

    setSelectedMember(null);

    setActionError("");
  };

  // ----------------------------------------------------
  // Delete Handler
  // ----------------------------------------------------

  const handleDelete = async () => {
    if (!selectedMember) return;

    try {
      setActionLoading(true);
      setActionError("");

      await memberService.delete(selectedMember.id);

      await refresh();

      showSnackbar("Member deleted successfully.", "success");

      closeDialogs();
    } catch (err: any) {
      console.error(err);

      setActionError(err?.response?.data?.detail ?? "Operation failed.");

      showSnackbar("Operation failed.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // ----------------------------------------------------
  // Workflow Open Handlers
  // ----------------------------------------------------

  const openApprove = (member: Member) => {
    setSelectedMember(member);
    setApproveOpen(true);
  };

  const openReject = (member: Member) => {
    setSelectedMember(member);
    setRejectOpen(true);
  };

  const openActivate = (member: Member) => {
    setSelectedMember(member);
    setActivateOpen(true);
  };

  const openDeactivate = (member: Member) => {
    setSelectedMember(member);
    setDeactivateOpen(true);
  };

  const openCompleteRegistration = (member: Member) => {
    setSelectedMember(member);
    setCompleteRegistrationOpen(true);
  };

  const openDelete = (member: Member) => {
    setSelectedMember(member);
    setDeleteOpen(true);
  };

  return (
    <>
      <Container maxWidth={false} sx={{ mt: 3 }}>
        <Typography variant="h4" mb={3}>
          Member Management
        </Typography>

        <MemberToolbar
          search={search}
          onSearchChange={setSearch}
          status={statusFilter}
          onStatusChange={setStatusFilter}
          stage={stageFilter}
          onStageChange={setStageFilter}
          onRefresh={refresh}
        />

        <Box mt={3}>
          {loading ? (
            <Box display="flex" justifyContent="center" py={8}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : (
            <MemberDataGrid
              members={filteredMembers}
              loading={loading}
              onView={(member) => router.push(`/members/${member.id}`)}
              onEdit={(member) => router.push(`/members/${member.id}/edit`)}
              onApprove={openApprove}
              onReject={openReject}
              onActivate={openActivate}
              onDeactivate={openDeactivate}
              onCompleteRegistration={openCompleteRegistration}
              onDelete={openDelete}
            />
          )}
        </Box>
      </Container>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <Alert
          severity={snackbarSeverity}
          variant="filled"
          onClose={() => setSnackbarOpen(false)}
          sx={{
            width: "100%",
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      <ApproveMemberDialog
        open={approveOpen}
        member={selectedMember}
        loading={actionLoading}
        error={actionError}
        onClose={closeDialogs}
        onSuccess={async () => {
          await refresh();
          showSnackbar("Member approved successfully.", "success");
          closeDialogs();
        }}
      />

      <RejectMemberDialog
        open={rejectOpen}
        member={selectedMember}
        loading={actionLoading}
        error={actionError}
        onClose={closeDialogs}
        onSuccess={async () => {
          await refresh();
          showSnackbar("Member rejected successfully.", "success");
          closeDialogs();
        }}
      />

      <ActivateMemberDialog
        open={activateOpen}
        member={selectedMember}
        loading={actionLoading}
        error={actionError}
        onClose={closeDialogs}
        onSuccess={async () => {
          await refresh();
          showSnackbar("Member activated successfully.", "success");
          closeDialogs();
        }}
      />

      <DeactivateMemberDialog
        open={deactivateOpen}
        member={selectedMember}
        loading={actionLoading}
        error={actionError}
        onClose={closeDialogs}
        onSuccess={async () => {
          await refresh();
          showSnackbar("Member deactivated successfully.", "success");
          closeDialogs();
        }}
      />

      <CompleteRegistrationDialog
        open={completeRegistrationOpen}
        member={selectedMember}
        loading={actionLoading}
        error={actionError}
        onClose={closeDialogs}
        onSuccess={async () => {
          await refresh();
          showSnackbar("Registration completed successfully.", "success");
          closeDialogs();
        }}
      />

      <DeleteMemberDialog
        open={deleteOpen}
        member={selectedMember}
        loading={actionLoading}
        error={actionError}
        onClose={closeDialogs}
        onDelete={handleDelete}
      />
    </>
  );
}
