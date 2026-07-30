"use client";

import { useEffect, useState } from "react";

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
  TextField,
  Typography,
} from "@mui/material";

import { LoadingButton } from "@mui/lab";

import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";

import { Member } from "@/interfaces/member";

interface RejectMemberDialogProps {
  open: boolean;

  member: Member | null;

  loading?: boolean;

  error?: string;

  onClose: () => void;

  onReject: (
    remarks: string
  ) => void | Promise<void>;
}

export default function RejectMemberDialog({
  open,
  member,
  loading = false,
  error,
  onClose,
  onReject,
}: RejectMemberDialogProps) {
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
          <CancelOutlinedIcon
            color="error"
          />

          <Box>
            <Typography variant="h6">
              Reject Member
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              Reject this member and
              return them to the
              rejected workflow state.
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
            label="Reason for Rejection"
            multiline
            minRows={4}
            maxRows={6}
            fullWidth
            required
            value={remarks}
            disabled={loading}
            onChange={(e) =>
              setRemarks(
                e.target.value
              )
            }
            helperText="Provide the reason for rejecting this member."
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
          color="error"
          variant="contained"
          loading={loading}
          startIcon={
            <CancelOutlinedIcon />
          }
          disabled={
            remarks.trim().length === 0
          }
          onClick={() =>
            onReject(
              remarks.trim()
            )
          }
        >
          Reject Member
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}