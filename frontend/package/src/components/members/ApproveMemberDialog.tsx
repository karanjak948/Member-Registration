"use client";

import { useEffect, useState } from "react";

import {
  Alert,
  Box,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
  Button,
} from "@mui/material";

import { LoadingButton } from "@mui/lab";

import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

import { Member } from "@/interfaces/member";

import useMemberWorkflow from "@/components/members/hooks/useMemberWorkflow";

interface ApproveMemberDialogProps {
  open: boolean;

  member: Member | null;

  loading?: boolean;

  error?: string;

  onClose: () => void;

  onSuccess?: () => void;
}

export default function ApproveMemberDialog({
  open,
  member,
  loading: externalLoading = false,
  error: externalError,
  onClose,
  onSuccess,
}: ApproveMemberDialogProps) {
  const [remarks, setRemarks] = useState("");
  const [internalError, setInternalError] = useState("");

  const workflow = useMemberWorkflow();

  useEffect(() => {
    if (open) {
      setRemarks("");
      setInternalError("");
    }
  }, [open]);

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

  async function handleApprove() {
    if (!member) return;

    try {
      setInternalError("");

      await workflow.approve(member.id, remarks);

      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (error) {
      console.error("Failed to approve member:", error);
      setInternalError("Failed to approve member. Please try again.");
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
          <CheckCircleOutlineIcon
            color="success"
          />

          <Box>
            <Typography variant="h6">
              Approve Member
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              Approve this member and
              advance them to the next
              registration stage.
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
                    {
                      member?.membership_number
                    }
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
                    Current Stage
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
              </Stack>
            </Stack>
          </Paper>

          <TextField
            label="Approval Remarks (Optional)"
            multiline
            minRows={4}
            maxRows={6}
            fullWidth
            value={remarks}
            disabled={workflow.loading || externalLoading}
            onChange={(e) =>
              setRemarks(
                e.target.value
              )
            }
            helperText="Remarks will be stored in the workflow history."
          />
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
            <CheckCircleOutlineIcon />
          }
          onClick={handleApprove}
        >
          Approve Member
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}