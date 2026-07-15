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

interface CategoryDistributionChartProps {
  members: Member[];
}

export default function CategoryDistributionChart({
  members,
}: CategoryDistributionChartProps) {
  const data = useMemo(() => {
    const categories = new Map<
      string,
      number
    >();

    members.forEach((member: any) => {
      const category =
        member.category_name ??
        member.category?.name ??
        member.category ??
        "Uncategorized";

      categories.set(
        category,
        (categories.get(category) ?? 0) + 1
      );
    });

    const labels = Array.from(
    categories.keys()
    );

    const series = Array.from(
    categories.values()
    );

    const total = series.reduce(
      (sum, value) => sum + value,
      0
    );

    return {
      labels,
      series,
      total,
    };
  }, [members]);

  const options: ApexOptions = {
    chart: {
      type: "pie",

      toolbar: {
        show: false,
      },

      animations: {
        enabled: true,
        speed: 900,
      },

      fontFamily: "inherit",
    },

    labels: data.labels,

    colors: [
      "#5D87FF",
      "#49BEFF",
      "#13DEB9",
      "#FFAE1F",
      "#FA896B",
      "#8E24AA",
      "#26A69A",
      "#3949AB",
    ],

    stroke: {
      width: 3,
      colors: ["#fff"],
    },

    legend: {
      position: "bottom",
      fontSize: "13px",
      fontWeight: 500,
    },

    dataLabels: {
      enabled: true,

      formatter: (
        value: number
      ) => `${value.toFixed(0)}%`,
    },

    tooltip: {
      theme: "light",

      y: {
        formatter: (value) =>
          `${value} members`,
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
          Member Categories
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          mb={3}
        >
          Distribution of members
          across categories.
        </Typography>

        <Chart
          type="pie"
          height={320}
          options={options}
          series={data.series}
        />

        <Divider sx={{ my: 2 }} />

        <Stack spacing={1}>
          {data.labels.map(
            (label, index) => (
              <Box
                key={label}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
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
                      borderRadius:
                        "50%",
                      bgcolor:
                        options.colors?.[
                          index
                        ] as string,
                    }}
                  />

                  <Typography
                    variant="body2"
                  >
                    {label}
                  </Typography>
                </Box>

                <Typography
                  variant="body2"
                  fontWeight={700}
                >
                  {data.series[index]}
                </Typography>
              </Box>
            )
          )}

          <Divider sx={{ mt: 1 }} />

          <Box
            display="flex"
            justifyContent="space-between"
          >
            <Typography
              fontWeight={700}
            >
              Total Members
            </Typography>

            <Typography
              fontWeight={700}
              color="primary"
            >
              {data.total}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}