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

export default function CollectionsOverviewChart() {
  const [period, setPeriod] = useState("month");

  const series = [
    {
      name: "Collections",
      data: [28, 42, 53, 49, 68, 62, 75, 88, 79, 82],
    },
  ];

  const categories = ["01", "06", "11", "16", "21", "26", "31"];

  const options: ApexOptions = {
    chart: {
      type: "area",
      fontFamily: "'Arimo', sans-serif",
      toolbar: { show: false },
    },
    colors: ["#10b981"],
    stroke: {
      curve: "smooth",
      width: 3,
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [0, 90, 100],
      },
    },
    markers: {
      size: 4,
      colors: ["#10b981"],
      strokeColors: "#ffffff",
      strokeWidth: 2,
      hover: { size: 6 },
    },
    dataLabels: { enabled: false },
    grid: {
      borderColor: "#f1f5f9",
      strokeDashArray: 3,
    },
    xaxis: {
      categories: ["01", "06", "11", "16", "21", "26", "31"],
      labels: {
        style: { fontSize: "11px", colors: "#64748b", fontFamily: "'Arimo', sans-serif" },
      },
    },
    yaxis: {
      min: 0,
      max: 100,
      tickAmount: 5,
      labels: {
        formatter: (val) => `${val}K`,
        style: { fontSize: "11px", colors: "#64748b", fontFamily: "'Arimo', sans-serif" },
      },
      title: {
        text: "KES",
        style: { fontSize: "11px", fontWeight: 600, color: "#64748b", fontFamily: "'Arimo', sans-serif" },
      },
    },
    tooltip: {
      y: {
        formatter: (val) => `KES ${(val * 1000).toLocaleString()}`,
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
            COLLECTIONS OVERVIEW
          </Typography>

          <FormControl size="small" sx={{ minWidth: 110 }}>
            <Select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              sx={{ fontSize: "0.75rem", height: 28 }}
            >
              <MenuItem value="month">This Month</MenuItem>
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="quarter">This Quarter</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        <Box sx={{ minHeight: 250 }}>
          <Chart type="area" height={250} width="100%" options={options} series={series} />
        </Box>
      </CardContent>

      <Box sx={{ p: 1.5, px: 2.5, borderTop: "1px solid", borderColor: "divider" }}>
        <Button
          component={Link}
          href="/collections"
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
