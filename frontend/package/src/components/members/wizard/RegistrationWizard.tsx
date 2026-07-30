"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
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

import registrationService from "@/services/registration.service";

import {
  setMember,
  replaceMember,
  replaceNextOfKin,
  replaceVehicle,
  replaceGuarantor,
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

  const [loadingRegistration, setLoadingRegistration] = useState(
    mode === "edit"
  );
  const [loadError, setLoadError] = useState("");

  const { currentStep: storedCurrentStep, member } = useAppSelector(
    (state) => state.registration,
  );

  /* =======================================================
     LOAD REGISTRATION FOR EDIT MODE
  ======================================================= */

  useEffect(() => {
    if (mode !== "edit") {
      return;
    }

    if (!memberId) {
      setLoadError("Invalid member.");
      setLoadingRegistration(false);
      return;
    }

    const id = memberId;

    async function loadRegistration() {
      try {
        const registration = await registrationService.loadRegistration(
          id,
        );

        console.log("Loaded registration:", registration);
        console.log("Loaded Next Of Kin:", registration.nextOfKin);
        console.log("Loaded Vehicle:", registration.vehicle);
        console.log("Loaded Guarantor:", registration.guarantor);

        dispatch(
          replaceMember({
            id: registration.member.id,

            membership_number:
              registration.member.membership_number,

            first_name:
              registration.member.first_name,

            other_names:
              registration.member.other_names,

            national_id:
              registration.member.national_id,

            phone_number:
              registration.member.phone_number,

            email:
              registration.member.email ?? "",

            physical_address:
              registration.member.physical_address,

            occupation:
              registration.member.occupation,

            kra_pin:
              registration.member.kra_pin ?? "",

            category:
              registration.member.category ?? "",

            category_details: registration.category
              ? {
                  id: registration.category.id,
                  name: registration.category.name,
                  code: registration.category.code,
                }
              : null,

            passport_photo:
              registration.member.passport_photo,

            status:
              registration.member.status,

            registration_stage:
              registration.member.registration_stage,
          }),
        );

        if (registration.nextOfKin) {
          dispatch(
            replaceNextOfKin({
              ...registration.nextOfKin,
            }),
          );
        }

        if (registration.vehicle) {
          dispatch(
            replaceVehicle({
              ...registration.vehicle,
            }),
          );
        }

        if (registration.guarantor) {
          dispatch(
            replaceGuarantor({
              ...registration.guarantor,
            }),
          );
        }
      } catch (error) {
        console.error(error);

        setLoadError(
          "Unable to load registration.",
        );
      } finally {
        setLoadingRegistration(false);
      }
    }

    loadRegistration();
  }, [
    mode,
    memberId,
    dispatch,
  ]);

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
    dispatch(setMember(data));

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
        return (
          <ReviewStep
            mode={mode}
            onBack={handleBack}
          />
        );

      default:
        return null;
    }
  }

  /* =======================================================
     LOADING / ERROR STATES
  ======================================================= */

  if (loadingRegistration) {
    return (
      <Container maxWidth="lg">
        <Box
          display="flex"
          justifyContent="center"
          py={8}
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (loadError) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error">
          {loadError}
        </Alert>
      </Container>
    );
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
              {mode === "create" ? "Register Member" : "Edit Member"}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 0.5,
              }}
            >
              {mode === "create"
                ? "Complete the required registration information before submitting the member for approval."
                : "Update the member's information and registration details."}
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
              label={mode === "create" ? "Data Capture Pending" : "Editing"}
              color={mode === "create" ? "warning" : "info"}
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