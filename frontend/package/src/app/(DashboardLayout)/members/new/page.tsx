"use client";

import { useEffect, useState } from "react";

import {
  Box,
  Card,
  CardContent,
  Container,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from "@mui/material";

import { Member } from "@/interfaces/member";

import MemberDetailsStep from "@/components/members/forms/MemberDetailsStep";
import NextOfKinStep from "@/components/members/forms/NextOfKinStep";
import VehicleStep from "@/components/members/forms/VehicleStep";
import GuarantorStep from "@/components/members/forms/GuarantorStep";
import ReviewStep from "@/components/members/forms/ReviewStep";

const steps = [
  "Member Details",
  "Next of Kin",
  "Vehicle",
  "Guarantor",
  "Review",
];

export default function RegisterMemberPage() {
  const [activeStep, setActiveStep] = useState(0);

  const [member, setMember] =
    useState<Member | null>(null);

  const [nextOfKin, setNextOfKin] =
    useState<any>(null);

  const [vehicle, setVehicle] =
    useState<any>(null);

  const [guarantor, setGuarantor] =
    useState<any>(null);

  /**
   * Restore progress
   */
  useEffect(() => {
    const saved = localStorage.getItem(
      "member-registration"
    );

    if (!saved) return;

    const data = JSON.parse(saved);

    setActiveStep(data.activeStep ?? 0);
    setMember(data.member ?? null);
    setNextOfKin(data.nextOfKin ?? null);
    setVehicle(data.vehicle ?? null);
    setGuarantor(data.guarantor ?? null);
  }, []);

  /**
   * Persist progress
   */
  useEffect(() => {
    localStorage.setItem(
      "member-registration",
      JSON.stringify({
        activeStep,
        member,
        nextOfKin,
        vehicle,
        guarantor,
      })
    );
  }, [
    activeStep,
    member,
    nextOfKin,
    vehicle,
    guarantor,
  ]);

  return (
    <Container maxWidth="xl">
      <Typography
        variant="h4"
        mb={3}
      >
        Register Member
      </Typography>

      <Card>
        <CardContent>
          <Stepper
            activeStep={activeStep}
            sx={{ mb: 5 }}
          >
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box>
            {activeStep === 0 && (
              <MemberDetailsStep
                onComplete={(createdMember) => {
                  setMember(createdMember);
                  setActiveStep(1);
                }}
              />
            )}

            {activeStep === 1 &&
              member && (
                <NextOfKinStep
                  memberId={member.id}
                  onBack={() =>
                    setActiveStep(0)
                  }
                  onComplete={(kin: any) => {
                    setNextOfKin(kin);
                    setActiveStep(2);
                  }}
                />
              )}

            {activeStep === 2 &&
              member && (
                <VehicleStep
                  memberId={member.id}
                  onBack={() =>
                    setActiveStep(1)
                  }
                  onComplete={(vehicle: any) => {
                    setVehicle(vehicle);
                    setActiveStep(3);
                  }}
                />
              )}

            {activeStep === 3 &&
              member && (
                <GuarantorStep
                  memberId={member.id}
                  onBack={() =>
                    setActiveStep(2)
                  }
                  onComplete={(guarantor: any) => {
                    setGuarantor(
                      guarantor
                    );
                    setActiveStep(4);
                  }}
                />
              )}

            {activeStep === 4 &&
              member && (
                <ReviewStep
                  member={member}
                  nextOfKin={nextOfKin}
                  vehicle={vehicle}
                  guarantor={guarantor}
                  onBack={() =>
                    setActiveStep(3)
                  }
                />
              )}
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}