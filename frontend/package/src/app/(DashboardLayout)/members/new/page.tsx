"use client";

import { ReactNode, useMemo, useState } from "react";

import {
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from "@mui/material";

import MemberDetailsStep from "@/components/members/forms/MemberDetailsStep";
import NextOfKinStep from "@/components/members/forms/NextOfKinStep";
import VehicleStep from "@/components/members/forms/VehicleStep";
import GuarantorStep from "@/components/members/forms/GuarantorStep";
import ReviewStep from "@/components/members/forms/ReviewStep";

/*
 * Each registration step has a stable key.
 *
 * We use keys instead of hardcoded numeric positions
 * because the number and order of steps will vary
 * according to the selected member category.
 */
type RegistrationStepKey =
  | "member"
  | "nextOfKin"
  | "vehicle"
  | "guarantor"
  | "review";

interface RegistrationStepDefinition {
  key: RegistrationStepKey;
  label: string;
}

/*
 * Phase 3A foundation:
 *
 * This is currently the full Normal Member workflow.
 *
 * Once we inspect the Redux registration slice,
 * this array will be generated dynamically from
 * the selected member category.
 */
const DEFAULT_REGISTRATION_STEPS: RegistrationStepDefinition[] = [
  {
    key: "member",
    label: "Member Details",
  },
  {
    key: "nextOfKin",
    label: "Next of Kin",
  },
  {
    key: "vehicle",
    label: "Vehicle",
  },
  {
    key: "guarantor",
    label: "Guarantor",
  },
  {
    key: "review",
    label: "Review",
  },
];

export default function RegisterMemberPage() {
  const [activeStep, setActiveStep] = useState(0);

  /*
   * This will become category-driven after
   * we inspect the Redux registration slice.
   *
   * For now, keeping the existing full workflow
   * ensures we do not break registration while
   * refactoring the navigation architecture.
   */
  const steps = useMemo(() => DEFAULT_REGISTRATION_STEPS, []);

  /*
   * Protect against an invalid activeStep if
   * the step list changes dynamically later.
   */
  const safeActiveStep = Math.min(activeStep, Math.max(steps.length - 1, 0));

  const currentStep = steps[safeActiveStep];

  /*
   * Generic navigation functions.
   *
   * No registration component needs to know
   * that Next of Kin is "step 1" or Review
   * is "step 4".
   *
   * This is essential for category-based
   * conditional workflows.
   */
  function handleNext() {
    setActiveStep((current) => Math.min(current + 1, steps.length - 1));
  }

  function handleBack() {
    setActiveStep((current) => Math.max(current - 1, 0));
  }

  /*
   * Render the current registration component
   * using the stable step key instead of
   * hardcoded numeric indexes.
   */
  function renderCurrentStep(): ReactNode {
    if (!currentStep) {
      return null;
    }

    switch (currentStep.key) {
      case "member":
        return <MemberDetailsStep onComplete={handleNext} />;

      case "nextOfKin":
        return <NextOfKinStep onBack={handleBack} onComplete={handleNext} />;

      case "vehicle":
        return <VehicleStep onBack={handleBack} onComplete={handleNext} />;

      case "guarantor":
        return <GuarantorStep onBack={handleBack} onComplete={handleNext} />;

      case "review":
        return <ReviewStep onBack={handleBack} />;

      default:
        return null;
    }
  }

  return (
    <Container maxWidth="xl">
      {/* =========================
          PAGE HEADER
      ========================== */}

      <Box
        sx={{
          mb: 3,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: {
              xs: "flex-start",
              sm: "center",
            },
            justifyContent: "space-between",
            flexDirection: {
              xs: "column",
              sm: "row",
            },
            gap: 1.5,
          }}
        >
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Register Member
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 0.5,
              }}
            >
              Complete the required registration information before submitting
              the member for approval.
            </Typography>
          </Box>

          <Chip
            label="Data Capture Pending"
            color="warning"
            variant="outlined"
            size="small"
          />
        </Box>
      </Box>

      {/* =========================
          REGISTRATION CARD
      ========================== */}

      <Card
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 3,
        }}
      >
        <CardContent
          sx={{
            p: {
              xs: 2,
              md: 3,
            },

            "&:last-child": {
              pb: {
                xs: 2,
                md: 3,
              },
            },
          }}
        >
          {/* =========================
              DYNAMIC STEPPER
          ========================== */}

          <Box
            sx={{
              overflowX: "auto",
              pb: 1,
            }}
          >
            <Stepper
              activeStep={safeActiveStep}
              alternativeLabel
              sx={{
                mb: 4,
                minWidth: steps.length > 3 ? 650 : "auto",
              }}
            >
              {steps.map((step) => (
                <Step key={step.key}>
                  <StepLabel>{step.label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

          {/* Current-step context */}

          <Box
            sx={{
              mb: 3,
            }}
          >
            <Typography variant="subtitle2" color="text.secondary">
              Step {safeActiveStep + 1} of {steps.length}
            </Typography>

            <Typography variant="h5" fontWeight={700}>
              {currentStep?.label}
            </Typography>
          </Box>

          {/* =========================
              ACTIVE FORM
          ========================== */}

          <Box>{renderCurrentStep()}</Box>
        </CardContent>
      </Card>
    </Container>
  );
}
