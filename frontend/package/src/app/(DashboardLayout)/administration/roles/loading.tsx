"use client";

import { Box, Skeleton } from "@mui/material";

export default function Loading() {
  return (
    <Box sx={{ p: 3 }}>
      <Skeleton
        variant="rounded"
        height={90}
        sx={{ mb: 3 }}
      />

      <Skeleton
        variant="rounded"
        height={500}
      />
    </Box>
  );
}