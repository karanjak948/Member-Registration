"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Card,
  CardContent,
  CircularProgress,
  Typography,
  Box,
} from "@mui/material";

import dynamic from "next/dynamic";

import memberService from "@/services/member.service";
import { Member } from "@/interfaces/member";

const Chart = dynamic(
  () => import("react-apexcharts"),
  {
    ssr: false,
  }
);

export default function RegistrationChart() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMembers();
  }, []);

  async function loadMembers() {
    try {
      const data = await memberService.getAll();
      setMembers(data);
    } finally {
      setLoading(false);
    }
  }

  const monthlyData = useMemo(() => {
    const months = Array(12).fill(0);

    members.forEach((member) => {
      const date = new Date(member.created_at);

      if (
        date.getFullYear() ===
        new Date().getFullYear()
      ) {
        months[date.getMonth()]++;
      }
    });

    return months;
  }, [members]);

  const options: ApexCharts.ApexOptions = {
    chart: {
      toolbar: {
        show: false,
      },
    },

    stroke: {
      curve: "smooth",
    },

    dataLabels: {
      enabled: false,
    },

    xaxis: {
      categories: [
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
      ],
    },

    yaxis: {
      title: {
        text: "Members",
      },
    },

    colors: ["#5D87FF"],

    grid: {
      borderColor: "#e0e0e0",
    },
  };

  const series = [
    {
      name: "Registrations",
      data: monthlyData,
    },
  ];

  return (
    <Card>
      <CardContent>

        <Typography
          variant="h5"
          mb={3}
        >
          Monthly Registrations
        </Typography>

        {loading ? (
          <Box
            display="flex"
            justifyContent="center"
            py={8}
          >
            <CircularProgress />
          </Box>
        ) : (
          <Chart
            type="line"
            height={350}
            options={options}
            series={series}
          />
        )}

      </CardContent>
    </Card>
  );
}