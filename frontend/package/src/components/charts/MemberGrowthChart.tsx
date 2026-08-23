"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  Button,
  Select,
  MenuItem,
  FormControl,
} from "@mui/material";
import Link from "next/link";
import { IconArrowRight } from "@tabler/icons-react";
import type { ApexOptions } from "apexcharts";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function MemberGrowthChart() {
  const [year, setYear] = useState("year");

  const series = [
    {
      name: "New Members",
      data: [650, 680, 710, 750, 780, 810, 830, 850, 820, 790, 780, 760],
    },
    {
      name: "Active Members",
      data: [1200, 1350, 1500, 1620, 1680, 1650, 1620, 1600, 1580, 1600, 1620, 1750],
    },
  ];

  const categories = [
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

  const options: ApexOptions = {
    chart: {
      type: "bar",
      fontFamily: "'Arimo', sans-serif",
      toolbar: { show: false },
    },
    colors: ["#10b981", "#1d4ed8"],
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "55%",
        borderRadius: 2,
      },
    },
    dataLabels: { enabled: false },
    stroke: {
      show: true,
      width: 2,
      colors: ["transparent"],
    },
    grid: {
      borderColor: "#f1f5f9",
      strokeDashArray: 3,
    },
    xaxis: {
      categories,
      labels: {
        style: { fontSize: "11px", colors: "#64748b", fontFamily: "'Arimo', sans-serif" },
      },
    },
    yaxis: {
      min: 0,
      max: 2000,
      tickAmount: 4,
      labels: {
        formatter: (val) => (val >= 1000 ? `${(val / 1000).toFixed(1)}K` : `${val}`),
        style: { fontSize: "11px", colors: "#64748b", fontFamily: "'Arimo', sans-serif" },
      },
    },
    legend: {
      position: "top",
      horizontalAlign: "center",
      fontSize: "12px",
      fontWeight: 500,
    },
    tooltip: {
      y: {
        formatter: (val) => `${val} members`,
      },
    },
  };

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <CardContent sx={{ p: 2.5, pb: 1.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 800,
              fontSize: "0.85rem",
              letterSpacing: 0.5,
              color: "text.primary",
            }}
          >
            MEMBER GROWTH
          </Typography>

          <FormControl size="small" sx={{ minWidth: 100 }}>
            <Select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              sx={{ fontSize: "0.75rem", height: 28 }}
            >
              <MenuItem value="year">This Year</MenuItem>
              <MenuItem value="last_year">Last Year</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        <Box sx={{ minHeight: 250 }}>
          <Chart type="bar" height={250} width="100%" options={options} series={series} />
        </Box>
      </CardContent>

      <Box sx={{ p: 1.5, px: 2.5, borderTop: "1px solid", borderColor: "divider" }}>
        <Button
          component={Link}
          href="/members"
          size="small"
          endIcon={<IconArrowRight size={14} />}
          sx={{ textTransform: "none", fontSize: "0.75rem", p: 0, fontWeight: 600, color: "#0f766e" }}
        >
          View full report
        </Button>
      </Box>
    </Card>
  );
}
