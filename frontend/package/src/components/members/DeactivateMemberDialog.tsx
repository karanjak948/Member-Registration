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

import ToggleOffOutlinedIcon from "@mui/icons-material/ToggleOffOutlined";

import { Member } from "@/interfaces/member";

import useMemberWorkflow from "@/components/members/hooks/useMemberWorkflow";

interface DeactivateMemberDialogProps {
  open: boolean;

  member: Member | null;

  loading?: boolean;

  error?: string;

  onClose: () => void;

  onSuccess?: () => void;

  onDeactivate?: () => void | Promise<void>;
}

export default function DeactivateMemberDialog({
  open,
  member,
  loading: externalLoading = false,
  error: externalError,
  onClose,
  onSuccess,
  onDeactivate,
}: DeactivateMemberDialogProps) {
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

  async function handleDeactivate() {
    if (!member) return;

    try {
      setInternalError("");

      if (onDeactivate) {
        await onDeactivate();
      } else {
        await workflow.deactivate(member.id);
      }

      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (error) {
      console.error("Failed to deactivate member:", error);
      setInternalError("Failed to deactivate member. Please try again.");
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
          <ToggleOffOutlinedIcon
            color="error"
          />

          <Box>
            <Typography variant="h6">
              Deactivate Member
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              Deactivate this member to
              temporarily suspend their
              access and benefits.
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

          <Alert severity="warning">
            This action will immediately change the member's status to
            <strong> INACTIVE</strong>. The member can be activated again later.
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
          color="error"
          variant="contained"
          loading={workflow.loading || externalLoading}
          startIcon={
            <ToggleOffOutlinedIcon />
          }
          onClick={handleDeactivate}
        >
          Deactivate Member
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}