"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  CircularProgress,
  Grid,
} from "@mui/material";

import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardStats from "@/components/dashboard/DashboardStats";
import QuickActions from "@/components/dashboard/QuickActions";

import LoanPortfolioStatusChart from "@/components/charts/LoanPortfolioStatusChart";
import CollectionsOverviewChart from "@/components/charts/CollectionsOverviewChart";
import LoanPerformanceChart from "@/components/charts/LoanPerformanceChart";
import MemberGrowthChart from "@/components/charts/MemberGrowthChart";
import TopLoanProductsChart from "@/components/charts/TopLoanProductsChart";
import RecentActivitiesFeed from "@/components/dashboard/RecentActivitiesFeed";

import memberService from "@/services/member.service";
import { Member } from "@/interfaces/member";

export default function Dashboard() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const data = await memberService.getAll();
      setMembers(data);
    } catch (error) {
      console.error("Failed to load members for dashboard:", error);
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(() => {
    const totalCount = members.length > 0 ? members.length : 2453;
    const activeCount = members.length > 0 ? members.filter((m) => m.status === "ACTIVE").length : 2453;
    const pendingCount = members.length > 0 ? members.filter((m) => m.registration_stage === "DATA_CAPTURE_PENDING").length : 23;

    return {
      totalMembers: totalCount,
      activeBorrowers: 543,
      todayCollections: "58,750",
      expectedThisWeek: "487,200",
      overdueLoansCount: 48,
      overdueAmount: "276,850",
      loanPortfolio: "12,450,300",
      securityDeposits: "3,112,575",
      availableLendingCapital: "4,875,000",
      smsBalance: 1587,
      pendingApplications: pendingCount,
    };
  }, [members]);

  return (
    <PageContainer
      title="Royal SACCO Dashboard"
      description="Member Registration & Lending Management Dashboard"
    >
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        <DashboardHeader />

        {loading ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            py={10}
          >
            <CircularProgress color="primary" />
          </Box>
        ) : (
          <>
            {/* Top & Bottom 10 KPI Metric Cards */}
            <DashboardStats
              totalMembers={stats.totalMembers}
              activeBorrowers={stats.activeBorrowers}
              todayCollections={stats.todayCollections}
              expectedThisWeek={stats.expectedThisWeek}
              overdueLoansCount={stats.overdueLoansCount}
              overdueAmount={stats.overdueAmount}
              loanPortfolio={stats.loanPortfolio}
              securityDeposits={stats.securityDeposits}
              availableLendingCapital={stats.availableLendingCapital}
              smsBalance={stats.smsBalance}
              pendingApplications={stats.pendingApplications}
            />

            {/* Middle Section - 3 Core Charts */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                <LoanPortfolioStatusChart />
              </Grid>

              <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                <CollectionsOverviewChart />
              </Grid>

              <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                <LoanPerformanceChart />
              </Grid>
            </Grid>

            {/* Lower Section - Growth, Products & Recent Activities */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                <MemberGrowthChart />
              </Grid>

              <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                <TopLoanProductsChart />
              </Grid>

              <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                <RecentActivitiesFeed />
              </Grid>
            </Grid>

            {/* Quick Actions */}
            <Box sx={{ mt: 3 }}>
              <QuickActions />
            </Box>
          </>
        )}
      </Box>
    </PageContainer>
  );
}