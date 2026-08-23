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

export default function TopLoanProductsChart() {
  const series = [92.6, 4.2, 2.1, 1.1];
  const labels = ["Jinue Loan", "Emergency Loan", "Business Loan", "Other Loans"];
  const colors = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b"];

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
      itemMargin: { horizontal: 6, vertical: 3 },
      formatter: (val, opts) => {
        const percent = opts.w.globals.series[opts.seriesIndex];
        return `${val}: ${percent}%`;
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: "68%",
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
        formatter: (val) => `${val}% of total loan volume`,
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
          TOP LOAN PRODUCTS
        </Typography>

        <Box sx={{ minHeight: 250, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Chart type="donut" height={250} width="100%" options={options} series={series} />
        </Box>
      </CardContent>

      <Box sx={{ p: 1.5, px: 2.5, borderTop: "1px solid", borderColor: "divider" }}>
        <Button
          component={Link}
          href="/loan-products"
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
