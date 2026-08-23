"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
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
import {
  replaceMember,
  setCurrentStep,
} from "@/store/registration/registrationSlice";

import type { MemberState } from "@/types/registration";
import {
  IconUserPlus,
  IconUser,
  IconHeartHandshake,
  IconCar,
  IconShieldCheck,
  IconCheck,
  IconClipboardCheck,
  IconArrowLeft,
} from "@tabler/icons-react";

/* =========================================================
   TYPES & WORKFLOW DEFINITIONS
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
}

const REGISTRATION_STEPS: RegistrationStepDefinition[] = [
  {
    key: "member",
    label: "Member Details",
    subtitle: "Personal & Contact Info",
    icon: IconUser,
  },
  {
    key: "nextOfKin",
    label: "Next of Kin",
    subtitle: "Emergency & Beneficiary",
    icon: IconHeartHandshake,
  },
  {
    key: "vehicle",
    label: "Vehicle Asset",
    subtitle: "Collateral & Operations",
    icon: IconCar,
  },
  {
    key: "guarantor",
    label: "Guarantor",
    subtitle: "Security & Reference",
    icon: IconShieldCheck,
  },
  {
    key: "review",
    label: "Review & Submit",
    subtitle: "Final Confirmation",
    icon: IconClipboardCheck,
  },
];

const NORMAL_CATEGORY_CODE = "NORMAL";

/* =========================================================
   CUSTOM STYLED STEPPER
========================================================= */

const CustomConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 22,
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: "#059669",
      borderWidth: 2,
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: "#10b981",
      borderWidth: 2,
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    borderColor: "#e2e8f0",
    borderTopWidth: 2,
    borderRadius: 1,
  },
}));

const CustomStepIconRoot = styled("div")<{
  ownerState: { completed?: boolean; active?: boolean };
}>(({ ownerState }) => ({
  backgroundColor: "#f1f5f9",
  zIndex: 1,
  color: "#64748b",
  width: 44,
  height: 44,
  display: "flex",
  borderRadius: "50%",
  justifyContent: "center",
  alignItems: "center",
  border: "2px solid #e2e8f0",
  transition: "all 0.3s ease",
  ...(ownerState.active && {
    background: "linear-gradient(135deg, #064e3b 0%, #059669 100%)",
    color: "#ffffff",
    borderColor: "#34d399",
    boxShadow: "0 0 0 4px rgba(5, 150, 105, 0.2)",
    transform: "scale(1.05)",
  }),
  ...(ownerState.completed && {
    background: "#059669",
    color: "#ffffff",
    borderColor: "#059669",
  }),
}));

