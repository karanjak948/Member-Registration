"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Grid,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";

import {
  IconUsers,
  IconUserCheck,
  IconUserX,
  IconClockHour4,
  IconCategory,
  IconFilter,
  IconX,
} from "@tabler/icons-react";

import memberService from "@/services/member.service";
import { Member } from "@/interfaces/member";
import { useMembers } from "@/hooks/useMembers";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/constants/permissions";

import MemberToolbar from "@/components/members/MemberToolbar";
import MemberDataGrid from "@/components/members/MemberDataGrid";

import ApproveMemberDialog from "@/components/members/ApproveMemberDialog";
import RejectMemberDialog from "@/components/members/RejectMemberDialog";
import ActivateMemberDialog from "@/components/members/ActivateMemberDialog";
import DeactivateMemberDialog from "@/components/members/DeactivateMemberDialog";
import CompleteRegistrationDialog from "@/components/members/CompleteRegistrationDialog";
import DeleteMemberDialog from "@/components/members/DeleteMemberDialog";
import BulkActivateMembersDialog from "@/components/members/BulkActivateMembersDialog";
import BulkDeactivateMembersDialog from "@/components/members/BulkDeactivateMembersDialog";

export default function MembersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { can } = usePermissions();

  const { members, loading, error, refresh } = useMembers();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedRowIds, setSelectedRowIds] = useState<number[]>([]);

  // Sync category filter from URL search params on mount or param change
  useEffect(() => {
    const categoryParam = searchParams.get("category") || searchParams.get("type");
    if (categoryParam) {
      if (categoryParam.toLowerCase().includes("normal")) {
        setCategoryFilter("Normal Member");
      } else if (categoryParam.toLowerCase().includes("special")) {
        setCategoryFilter("Special Member");
      } else if (categoryParam.toLowerCase().includes("other")) {
        setCategoryFilter("Other Member");
      } else {
        setCategoryFilter(categoryParam);
      }
    } else {
      setCategoryFilter("");
    }
  }, [searchParams]);

  // Quick stats
  const totalCount = members.length;
  const activeCount = members.filter((m) => m.status === "ACTIVE").length;
  const pendingCount = members.filter(
    (m) => m.registration_stage === "DATA_CAPTURE_PENDING",
  ).length;

  // ----------------------------------------------------
  // Dialog State
  // ----------------------------------------------------

  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [activateOpen, setActivateOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [completeRegistrationOpen, setCompleteRegistrationOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [bulkActivateOpen, setBulkActivateOpen] = useState(false);
  const [bulkDeactivateOpen, setBulkDeactivateOpen] = useState(false);

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
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");

  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Selected Members object list
  const selectedMembers = useMemo(() => {
    return members.filter((m) => selectedRowIds.includes(m.id));
  }, [members, selectedRowIds]);

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

      const matchesCategory =
        !categoryFilter ||
        member.category_name?.toLowerCase().includes(categoryFilter.toLowerCase()) ||
        (categoryFilter.toLowerCase().includes("normal") &&
          (member.category_name?.toLowerCase().includes("normal") || !member.category_name)) ||
        (categoryFilter.toLowerCase().includes("special") &&
          member.category_name?.toLowerCase().includes("special")) ||
        (categoryFilter.toLowerCase().includes("other") &&
          member.category_name?.toLowerCase().includes("other"));

      return matchesSearch && matchesStatus && matchesStage && matchesCategory;
    });
  }, [members, search, statusFilter, stageFilter, categoryFilter]);

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
    setBulkActivateOpen(false);
    setBulkDeactivateOpen(false);

    setSelectedMember(null);
    setActionError("");
  };

  // ----------------------------------------------------
  // Delete Handler
  // ----------------------------------------------------

  const handleDelete = async () => {
    if (!selectedMember) return;

    setActionLoading(true);
    setActionError("");

    try {
      await memberService.delete(selectedMember.id);
      await refresh();
      showSnackbar("Member deleted successfully.", "success");
      closeDialogs();
    } catch (err: any) {
      console.error(err);
      setActionError(
        err?.response?.data?.detail ??
          err?.message ??
          "Failed to delete member.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ----------------------------------------------------
  // Dialog Openers
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
      <Container maxWidth={false} sx={{ mt: 2, mb: 5 }}>
        {/* Executive Header Banner */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3 },
            mb: 3,
            borderRadius: 3,
            border: "1px solid #10b981",
            background: "linear-gradient(135deg, #064e3b 0%, #047857 50%, #059669 100%)",
            color: "#ffffff",
            boxShadow: "0 8px 24px rgba(6, 78, 59, 0.25)",
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "center" }}
            spacing={2}
          >
            <Box>
              <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: "-0.5px", color: "#ffffff" }}>
                Member Management &amp; Directory
              </Typography>
              <Typography variant="body2" sx={{ color: "#d1fae5", mt: 0.5, fontWeight: 500 }}>
                Manage, search, and verify registered SACCO members, membership tiers, and KYC profiles
              </Typography>
            </Box>

            {/* Quick Stat Badges */}
            <Stack direction="row" spacing={1.5} flexWrap="wrap">
              <Box
                sx={{
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  bgcolor: "rgba(255, 255, 255, 0.15)",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  backdropFilter: "blur(6px)",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <IconUsers size={18} color="#d1fae5" />
                <Typography variant="caption" sx={{ color: "#ffffff", fontWeight: 800 }}>
                  {totalCount} Total Members
                </Typography>
              </Box>

              <Box
                sx={{
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  bgcolor: "rgba(16, 185, 129, 0.3)",
                  border: "1px solid rgba(167, 243, 208, 0.4)",
                  backdropFilter: "blur(6px)",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <IconUserCheck size={18} color="#a7f3d0" />
                <Typography variant="caption" sx={{ color: "#ffffff", fontWeight: 800 }}>
                  {activeCount} Active
                </Typography>
              </Box>

              {pendingCount > 0 && (
                <Box
                  sx={{
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    bgcolor: "rgba(245, 158, 11, 0.3)",
                    border: "1px solid rgba(253, 230, 138, 0.4)",
                    backdropFilter: "blur(6px)",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <IconClockHour4 size={18} color="#fde68a" />
                  <Typography variant="caption" sx={{ color: "#ffffff", fontWeight: 800 }}>
                    {pendingCount} Pending Capture
                  </Typography>
                </Box>
              )}
            </Stack>
          </Stack>
        </Paper>

        <MemberToolbar
          search={search}
          onSearchChange={setSearch}
          status={statusFilter}
          onStatusChange={setStatusFilter}
          stage={stageFilter}
          onStageChange={setStageFilter}
          category={categoryFilter}
          onCategoryChange={setCategoryFilter}
          onRefresh={refresh}
          members={filteredMembers}
        />

        {categoryFilter && (
          <Box mb={2}>
            <Chip
              icon={<IconFilter size={16} />}
              label={`Filter Active: ${categoryFilter} (${filteredMembers.length} members)`}
              color="success"
              onDelete={() => setCategoryFilter("")}
              sx={{ fontWeight: 700, borderRadius: 2 }}
            />
          </Box>
        )}

        {/* Bulk Action Toolbar */}
        {selectedRowIds.length > 0 && (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 2,
              borderRadius: 2.5,
              background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 1.5,
              boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.35)",
              border: "1px solid #334155",
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: 2,
                  bgcolor: "rgba(16, 185, 129, 0.2)",
                  border: "1px solid rgba(16, 185, 129, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#34d399",
                }}
              >
                <IconUsers size={20} />
              </Box>
              <Box>
                <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#f8fafc" }}>
                  {selectedRowIds.length} {selectedRowIds.length === 1 ? "member" : "members"} selected
                </Typography>
                <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 600 }}>
                  Choose a batch action to apply across all selected accounts
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
              {can(PERMISSIONS.ACTIVATE_MEMBERS) && (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<IconUserCheck size={18} />}
                  onClick={() => setBulkActivateOpen(true)}
                  sx={{
                    bgcolor: "#059669",
                    color: "#ffffff",
                    fontWeight: 800,
                    borderRadius: 2,
                    px: 2,
                    py: 0.75,
                    boxShadow: "0 4px 12px rgba(5, 150, 105, 0.3)",
                    "&:hover": { bgcolor: "#047857" },
                  }}
                >
                  Bulk Activate
                </Button>
              )}

              {can(PERMISSIONS.DEACTIVATE_MEMBERS) && (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<IconUserX size={18} />}
                  onClick={() => setBulkDeactivateOpen(true)}
                  sx={{
                    bgcolor: "#b45309",
                    color: "#ffffff",
                    fontWeight: 800,
                    borderRadius: 2,
                    px: 2,
                    py: 0.75,
                    boxShadow: "0 4px 12px rgba(180, 83, 9, 0.3)",
                    "&:hover": { bgcolor: "#92400e" },
                  }}
                >
                  Bulk Deactivate
                </Button>
              )}

              <Button
                variant="outlined"
                size="small"
                startIcon={<IconX size={16} />}
                onClick={() => setSelectedRowIds([])}
                sx={{
                  color: "#cbd5e1",
                  borderColor: "#475569",
                  fontWeight: 700,
                  borderRadius: 2,
                  "&:hover": { borderColor: "#94a3b8", bgcolor: "rgba(255, 255, 255, 0.05)" },
                }}
              >
                Clear Selection
              </Button>
            </Stack>
          </Paper>
        )}

        <Box>
          {loading ? (
            <Box display="flex" justifyContent="center" py={8}>
              <CircularProgress color="success" />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ borderRadius: 2, fontWeight: 600 }}>{error}</Alert>
          ) : (
            <MemberDataGrid
              members={filteredMembers}
              loading={loading}
              selectedRowIds={selectedRowIds}
              onSelectionChange={setSelectedRowIds}
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
            borderRadius: 2,
            fontWeight: 700,
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

      <BulkActivateMembersDialog
        open={bulkActivateOpen}
        selectedMembers={selectedMembers}
        onClose={closeDialogs}
        onSuccess={async (activatedCount, skippedCount) => {
          setSelectedRowIds([]);
          await refresh();
          const message =
            skippedCount > 0
              ? `Successfully activated ${activatedCount} member(s). ${skippedCount} skipped.`
              : `Successfully activated ${activatedCount} member(s).`;
          showSnackbar(message, "success");
          closeDialogs();
        }}
      />

      <BulkDeactivateMembersDialog
        open={bulkDeactivateOpen}
        selectedMembers={selectedMembers}
        onClose={closeDialogs}
        onSuccess={async (deactivatedCount) => {
          setSelectedRowIds([]);
          await refresh();
          showSnackbar(
            `Successfully deactivated ${deactivatedCount} member(s).`,
            "success",
          );
          closeDialogs();
        }}
      />
    </>
  );
}

