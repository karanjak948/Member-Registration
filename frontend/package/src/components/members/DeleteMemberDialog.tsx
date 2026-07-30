"use client";

import {
  Alert,
  Box,
  Button,
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

import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";

import { Member } from "@/interfaces/member";

interface DeleteMemberDialogProps {
  open: boolean;

  member: Member | null;

  loading?: boolean;

  error?: string;

  onClose: () => void;

  onDelete: () => void | Promise<void>;
}

export default function DeleteMemberDialog({
  open,
  member,
  loading = false,
  error,
  onClose,
  onDelete,
}: DeleteMemberDialogProps) {
  return (
    <Dialog
      open={open}
      fullWidth
      maxWidth="sm"
      onClose={loading ? undefined : onClose}
    >
      <DialogTitle>
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
        >
          <DeleteOutlineOutlinedIcon color="error" />

          <Box>
            <Typography variant="h6">
              Delete Member
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              Permanently delete this member
              from the system.
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
            sx={{ p: 2.5 }}
          >
            <Stack spacing={1.5}>
              <Typography
                variant="subtitle1"
                fontWeight={600}
              >
                Member Information
              </Typography>

              <Divider />

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
                  {member?.category_name ?? "-"}
                </Typography>
              </Box>
            </Stack>
          </Paper>

          <Alert severity="warning">
            This action is permanent and
            cannot be undone.
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
          disabled={loading}
          onClick={onClose}
        >
          Cancel
        </Button>

        <LoadingButton
          color="error"
          variant="contained"
          loading={loading}
          startIcon={
            <DeleteOutlineOutlinedIcon />
          }
          onClick={() =>
            onDelete()
          }
        >
          Delete Member
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}