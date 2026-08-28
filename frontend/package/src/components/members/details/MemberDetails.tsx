"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from "@mui/material";
import {
  IconArrowLeft,
  IconEdit,
  IconUser,
  IconHeartHandshake,
  IconCar,
  IconShieldCheck,
  IconHistory,
  IconIdBadge2,
  IconPhone,
  IconMail,
  IconMapPin,
  IconBriefcase,
  IconReceiptTax,
  IconBuildingCommunity,
} from "@tabler/icons-react";

import { Member } from "@/interfaces/member";
import { NextOfKin } from "@/interfaces/nextOfKin";
import { Vehicle } from "@/interfaces/vehicle";
import { Guarantor } from "@/interfaces/guarantor";

import nextOfKinService from "@/services/nextOfKin.service";
import vehicleService from "@/services/vehicle.service";
import guarantorService from "@/services/guarantor.service";
import memberService from "@/services/member.service";
import { getMediaUrl } from "@/utils/media";

import MemberProfileCard from "./MemberProfileCard";
import MemberSummaryCard from "./MemberSummaryCard";
import AuditInformation from "@/components/members/AuditInformation";
import WorkflowToolbar from "./WorkflowToolbar";

import ApproveMemberDialog from "../ApproveMemberDialog";
import RejectMemberDialog from "../RejectMemberDialog";
import ActivateMemberDialog from "../ActivateMemberDialog";
import DeactivateMemberDialog from "../DeactivateMemberDialog";
import CompleteRegistrationDialog from "../CompleteRegistrationDialog";
import DeleteMemberDialog from "../DeleteMemberDialog";

interface Props {
  member: Member;
  onRefresh?: () => Promise<void>;
}

