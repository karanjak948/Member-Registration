"use client";

import Link from "next/link";

import { Box, Card, Grid, Stack, Typography } from "@mui/material";

import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";

import Logo from "@/app/(DashboardLayout)/layout/shared/logo/Logo";

import AuthLogin from "../auth/AuthLogin";

export default function LoginPage() {
  return (
    <PageContainer
      title="Sign In"
      description="Sign in to the Member Registration System."
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
              <Box display="flex" alignItems="center" justifyContent="center">
                <Logo />
              </Box>

              <AuthLogin
                subtext={
                  <Typography
                    variant="subtitle1"
                    textAlign="center"
                    color="text.secondary"
                    mb={3}
                    mt={1}
                  >
                    Sign in to continue to the Member Registration System
                  </Typography>
                }
                subtitle={
                  <Stack
                    direction="row"
                    spacing={1}
                    justifyContent="center"
                    alignItems="center"
                    flexWrap="wrap"
                    mt={3}
                  >
                    <Typography color="text.secondary" variant="body2">
                      Don&apos;t have an account?
                    </Typography>

                    <Typography
                      component={Link}
                      href="/authentication/register"
                      variant="body2"
                      fontWeight={600}
                      sx={{
                        textDecoration: "none",

                        color: "primary.main",
                      }}
                    >
                      Create an account
                    </Typography>
                  </Stack>
                }
              />
            </Card>
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  );
}
