"use client";

import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import { ErrorOutline } from "@mui/icons-material";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { resetRegistration } from "@/store/registration/registrationSlice";
import api from "@/services/api";
import memberService from "@/services/member.service";
import nextOfKinService from "@/services/nextOfKin.service";
import vehicleService from "@/services/vehicle.service";
import guarantorService from "@/services/guarantor.service";
import { Member } from "@/interfaces/member";
import AuditInformation from "@/components/members/AuditInformation";
import {
  IconUser,
  IconPhone,
  IconMail,
  IconMapPin,
  IconId,
  IconBriefcase,
  IconReceiptTax,
  IconHeartHandshake,
  IconCar,
  IconShieldCheck,
  IconCheck,
  IconSend,
  IconArrowLeft,
  IconFileCheck,
  IconBadge,
  IconCalendar,
  IconNumber,
} from "@tabler/icons-react";

/* =========================================================
   TYPES
========================================================= */

interface ReviewStepProps {
  mode?: "create" | "edit";
  memberId?: number;
  onBack: () => void;
}

interface MemberCategory {
  id: number;
  name: string;
  code?: string;
}

function hasValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  return true;
}

function cleanString(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

function getApiErrorMessage(error: any): string {
  const responseData = error?.response?.data;
  if (!responseData) return error?.message ?? "Registration failed. Please try again.";
  if (typeof responseData.detail === "string") {
    if (responseData.detail.toLowerCase().includes("not found")) {
      return "Member record was not found on the server. Please verify the member exists in the directory.";
    }
    return responseData.detail;
  }
  if (typeof responseData === "string") return responseData;

  if (typeof responseData === "object") {
    const messages: string[] = [];
    Object.entries(responseData).forEach(([field, value]) => {
      const fieldTitle = field
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      if (Array.isArray(value)) {
        messages.push(`${fieldTitle}: ${value.join(", ")}`);
      } else if (typeof value === "string") {
        messages.push(`${fieldTitle}: ${value}`);
      }
    });
    if (messages.length > 0) return messages.join("\n• ");
  }

  return "Validation error occurred. Please verify that all required fields are filled out correctly.";
}

export default function ReviewStep({
  mode = "create",
  memberId: propMemberId,
  onBack,
}: ReviewStepProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const registration = useAppSelector((state) => state.registration);
  const { member, nextOfKin, vehicle, guarantor } = registration;

  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categories, setCategories] = useState<MemberCategory[]>([]);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [success, setSuccess] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const redirectTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (redirectTimer.current) {
        clearTimeout(redirectTimer.current);
      }
    };
  }, []);

  const hasNextOfKin = Boolean(
    nextOfKin.first_name ||
      nextOfKin.other_names ||
      nextOfKin.phone_number ||
      nextOfKin.relationship ||
      nextOfKin.national_id ||
      nextOfKin.physical_address,
  );

  const hasVehicle = Boolean(
    vehicle.registration_number ||
      vehicle.make ||
      vehicle.model ||
      vehicle.year ||
      vehicle.color ||
      vehicle.engine_number ||
      vehicle.chassis_number,
  );

  const hasGuarantor = Boolean(
    guarantor.first_name ||
      guarantor.other_names ||
      guarantor.national_id ||
      guarantor.phone_number ||
      guarantor.relationship ||
      guarantor.guarantor_member,
  );

  const memberReady = useMemo(() => {
    return Boolean(
      member.first_name?.trim() &&
        member.national_id?.trim() &&
        member.phone_number?.trim(),
    );
  }, [member.first_name, member.national_id, member.phone_number]);

  useEffect(() => {
    let active = true;

    async function loadCategories() {
      setCategoriesLoading(true);
      try {
        const response = await api.get("/member-categories/");
        if (!active) return;
        const data = Array.isArray(response.data)
          ? response.data
          : (response.data?.results ?? []);
        setCategories(data);
      } catch (err) {
        console.error("Unable to load member categories:", err);
      } finally {
        if (active) setCategoriesLoading(false);
      }
    }

    void loadCategories();

    return () => {
      active = false;
    };
  }, []);

  const categoryObj = useMemo(() => {
    if (!member.category) return null;
    return (
      categories.find(
        (c) =>
          c.id === member.category ||
          String(c.id) === String(member.category),
      ) || null
    );
  }, [categories, member.category]);

  const categoryName = useMemo(() => {
    if (categoryObj) return categoryObj.name;
    if (member.category_details?.name) return member.category_details.name;
    if (typeof member.category === "string" && member.category.trim()) {
      return member.category;
    }
    return "Standard Member";
  }, [categoryObj, member.category, member.category_details]);

  useEffect(() => {
    const photo = member.passport_photo;
    if (!photo) {
      setPhotoPreview(null);
      return;
    }

    if (photo instanceof File) {
      const objectUrl = URL.createObjectURL(photo);
      setPhotoPreview(objectUrl);
      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    }

    if (typeof photo === "string") {
      setPhotoPreview(photo);
    }
  }, [member.passport_photo]);

  async function saveRegistration() {
    if (loading) return;

    if (!memberReady) {
      setError(
        "Primary member details are incomplete. Please return to Step 1 and provide the required information.",
      );
      return;
    }

    setError("");
    setWarning("");
    setLoading(true);

    try {
      const formData = new FormData();

      formData.append("first_name", cleanString(member.first_name));
      formData.append("other_names", cleanString(member.other_names));
      formData.append("national_id", cleanString(member.national_id));
      formData.append("phone_number", cleanString(member.phone_number));
      formData.append("email", cleanString(member.email));
      formData.append("physical_address", cleanString(member.physical_address));
      formData.append("occupation", cleanString(member.occupation));
      formData.append("kra_pin", cleanString(member.kra_pin));
      formData.append("category", String(member.category || ""));

      if (member.passport_photo instanceof File) {
        formData.append("passport_photo", member.passport_photo);
      }

      if (hasNextOfKin) {
        formData.append("next_of_kin_first_name", cleanString(nextOfKin.first_name));
        formData.append("next_of_kin_other_names", cleanString(nextOfKin.other_names));
        formData.append("next_of_kin_relationship", cleanString(nextOfKin.relationship));
        formData.append("next_of_kin_national_id", cleanString(nextOfKin.national_id));
        formData.append("next_of_kin_phone_number", cleanString(nextOfKin.phone_number));
        formData.append("next_of_kin_physical_address", cleanString(nextOfKin.physical_address));
        formData.append("next_of_kin_is_primary", String(nextOfKin.is_primary ?? true));
      }

      if (hasVehicle) {
        formData.append("vehicle_registration_number", cleanString(vehicle.registration_number).toUpperCase());
        formData.append("vehicle_make", cleanString(vehicle.make));
        formData.append("vehicle_model", cleanString(vehicle.model));
        formData.append("vehicle_year", vehicle.year ? String(vehicle.year) : "");
        formData.append("vehicle_color", cleanString(vehicle.color));
        formData.append("vehicle_engine_number", cleanString(vehicle.engine_number));
        formData.append("vehicle_chassis_number", cleanString(vehicle.chassis_number));
      }

      if (hasGuarantor) {
        formData.append("guarantor_first_name", cleanString(guarantor.first_name));
        formData.append("guarantor_other_names", cleanString(guarantor.other_names));
        formData.append("guarantor_national_id", cleanString(guarantor.national_id));
        formData.append("guarantor_phone_number", cleanString(guarantor.phone_number));
        formData.append("guarantor_relationship", cleanString(guarantor.relationship));
        if (guarantor.guarantor_member) {
          formData.append("guarantor_member", String(guarantor.guarantor_member));
        }
      }

      let createdOrUpdatedMember: Member;

      if (mode === "create") {
        createdOrUpdatedMember = await memberService.create(formData);
      } else {
        const updateId =
          propMemberId ||
          member.id ||
          (typeof window !== "undefined"
            ? Number(window.location.pathname.match(/\/members\/(\d+)/)?.[1])
            : undefined);

        if (!updateId || Number.isNaN(updateId)) {
          throw new Error(
            "Unable to identify member ID for updating. Please reload the member edit page.",
          );
        }

        createdOrUpdatedMember = await memberService.update(updateId, formData);
      }

      const memberId = createdOrUpdatedMember.id;

      // 1. Save Next of Kin
      if (hasNextOfKin && memberId) {
        try {
          const existingKin = await nextOfKinService.getByMember(memberId);
          const kinPayload = {
            member: memberId,
            first_name: cleanString(nextOfKin.first_name),
            other_names: cleanString(nextOfKin.other_names),
            relationship: cleanString(nextOfKin.relationship),
            national_id: cleanString(nextOfKin.national_id),
            phone_number: cleanString(nextOfKin.phone_number),
            physical_address: cleanString(nextOfKin.physical_address),
            is_primary: Boolean(nextOfKin.is_primary ?? true),
          };
          if (existingKin?.id) {
            await nextOfKinService.update(existingKin.id, kinPayload);
          } else {
            await nextOfKinService.create(kinPayload);
          }
        } catch (err) {
          console.error("Next of Kin save error:", err);
        }
      }

      // 2. Save Vehicle (if provided)
      if (hasVehicle && memberId) {
        try {
          const existingVehicle = await vehicleService.getByMember(memberId);
          const vehiclePayload = {
            member: memberId,
            registration_number: cleanString(vehicle.registration_number).toUpperCase(),
            make: cleanString(vehicle.make),
            model: cleanString(vehicle.model),
            year: vehicle.year ? Number(vehicle.year) : null,
            color: cleanString(vehicle.color),
            engine_number: cleanString(vehicle.engine_number),
            chassis_number: cleanString(vehicle.chassis_number),
          };
          if (existingVehicle?.id) {
            await vehicleService.update(existingVehicle.id, vehiclePayload);
          } else {
            await vehicleService.create(vehiclePayload);
          }
        } catch (err) {
          console.error("Vehicle save error:", err);
        }
      }

      // 3. Save Guarantor (if provided)
      if (hasGuarantor && memberId) {
        try {
          const existingGuarantor = await guarantorService.getByMember(memberId);
          const guarantorPayload: any = {
            member: memberId,
            first_name: cleanString(guarantor.first_name),
            other_names: cleanString(guarantor.other_names),
            national_id: cleanString(guarantor.national_id),
            phone_number: cleanString(guarantor.phone_number),
            relationship: cleanString(guarantor.relationship),
          };
          if (guarantor.guarantor_member) {
            guarantorPayload.guarantor_member = guarantor.guarantor_member;
          }
          if (existingGuarantor?.id) {
            await guarantorService.update(existingGuarantor.id, guarantorPayload);
          } else {
            await guarantorService.create(guarantorPayload);
          }
        } catch (err) {
          console.error("Guarantor save error:", err);
        }
      }

      setSuccess(true);

      redirectTimer.current = setTimeout(() => {
        dispatch(resetRegistration());
        router.push("/members");
      }, 1500);
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     COLORFUL DETAIL CELL COMPONENT
     - Label: Clean subtle text with colored icon
     - Value: Bold, deep, prominent themed value
  ======================================================= */

  function DetailCell({
    label,
    value,
    icon,
    accentColor = "#059669",
    valueColor = "#064e3b",
    customBadge,
    fullWidth = false,
  }: {
    label: string;
    value: unknown;
    icon?: ReactNode;
    accentColor?: string;
    valueColor?: string;
    customBadge?: ReactNode;
    fullWidth?: boolean;
  }) {
    return (
      <Grid size={{ xs: 12, sm: fullWidth ? 12 : 6, md: fullWidth ? 12 : 4 }}>
        <Box
          sx={{
            p: 2,
            borderRadius: 2.5,
            bgcolor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderLeft: `4px solid ${accentColor}`,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            transition: "all 0.2s ease-in-out",
            "&:hover": {
              borderColor: accentColor,
              boxShadow: `0 4px 12px ${accentColor}20`,
              transform: "translateY(-1px)",
            },
          }}
        >
          <Stack direction="row" spacing={0.8} alignItems="center" mb={0.6}>
            {icon && <Box sx={{ display: "flex", color: accentColor }}>{icon}</Box>}
            <Typography
              variant="caption"
              sx={{
                color: "#64748b",
                fontWeight: 600,
                fontSize: "0.78rem",
              }}
            >
              {label}
            </Typography>
          </Stack>

          {customBadge ? (
            <Box mt={0.3}>{customBadge}</Box>
          ) : (
            <Typography
              variant="body1"
              sx={{
                color: hasValue(value) ? valueColor : "#94a3b8",
                fontWeight: hasValue(value) ? 800 : 500,
                fontSize: "1.02rem",
                letterSpacing: "-0.2px",
                wordBreak: "break-word",
              }}
            >
              {hasValue(value) ? String(value) : "—"}
            </Typography>
          )}
        </Box>
      </Grid>
    );
  }

  /* =======================================================
     REVIEW MODULE CARD COMPONENT
  ======================================================= */

  function ReviewModuleCard({
    title,
    subtitle,
    icon,
    accentColor,
    headerBg,
    completed,
    children,
  }: {
    title: string;
    subtitle: string;
    icon: ReactNode;
    accentColor: string;
    headerBg: string;
    completed: boolean;
    children: ReactNode;
  }) {
    return (
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: `1px solid ${accentColor}35`,
          bgcolor: "#ffffff",
          overflow: "hidden",
          boxShadow: `0 4px 16px ${accentColor}12`,
        }}
      >
        <Box
          sx={{
            px: { xs: 2.5, sm: 3 },
            py: 2,
            background: headerBg,
            borderBottom: `1px solid ${accentColor}25`,
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={1.5}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: accentColor,
                  color: "#ffffff",
                  borderRadius: 2.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: `0 4px 10px ${accentColor}40`,
                }}
              >
                {icon}
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={800} sx={{ color: "#0f172a", fontSize: "1.05rem" }}>
                  {title}
                </Typography>
                <Typography variant="caption" sx={{ color: "#475569", fontWeight: 600 }}>
                  {subtitle}
                </Typography>
              </Box>
            </Stack>

            <Chip
              size="small"
              icon={completed ? <IconCheck size={14} color="#059669" /> : undefined}
              label={completed ? "Verified & Captured" : "Not Provided"}
              sx={{
                bgcolor: completed ? "#ecfdf5" : "#f1f5f9",
                color: completed ? "#065f46" : "#64748b",
                border: `1px solid ${completed ? "#a7f3d0" : "#e2e8f0"}`,
                fontWeight: 800,
                fontSize: "0.75rem",
                height: 26,
              }}
            />
          </Stack>
        </Box>

        <Box sx={{ p: { xs: 2.5, sm: 3 }, bgcolor: "#fafafa" }}>{children}</Box>
      </Paper>
    );
  }

  const fullName = [member.first_name, member.other_names].filter(Boolean).join(" ") || "New Member";

  return (
    <>
      <Box>
        {/* Executive Dossier Header */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3.5 },
            mb: 3.5,
            borderRadius: 3,
            border: "1px solid #10b981",
            background: "linear-gradient(135deg, #064e3b 0%, #047857 50%, #059669 100%)",
            color: "#ffffff",
            boxShadow: "0 10px 28px rgba(6, 78, 59, 0.3)",
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={3}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
          >
            <Stack direction="row" spacing={2.5} alignItems="center">
              {photoPreview ? (
                <Box
                  component="img"
                  src={photoPreview}
                  alt={fullName}
                  sx={{
                    width: 86,
                    height: 86,
                    borderRadius: 2.5,
                    objectFit: "cover",
                    border: "3px solid #ffffff",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
                  }}
                />
              ) : (
                <Avatar
                  sx={{
                    width: 86,
                    height: 86,
                    borderRadius: 2.5,
                    bgcolor: "rgba(255,255,255,0.2)",
                    color: "#ffffff",
                    fontSize: "2rem",
                    fontWeight: 800,
                    border: "2px solid rgba(255,255,255,0.5)",
                  }}
                >
                  {member.first_name ? member.first_name.charAt(0).toUpperCase() : "M"}
                </Avatar>
              )}

              <Box>
                <Stack direction="row" spacing={1.5} alignItems="center" mb={0.8}>
                  <Typography variant="h5" fontWeight={800} sx={{ color: "#ffffff", letterSpacing: "-0.5px" }}>
                    {fullName}
                  </Typography>
                  <Chip
                    label={categoryName}
                    size="small"
                    sx={{
                      bgcolor: "#ecfdf5",
                      color: "#065f46",
                      fontWeight: 800,
                      border: "1px solid #a7f3d0",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                    }}
                  />
                </Stack>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 0.5, sm: 2.5 }} alignItems={{ xs: "flex-start", sm: "center" }}>
                  <Typography variant="body2" sx={{ color: "#d1fae5", fontWeight: 500 }}>
                    National ID: <strong style={{ color: "#ffffff", fontWeight: 800 }}>{member.national_id || "—"}</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#d1fae5", fontWeight: 500 }}>
                    Phone: <strong style={{ color: "#ffffff", fontWeight: 800 }}>{member.phone_number || "—"}</strong>
                  </Typography>
                  {member.physical_address && (
                    <Typography variant="body2" sx={{ color: "#d1fae5", fontWeight: 500 }}>
                      Location: <strong style={{ color: "#ffffff", fontWeight: 800 }}>{member.physical_address}</strong>
                    </Typography>
                  )}
                </Stack>
              </Box>
            </Stack>

            <Chip
              icon={<IconFileCheck size={18} color="#064e3b" />}
              label={memberReady ? "Ready for Submission" : "Incomplete Profile"}
              sx={{
                bgcolor: memberReady ? "#a7f3d0" : "#fecdd3",
                color: memberReady ? "#064e3b" : "#9f1239",
                fontWeight: 800,
                fontSize: "0.85rem",
                px: 1.5,
                py: 1,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              }}
            />
          </Stack>
        </Paper>

        {/* Validation Alert */}
        {!memberReady && (
          <Alert severity="error" icon={<ErrorOutline />} sx={{ mb: 3, borderRadius: 2 }}>
            <strong>Primary member information is incomplete.</strong> Return to Step 1 to complete required fields.
          </Alert>
        )}

        {error && (
          <Alert
            severity="error"
            icon={<ErrorOutline sx={{ fontSize: 24 }} />}
            sx={{
              mb: 3.5,
              borderRadius: 3,
              border: "1px solid #fca5a5",
              bgcolor: "#fef2f2",
              color: "#991b1b",
              boxShadow: "0 4px 16px rgba(239, 68, 68, 0.08)",
              whiteSpace: "pre-line",
              "& .MuiAlert-message": {
                fontWeight: 600,
                fontSize: "0.92rem",
                lineHeight: 1.6,
              },
            }}
            onClose={() => setError("")}
          >
            <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#7f1d1d", mb: 0.5 }}>
              Submission Notice:
            </Typography>
            {error}
          </Alert>
        )}

        {warning && (
          <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
            {warning}
          </Alert>
        )}

        {/* Modular Cards with Theme Colors */}
        <Stack spacing={3}>
          {/* 1. Personal Details */}
          <ReviewModuleCard
            title="1. Personal & Contact Details"
            subtitle="Official legal identity, direct channels, and tax compliance record"
            icon={<IconUser size={22} />}
            accentColor="#059669"
            headerBg="linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)"
            completed={memberReady}
          >
            <Grid container spacing={2}>
              <DetailCell
                label="First Name"
                value={member.first_name}
                icon={<IconUser size={16} />}
                accentColor="#059669"
                valueColor="#064e3b"
              />
              <DetailCell
                label="Other / Middle Names"
                value={member.other_names}
                icon={<IconUser size={16} />}
                accentColor="#059669"
                valueColor="#064e3b"
              />
              <DetailCell
                label="National ID / Passport Number"
                value={member.national_id}
                icon={<IconId size={16} />}
                accentColor="#059669"
                valueColor="#064e3b"
              />
              <DetailCell
                label="Primary Phone Number"
                value={member.phone_number}
                icon={<IconPhone size={16} />}
                accentColor="#0284c7"
                valueColor="#0369a1"
              />
              <DetailCell
                label="Email Address"
                value={member.email}
                icon={<IconMail size={16} />}
                accentColor="#0284c7"
                valueColor="#0369a1"
              />
              <DetailCell
                label="Occupation / Primary Business"
                value={member.occupation}
                icon={<IconBriefcase size={16} />}
                accentColor="#0284c7"
                valueColor="#0369a1"
              />
              <DetailCell
                label="KRA Tax PIN"
                value={member.kra_pin}
                icon={<IconReceiptTax size={16} />}
                accentColor="#d97706"
                valueColor="#b45309"
                customBadge={
                  member.kra_pin ? (
                    <Chip
                      label={member.kra_pin}
                      size="small"
                      sx={{
                        bgcolor: "#fef3c7",
                        color: "#92400e",
                        fontWeight: 800,
                        border: "1px solid #fde68a",
                        fontSize: "0.85rem",
                      }}
                    />
                  ) : undefined
                }
              />
              <DetailCell
                label="Membership Category Tier"
                value={categoryName}
                icon={<IconBadge size={16} />}
                accentColor="#059669"
                valueColor="#064e3b"
                customBadge={
                  <Chip
                    label={categoryName}
                    size="small"
                    sx={{
                      bgcolor: "#ecfdf5",
                      color: "#065f46",
                      fontWeight: 800,
                      border: "1px solid #a7f3d0",
                      fontSize: "0.85rem",
                    }}
                  />
                }
              />
              <DetailCell
                label="Physical Residential Address"
                value={member.physical_address}
                icon={<IconMapPin size={16} />}
                accentColor="#0284c7"
                valueColor="#0369a1"
                fullWidth
              />
            </Grid>
          </ReviewModuleCard>

          {/* 2. Next of Kin */}
          <ReviewModuleCard
            title="2. Next of Kin & Beneficiary"
            subtitle="Emergency contact person and primary nominated beneficiary"
            icon={<IconHeartHandshake size={22} />}
            accentColor="#e11d48"
            headerBg="linear-gradient(135deg, #fff1f2 0%, #ffffff 100%)"
            completed={hasNextOfKin}
          >
            <Grid container spacing={2}>
              <DetailCell
                label="Next of Kin First Name"
                value={nextOfKin.first_name}
                icon={<IconUser size={16} />}
                accentColor="#e11d48"
                valueColor="#9f1239"
              />
              <DetailCell
                label="Other / Middle Names"
                value={nextOfKin.other_names}
                icon={<IconUser size={16} />}
                accentColor="#e11d48"
                valueColor="#9f1239"
              />
              <DetailCell
                label="Relationship"
                value={nextOfKin.relationship}
                icon={<IconHeartHandshake size={16} />}
                accentColor="#e11d48"
                valueColor="#9f1239"
                customBadge={
                  nextOfKin.relationship ? (
                    <Chip
                      label={nextOfKin.relationship}
                      size="small"
                      sx={{
                        bgcolor: "#ffe4e6",
                        color: "#9f1239",
                        fontWeight: 800,
                        border: "1px solid #fecdd3",
                        fontSize: "0.85rem",
                      }}
                    />
                  ) : undefined
                }
              />
              <DetailCell
                label="National ID Number"
                value={nextOfKin.national_id}
                icon={<IconId size={16} />}
                accentColor="#e11d48"
                valueColor="#9f1239"
              />
              <DetailCell
                label="Primary Phone Number"
                value={nextOfKin.phone_number}
                icon={<IconPhone size={16} />}
                accentColor="#e11d48"
                valueColor="#9f1239"
              />
              <DetailCell
                label="Primary Beneficiary Status"
                value={hasNextOfKin ? (nextOfKin.is_primary ? "Yes (Primary)" : "Secondary") : null}
                icon={<IconCheck size={16} />}
                accentColor="#059669"
                valueColor="#065f46"
                customBadge={
                  hasNextOfKin ? (
                    <Chip
                      label={nextOfKin.is_primary ? "✓ Yes (Primary Beneficiary)" : "Secondary"}
                      size="small"
                      sx={{
                        bgcolor: nextOfKin.is_primary ? "#ecfdf5" : "#f1f5f9",
                        color: nextOfKin.is_primary ? "#065f46" : "#475569",
                        fontWeight: 800,
                        border: `1px solid ${nextOfKin.is_primary ? "#a7f3d0" : "#e2e8f0"}`,
                        fontSize: "0.85rem",
                      }}
                    />
                  ) : undefined
                }
              />
              <DetailCell
                label="Physical Residential Location"
                value={nextOfKin.physical_address}
                icon={<IconMapPin size={16} />}
                accentColor="#e11d48"
                valueColor="#9f1239"
                fullWidth
              />
            </Grid>
          </ReviewModuleCard>

          {/* 3. Vehicle Asset */}
          <ReviewModuleCard
            title="3. Vehicle Asset & Collateral"
            subtitle="Transport collateral asset registration and technical specifications"
            icon={<IconCar size={22} />}
            accentColor="#0d9488"
            headerBg="linear-gradient(135deg, #f0fdfa 0%, #ffffff 100%)"
            completed={hasVehicle}
          >
            <Grid container spacing={2}>
              <DetailCell
                label="Registration Number Plate"
                value={vehicle.registration_number}
                icon={<IconNumber size={16} />}
                accentColor="#0d9488"
                valueColor="#0f766e"
                customBadge={
                  vehicle.registration_number ? (
                    <Box
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        px: 1.5,
                        py: 0.4,
                        bgcolor: "#f0fdfa",
                        border: "2px solid #0d9488",
                        borderRadius: 1.5,
                        fontWeight: 900,
                        fontSize: "1rem",
                        color: "#115e59",
                        letterSpacing: "1px",
                      }}
                    >
                      {vehicle.registration_number}
                    </Box>
                  ) : undefined
                }
              />
              <DetailCell
                label="Vehicle Make"
                value={vehicle.make}
                icon={<IconCar size={16} />}
                accentColor="#0d9488"
                valueColor="#0f766e"
              />
              <DetailCell
                label="Vehicle Model"
                value={vehicle.model}
                icon={<IconCar size={16} />}
                accentColor="#0d9488"
                valueColor="#0f766e"
              />
              <DetailCell
                label="Year of Manufacture"
                value={vehicle.year}
                icon={<IconCalendar size={16} />}
                accentColor="#0d9488"
                valueColor="#0f766e"
              />
              <DetailCell
                label="Vehicle Color"
                value={vehicle.color}
                accentColor="#0d9488"
                valueColor="#0f766e"
              />
              <DetailCell
                label="Engine Number"
                value={vehicle.engine_number}
                accentColor="#0d9488"
                valueColor="#0f766e"
              />
              <DetailCell
                label="Chassis Number"
                value={vehicle.chassis_number}
                accentColor="#0d9488"
                valueColor="#0f766e"
                fullWidth
              />
            </Grid>
          </ReviewModuleCard>

          {/* 4. Guarantor */}
          <ReviewModuleCard
            title="4. Guarantor & Financial Reference"
            subtitle="Financial guarantor details for credit appraisal and endorsement"
            icon={<IconShieldCheck size={22} />}
            accentColor="#2563eb"
            headerBg="linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)"
            completed={hasGuarantor}
          >
            <Grid container spacing={2}>
              <DetailCell
                label="Guarantor First Name"
                value={guarantor.first_name}
                icon={<IconUser size={16} />}
                accentColor="#2563eb"
                valueColor="#1e40af"
              />
              <DetailCell
                label="Other / Middle Names"
                value={guarantor.other_names}
                icon={<IconUser size={16} />}
                accentColor="#2563eb"
                valueColor="#1e40af"
              />
              <DetailCell
                label="National ID / Passport Number"
                value={guarantor.national_id}
                icon={<IconId size={16} />}
                accentColor="#2563eb"
                valueColor="#1e40af"
              />
              <DetailCell
                label="Primary Phone Number"
                value={guarantor.phone_number}
                icon={<IconPhone size={16} />}
                accentColor="#2563eb"
                valueColor="#1e40af"
              />
              <DetailCell
                label="Relationship / Association"
                value={guarantor.relationship}
                icon={<IconHeartHandshake size={16} />}
                accentColor="#2563eb"
                valueColor="#1e40af"
                customBadge={
                  guarantor.relationship ? (
                    <Chip
                      label={guarantor.relationship}
                      size="small"
                      sx={{
                        bgcolor: "#dbeafe",
                        color: "#1e40af",
                        fontWeight: 800,
                        border: "1px solid #bfdbfe",
                        fontSize: "0.85rem",
                      }}
                    />
                  ) : undefined
                }
              />
              <DetailCell
                label="Linked Existing Member ID"
                value={guarantor.guarantor_member}
                accentColor="#2563eb"
                valueColor="#1e40af"
              />
            </Grid>
          </ReviewModuleCard>

          {member.id && <AuditInformation member={member} />}
        </Stack>

        {/* Bottom Actions */}
        <Box
          sx={{
            mt: 4,
            pt: 3,
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Button
            variant="outlined"
            startIcon={<IconArrowLeft size={18} />}
            onClick={onBack}
            disabled={loading}
            sx={{
              px: 3,
              py: 1.2,
              fontWeight: 700,
              textTransform: "none",
              borderColor: "#cbd5e1",
              color: "#334155",
            }}
          >
            Back
          </Button>

          <Button
            variant="contained"
            endIcon={loading ? undefined : <IconSend size={18} />}
            onClick={saveRegistration}
            disabled={loading || !memberReady || Boolean(warning)}
            sx={{
              minWidth: 260,
              bgcolor: "#064e3b",
              color: "#ffffff",
              fontWeight: 800,
              px: 4,
              py: 1.3,
              borderRadius: 2.5,
              textTransform: "none",
              fontSize: "0.95rem",
              boxShadow: "0 6px 18px rgba(6, 78, 59, 0.35)",
              "&:hover": { bgcolor: "#047857" },
            }}
          >
            {loading ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={20} color="inherit" />
                <Typography variant="body2" fontWeight={800}>Submitting Registration...</Typography>
              </Stack>
            ) : mode === "create" ? (
              "Submit Member Registration"
            ) : (
              "Save Changes"
            )}
          </Button>
        </Box>
      </Box>

      {/* Success Snackbar */}
      <Snackbar
        open={success}
        autoHideDuration={2000}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity="success" variant="filled" icon={<IconCheck size={20} />}>
          {mode === "create"
            ? "Member registration completed successfully! Redirecting..."
            : "Member updated successfully! Redirecting..."}
        </Alert>
      </Snackbar>
    </>
  );
}
