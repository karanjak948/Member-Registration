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
import RecentMembers from "@/components/dashboard/RecentMembers";
import RecentActivity from "@/components/dashboard/RecentActivity";

import RegistrationTrendChart from "@/components/charts/RegistrationTrendChart";
import MemberStatusChart from "@/components/charts/MemberStatusChart";
import CategoryDistributionChart from "@/components/charts/CategoryDistributionChart";
import RegistrationStageChart from "@/components/charts/RegistrationStageChart";

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
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(() => {
    return {
      totalMembers: members.length,

      activeMembers: members.filter(
        (member) => member.status === "ACTIVE"
      ).length,

      inactiveMembers: members.filter(
        (member) => member.status === "INACTIVE"
      ).length,

      pendingMembers: members.filter(
        (member) =>
          member.registration_stage ===
          "DATA_CAPTURE_PENDING"
      ).length,

      approvedMembers: members.filter(
        (member) =>
          member.registration_stage ===
          "APPROVED"
      ).length,

      rejectedMembers: members.filter(
        (member) =>
          member.registration_stage ===
          "REJECTED"
      ).length,

      totalCategories: new Set(
        members.map(
          (member: any) =>
            member.category_name ??
            member.category?.name ??
            member.category
        )
      ).size,

      newMembersThisMonth: members.filter(
        (member) => {
          if (!member.created_at) {
            return false;
          }

          const created = new Date(
            member.created_at
          );

          const now = new Date();

          return (
            created.getMonth() ===
              now.getMonth() &&
            created.getFullYear() ===
              now.getFullYear()
          );
        }
      ).length,
    };
  }, [members]);

  return (
    <PageContainer
      title="Dashboard"
      description="Member Registration Dashboard"
    >
      <Box>

        <DashboardHeader />

        {loading ? (
          <Box
            display="flex"
            justifyContent="center"
            py={10}
          >
            <CircularProgress />
          </Box>
        ) : (
          <>

            <DashboardStats
              totalMembers={stats.totalMembers}
              activeMembers={stats.activeMembers}
              pendingMembers={stats.pendingMembers}
              inactiveMembers={stats.inactiveMembers}
              approvedMembers={
                stats.approvedMembers
              }
              rejectedMembers={
                stats.rejectedMembers
              }
              totalCategories={
                stats.totalCategories
              }
              newMembersThisMonth={
                stats.newMembersThisMonth
              }
            />

            {/* Executive Analytics */}

            <Grid
              container
              spacing={3}
              mt={2}
            >
              <Grid
                size={{
                  xs: 12,
                  lg: 8,
                }}
              >
                <RegistrationTrendChart
                  members={members}
                />
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  lg: 4,
                }}
              >
                <MemberStatusChart
                  members={members}
                />
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  lg: 6,
                }}
              >
                <CategoryDistributionChart
                  members={members}
                />
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  lg: 6,
                }}
              >
                <RegistrationStageChart
                  members={members}
                />
              </Grid>
            </Grid>

            {/* Operational Widgets */}

            <Grid
              container
              spacing={3}
              mt={2}
            >
              <Grid
                size={{
                  xs: 12,
                  lg: 6,
                }}
              >
                <RecentMembers members={members} />
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  lg: 6,
                }}
              >
                <RecentActivity
                  members={members}
                />
              </Grid>

              <Grid size={12}>
                <QuickActions />
              </Grid>
            </Grid>

          </>
        )}
      </Box>
    </PageContainer>
  );
}