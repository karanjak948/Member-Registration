"use client";

import { useState } from "react";

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

import ToggleOnOutlinedIcon from "@mui/icons-material/ToggleOnOutlined";

import { Member } from "@/interfaces/member";

import useMemberWorkflow from "@/components/members/hooks/useMemberWorkflow";

interface ActivateMemberDialogProps {
  open: boolean;

  member: Member | null;

  loading?: boolean;

  error?: string;

  onClose: () => void;

  onSuccess?: () => void;

  onActivate?: () => void | Promise<void>;
}

export default function ActivateMemberDialog({
  open,
  member,
  loading: externalLoading = false,
  error: externalError,
  onClose,
  onSuccess,
  onActivate,
}: ActivateMemberDialogProps) {
  const [internalError, setInternalError] = useState("");

  const workflow = useMemberWorkflow();

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

  async function handleActivate() {
    if (!member) return;

    try {
      setInternalError("");

      if (onActivate) {
        await onActivate();
      } else {
        await workflow.activate(member.id);
      }

      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (error) {
      console.error("Failed to activate member:", error);
      setInternalError("Failed to activate member. Please try again.");
    }
  }

  const displayError = externalError || internalError;

  return (
    <Dialog
      open={open}
      fullWidth
      maxWidth="sm"
      onClose={
        workflow.loading || externalLoading ? undefined : onClose
      }
    >
      <DialogTitle>
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
        >
          <ToggleOnOutlinedIcon
            color="success"
          />

          <Box>
            <Typography variant="h6">
              Activate Member
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              Activate this member to grant
              them full access to member
              benefits and services.
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <Stack spacing={3}>
          {displayError && (
            <Alert severity="error">
              {displayError}
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
                        member?.status === "ACTIVE"
                          ? "success"
                          : member?.status === "INACTIVE"
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

          <Alert severity="info">
            Activating this member will change their status from INACTIVE to ACTIVE.
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
          disabled={workflow.loading || externalLoading}
        >
          Cancel
        </Button>

        <LoadingButton
          color="success"
          variant="contained"
          loading={workflow.loading || externalLoading}
          startIcon={
            <ToggleOnOutlinedIcon />
          }
          onClick={handleActivate}
        >
          Activate Member
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}