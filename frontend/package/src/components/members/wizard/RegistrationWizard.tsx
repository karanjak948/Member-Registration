"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Step,
  StepConnector,
  stepConnectorClasses,
  StepIconProps,
  StepLabel,
  Stepper,
  styled,
  Typography,
} from "@mui/material";

import MemberDetailsStep, {
  MemberFormData,
} from "@/components/members/forms/MemberDetailsStep";

import NextOfKinStep from "@/components/members/forms/NextOfKinStep";
import VehicleStep from "@/components/members/forms/VehicleStep";
import GuarantorStep from "@/components/members/forms/GuarantorStep";
import ReviewStep from "@/components/members/forms/ReviewStep";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import registrationService from "@/services/registration.service";

import {
  replaceMember,
  replaceNextOfKin,
  replaceVehicle,
  replaceGuarantor,
  setCurrentStep,
} from "@/store/registration/registrationSlice";

import type { MemberState } from "@/types/registration";
import { memberToState } from "@/utils/memberMapper";
import {
  IconUser,
  IconHeartHandshake,
  IconCar,
  IconShieldCheck,
  IconCheck,
  IconClipboardCheck,
  IconArrowLeft,
  IconSparkles,
} from "@tabler/icons-react";

/* =========================================================
   TYPES & STEP DEFINITIONS
========================================================= */

type RegistrationStepKey =
  | "member"
  | "nextOfKin"
  | "vehicle"
  | "guarantor"
  | "review";

interface RegistrationStepDefinition {
  key: RegistrationStepKey;
  label: string;
  subtitle: string;
  icon: any;
  color: string;
}

const REGISTRATION_STEPS: RegistrationStepDefinition[] = [
  {
    key: "member",
    label: "Member Details",
    subtitle: "Personal & KYC",
    icon: IconUser,
    color: "#059669",
  },
  {
    key: "nextOfKin",
    label: "Next of Kin",
    subtitle: "Emergency & Beneficiary",
    icon: IconHeartHandshake,
    color: "#e11d48",
  },
  {
    key: "vehicle",
    label: "Vehicle Asset",
    subtitle: "Fleet & Collateral",
    icon: IconCar,
    color: "#0d9488",
  },
  {
    key: "guarantor",
    label: "Guarantor",
    subtitle: "Endorsement & Security",
    icon: IconShieldCheck,
    color: "#2563eb",
  },
  {
    key: "review",
    label: "Review & Submit",
    subtitle: "Final Confirmation",
    icon: IconClipboardCheck,
    color: "#065f46",
  },
];

/* =========================================================
   CUSTOM STEPPER STYLES
========================================================= */

const CustomConnector = styled(StepConnector)(() => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 26,
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: "#059669",
      borderWidth: 2.5,
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: "#10b981",
      borderWidth: 2.5,
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    borderColor: "#e2e8f0",
    borderTopWidth: 2,
    borderRadius: 1,
  },
}));

const CustomStepIconRoot = styled("div")<{
  ownerState: { completed?: boolean; active?: boolean; color?: string };
}>(({ ownerState }) => ({
  backgroundColor: "#f8fafc",
  zIndex: 1,
  color: "#64748b",
  width: 46,
  height: 46,
  display: "flex",
  borderRadius: "50%",
  justifyContent: "center",
  alignItems: "center",
  border: "2px solid #e2e8f0",
  transition: "all 0.3s ease",
  ...(ownerState.active && {
    background: `linear-gradient(135deg, ${ownerState.color || "#059669"} 0%, #064e3b 100%)`,
    color: "#ffffff",
    borderColor: "#34d399",
    boxShadow: "0 0 0 4px rgba(5, 150, 105, 0.25)",
    transform: "scale(1.08)",
  }),
  ...(ownerState.completed && {
    background: "#059669",
    color: "#ffffff",
    borderColor: "#059669",
  }),
}));

function CustomStepIcon(props: StepIconProps & { iconIndex: number }) {
  const { active, completed, className, iconIndex } = props;
  const stepDef = REGISTRATION_STEPS[iconIndex] || REGISTRATION_STEPS[0];
  const StepIconDef = stepDef.icon || IconUser;

  return (
    <CustomStepIconRoot
      ownerState={{ completed, active, color: stepDef.color }}
      className={className}
    >
      {completed ? <IconCheck size={20} stroke={3} /> : <StepIconDef size={20} />}
    </CustomStepIconRoot>
  );
}

/* =========================================================
   PROPS
========================================================= */

interface RegistrationWizardProps {
  mode: "create" | "edit";
  memberId?: number;
}

/* =========================================================
   COMPONENT
========================================================= */