function CustomStepIcon(props: StepIconProps & { iconIndex: number }) {
  const { active, completed, className, iconIndex } = props;
  const StepIconDef = REGISTRATION_STEPS[iconIndex]?.icon || IconUser;

  return (
    <CustomStepIconRoot ownerState={{ completed, active }} className={className}>
      {completed ? <IconCheck size={20} stroke={3} /> : <StepIconDef size={20} />}
    </CustomStepIconRoot>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function RegisterMemberPage() {
  const dispatch = useAppDispatch();

  const { currentStep: storedCurrentStep, member } = useAppSelector(
    (state) => state.registration,
  );

  const categoryCode =
    member.category_details?.code?.trim().toUpperCase() ||
    (member.category === 1 || String(member.category) === "1"
      ? "NORMAL"
      : "");

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
    if (
      typeof storedCurrentStep === "number" &&
      Number.isFinite(storedCurrentStep)
    ) {
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
    if (!currentStep) {
      return null;
    }

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
          <Box>
            {!required && <OptionalStepNotice label="Next of Kin" />}
            <NextOfKinStep
              required={required}
              onBack={handleBack}
              onComplete={handleNext}
              onSkip={handleNext}
            />
          </Box>
        );

      case "vehicle":
        return (
          <Box>
            {!required && <OptionalStepNotice label="Vehicle" />}
            <VehicleStep
              required={required}
              onBack={handleBack}
              onComplete={handleNext}
              onSkip={handleNext}
            />
          </Box>
        );

      case "guarantor":
        return (
          <Box>
            {!required && <OptionalStepNotice label="Guarantor" />}
            <GuarantorStep
              required={required}
              onBack={handleBack}
              onComplete={handleNext}
              onSkip={handleNext}
            />
          </Box>
        );

      case "review":
        return <ReviewStep onBack={handleBack} />;

      default:
        return null;
    }
  }

  return (
    <Container
      maxWidth="xl"
      sx={{
        py: {
          xs: 2,
          md: 3,
        },
      }}
    >
      {/* Executive Hero Banner */}
      <Box
        sx={{
          mb: 3.5,
          p: 3.5,
          borderRadius: 3,
          background: "linear-gradient(135deg, #064e3b 0%, #047857 50%, #0f766e 100%)",
          color: "#ffffff",
          boxShadow: "0 12px 28px -6px rgba(6, 78, 59, 0.35)",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
        >
          <Box>
            <Stack direction="row" spacing={1.5} alignItems="center" mb={0.5}>
              <Box sx={{ p: 1, bgcolor: "rgba(255,255,255,0.18)", borderRadius: 2, display: "flex" }}>
                <IconUserPlus size={28} color="#6ee7b7" />
              </Box>
              <Typography variant="h4" fontWeight={800} sx={{ color: "#ffffff", letterSpacing: "-0.5px" }}>
                Member Onboarding &amp; Registration
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ color: "#a7f3d0" }}>
              Complete the guided multi-step profile capture to register and submit the new SACCO member
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {hasSelectedCategory && (
              <Chip
                label={member.category_details?.name ?? "Selected Category"}
                sx={{
                  bgcolor: "rgba(255,255,255,0.2)",
                  color: "#ffffff",
                  fontWeight: 700,
                  border: "1px solid rgba(255,255,255,0.3)",
                }}
              />
            )}
            <Chip
              label="Data Capture Pending"
              sx={{
                bgcolor: "#fef3c7",
                color: "#92400e",
                fontWeight: 700,
                border: "1px solid #fde68a",
              }}
            />
          </Stack>
        </Stack>
      </Box>

      {/* Modern Stepper Navigation Card */}
      <Card
        elevation={0}
        sx={{
          mb: 3.5,
          border: "1px solid #e2e8f0",
          borderRadius: 3,
          boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
          overflow: "visible",
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box
            sx={{
              overflowX: "auto",
              overflowY: "hidden",
              py: 1,
            }}
          >
            <Stepper
              activeStep={safeActiveStep}
              alternativeLabel
              connector={<CustomConnector />}
              sx={{ minWidth: 680 }}
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
                        <Typography
                          variant="caption"
                          sx={{
                            display: "block",
                            textAlign: "center",
                            color: "text.secondary",
                            fontSize: "0.75rem",
                            mt: 0.5,
                          }}
                        >
                          {hasSelectedCategory && !required && step.key !== "review"
                            ? "Optional"
                            : step.subtitle}
                        </Typography>
                      }
                    >
                      <Typography
                        variant="body2"
                        fontWeight={index === safeActiveStep ? 800 : 600}
                        sx={{
                          color: index === safeActiveStep ? "#064e3b" : "text.primary",
                          fontSize: "0.875rem",
                        }}
                      >
                        {step.label}
                      </Typography>
                    </StepLabel>
                  </Step>
                );
              })}
            </Stepper>
          </Box>
        </CardContent>
      </Card>

      {/* Active Wizard Form Card */}
      <Card
        elevation={0}
        sx={{
          border: "1px solid #e2e8f0",
          borderRadius: 3,
          boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
          overflow: "visible",
        }}
      >
        <CardContent
          sx={{
            p: { xs: 2.5, sm: 3.5, md: 4 },
            "&:last-child": {
              pb: { xs: 2.5, sm: 3.5, md: 4 },
            },
          }}
        >
          {/* Step Context Title */}
          <Box
            sx={{
              mb: 3.5,
              pb: 2,
              borderBottom: "1px solid #f1f5f9",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 1.5,
            }}
          >
            <Box>
              <Typography variant="caption" fontWeight={700} sx={{ color: "#059669", letterSpacing: 0.5 }}>
                STEP {safeActiveStep + 1} OF {steps.length}
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ color: "text.primary", mt: 0.25 }}>
                {currentStep?.label}
              </Typography>
            </Box>

            {currentStep && hasSelectedCategory && !isStepRequired(currentStep.key) && (
              <Chip
                label="Optional Step for Selected Tier"
                size="small"
                sx={{
                  bgcolor: "#f0fdf4",
                  color: "#059669",
                  border: "1px solid #bbf7d0",
                  fontWeight: 700,
                }}
              />
            )}
          </Box>

          {/* ACTIVE FORM STEP */}
          <Box>{renderCurrentStep()}</Box>
        </CardContent>
      </Card>
    </Container>
  );
}

/* =========================================================
   OPTIONAL STEP NOTICE
========================================================= */

function OptionalStepNotice({ label }: { label: string }) {
  return (
    <Alert
      severity="info"
      sx={{
        mb: 3,
        borderRadius: 2,
        bgcolor: "#eff6ff",
        color: "#1e40af",
        border: "1px solid #dbeafe",
      }}
    >
      <strong>{label}</strong> information is optional for this member classification. You can fill it in if applicable, or click <strong>Skip Step</strong> to proceed.
    </Alert>
  );
}
