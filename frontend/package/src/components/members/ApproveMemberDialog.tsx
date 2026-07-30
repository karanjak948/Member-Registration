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

interface ApproveMemberDialogProps {
  open: boolean;

  member: Member | null;

  loading?: boolean;

  error?: string;

  onClose: () => void;

  onApprove: (
    remarks: string
  ) => void | Promise<void>;
}

export default function ApproveMemberDialog({
  open,
  member,
  loading = false,
  error,
  onClose,
  onApprove,
}: ApproveMemberDialogProps) {
  const [remarks, setRemarks] =
    useState("");

  useEffect(() => {
    if (open) {
      setRemarks("");
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
            disabled={loading}
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
          disabled={loading}
        >
          Cancel
        </Button>

        <LoadingButton
          color="success"
          variant="contained"
          loading={loading}
          startIcon={
            <CheckCircleOutlineIcon />
          }
          onClick={() =>
            onApprove(remarks)
          }
        >
          Approve Member
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}