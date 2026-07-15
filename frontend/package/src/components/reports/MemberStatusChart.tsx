"use client";

import { useMemo } from "react";

import dynamic from "next/dynamic";

import {
  Card,
  CardContent,
  Typography,
} from "@mui/material";

import { Member } from "@/interfaces/member";

const Chart = dynamic(
  () => import("react-apexcharts"),
  {
    ssr: false,
  }
);

interface MemberStatusChartProps {
  members: Member[];
}

export default function MemberStatusChart({
  members,
}: MemberStatusChartProps) {
  const statusCounts = useMemo(() => {
    return members.reduce(
      (acc, member) => {
        acc[member.status] =
          (acc[member.status] || 0) + 1;

        return acc;
      },
      {
        ACTIVE: 0,
        INACTIVE: 0,
        SUSPENDED: 0,
      } as Record<string, number>
    );
  }, [members]);

  const series = [
    statusCounts.ACTIVE,
    statusCounts.INACTIVE,
    statusCounts.SUSPENDED,
  ];

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: "donut",
      toolbar: {
        show: false,
      },
    },

    labels: [
      "Active",
      "Inactive",
      "Suspended",
    ],

    legend: {
      position: "bottom",
    },

    stroke: {
      width: 2,
    },

    dataLabels: {
      enabled: true,
    },

    plotOptions: {
      pie: {
        donut: {
          size: "65%",
        },
      },
    },

    tooltip: {
      y: {
        formatter(value) {
          return `${value} member${value === 1 ? "" : "s"}`;
        },
      },
    },

    responsive: [
      {
        breakpoint: 768,
        options: {
          legend: {
            position: "bottom",
          },
        },
      },
    ],
  };

  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Typography
          variant="h6"
          mb={3}
        >
          Members by Status
        </Typography>

        <Chart
          type="donut"
          height={350}
          options={options}
          series={series}
        />
      </CardContent>
    </Card>
  );
}