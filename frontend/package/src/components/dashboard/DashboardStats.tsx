"use client";

import {
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
  Box,
} from "@mui/material";
import Link from "next/link";
import {
  IconUsers,
  IconUserCheck,
  IconCoin,
  IconCalendarEvent,
  IconAlertCircle,
  IconWallet,
  IconLock,
  IconDatabase,
  IconMessage2,
  IconClockHour4,
  IconArrowRight,
} from "@tabler/icons-react";

interface DashboardStatsProps {
  totalMembers?: number;
  activeBorrowers?: number;
  todayCollections?: number | string;
  expectedThisWeek?: number | string;
  overdueLoansCount?: number;
  overdueAmount?: number | string;
  loanPortfolio?: number | string;
  securityDeposits?: number | string;
  availableLendingCapital?: number | string;
  smsBalance?: number;
  pendingApplications?: number;
}

export default function DashboardStats({
  totalMembers = 2453,
  activeBorrowers = 543,
  todayCollections = "58,750",
  expectedThisWeek = "487,200",
  overdueLoansCount = 48,
  overdueAmount = "276,850",
  loanPortfolio = "12,450,300",
  securityDeposits = "3,112,575",
  availableLendingCapital = "4,875,000",
  smsBalance = 1587,
  pendingApplications = 23,
}: DashboardStatsProps) {
  // Top 5 Cards (Row 1) & Bottom 5 Cards (Row 2) matching the reference design exactly
  const cards = [
    // 1. Total Members - Forest Green
    {
      title: "TOTAL MEMBERS",
      value: typeof totalMembers === "number" ? totalMembers.toLocaleString() : totalMembers,
      subtitle: "Active Members",
      actionText: "View all",
      href: "/members",
      icon: IconUsers,
      bgColor: "#059669", // Rich Forest Green
    },
    // 2. Active Borrowers - Ocean Blue
    {
      title: "ACTIVE BORROWERS",
      value: typeof activeBorrowers === "number" ? activeBorrowers.toLocaleString() : activeBorrowers,
      subtitle: "With Active Loans",
      actionText: "View all",
      href: "/loans?status=active",
      icon: IconUserCheck,
      bgColor: "#0284c7", // Ocean Blue
    },
    // 3. Today's Collections - Deep Teal / Mint
    {
      title: "TODAY'S COLLECTIONS",
      value: `KES ${todayCollections}`,
      subtitle: "Received Today",
      actionText: "View details",
      href: "/collections/receive",
      icon: IconCoin,
      bgColor: "#0d9488", // Deep Teal
    },
    // 4. Expected This Week - Royal Indigo / Purple
    {
      title: "EXPECTED THIS WEEK",
      value: `KES ${expectedThisWeek}`,
      subtitle: "Expected Repayments",
      actionText: "View details",
      href: "/loans/schedule",
      icon: IconCalendarEvent,
      bgColor: "#4f46e5", // Indigo Purple
    },
    // 5. Overdue Loans - Coral Orange Red
    {
      title: "OVERDUE LOANS",
      value: overdueLoansCount,
      subtitle: `KES ${overdueAmount}`,
      actionText: "View details",
      href: "/collections/arrears",
      icon: IconAlertCircle,
      bgColor: "#dc2626", // Coral Red
    },
    // 6. Loan Portfolio - Amber Ochre
    {
      title: "LOAN PORTFOLIO",
      value: `KES ${loanPortfolio}`,
      subtitle: "Total Outstanding",
      actionText: "View details",
      href: "/loans",
      icon: IconWallet,
      bgColor: "#d97706", // Amber Gold
    },
    // 7. Security Deposits - Pine Green
    {
      title: "SECURITY DEPOSITS",
      value: `KES ${securityDeposits}`,
      subtitle: "Total Deposits Held",
      actionText: "View details",
      href: "/collections/deposits",
      icon: IconLock,
      bgColor: "#15803d", // Pine Green
    },
    // 8. Available Lending Capital - Cobalt Blue
    {
      title: "AVAILABLE LENDING CAPITAL",
      value: `KES ${availableLendingCapital}`,
      subtitle: "Available to Lend",
      actionText: "View details",
      href: "/collections/reconciliation",
      icon: IconDatabase,
      bgColor: "#0369a1", // Deep Cobalt Blue
    },
    // 9. SMS Balance - Purple
    {
      title: "SMS BALANCE",
      value: typeof smsBalance === "number" ? smsBalance.toLocaleString() : smsBalance,
      subtitle: "SMS Credits Left",
      actionText: "View details",
      href: "/sms",
      icon: IconMessage2,
      bgColor: "#7c3aed", // Vibrant Purple
    },
    // 10. Pending Applications - Emerald Teal
    {
      title: "PENDING APPLICATIONS",
      value: pendingApplications,
      subtitle: "Awaiting Approval",
      actionText: "View details",
      href: "/members",
      icon: IconClockHour4,
      bgColor: "#0f766e", // Emerald Teal
    },
  ];

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {cards.map((card, index) => {
        const Icon = card.icon;

        return (
          <Grid key={index} size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
            <Card
              elevation={0}
              sx={{
                height: "100%",
                borderRadius: 2.5,
                bgcolor: card.bgColor,
                color: "#ffffff",
                transition: "all 0.2s ease-in-out",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 4px 14px rgba(0,0,0,0.1)",
                "&:hover": {
                  transform: "translateY(-3px)",
                  boxShadow: "0 8px 20px rgba(0,0,0,0.18)",
                  filter: "brightness(1.04)",
                },
              }}
            >
              <CardContent sx={{ p: 2.2, pb: 1.5, flex: 1, display: "flex", flexDirection: "column" }}>
                {/* Header with Icon and Title */}
                <Stack direction="row" spacing={1.5} alignItems="flex-start" mb={1.2}>
                  <Box
                    sx={{
                      p: 0.8,
                      borderRadius: 1.5,
                      bgcolor: "rgba(255, 255, 255, 0.18)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={24} color="#ffffff" stroke={2} />
                  </Box>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 800,
                        letterSpacing: "0.5px",
                        fontSize: "0.68rem",
                        color: "rgba(255, 255, 255, 0.9)",
                        textTransform: "uppercase",
                        display: "block",
                        lineHeight: 1.2,
                        mb: 0.5,
                      }}
                      noWrap
                    >
                      {card.title}
                    </Typography>

                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 800,
                        color: "#ffffff",
                        letterSpacing: "-0.5px",
                        fontSize: "1.28rem",
                        lineHeight: 1.2,
                        mb: 0.3,
                      }}
                    >
                      {card.value}
                    </Typography>

                    <Typography
                      variant="caption"
                      sx={{
                        color: "rgba(255, 255, 255, 0.82)",
                        fontSize: "0.72rem",
                        fontWeight: 500,
                        display: "block",
                      }}
                      noWrap
                    >
                      {card.subtitle}
                    </Typography>
                  </Box>
                </Stack>

                {/* Footer Link */}
                <Box
                  sx={{
                    mt: "auto",
                    pt: 1.2,
                    borderTop: "1px solid rgba(255, 255, 255, 0.2)",
                  }}
                >
                  <Link
                    href={card.href}
                    style={{
                      textDecoration: "none",
                      color: "#ffffff",
                      fontWeight: 600,
                      fontSize: "0.72rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>{card.actionText}</span>
                    <IconArrowRight size={14} color="#ffffff" />
                  </Link>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
}