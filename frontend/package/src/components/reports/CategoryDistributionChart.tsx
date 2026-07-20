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

interface CategoryDistributionChartProps {
  members: Member[];
}

export default function CategoryDistributionChart({
  members,
}: CategoryDistributionChartProps) {
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};

    members.forEach((member: any) => {
      const category =
        member.category_name ||
        member.category?.name ||
        "Unassigned";

      counts[category] =
        (counts[category] || 0) + 1;
    });

    return counts;
  }, [members]);

  const labels = Object.keys(categoryData);

  const series = Object.values(categoryData);

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: "pie",
      toolbar: {
        show: false,
      },
    },

    labels,

    legend: {
      position: "bottom",
    },

    stroke: {
      width: 2,
    },

    dataLabels: {
      enabled: true,
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
          Members by Category
        </Typography>

        <Chart
          type="pie"
          height={350}
          options={options}
          series={series}
        />
      </CardContent>
    </Card>
  );
}