"use client";

import { Grid, Box, Typography, Paper } from "@mui/material";
import { useSession } from "next-auth/react";

import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";

// Dashboard Components
import SalesOverview from "@/app/(DashboardLayout)/components/dashboard/SalesOverview";
import YearlyBreakup from "@/app/(DashboardLayout)/components/dashboard/YearlyBreakup";
import RecentTransactions from "@/app/(DashboardLayout)/components/dashboard/RecentTransactions";
import ProductPerformance from "@/app/(DashboardLayout)/components/dashboard/ProductPerformance";
import Blog from "@/app/(DashboardLayout)/components/dashboard/Blog";
import MonthlyEarnings from "@/app/(DashboardLayout)/components/dashboard/MonthlyEarnings";

const Dashboard = () => {
  const { data: session } = useSession();

  return (
    <PageContainer
      title="Dashboard"
      description="Member Registration Dashboard"
    >
      <Box>

        {/* Welcome Card */}
        <Paper
          elevation={2}
          sx={{
            mb: 3,
            p: 3,
            borderRadius: 2,
          }}
        >
          <Typography variant="h4" fontWeight={700}>
            Welcome,
            {" "}
            {session?.user?.username ?? "Guest"}
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            mt={1}
          >
            Logged in as {session?.user?.email}
          </Typography>
        </Paper>

        <Grid container spacing={3}>
          <Grid
            size={{
              xs: 12,
              lg: 8,
            }}
          >
            <SalesOverview />
          </Grid>

          <Grid
            size={{
              xs: 12,
              lg: 4,
            }}
          >
            <Grid container spacing={3}>
              <Grid size={12}>
                <YearlyBreakup />
              </Grid>

              <Grid size={12}>
                <MonthlyEarnings />
              </Grid>
            </Grid>
          </Grid>

          <Grid
            size={{
              xs: 12,
              lg: 4,
            }}
          >
            <RecentTransactions />
          </Grid>

          <Grid
            size={{
              xs: 12,
              lg: 8,
            }}
          >
            <ProductPerformance />
          </Grid>

          <Grid size={12}>
            <Blog />
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  );
};

export default Dashboard;