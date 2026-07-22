"use client";

import { Box, Card, Grid, Typography } from "@mui/material";

import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";

import Logo from "@/app/(DashboardLayout)/layout/shared/logo/Logo";

import AuthVerifyResetOTP from "../auth/AuthVerifyResetOTP";

export default function VerifyResetOTPPage() {
  return (
    <PageContainer
      title="Verify Reset Code"
      description="Verify your password reset code."
    >
      <Box
        sx={{
          position: "relative",

          minHeight: "100vh",

          "&:before": {
            content: '""',

            background: "radial-gradient(#d2f1df, #d3d7fa, #bad8f4)",

            backgroundSize: "400% 400%",

            animation: "gradient 15s ease infinite",

            position: "absolute",

            inset: 0,

            opacity: 0.3,
          },
        }}
      >
        <Grid
          container
          spacing={0}
          justifyContent="center"
          sx={{
            minHeight: "100vh",
          }}
        >
          <Grid
            display="flex"
            justifyContent="center"
            alignItems="center"
            size={{
              xs: 12,
              sm: 12,
              lg: 4,
              xl: 3,
            }}
            sx={{
              px: 2,
              py: 4,
            }}
          >
            <Card
              elevation={9}
              sx={{
                p: {
                  xs: 3,
                  sm: 4,
                },

                zIndex: 1,

                width: "100%",

                maxWidth: "500px",
              }}
            >
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                mb={3}
              >
                <Logo />
              </Box>

              <Typography
                variant="h4"
                fontWeight={700}
                textAlign="center"
                mb={1}
              >
                Verify Your Code
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                textAlign="center"
                mb={4}
              >
                We sent a 6-digit verification code to your registered email
                address.
              </Typography>

              <AuthVerifyResetOTP />
            </Card>
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  );
}