export default function RegistrationWizard({
  mode,
  memberId,
}: RegistrationWizardProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const [loadingRegistration, setLoadingRegistration] = useState(mode === "edit");
  const [loadError, setLoadError] = useState("");

  const { currentStep: storedCurrentStep, member } = useAppSelector(
    (state) => state.registration,
  );

  /* =======================================================
     LOAD REGISTRATION FOR EDIT MODE
  ======================================================= */

  useEffect(() => {
    if (mode !== "edit") return;

    if (!memberId) {
      setLoadError("Invalid member identifier.");
      setLoadingRegistration(false);
      return;
    }

    async function loadRegistration() {
      try {
        setLoadingRegistration(true);
        const registration = await registrationService.loadRegistration(memberId!);

        dispatch(replaceMember(memberToState(registration.member)));

        if (registration.nextOfKin) {
          dispatch(replaceNextOfKin({ ...registration.nextOfKin }));
        }

        if (registration.vehicle) {
          dispatch(replaceVehicle({ ...registration.vehicle }));
        }

        if (registration.guarantor) {
          dispatch(replaceGuarantor({ ...registration.guarantor }));
        }
      } catch (error) {
        console.error(error);
        setLoadError("Unable to load member registration details.");
      } finally {
        setLoadingRegistration(false);
      }
    }

    loadRegistration();
  }, [mode, memberId, dispatch]);

  /* =======================================================
     CATEGORY & STEP WORKFLOW LOGIC
  ======================================================= */

  const categoryCode =
    member.category_details?.code?.trim().toUpperCase() ||
    (member.category === 1 || String(member.category) === "1" ? "NORMAL" : "");

  /*
   * Normal Members require the complete registration workflow (all steps mandatory).
   * Special and Other Members can skip secondary steps if not applicable.
   */
  const isNormalMember =
    categoryCode === "NORMAL" ||
    Boolean(member.category_details?.name?.toLowerCase().includes("normal")) ||
    member.category === 1 ||
    String(member.category) === "1" ||
    (typeof member.category === "string" &&
      member.category.toLowerCase().includes("normal"));

  const hasSelectedCategory =
    member.category !== "" && (member.category_details !== null || member.category !== undefined);

  const steps = useMemo(() => REGISTRATION_STEPS, []);

  const [activeStep, setActiveStep] = useState(() => {
    if (typeof storedCurrentStep === "number" && Number.isFinite(storedCurrentStep)) {
      return storedCurrentStep;
    }
    return 0;
  });

  const safeActiveStep = Math.min(
    Math.max(activeStep, 0),
    Math.max(steps.length - 1, 0),
  );

  const currentStep = steps[safeActiveStep];

  useEffect(() => {
    if (storedCurrentStep !== safeActiveStep) {
      dispatch(setCurrentStep(safeActiveStep));
    }
  }, [dispatch, safeActiveStep, storedCurrentStep]);

  function goToStep(nextStep: number) {
    const normalizedStep = Math.min(
      Math.max(nextStep, 0),
      Math.max(steps.length - 1, 0),
    );
    dispatch(setCurrentStep(normalizedStep));
    setActiveStep(normalizedStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleNext() {
    goToStep(safeActiveStep + 1);
  }

  function handleBack() {
    goToStep(safeActiveStep - 1);
  }

  function handleMemberComplete(data: MemberFormData) {
    dispatch(
      replaceMember({
        ...member,
        ...data,
        id: member.id || memberId,
        membership_number: member.membership_number,
      } as MemberState),
    );
    handleNext();
  }

  function isStepRequired(key: RegistrationStepKey): boolean {
    if (key === "member" || key === "review") {
      return true;
    }
    return isNormalMember;
  }

  function renderCurrentStep(): ReactNode {
    if (!currentStep) return null;

    const required = isStepRequired(currentStep.key);

    switch (currentStep.key) {
      case "member":
        return (
          <MemberDetailsStep
            initialValues={member}
            onComplete={handleMemberComplete}
            submitLabel="Continue to Next of Kin"
          />
        );

      case "nextOfKin":
        return (
          <NextOfKinStep
            required={required}
            onBack={handleBack}
            onComplete={handleNext}
            onSkip={handleNext}
          />
        );

      case "vehicle":
        return (
          <VehicleStep
            required={required}
            onBack={handleBack}
            onComplete={handleNext}
            onSkip={handleNext}
          />
        );

      case "guarantor":
        return (
          <GuarantorStep
            required={required}
            onBack={handleBack}
            onComplete={handleNext}
            onSkip={handleNext}
          />
        );

      case "review":
        return (
          <ReviewStep
            mode={mode}
            memberId={memberId}
            onBack={handleBack}
          />
        );

      default:
        return null;
    }
  }

  if (loadingRegistration) {
    return (
      <Container maxWidth="xl" sx={{ py: 8 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
          <CircularProgress color="success" size={42} />
        </Box>
      </Container>
    );
  }

  if (loadError) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ borderRadius: 2.5, fontWeight: 700 }}>
          {loadError}
        </Alert>
      </Container>
    );
  }

  const categoryDisplayName =
    member.category_details?.name ||
    (isNormalMember ? "Normal Member" : "Selected Category");

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 3 } }}>
      {/* 1. EXECUTIVE HERO BANNER */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3.5 },
          borderRadius: 3.5,
          background: "linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)",
          color: "#ffffff",
          boxShadow: "0 10px 30px -5px rgba(6, 78, 59, 0.35)",
          mb: 3,
          position: "relative",
          overflow: "hidden",
        }}
      >
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
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
        >
          <Box>
            <Stack direction="row" spacing={1.5} alignItems="center" mb={0.5}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 900,
                  color: "#ffffff",
                  fontSize: { xs: "1.4rem", md: "1.85rem" },
                  letterSpacing: "-0.5px",
                }}
              >
                {mode === "create"
                  ? "Register Member"
                  : `Edit Member: ${member.first_name || ""} ${member.other_names || ""}`}
              </Typography>

              {member.membership_number && (
                <Chip
                  size="small"
                  label={member.membership_number}
                  sx={{
                    fontFamily: "monospace",
                    fontWeight: 900,
                    fontSize: "0.85rem",
                    bgcolor: "rgba(255, 255, 255, 0.2)",
                    color: "#ffffff",
                    border: "1px solid rgba(255, 255, 255, 0.35)",
                  }}
                />
              )}
            </Stack>

            <Typography variant="body2" sx={{ color: "#a7f3d0", fontWeight: 600 }}>
              {mode === "create"
                ? "Complete the required registration information before submitting the member for approval."
                : "Update and verify member information and registration details."}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.5} alignItems="center">
            {hasSelectedCategory && (
              <Chip
                label={categoryDisplayName}
                sx={{
                  fontWeight: 800,
                  fontSize: "0.82rem",
                  bgcolor: "rgba(16, 185, 129, 0.3)",
                  color: "#ffffff",
                  border: "1px solid rgba(167, 243, 208, 0.4)",
                }}
              />
            )}

            <Button
              startIcon={<IconArrowLeft size={18} />}
              onClick={() => router.push("/members")}
              sx={{
                bgcolor: "rgba(255, 255, 255, 0.15)",
                color: "#ffffff",
                fontWeight: 800,
                borderRadius: 2.5,
                px: 2.25,
                py: 0.9,
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                "&:hover": {
                  bgcolor: "rgba(255, 255, 255, 0.25)",
                },
              }}
            >
              Back to Members
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* 2. MAIN WIZARD CONTAINER */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 3.5,
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 25px -4px rgba(0, 0, 0, 0.05)",
          bgcolor: "#ffffff",
          overflow: "visible",
        }}
      >
        <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
          {/* STEPPER BAR (Added ample padding-top and margin to ensure circles are never clipped) */}
          <Box sx={{ overflowX: "auto", pt: 3.5, pb: 2.5, px: 1, mb: 3 }}>
            <Stepper
              activeStep={safeActiveStep}
              alternativeLabel
              connector={<CustomConnector />}
              sx={{ minWidth: 650, pt: 1 }}
            >
              {steps.map((step, index) => {
                const required = isStepRequired(step.key);

                return (
                  <Step key={step.key} completed={index < safeActiveStep}>
                    <StepLabel
                      StepIconComponent={(props) => (
                        <CustomStepIcon {...props} iconIndex={index} />
                      )}
                      optional={
                        hasSelectedCategory && !required && step.key !== "review" ? (
                          <Typography
                            variant="caption"
                            sx={{
                              display: "block",
                              fontWeight: 700,
                              color: "#94a3b8",
                              fontSize: "0.72rem",
                            }}
                          >
                            Optional
                          </Typography>
                        ) : undefined
                      }
                    >
                      <Typography
                        sx={{
                          fontWeight: safeActiveStep === index ? 900 : 700,
                          color: safeActiveStep === index ? "#0f172a" : "#64748b",
                          fontSize: "0.9rem",
                        }}
                      >
                        {step.label}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#94a3b8",
                          fontWeight: 600,
                          fontSize: "0.72rem",
                          display: "block",
                        }}
                      >
                        {step.subtitle}
                      </Typography>
                    </StepLabel>
                  </Step>
                );
              })}
            </Stepper>
          </Box>

          {/* ACTIVE STEP CONTENT */}
          <Box>{renderCurrentStep()}</Box>
        </CardContent>
      </Card>
    </Container>
  );
}
