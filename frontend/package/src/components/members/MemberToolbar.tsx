"use client";

import Link from "next/link";

import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";

interface MemberToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;

  status: string;
  onStatusChange: (value: string) => void;

  stage: string;
  onStageChange: (value: string) => void;

  onRefresh: () => void | Promise<void>;
}

export default function MemberToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  stage,
  onStageChange,
  onRefresh,
}: MemberToolbarProps) {
  return (
    <Box mb={3}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{
          xs: "stretch",
          md: "center",
        }}
      >
        <Stack
          direction={{
            xs: "column",
            md: "row",
          }}
          spacing={2}
          flex={1}
        >
          <TextField
            fullWidth
            label="Search Members"
            placeholder="Membership No, Name, National ID or Phone"
            value={search}
            onChange={(e) =>
              onSearchChange(e.target.value)
            }
          />

          <FormControl sx={{ minWidth: 170 }}>
            <InputLabel>Status</InputLabel>

            <Select
              value={status}
              label="Status"
              onChange={(e) =>
                onStatusChange(
                  e.target.value as string
                )
              }
            >
              <MenuItem value="">All</MenuItem>

              <MenuItem value="ACTIVE">
                Active
              </MenuItem>

              <MenuItem value="INACTIVE">
                Inactive
              </MenuItem>

              <MenuItem value="SUSPENDED">
                Suspended
              </MenuItem>
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 220 }}>
            <InputLabel>
              Registration Stage
            </InputLabel>

            <Select
              value={stage}
              label="Registration Stage"
              onChange={(e) =>
                onStageChange(
                  e.target.value as string
                )
              }
            >
              <MenuItem value="">
                All
              </MenuItem>

              <MenuItem value="DATA_CAPTURE_PENDING">
                Data Capture Pending
              </MenuItem>

              <MenuItem value="APPROVED">
                Approved
              </MenuItem>

              <MenuItem value="ACTIVE">
                Active
              </MenuItem>

              <MenuItem value="REJECTED">
                Rejected
              </MenuItem>
            </Select>
          </FormControl>
        </Stack>

        <Stack
          direction="row"
          spacing={2}
        >
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={onRefresh}
          >
            Refresh
          </Button>

          <Button
            component={Link}
            href="/members/new"
            variant="contained"
            startIcon={<AddIcon />}
          >
            Register Member
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}