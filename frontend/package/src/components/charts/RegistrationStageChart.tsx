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

interface RegistrationStageChartProps {
  members: Member[];
}

export default function RegistrationStageChart({
  members,
}: RegistrationStageChartProps) {
  const chartData = useMemo(() => {
    const pending = members.filter(
      (m) =>
        m.registration_stage ===
        "DATA_CAPTURE_PENDING"
    ).length;

    const approved = members.filter(
      (m) =>
        m.registration_stage ===
        "APPROVED"
    ).length;

    const rejected = members.filter(
      (m) =>
        m.registration_stage ===
        "REJECTED"
    ).length;

    const active = members.filter(
      (m) =>
        m.registration_stage ===
        "ACTIVE"
    ).length;

    return {
      series: [
        pending,
        approved,
        rejected,
        active,
      ],

      labels: [
        "Pending",
        "Approved",
        "Rejected",
        "Active",
      ],

      colors: [
        "#FFAE1F",
        "#13DEB9",
        "#FA896B",
        "#5D87FF",
      ],

      total:
        pending +
        approved +
        rejected +
        active,
    };
  }, [members]);

  const options: ApexOptions = {
    chart: {
      type: "bar",

      toolbar: {
        show: false,
      },

      animations: {
        enabled: true,
        speed: 900,
      },

      fontFamily: "inherit",
    },

    plotOptions: {
      bar: {
        horizontal: true,

        distributed: true,

        borderRadius: 8,

        borderRadiusApplication:
          "end",

        barHeight: "58%",
      },
    },

    colors: chartData.colors,

    grid: {
      borderColor: "#ECEFF5",

      strokeDashArray: 4,

      padding: {
        left: 10,
        right: 10,
      },
    },

    xaxis: {
      categories:
        chartData.labels,

      labels: {
        style: {
          fontSize: "12px",
        },
      },
    },

    dataLabels: {
      enabled: true,

      style: {
        fontWeight: 600,
      },
    },

    tooltip: {
      theme: "light",

      y: {
        formatter: (value) =>
          `${value} members`,
      },
    },

    legend: {
      show: false,
    },
  };

  const StageRow = ({
    label,
    color,
    value,
  }: {
    label: string;
    color: string;
    value: number;
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
        {value}
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
          Registration Stages
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          mb={3}
        >
          Current registration workflow
          status.
        </Typography>

        <Chart
          type="bar"
          height={320}
          options={options}
          series={[
            {
              name: "Members",
              data: chartData.series,
            },
          ]}
        />

        <Divider sx={{ my: 2 }} />

        <Stack spacing={1}>
          <StageRow
            label="Pending"
            color="#FFAE1F"
            value={chartData.series[0]}
          />

          <StageRow
            label="Approved"
            color="#13DEB9"
            value={chartData.series[1]}
          />

          <StageRow
            label="Rejected"
            color="#FA896B"
            value={chartData.series[2]}
          />

          <StageRow
            label="Active"
            color="#5D87FF"
            value={chartData.series[3]}
          />
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Box
          display="flex"
          justifyContent="space-between"
        >
          <Typography
            fontWeight={700}
          >
            Total Registrations
          </Typography>

          <Typography
            fontWeight={700}
            color="primary"
          >
            {chartData.total}
          </Typography>
        </Box>

      </CardContent>
    </Card>
  );
}