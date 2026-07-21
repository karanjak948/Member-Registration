"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";

import {
  Alert,
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

/* =========================================================
   TYPES
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
}

/* =========================================================
   WORKFLOW DEFINITIONS
========================================================= */

const REGISTRATION_STEPS: RegistrationStepDefinition[] = [
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

/*
 * Stable category codes.
 *
 * These MUST correspond to MemberCategory.code values
 * seeded/configured in Django.
 *
 * Never implement workflow rules using database IDs.
 */
const NORMAL_CATEGORY_CODE = "NORMAL";

/* =========================================================
   PAGE
========================================================= */

export default function RegisterMemberPage() {
  const dispatch = useAppDispatch();

  const { currentStep: storedCurrentStep, member } = useAppSelector(
    (state) => state.registration,
  );

  /* =======================================================
     CATEGORY WORKFLOW
  ======================================================= */

  const categoryCode =
    member.category_details?.code?.trim().toUpperCase() ?? "";

  /*
   * Normal Members require the complete registration
   * workflow.
   *
   * Special and Other Members can use the same workflow,
   * but related-data steps will become optional/skippable.
   */
  const isNormalMember = categoryCode === NORMAL_CATEGORY_CODE;

  const hasSelectedCategory =
    member.category !== "" && member.category_details !== null;

  /* =======================================================
     STEPS
  ======================================================= */

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

  /* =======================================================
     SYNCHRONIZE STEP
  ======================================================= */

  useEffect(() => {
    if (storedCurrentStep !== safeActiveStep) {
      dispatch(setCurrentStep(safeActiveStep));
    }
  }, [dispatch, safeActiveStep, storedCurrentStep]);

  /* =======================================================
     NAVIGATION
  ======================================================= */

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

  /* =======================================================
     MEMBER DETAILS
  ======================================================= */

  function handleMemberComplete(data: MemberFormData) {
    /*
     * Step 1 is always mandatory for every category.
     *
     * Store both:
     *
     * category        -> Django FK
     * category_details -> frontend workflow metadata
     */
    dispatch(replaceMember(data as MemberState));

    handleNext();
  }

  /* =======================================================
     STEP REQUIREMENT
  ======================================================= */

  function isStepRequired(key: RegistrationStepKey): boolean {
    /*
     * Member Details and Review always participate in
     * registration.
     */
    if (key === "member" || key === "review") {
      return true;
    }

    /*
     * Normal Member:
     *
     * Next of Kin
     * Vehicle
     * Guarantor
     *
     * are required.
     */
    return isNormalMember;
  }

  /* =======================================================
     STEP UI
  ======================================================= */

  function renderCurrentStep(): ReactNode {
    if (!currentStep) {
      return null;
    }

    const required = isStepRequired(currentStep.key);

    switch (currentStep.key) {
      /* ---------------------------------------------------
         MEMBER
      --------------------------------------------------- */

      case "member":
        return (
          <MemberDetailsStep
            initialValues={member}
            onComplete={handleMemberComplete}
            submitLabel="Next"
          />
        );

      /* ---------------------------------------------------
         NEXT OF KIN
      --------------------------------------------------- */

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

      /* ---------------------------------------------------
         VEHICLE
      --------------------------------------------------- */

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

      /* ---------------------------------------------------
         GUARANTOR
      --------------------------------------------------- */

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

      /* ---------------------------------------------------
         REVIEW
      --------------------------------------------------- */

      case "review":
        return <ReviewStep onBack={handleBack} />;

      default:
        return null;
    }
  }

  /* =======================================================
     UI
  ======================================================= */

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
      {/* HEADER */}

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

          <Box
            sx={{
              display: "flex",

              gap: 1,

              flexWrap: "wrap",

              justifyContent: {
                xs: "flex-start",
                sm: "flex-end",
              },
            }}
          >
            {hasSelectedCategory && (
              <Chip
                label={member.category_details?.name ?? "Selected Category"}
                variant="outlined"
                size="small"
              />
            )}

            <Chip
              label="Data Capture Pending"
              color="warning"
              variant="outlined"
              size="small"
            />
          </Box>
        </Box>
      </Box>

      {/* WIZARD */}

      <Card
        elevation={0}
        sx={{
          border: "1px solid",

          borderColor: "divider",

          borderRadius: 3,

          overflow: "visible",
        }}
      >
        <CardContent
          sx={{
            p: {
              xs: 2,
              sm: 2.5,
              md: 3,
            },

            "&:last-child": {
              pb: {
                xs: 2,
                sm: 2.5,
                md: 3,
              },
            },
          }}
        >
          {/* STEPPER */}

          <Box
            sx={{
              overflowX: "auto",

              overflowY: "hidden",

              pb: 1,
            }}
          >
            <Stepper
              activeStep={safeActiveStep}
              alternativeLabel
              sx={{
                mb: 4,

                minWidth: 650,
              }}
            >
              {steps.map((step, index) => {
                const required = isStepRequired(step.key);

                return (
                  <Step key={step.key} completed={index < safeActiveStep}>
                    <StepLabel
                      optional={
                        hasSelectedCategory &&
                        !required &&
                        step.key !== "review" ? (
                          <Typography variant="caption" color="text.secondary">
                            Optional
                          </Typography>
                        ) : undefined
                      }
                    >
                      {step.label}
                    </StepLabel>
                  </Step>
                );
              })}
            </Stepper>
          </Box>

          {/* STEP CONTEXT */}

          <Box
            sx={{
              mb: 3,
            }}
          >
            <Typography variant="subtitle2" color="text.secondary">
              Step {safeActiveStep + 1} of {steps.length}
            </Typography>

            <Box
              sx={{
                display: "flex",

                alignItems: "center",

                gap: 1,

                mt: 0.25,

                flexWrap: "wrap",
              }}
            >
              <Typography variant="h5" fontWeight={700}>
                {currentStep?.label}
              </Typography>

              {currentStep &&
                hasSelectedCategory &&
                !isStepRequired(currentStep.key) && (
                  <Chip label="Optional" size="small" variant="outlined" />
                )}
            </Box>
          </Box>

          {/* ACTIVE FORM */}

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
      }}
    >
      {label} information is optional for this member category. Complete it when
      applicable, or skip this step and continue with registration.
    </Alert>
  );
}
