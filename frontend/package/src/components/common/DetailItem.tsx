import { Grid, Typography } from "@mui/material";
import { ReactNode } from "react";

interface DetailItemProps {
  label: string;
  value?: ReactNode;
}

export default function DetailItem({
  label,
  value,
}: DetailItemProps) {
  return (
    <Grid size={{ xs: 12, md: 6 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        display="block"
        sx={{ mb: 0.5 }}
      >
        {label}
      </Typography>

      <Typography
        variant="body1"
        fontWeight={600}
      >
        {value ?? "—"}
      </Typography>
    </Grid>
  );
}