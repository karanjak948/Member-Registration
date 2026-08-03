"use client";

import { Stack, Button } from "@mui/material";

interface Props {
  memberId: number;

  onApprove: () => void;

  onReject: () => void;

  onActivate: () => void;

  onDeactivate: () => void;

  onCompleteRegistration: () => void;
}

export default function WorkflowToolbar({
  onApprove,
  onReject,
  onActivate,
  onDeactivate,
  onCompleteRegistration,
}: Props) {
  return (
    <Stack
      direction="row"
      spacing={2}
      flexWrap="wrap"
      useFlexGap
    >
      <Button
        variant="contained"
        color="success"
        onClick={onApprove}
      >
        Approve
      </Button>

      <Button
        variant="contained"
        color="error"
        onClick={onReject}
      >
        Reject
      </Button>

      <Button
        variant="contained"
        color="primary"
        onClick={onActivate}
      >
        Activate
      </Button>

      <Button
        variant="outlined"
        color="warning"
        onClick={onDeactivate}
      >
        Deactivate
      </Button>

      <Button
        variant="contained"
        onClick={onCompleteRegistration}
      >
        Complete Registration
      </Button>
    </Stack>
  );
}