"use client";

import { Box, Card, Grid, Typography } from "@mui/material";

import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import Logo from "@/app/(DashboardLayout)/layout/shared/logo/Logo";

import AuthForgotPassword from "../auth/AuthForgotPassword";

export default function ForgotPasswordPage() {
  return (
    <PageContainer
      title="Forgot Password"
      description="Reset your Member Registration System account password."
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
                Forgot your password?
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                textAlign="center"
                mb={4}
              >
                Enter the email address associated with your account and we will
                send you instructions to reset your password.
              </Typography>

              <AuthForgotPassword />
            </Card>
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  );
}
