"use client";

import { useMemo, useState } from "react";

import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Typography,
} from "@mui/material";

import { Member } from "@/interfaces/member";
import { useMembers } from "@/hooks/useMembers";

import MemberToolbar from "@/components/members/MemberToolbar";
import MemberDataGrid from "@/components/members/MemberDataGrid";
import DeleteMemberDialog from "@/components/members/DeleteMemberDialog";

export default function MembersPage() {
  const {
    members,
    loading,
    error,
    refresh,
  } = useMembers();

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState("");

  const [stageFilter, setStageFilter] =
    useState("");

  const [selectedMember, setSelectedMember] =
    useState<Member | null>(null);

  const [deleteOpen, setDeleteOpen] =
    useState(false);

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const searchValue = search.toLowerCase();

      const matchesSearch =
        member.membership_number
          ?.toLowerCase()
          .includes(searchValue) ||
        member.first_name
          ?.toLowerCase()
          .includes(searchValue) ||
        member.other_names
          ?.toLowerCase()
          .includes(searchValue) ||
        member.phone_number
          ?.toLowerCase()
          .includes(searchValue);

      const matchesStatus =
        !statusFilter ||
        member.status === statusFilter;

      const matchesStage =
        !stageFilter ||
        member.registration_stage === stageFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesStage
      );
    });
  }, [
    members,
    search,
    statusFilter,
    stageFilter,
  ]);

  const handleDelete = (
    member: Member
  ) => {
    setSelectedMember(member);
    setDeleteOpen(true);
  };

  return (
    <Container
      maxWidth={false}
      sx={{ mt: 3 }}
    >
      <Typography
        variant="h4"
        mb={3}
      >
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
          <Box
            display="flex"
            justifyContent="center"
            py={8}
          >
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">
            {error}
          </Alert>
        ) : (
          <MemberDataGrid
            members={filteredMembers}
            onDelete={handleDelete}
            onRefresh={refresh}
          />
        )}
      </Box>

      <DeleteMemberDialog
        open={deleteOpen}
        member={selectedMember}
        onClose={() => {
          setDeleteOpen(false);
          setSelectedMember(null);
        }}
        onDeleted={refresh}
      />
    </Container>
  );
}