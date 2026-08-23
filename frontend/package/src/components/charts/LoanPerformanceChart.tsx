"use client";

import dynamic from "next/dynamic";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
} from "@mui/material";
import Link from "next/link";
import { IconArrowRight } from "@tabler/icons-react";
import type { ApexOptions } from "apexcharts";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function LoanPerformanceChart() {
  const series = [362, 116, 65];
  const labels = ["On Time", "Late", "Default"];
  const colors = ["#10b981", "#f59e0b", "#ef4444"];

  const options: ApexOptions = {
    chart: {
      type: "donut",
      fontFamily: "'Arimo', sans-serif",
    },
    labels,
    colors,
    legend: {
      position: "bottom",
      horizontalAlign: "center",
      fontSize: "11px",
      fontWeight: 500,
      itemMargin: { horizontal: 8, vertical: 3 },
      formatter: (val, opts) => {
        const count = opts.w.globals.series[opts.seriesIndex];
        const percent = ((count / 543) * 100).toFixed(1);
        return `${val}: ${count} (${percent}%)`;
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: "70%",
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: "12px",
              fontWeight: 600,
              color: "#64748b",
              offsetY: -6,
            },
            value: {
              show: true,
              fontSize: "18px",
              fontWeight: 700,
              color: "#1e293b",
              offsetY: 6,
              formatter: () => "543",
            },
            total: {
              show: true,
              showAlways: true,
              label: "Total Loans",
              fontSize: "12px",
              fontWeight: 600,
              color: "#64748b",
              formatter: () => "543",
            },
          },
        },
      },
    },
    dataLabels: { enabled: false },
    stroke: {
      width: 2,
      colors: ["#ffffff"],
    },
    tooltip: {
      y: {
        formatter: (val) => `${val} loans`,
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
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 800,
            fontSize: "0.85rem",
            letterSpacing: 0.5,
            color: "text.primary",
            mb: 2,
          }}
        >
          LOAN PERFORMANCE
        </Typography>

        <Box sx={{ minHeight: 250, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Chart type="donut" height={250} width="100%" options={options} series={series} />
        </Box>
      </CardContent>

      <Box sx={{ p: 1.5, px: 2.5, borderTop: "1px solid", borderColor: "divider" }}>
        <Button
          component={Link}
          href="/reports"
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
