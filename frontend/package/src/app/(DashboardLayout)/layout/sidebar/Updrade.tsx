import {
  Box,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";

import {
  IconDatabase,
  IconServer,
} from "@tabler/icons-react";

export const Upgrade = () => {
  return (
    <Box
      sx={{
        mt: 3,
        p: 3,
        borderRadius: 2,
        bgcolor: "primary.light",
      }}
    >
      <Typography
        variant="h6"
        fontWeight={700}
        gutterBottom
      >
        System Status
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        mb={2}
      >
        Membership Management System
      </Typography>

      <Divider sx={{ mb: 2 }} />

      <Stack spacing={2}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
          >
            <IconServer size={18} />

            <Typography variant="body2">
              Backend
            </Typography>
          </Stack>

          <Chip
            label="Online"
            color="success"
            size="small"
          />
        </Stack>

        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
          >
            <IconDatabase size={18} />

            <Typography variant="body2">
              Database
            </Typography>
          </Stack>

          <Chip
            label="Connected"
            color="success"
            size="small"
          />
        </Stack>

        <Divider />

        <Typography
          variant="caption"
          color="text.secondary"
        >
          Version 1.0.0
        </Typography>
      </Stack>
    </Box>
  );
};