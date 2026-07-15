"use client";

import Link from "next/link";

import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Container,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

import BusinessIcon from "@mui/icons-material/Business";
import BadgeIcon from "@mui/icons-material/Badge";
import ViewListIcon from "@mui/icons-material/ViewList";
import TagIcon from "@mui/icons-material/Tag";
import TuneIcon from "@mui/icons-material/Tune";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

const settings = [
  {
    title: "Organization Settings",
    description:
      "Configure organization information and branding.",
    icon: <BusinessIcon fontSize="large" color="primary" />,
    href: "/settings/organization",
  },
  {
    title: "Member Categories",
    description:
      "Manage member categories used during registration.",
    icon: <BadgeIcon fontSize="large" color="primary" />,
    href: "/settings/categories",
  },
  {
    title: "Field Configuration",
    description:
      "Configure dynamic registration fields.",
    icon: <ViewListIcon fontSize="large" color="primary" />,
    href: "/settings/fields",
  },
  {
    title: "Member Numbering",
    description:
      "Configure automatic membership number generation.",
    icon: <TagIcon fontSize="large" color="primary" />,
    href: "/settings/numbering",
  },
  {
    title: "System Preferences",
    description:
      "Application preferences and general configuration.",
    icon: <TuneIcon fontSize="large" color="primary" />,
    href: "/settings/preferences",
  },
];

export default function SettingsPage() {
  return (
    <Container maxWidth={false}>
      <Typography
        variant="h4"
        gutterBottom
      >
        Settings
      </Typography>

      <Typography
        color="text.secondary"
        mb={4}
      >
        Configure the membership management system.
      </Typography>

      <Grid container spacing={3}>
        {settings.map((item) => (
          <Grid
            key={item.title}
            size={{
              xs: 12,
              sm: 6,
              lg: 4,
            }}
          >
            <Card
              elevation={2}
              sx={{
                height: "100%",
                transition: "0.25s",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: 8,
                },
              }}
            >
              <CardActionArea
                component={Link}
                href={item.href}
                sx={{ height: "100%" }}
              >
                <CardContent
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    {item.icon}

                    <ChevronRightIcon
                      color="action"
                    />
                  </Stack>

                  <Box mt={3}>
                    <Typography
                      variant="h6"
                      gutterBottom
                    >
                      {item.title}
                    </Typography>

                    <Typography
                      color="text.secondary"
                      variant="body2"
                    >
                      {item.description}
                    </Typography>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}