export default function MemberDetails({ member, onRefresh }: Props) {
  const router = useRouter();

  // Workflow Dialog States
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [activateOpen, setActivateOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleDeleteMember = async () => {
    if (!member?.id) return;
    try {
      setDeleteLoading(true);
      setDeleteError("");
      await memberService.delete(member.id);
      setDeleteOpen(false);
      router.push("/members");
    } catch (err: any) {
      console.error("Failed to delete member:", err);
      setDeleteError(err.response?.data?.detail || "Failed to delete member record.");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Tab State
  const [activeTab, setActiveTab] = useState(0);

  // Related Modules State
  const [nextOfKin, setNextOfKin] = useState<NextOfKin | null>(null);
  const [nextOfKins, setNextOfKins] = useState<NextOfKin[]>([]);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [guarantor, setGuarantor] = useState<Guarantor | null>(null);
  const [loadingRelated, setLoadingRelated] = useState(true);

  useEffect(() => {
    async function loadRelatedData() {
      if (!member?.id) return;
      try {
        setLoadingRelated(true);
        const [kinData, vehicleData, guarantorData] = await Promise.allSettled([
          nextOfKinService.getAllByMember(member.id),
          vehicleService.getAllByMember(member.id),
          guarantorService.getByMember(member.id),
        ]);

        if (kinData.status === "fulfilled") {
          setNextOfKins(kinData.value);
          setNextOfKin(kinData.value.length > 0 ? kinData.value[0] : null);
        }
        if (vehicleData.status === "fulfilled") {
          setVehicles(vehicleData.value);
          setVehicle(vehicleData.value.length > 0 ? vehicleData.value[0] : null);
        }
        if (guarantorData.status === "fulfilled") {
          setGuarantor(guarantorData.value);
        }
      } catch (err) {
        console.error("Failed to load member related data:", err);
      } finally {
        setLoadingRelated(false);
      }
    }

    loadRelatedData();
  }, [member?.id]);

  const handleDialogSuccess = async () => {
    if (onRefresh) {
      await onRefresh();
    }
    setApproveOpen(false);
    setRejectOpen(false);
    setActivateOpen(false);
    setDeactivateOpen(false);
    setCompleteOpen(false);
  };

  const isDataCapture = member.registration_stage === "DATA_CAPTURE_PENDING";
  const isApproved = member.registration_stage === "APPROVED";
  const isActive = member.registration_stage === "ACTIVE";
  const isRejected = member.registration_stage === "REJECTED";
  const photoUrl = getMediaUrl(member.passport_photo);

  return (
    <Stack spacing={3}>
      {/* 1. EXECUTIVE HERO BANNER */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3.5 },
          borderRadius: 3.5,
          background: "linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)",
          color: "#ffffff",
          boxShadow: "0 10px 30px -5px rgba(6, 78, 59, 0.35)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle decorative glowing background shapes */}
        <Box
          sx={{
            position: "absolute",
            top: -60,
            right: -60,
            width: 220,
            height: 220,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(52, 211, 153, 0.25) 0%, rgba(52, 211, 153, 0) 70%)",
            pointerEvents: "none",
          }}
        />

        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
          spacing={2.5}
        >
          {/* Left: Avatar & Identity Details */}
          <Stack direction="row" spacing={2.5} alignItems="center">
            <Box
              sx={{
                p: "3px",
                borderRadius: 3,
                background: "linear-gradient(135deg, #34d399 0%, #a7f3d0 100%)",
                boxShadow: "0 6px 16px rgba(0,0,0,0.2)",
              }}
            >
              <Avatar
                src={photoUrl}
                variant="rounded"
                sx={{
                  width: { xs: 72, md: 88 },
                  height: { xs: 72, md: 88 },
                  borderRadius: 2.5,
                  bgcolor: "#065f46",
                  color: "#a7f3d0",
                  fontWeight: 900,
                  fontSize: "2rem",
                  border: "2px solid #ffffff",
                }}
              >
                {member.first_name?.[0]?.toUpperCase()}
              </Avatar>
            </Box>

            <Box>
              <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" mb={0.5}>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 900,
                    color: "#ffffff",
                    fontSize: { xs: "1.4rem", md: "1.85rem" },
                    letterSpacing: "-0.5px",
                  }}
                >
                  {member.first_name} {member.other_names}
                </Typography>

                {/* Monospace Membership Badge */}
                <Chip
                  size="small"
                  label={member.membership_number || "RC-PENDING"}
                  sx={{
                    fontFamily: "monospace",
                    fontWeight: 900,
                    fontSize: "0.85rem",
                    bgcolor: "rgba(255, 255, 255, 0.18)",
                    color: "#ffffff",
                    border: "1px solid rgba(255, 255, 255, 0.35)",
                    backdropFilter: "blur(8px)",
                  }}
                />
              </Stack>

              {/* Badges & Meta Row */}
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Chip
                  size="small"
                  label={member.category_name || "Normal Member"}
                  sx={{
                    fontWeight: 800,
                    fontSize: "0.78rem",
                    bgcolor: "rgba(16, 185, 129, 0.25)",
                    color: "#a7f3d0",
                    border: "1px solid rgba(167, 243, 208, 0.3)",
                  }}
                />

                {/* Stage Badge */}
                <Chip
                  size="small"
                  label={
                    isDataCapture
                      ? "Data Capture Pending"
                      : isApproved
                      ? "Approved"
                      : isActive
                      ? "Completed & Active"
                      : isRejected
                      ? "Rejected"
                      : member.registration_stage
                  }
                  sx={{
                    fontWeight: 800,
                    fontSize: "0.78rem",
                    bgcolor: isDataCapture
                      ? "rgba(245, 158, 11, 0.25)"
                      : isApproved
                      ? "rgba(59, 130, 246, 0.25)"
                      : isActive
                      ? "rgba(16, 185, 129, 0.35)"
                      : "rgba(244, 63, 94, 0.25)",
                    color: isDataCapture
                      ? "#fde68a"
                      : isApproved
                      ? "#bfdbfe"
                      : isActive
                      ? "#ffffff"
                      : "#fecdd3",
                    border: `1px solid ${
                      isDataCapture
                        ? "rgba(253, 230, 138, 0.4)"
                        : isApproved
                        ? "rgba(191, 219, 254, 0.4)"
                        : isActive
                        ? "rgba(167, 243, 208, 0.5)"
                        : "rgba(254, 205, 211, 0.4)"
                    }`,
                  }}
                />

                {/* Account Status Pill */}
                <Box
                  sx={{
                    px: 1.25,
                    py: 0.4,
                    borderRadius: 2,
                    bgcolor: member.status === "ACTIVE" ? "rgba(16, 185, 129, 0.3)" : "rgba(245, 158, 11, 0.3)",
                    border: `1px solid ${member.status === "ACTIVE" ? "rgba(167, 243, 208, 0.4)" : "rgba(253, 230, 138, 0.4)"}`,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.75,
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: member.status === "ACTIVE" ? "#34d399" : "#fbbf24",
                      boxShadow: member.status === "ACTIVE" ? "0 0 8px #34d399" : "none",
                    }}
                  />
                  <Typography variant="caption" sx={{ color: "#ffffff", fontWeight: 800, fontSize: "0.78rem" }}>
                    {member.status === "ACTIVE" ? "Active Account" : "Inactive Account"}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Stack>

          {/* Right: Quick Action Buttons */}
          <Stack direction="row" spacing={1.5}>
            <Button
              startIcon={<IconArrowLeft size={18} />}
              onClick={() => router.push("/members")}
              sx={{
                bgcolor: "rgba(255, 255, 255, 0.15)",
                color: "#ffffff",
                fontWeight: 800,
                borderRadius: 2.5,
                px: 2.25,
                py: 1,
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                "&:hover": {
                  bgcolor: "rgba(255, 255, 255, 0.25)",
                },
              }}
            >
              Back to Members
            </Button>

            <Button
              startIcon={<IconEdit size={18} />}
              onClick={() => router.push(`/members/${member.id}/edit`)}
              sx={{
                bgcolor: "#ffffff",
                color: "#065f46",
                fontWeight: 900,
                borderRadius: 2.5,
                px: 2.5,
                py: 1,
                boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                "&:hover": {
                  bgcolor: "#f0fdf4",
                },
              }}
            >
              Edit Member
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* 2. SACCO STAGE WORKFLOW TOOLBAR */}
      <WorkflowToolbar
        member={member}
        onApprove={() => setApproveOpen(true)}
        onReject={() => setRejectOpen(true)}
        onActivate={() => setActivateOpen(true)}
        onDeactivate={() => setDeactivateOpen(true)}
        onCompleteRegistration={() => setCompleteOpen(true)}
        onDelete={() => setDeleteOpen(true)}
      />

      {/* 3. DOSSIER MODULE NAVIGATION TABS */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid #e2e8f0",
          bgcolor: "#ffffff",
          px: 2,
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            "& .MuiTab-root": {
              fontWeight: 800,
              fontSize: "0.92rem",
              py: 2,
              textTransform: "none",
              color: "#64748b",
              "&.Mui-selected": {
                color: "#059669",
              },
            },
            "& .MuiTabs-indicator": {
              backgroundColor: "#059669",
              height: 3,
              borderRadius: "3px 3px 0 0",
            },
          }}
        >
          <Tab
            icon={<IconUser size={18} />}
            iconPosition="start"
            label="Personal Profile & Summary"
          />

          <Tab
            icon={<IconHeartHandshake size={18} />}
            iconPosition="start"
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <span>Next of Kin</span>
                <Chip
                  size="small"
                  label={nextOfKin ? "1 Registered" : "Not Provided"}
                  sx={{
                    height: 20,
                    fontSize: "0.7rem",
                    fontWeight: 800,
                    bgcolor: nextOfKin ? "#f0fdf4" : "#f1f5f9",
                    color: nextOfKin ? "#15803d" : "#94a3b8",
                    border: `1px solid ${nextOfKin ? "#bbf7d0" : "#e2e8f0"}`,
                  }}
                />
              </Stack>
            }
          />

          <Tab
            icon={<IconCar size={18} />}
            iconPosition="start"
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <span>Vehicle Details</span>
                <Chip
                  size="small"
                  label={vehicle ? vehicle.registration_number : "None"}
                  sx={{
                    height: 20,
                    fontSize: "0.7rem",
                    fontWeight: 800,
                    fontFamily: vehicle ? "monospace" : "inherit",
                    bgcolor: vehicle ? "#f0fdfa" : "#f1f5f9",
                    color: vehicle ? "#0d9488" : "#94a3b8",
                    border: `1px solid ${vehicle ? "#99f6e4" : "#e2e8f0"}`,
                  }}
                />
              </Stack>
            }
          />

          <Tab
            icon={<IconShieldCheck size={18} />}
            iconPosition="start"
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <span>Guarantor</span>
                <Chip
                  size="small"
                  label={guarantor ? "1 Assigned" : "None"}
                  sx={{
                    height: 20,
                    fontSize: "0.7rem",
                    fontWeight: 800,
                    bgcolor: guarantor ? "#eff6ff" : "#f1f5f9",
                    color: guarantor ? "#1d4ed8" : "#94a3b8",
                    border: `1px solid ${guarantor ? "#bfdbfe" : "#e2e8f0"}`,
                  }}
                />
              </Stack>
            }
          />

          <Tab
            icon={<IconHistory size={18} />}
            iconPosition="start"
            label="Audit & Governance Trail"
          />
        </Tabs>
      </Paper>

      {/* 4. TAB CONTENTS */}
      {activeTab === 0 && (
        <Stack spacing={3}>
          <MemberSummaryCard member={member} />
          <MemberProfileCard member={member} />
        </Stack>
      )}

      {/* NEXT OF KIN TAB */}
      {activeTab === 1 && (
        <Card
          elevation={0}
          sx={{
            borderRadius: 3.5,
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 20px -4px rgba(0,0,0,0.04)",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              px: 3,
              py: 2,
              bgcolor: "#fafbfc",
              borderBottom: "1px solid #f1f5f9",
              borderLeft: "5px solid #e11d48",
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 2,
                bgcolor: "#fff1f2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#e11d48",
              }}
            >
              <IconHeartHandshake size={18} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 900, color: "#0f172a", fontSize: "1.1rem" }}>
                Next of Kin & Beneficiary Information
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
                Designated emergency contact and benefit recipient
              </Typography>
            </Box>
          </Box>

          <CardContent sx={{ p: 3 }}>
            {loadingRelated ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress color="success" size={32} />
              </Box>
            ) : nextOfKins.length > 1 ? (
              <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2.5, overflow: "hidden" }}>
                <Table>
                  <TableHead sx={{ bgcolor: "#f8fafc" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800, color: "#475569" }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: "#475569" }}>Full Name</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: "#475569" }}>Relationship</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: "#475569" }}>Phone Number</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: "#475569" }}>National ID</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: "#475569" }}>Address</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: "#475569" }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {nextOfKins.map((kin, idx) => (
                      <TableRow key={idx} hover>
                        <TableCell sx={{ fontWeight: 700, color: "#64748b" }}>{idx + 1}</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: "#0f172a" }}>
                          {kin.first_name} {kin.other_names}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={kin.relationship || "—"}
                            size="small"
                            sx={{ fontWeight: 700, bgcolor: "#ffe4e6", color: "#e11d48" }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontFamily: "monospace", fontWeight: 700, color: "#334155" }}>
                          {kin.phone_number || "—"}
                        </TableCell>
                        <TableCell sx={{ fontFamily: "monospace", color: "#64748b" }}>
                          {kin.national_id || "—"}
                        </TableCell>
                        <TableCell sx={{ color: "#64748b" }}>{kin.physical_address || "—"}</TableCell>
                        <TableCell>
                          <Chip
                            label={kin.is_primary ? "Primary Beneficiary" : "Secondary"}
                            size="small"
                            color={kin.is_primary ? "error" : "default"}
                            sx={{ fontWeight: 800 }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : nextOfKin ? (
              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: "#f8fafc", border: "1px solid #f1f5f9" }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                      Full Name
                    </Typography>
                    <Typography sx={{ fontWeight: 800, color: "#0f172a", fontSize: "1.05rem", mt: 0.5 }}>
                      {nextOfKin.first_name} {nextOfKin.other_names}
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: "#f8fafc", border: "1px solid #f1f5f9" }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                      Relationship
                    </Typography>
                    <Typography sx={{ fontWeight: 800, color: "#e11d48", fontSize: "1.05rem", mt: 0.5 }}>
                      {nextOfKin.relationship || "—"}
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: "#f8fafc", border: "1px solid #f1f5f9" }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                      Phone Number
                    </Typography>
                    <Typography sx={{ fontWeight: 800, color: "#0f172a", fontSize: "1.05rem", fontFamily: "monospace", mt: 0.5 }}>
                      {nextOfKin.phone_number || "—"}
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: "#f8fafc", border: "1px solid #f1f5f9" }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                      National ID
                    </Typography>
                    <Typography sx={{ fontWeight: 800, color: "#0f172a", fontSize: "1.05rem", fontFamily: "monospace", mt: 0.5 }}>
                      {nextOfKin.national_id || "—"}
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: "#f8fafc", border: "1px solid #f1f5f9" }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                      Physical Address
                    </Typography>
                    <Typography sx={{ fontWeight: 800, color: "#0f172a", fontSize: "1.05rem", mt: 0.5 }}>
                      {nextOfKin.physical_address || "—"}
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: "#f8fafc", border: "1px solid #f1f5f9" }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                      Primary Beneficiary
                    </Typography>
                    <Chip
                      label={nextOfKin.is_primary ? "Primary Contact" : "Secondary Contact"}
                      color={nextOfKin.is_primary ? "error" : "default"}
                      sx={{ fontWeight: 800, mt: 0.5 }}
                    />
                  </Box>
                </Grid>
              </Grid>
            ) : (
              <Box
                sx={{
                  py: 6,
                  px: 3,
                  textAlign: "center",
                  borderRadius: 3,
                  bgcolor: "#fafbfc",
                  border: "1px dashed #cbd5e1",
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    bgcolor: "#fff1f2",
                    color: "#e11d48",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mx: "auto",
                    mb: 1.5,
                  }}
                >
                  <IconHeartHandshake size={24} />
                </Box>
                <Typography sx={{ fontWeight: 800, color: "#0f172a", fontSize: "1.05rem" }}>
                  No Next of Kin Records Captured
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748b", maxWidth: 460, mx: "auto", mt: 0.5, mb: 2.5 }}>
                  This member does not have emergency beneficiary or kin records on file. You can attach kin details anytime.
                </Typography>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<IconEdit size={16} />}
                  onClick={() => router.push(`/members/${member.id}/edit`)}
                  sx={{ fontWeight: 800, borderRadius: 2 }}
                >
                  Edit Member & Add Kin
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* VEHICLE TAB */}
      {activeTab === 2 && (
        <Card
          elevation={0}
          sx={{
            borderRadius: 3.5,
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 20px -4px rgba(0,0,0,0.04)",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              px: 3,
              py: 2,
              bgcolor: "#fafbfc",
              borderBottom: "1px solid #f1f5f9",
              borderLeft: "5px solid #0d9488",
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 2,
                bgcolor: "#f0fdfa",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#0d9488",
              }}
            >
              <IconCar size={18} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 900, color: "#0f172a", fontSize: "1.1rem" }}>
                Vehicle Asset & SACCO Fleet Information
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
                Registered operational vehicle details, make, and logbook records
              </Typography>
            </Box>
          </Box>

          <CardContent sx={{ p: 3 }}>
            {loadingRelated ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress color="success" size={32} />
              </Box>
            ) : vehicles.length > 1 ? (
              <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2.5, overflow: "hidden" }}>
                <Table>
                  <TableHead sx={{ bgcolor: "#f8fafc" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800, color: "#475569" }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: "#475569" }}>Plate Number</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: "#475569" }}>Make & Model</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: "#475569" }}>Year</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: "#475569" }}>Color</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: "#475569" }}>Engine No.</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: "#475569" }}>Chassis No.</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {vehicles.map((veh, idx) => (
                      <TableRow key={idx} hover>
                        <TableCell sx={{ fontWeight: 700, color: "#64748b" }}>{idx + 1}</TableCell>
                        <TableCell>
                          <Chip
                            label={veh.registration_number || "—"}
                            size="small"
                            sx={{
                              fontWeight: 900,
                              fontFamily: "monospace",
                              bgcolor: "#0f172a",
                              color: "#f8fafc",
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800, color: "#0f172a" }}>
                          {veh.make} {veh.model}
                        </TableCell>
                        <TableCell sx={{ color: "#475569", fontWeight: 600 }}>{veh.year || "—"}</TableCell>
                        <TableCell>
                          {veh.color ? (
                            <Chip label={veh.color} size="small" sx={{ fontWeight: 700, bgcolor: "#f1f5f9" }} />
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell sx={{ fontFamily: "monospace", color: "#64748b" }}>{veh.engine_number || "—"}</TableCell>
                        <TableCell sx={{ fontFamily: "monospace", color: "#64748b" }}>{veh.chassis_number || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : vehicle ? (
              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: "#f8fafc", border: "1px solid #f1f5f9" }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                      Registration Number Plate
                    </Typography>
                    <Typography sx={{ fontWeight: 900, color: "#0d9488", fontSize: "1.15rem", fontFamily: "monospace", mt: 0.5 }}>
                      {vehicle.registration_number}
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: "#f8fafc", border: "1px solid #f1f5f9" }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                      Make & Model
                    </Typography>
                    <Typography sx={{ fontWeight: 800, color: "#0f172a", fontSize: "1.05rem", mt: 0.5 }}>
                      {vehicle.make} {vehicle.model}
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: "#f8fafc", border: "1px solid #f1f5f9" }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                      Year of Manufacture
                    </Typography>
                    <Typography sx={{ fontWeight: 800, color: "#0f172a", fontSize: "1.05rem", mt: 0.5 }}>
                      {vehicle.year || "—"}
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: "#f8fafc", border: "1px solid #f1f5f9" }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                      Vehicle Color
                    </Typography>
                    <Typography sx={{ fontWeight: 800, color: "#0f172a", fontSize: "1.05rem", mt: 0.5 }}>
                      {vehicle.color || "—"}
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: "#f8fafc", border: "1px solid #f1f5f9" }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                      Engine Number
                    </Typography>
                    <Typography sx={{ fontWeight: 800, color: "#0f172a", fontSize: "1.05rem", fontFamily: "monospace", mt: 0.5 }}>
                      {vehicle.engine_number || "—"}
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: "#f8fafc", border: "1px solid #f1f5f9" }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                      Chassis Number
                    </Typography>
                    <Typography sx={{ fontWeight: 800, color: "#0f172a", fontSize: "1.05rem", fontFamily: "monospace", mt: 0.5 }}>
                      {vehicle.chassis_number || "—"}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            ) : (
              <Box
                sx={{
                  py: 6,
                  px: 3,
                  textAlign: "center",
                  borderRadius: 3,
                  bgcolor: "#fafbfc",
                  border: "1px dashed #cbd5e1",
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    bgcolor: "#f0fdfa",
                    color: "#0d9488",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mx: "auto",
                    mb: 1.5,
                  }}
                >
                  <IconCar size={24} />
                </Box>
                <Typography sx={{ fontWeight: 800, color: "#0f172a", fontSize: "1.05rem" }}>
                  No Vehicle Asset Registered
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748b", maxWidth: 460, mx: "auto", mt: 0.5, mb: 2.5 }}>
                  Normal members and non-transport category members are not required to own or register fleet vehicles.
                </Typography>
                <Button
                  variant="outlined"
                  color="success"
                  startIcon={<IconEdit size={16} />}
                  onClick={() => router.push(`/members/${member.id}/edit`)}
                  sx={{ fontWeight: 800, borderRadius: 2 }}
                >
                  Register Vehicle Asset
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* GUARANTOR TAB */}
      {activeTab === 3 && (
        <Card
          elevation={0}
          sx={{
            borderRadius: 3.5,
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 20px -4px rgba(0,0,0,0.04)",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              px: 3,
              py: 2,
              bgcolor: "#fafbfc",
              borderBottom: "1px solid #f1f5f9",
              borderLeft: "5px solid #2563eb",
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 2,
                bgcolor: "#eff6ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#2563eb",
              }}
            >
              <IconShieldCheck size={18} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 900, color: "#0f172a", fontSize: "1.1rem" }}>
                Guarantor & Security Details
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
                Endorsing SACCO member guaranteeing financial obligations
              </Typography>
            </Box>
          </Box>

          <CardContent sx={{ p: 3 }}>
            {loadingRelated ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress color="success" size={32} />
              </Box>
            ) : guarantor ? (
              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: "#f8fafc", border: "1px solid #f1f5f9" }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                      Guarantor Full Name
                    </Typography>
                    <Typography sx={{ fontWeight: 800, color: "#0f172a", fontSize: "1.05rem", mt: 0.5 }}>
                      {guarantor.first_name} {guarantor.other_names}
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: "#f8fafc", border: "1px solid #f1f5f9" }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                      Phone Number
                    </Typography>
                    <Typography sx={{ fontWeight: 800, color: "#2563eb", fontSize: "1.05rem", fontFamily: "monospace", mt: 0.5 }}>
                      {guarantor.phone_number}
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: "#f8fafc", border: "1px solid #f1f5f9" }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                      National ID
                    </Typography>
                    <Typography sx={{ fontWeight: 800, color: "#0f172a", fontSize: "1.05rem", fontFamily: "monospace", mt: 0.5 }}>
                      {guarantor.national_id || "—"}
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: "#f8fafc", border: "1px solid #f1f5f9" }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                      Relationship
                    </Typography>
                    <Typography sx={{ fontWeight: 800, color: "#0f172a", fontSize: "1.05rem", mt: 0.5 }}>
                      {guarantor.relationship || "—"}
                    </Typography>
                  </Box>
                </Grid>

                {guarantor.guarantor_number && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: "#f8fafc", border: "1px solid #f1f5f9" }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                        Guarantor Membership Number
                      </Typography>
                      <Chip
                        label={guarantor.guarantor_number}
                        sx={{
                          fontWeight: 900,
                          mt: 0.5,
                          fontFamily: "monospace",
                          bgcolor: "#eff6ff",
                          color: "#1d4ed8",
                          border: "1px solid #bfdbfe",
                        }}
                      />
                    </Box>
                  </Grid>
                )}
              </Grid>
            ) : (
              <Box
                sx={{
                  py: 6,
                  px: 3,
                  textAlign: "center",
                  borderRadius: 3,
                  bgcolor: "#fafbfc",
                  border: "1px dashed #cbd5e1",
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    bgcolor: "#eff6ff",
                    color: "#2563eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mx: "auto",
                    mb: 1.5,
                  }}
                >
                  <IconShieldCheck size={24} />
                </Box>
                <Typography sx={{ fontWeight: 800, color: "#0f172a", fontSize: "1.05rem" }}>
                  No Guarantor Assigned
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748b", maxWidth: 460, mx: "auto", mt: 0.5, mb: 2.5 }}>
                  Guarantors and loan underwriters can be linked when requesting SACCO credit facilities or upon loan application.
                </Typography>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<IconEdit size={16} />}
                  onClick={() => router.push(`/members/${member.id}/edit`)}
                  sx={{ fontWeight: 800, borderRadius: 2 }}
                >
                  Assign Guarantor
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* AUDIT TAB */}
      {activeTab === 4 && (
        <AuditInformation member={member} />
      )}

      {/* WORKFLOW DIALOGS */}
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

      <DeleteMemberDialog
        open={deleteOpen}
        member={member}
        loading={deleteLoading}
        error={deleteError}
        onClose={() => setDeleteOpen(false)}
        onDelete={handleDeleteMember}
      />
    </Stack>
  );
}
