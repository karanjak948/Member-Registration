"use client";

import {
  Box,
  CircularProgress,
  Typography,
} from "@mui/material";

export default function Loading() {
  return (
    <Box
      sx={{
        minHeight: 400,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 2,
      }}
    >
      <CircularProgress />

      <Typography
        variant="body2"
        color="text.secondary"
      >
        Loading users...
      </Typography>
    </Box>
  );
}