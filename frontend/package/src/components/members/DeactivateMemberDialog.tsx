"use client";

import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import { LoadingButton } from "@mui/lab";

import ToggleOffOutlinedIcon from "@mui/icons-material/ToggleOffOutlined";

import { Member } from "@/interfaces/member";

interface DeactivateMemberDialogProps {
  open: boolean;

  member: Member | null;

  loading?: boolean;

  error?: string;

  onClose: () => void;

  onDeactivate: () => void | Promise<void>;
}

export default function DeactivateMemberDialog({
  open,
  member,
  loading = false,
  error,
  onClose,
  onDeactivate,
}: DeactivateMemberDialogProps) {
  const getStageColor = (
    stage?: string
  ):
    | "warning"
    | "success"
    | "error"
    | "primary"
    | "default" => {
    switch (stage) {
      case "APPROVED":
        return "primary";

      case "ACTIVE":
        return "success";

      case "REJECTED":
        return "error";

      default:
        return "warning";
    }
  };

  return (
    <Dialog
      open={open}
      fullWidth
      maxWidth="sm"
      onClose={
        loading ? undefined : onClose
      }
    >
      <DialogTitle>
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
        >
          <ToggleOffOutlinedIcon
            color="warning"
          />

          <Box>
            <Typography variant="h6">
              Deactivate Member
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              Deactivate this member and
              prevent further activity until
              they are activated again.
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <Stack spacing={3}>
          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}

          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
            }}
          >
            <Stack spacing={2}>
              <Typography
                variant="subtitle1"
                fontWeight={600}
              >
                Member Information
              </Typography>

              <Divider />

              <Stack spacing={1.5}>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Membership Number
                  </Typography>

                  <Typography fontWeight={600}>
                    {member?.membership_number}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Full Name
                  </Typography>

                  <Typography fontWeight={600}>
                    {member?.first_name}{" "}
                    {member?.other_names}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Category
                  </Typography>

                  <Typography fontWeight={600}>
                    {member?.category_name ??
                      "-"}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Phone Number
                  </Typography>

                  <Typography fontWeight={600}>
                    {member?.phone_number}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Registration Stage
                  </Typography>

                  <Box mt={0.5}>
                    <Chip
                      size="small"
                      label={
                        member?.registration_stage
                      }
                      color={getStageColor(
                        member?.registration_stage
                      )}
                    />
                  </Box>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Current Status
                  </Typography>

                  <Box mt={0.5}>
                    <Chip
                      size="small"
                      color={
                        member?.status ===
                        "ACTIVE"
                          ? "success"
                          : member?.status ===
                              "INACTIVE"
                            ? "warning"
                            : "error"
                      }
                      label={member?.status}
                    />
                  </Box>
                </Box>
              </Stack>
            </Stack>
          </Paper>

          <Alert severity="warning">
            This action will immediately
            change the member's status to
            <strong> INACTIVE</strong>.
            The member can be activated
            again later.
          </Alert>
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions
        sx={{
          px: 3,
          py: 2,
        }}
      >
        <Button
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </Button>

        <LoadingButton
          color="warning"
          variant="contained"
          loading={loading}
          startIcon={
            <ToggleOffOutlinedIcon />
          }
          onClick={() =>
            onDeactivate()
          }
        >
          Deactivate Member
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}