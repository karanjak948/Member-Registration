"use client";

import { useMemo } from "react";

import dynamic from "next/dynamic";

import {
  Box,
  Card,
  CardContent,
  Divider,
  Stack,
  Typography,
} from "@mui/material";

import { ApexOptions } from "apexcharts";

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
  const data = useMemo(() => {
    const active = members.filter(
      (m) => m.status === "ACTIVE"
    ).length;

    const inactive = members.filter(
      (m) => m.status === "INACTIVE"
    ).length;

    const suspended = members.filter(
      (m) => m.status === "SUSPENDED"
    ).length;

    const total =
      active +
      inactive +
      suspended;

    return {
      active,
      inactive,
      suspended,
      total,

      series: [
        active,
        inactive,
        suspended,
      ],

      percentages: {
        active:
          total === 0
            ? 0
            : Math.round(
                (active / total) * 100
              ),

        inactive:
          total === 0
            ? 0
            : Math.round(
                (inactive / total) * 100
              ),

        suspended:
          total === 0
            ? 0
            : Math.round(
                (suspended / total) * 100
              ),
      },
    };
  }, [members]);

  const options: ApexOptions = {
    chart: {
      type: "donut",

      toolbar: {
        show: false,
      },

      animations: {
        enabled: true,
        speed: 900,
      },

      fontFamily: "inherit",
    },

    labels: [
      "Active",
      "Inactive",
      "Suspended",
    ],

    colors: [
      "#13DEB9",
      "#FFAE1F",
      "#FA896B",
    ],

    stroke: {
      width: 4,
      colors: ["#ffffff"],
    },

    legend: {
      show: false,
    },

    dataLabels: {
      enabled: false,
    },

    tooltip: {
      theme: "light",

      y: {
        formatter: (value) =>
          `${value} members`,
      },
    },

    plotOptions: {
      pie: {
        expandOnClick: true,

        donut: {
          size: "74%",

          labels: {
            show: true,

            name: {
              show: true,
              fontSize: "16px",
            },

            value: {
              show: true,
              fontSize: "26px",
              fontWeight: 700,
            },

            total: {
              show: true,
              label: "Total",

              formatter: () =>
                `${data.total}`,
            },
          },
        },
      },
    },
  };

  const StatusRow = ({
    label,
    color,
    count,
    percentage,
  }: {
    label: string;
    color: string;
    count: number;
    percentage: number;
  }) => (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      py={1}
    >
      <Box
        display="flex"
        alignItems="center"
        gap={1.5}
      >
        <Box
          sx={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            bgcolor: color,
          }}
        />

        <Typography variant="body2">
          {label}
        </Typography>
      </Box>

      <Typography
        variant="body2"
        fontWeight={700}
      >
        {count} ({percentage}%)
      </Typography>
    </Box>
  );

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        borderRadius: 4,
        border: "1px solid",
        borderColor: "divider",
        transition: ".25s",

        "&:hover": {
          boxShadow: 8,
        },
      }}
    >
      <CardContent>
        <Typography
          variant="h5"
          fontWeight={700}
        >
          Member Status
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          mb={3}
        >
          Current membership status
          distribution.
        </Typography>

        <Chart
          type="donut"
          height={320}
          options={options}
          series={data.series}
        />

        <Divider sx={{ my: 2 }} />

        <Stack spacing={1}>
          <StatusRow
            label="Active"
            color="#13DEB9"
            count={data.active}
            percentage={
              data.percentages.active
            }
          />

          <StatusRow
            label="Inactive"
            color="#FFAE1F"
            count={data.inactive}
            percentage={
              data.percentages.inactive
            }
          />

          <StatusRow
            label="Suspended"
            color="#FA896B"
            count={data.suspended}
            percentage={
              data.percentages.suspended
            }
          />
        </Stack>
      </CardContent>
    </Card>
  );
}