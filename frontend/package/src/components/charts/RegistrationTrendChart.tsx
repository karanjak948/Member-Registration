"use client";

import { useMemo } from "react";

import dynamic from "next/dynamic";

import {
  Card,
  CardContent,
  Typography,
} from "@mui/material";

import type { ApexOptions } from "apexcharts";

import { Member } from "@/interfaces/member";

const Chart = dynamic(
  () => import("react-apexcharts"),
  {
    ssr: false,
  }
);

interface RegistrationTrendChartProps {
  members: Member[];
}

export default function RegistrationTrendChart({
  members,
}: RegistrationTrendChartProps) {
  const monthlyData = useMemo(() => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const counts = new Array(12).fill(0);

    members.forEach((member) => {
      if (!member.created_at) {
        return;
      }

      const month = new Date(
        member.created_at
      ).getMonth();

      counts[month]++;
    });

    return {
      categories: months,
      series: counts,
    };
  }, [members]);

  const options: ApexOptions = {
    chart: {
      type: "area",

      height: 350,

      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: false,
          zoom: false,
          zoomin: false,
          zoomout: false,
          pan: false,
          reset: false,
        },
      },

      animations: {
        enabled: true,
        speed: 900,
      },

      fontFamily: "inherit",
    },

    theme: {
      mode: "light",
    },

    colors: ["#5D87FF"],

    stroke: {
      curve: "smooth",
      width: 4,
    },

    fill: {
      type: "gradient",

      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.55,
        opacityTo: 0.05,
        stops: [0, 95, 100],
      },
    },

    markers: {
      size: 5,

      strokeWidth: 2,

      hover: {
        size: 7,
      },
    },

    dataLabels: {
      enabled: false,
    },

    grid: {
      borderColor: "#E5EAEF",

      strokeDashArray: 4,

      padding: {
        left: 15,
        right: 15,
      },
    },

    xaxis: {
      categories: monthlyData.categories,

      axisBorder: {
        show: false,
      },

      axisTicks: {
        show: false,
      },

      labels: {
        style: {
          fontSize: "12px",
        },
      },
    },

    yaxis: {
      min: 0,

      forceNiceScale: true,

      labels: {
        formatter: (value) =>
          Math.round(value).toString(),
      },
    },

    tooltip: {
      theme: "light",

      y: {
        formatter: (value) =>
          `${value} registrations`,
      },
    },

    legend: {
      position: "top",

      horizontalAlign: "left",

      fontSize: "14px",
    },
  };

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
          Registration Trend
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          mb={3}
        >
          Monthly member registration trend.
        </Typography>

        <Chart
          type="area"
          height={380}
          options={options}
          series={[
            {
              name: "Registrations",
              data: monthlyData.series,
            },
          ]}
        />
      </CardContent>
    </Card>
  );
}