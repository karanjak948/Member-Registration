"use client";

import { useState } from "react";

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
                onComplete={() => setActiveStep(1)}
              />
            )}

            {activeStep === 1 && (
              <NextOfKinStep
                onBack={() => setActiveStep(0)}
                onComplete={() => setActiveStep(2)}
              />
            )}

            {activeStep === 2 && (
              <VehicleStep
                onBack={() => setActiveStep(1)}
                onComplete={() => setActiveStep(3)}
              />
            )}

            {activeStep === 3 && (
              <GuarantorStep
                onBack={() => setActiveStep(2)}
                onComplete={() => setActiveStep(4)}
              />
            )}

            {activeStep === 4 && (
              <ReviewStep
                onBack={() => setActiveStep(3)}
              />
            )}
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}