"use client";

import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

import { Role } from "@/types/role";

interface ViewRoleDialogProps {
  open: boolean;
  role: Role | null;
  onClose: () => void;
}

export default function ViewRoleDialog({
  open,
  role,
  onClose,
}: ViewRoleDialogProps) {
  if (!role) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>
        Role Details
      </DialogTitle>

      <DialogContent dividers>
        <DialogContentText sx={{ mb: 3 }}>
          Review the role information and the permissions assigned to this
          role.
        </DialogContentText>

        <Stack spacing={4}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography
                variant="caption"
                color="text.secondary"
              >
                Role Name
              </Typography>

              <Typography
                variant="h6"
                fontWeight={700}
              >
                {role.name}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography
                variant="caption"
                color="text.secondary"
              >
                Role Type
              </Typography>

              <Box mt={1}>
                <Chip
                  label={
                    role.is_system_role
                      ? "System Role"
                      : "Organization Role"
                  }
                  color={
                    role.is_system_role
                      ? "warning"
                      : "primary"
                  }
                />
              </Box>
            </Grid>

            <Grid size={12}>
              <Typography
                variant="caption"
                color="text.secondary"
              >
                Description
              </Typography>

              <Typography sx={{ mt: 0.5 }}>
                {role.description || "No description provided."}
              </Typography>
            </Grid>
          </Grid>

          <Divider />

          <Stack spacing={2}>
            <Typography
              variant="h6"
              fontWeight={700}
            >
              Permissions ({role.permissions.length})
            </Typography>

            {role.permissions.length > 0 ? (
              <Box
                display="flex"
                flexWrap="wrap"
                gap={1}
              >
                {role.permissions.map((permission) => (
                  <Chip
                    key={permission.id}
                    label={permission.name}
                    variant="outlined"
                    size="small"
                  />
                ))}
              </Box>
            ) : (
              <Typography
                variant="body2"
                color="text.secondary"
              >
                No permissions have been assigned to this role.
              </Typography>
            )}
          </Stack>

          <Divider />

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography
                variant="caption"
                color="text.secondary"
              >
                Created
              </Typography>

              <Typography>
                {new Date(role.created_at).toLocaleString()}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography
                variant="caption"
                color="text.secondary"
              >
                Last Updated
              </Typography>

              <Typography>
                {new Date(role.updated_at).toLocaleString()}
              </Typography>
            </Grid>
          </Grid>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button
          variant="contained"
          onClick={onClose}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}