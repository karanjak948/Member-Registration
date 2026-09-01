"use client";

import Link from "next/link";
import {
  Box,
  Button,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import {
  IconSearch,
  IconRefresh,
  IconUserPlus,
  IconFilter,
  IconCategory,
  IconShieldCheck,
  IconProgress,
} from "@tabler/icons-react";

import ExportButton from "@/components/common/ExportButton";
import { Member } from "@/interfaces/member";

interface MemberToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  stage: string;
  onStageChange: (value: string) => void;
  category?: string;
  onCategoryChange?: (value: string) => void;
  onRefresh: () => void | Promise<void>;
  members?: Member[];
}

export default function MemberToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  stage,
  onStageChange,
  category = "",
  onCategoryChange,
  onRefresh,
  members = [],
}: MemberToolbarProps) {
  const exportColumns = [
    { header: "Membership No", accessor: (m: Member) => m.membership_number || "—" },
    { header: "Full Name", accessor: (m: Member) => `${m.first_name || ""} ${m.other_names || ""}`.trim() || "—" },
    { header: "National ID", accessor: (m: Member) => m.national_id || "—" },
    { header: "Phone Number", accessor: (m: Member) => m.phone_number || "—" },
    { header: "Email", accessor: (m: Member) => m.email || "—" },
    { header: "Category", accessor: (m: Member) => m.category_name || "Normal Member" },
    { header: "Status", accessor: (m: Member) => m.status },
    { header: "Registration Stage", accessor: (m: Member) => m.registration_stage },
  ];

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        mb: 3,
        borderRadius: 3,
        border: "1px solid #e2e8f0",
        bgcolor: "#ffffff",
        boxShadow: "0 1px 4px rgba(0,0,0,0.02)",
      }}
    >
      <Stack
        direction={{ xs: "column", xl: "row" }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", xl: "center" }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          flex={1}
          alignItems={{ xs: "stretch", md: "center" }}
        >
          {/* Search Input */}
          <TextField
            fullWidth
            placeholder="Search by Name, Member No, National ID, or Phone..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <IconSearch size={18} style={{ color: "#064e3b" }} />
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: 2.5,
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#cbd5e1" },
                  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#064e3b" },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#064e3b",
                    borderWidth: 2,
                  },
                },
              },
            }}
            sx={{ maxWidth: { xs: "100%", md: 380 } }}
          />

          {/* Category Filter */}
          {onCategoryChange && (
            <FormControl sx={{ minWidth: { xs: "100%", md: 170 } }}>
              <InputLabel id="category-filter-label" sx={{ fontWeight: 600, fontSize: "0.9rem" }}>
                Category
              </InputLabel>
              <Select
                labelId="category-filter-label"
                value={category}
                label="Category"
                onChange={(e) => onCategoryChange(e.target.value as string)}
                sx={{
                  borderRadius: 2.5,
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#cbd5e1" },
                  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#064e3b" },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#064e3b",
                    borderWidth: 2,
                  },
                }}
              >
                <MenuItem value="" sx={{ fontWeight: 600 }}>All Categories</MenuItem>
                <MenuItem value="Normal Member">🟢 Normal Member</MenuItem>
                <MenuItem value="Special Member">🔵 Special Member</MenuItem>
                <MenuItem value="Other Member">🟣 Other Member</MenuItem>
              </Select>
            </FormControl>
          )}

          {/* Status Filter */}
          <FormControl sx={{ minWidth: { xs: "100%", md: 150 } }}>
            <InputLabel id="status-filter-label" sx={{ fontWeight: 600, fontSize: "0.9rem" }}>
              Status
            </InputLabel>
            <Select
              labelId="status-filter-label"
              value={status}
              label="Status"
              onChange={(e) => onStatusChange(e.target.value as string)}
              sx={{
                borderRadius: 2.5,
                fontWeight: 600,
                fontSize: "0.875rem",
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "#cbd5e1" },
                "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#064e3b" },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#064e3b",
                  borderWidth: 2,
                },
              }}
            >
              <MenuItem value="" sx={{ fontWeight: 600 }}>All Status</MenuItem>
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="INACTIVE">Inactive</MenuItem>
              <MenuItem value="SUSPENDED">Suspended</MenuItem>
            </Select>
          </FormControl>

          {/* Registration Stage Filter */}
          <FormControl sx={{ minWidth: { xs: "100%", md: 190 } }}>
            <InputLabel id="stage-filter-label" sx={{ fontWeight: 600, fontSize: "0.9rem" }}>
              Registration Stage
            </InputLabel>
            <Select
              labelId="stage-filter-label"
              value={stage}
              label="Registration Stage"
              onChange={(e) => onStageChange(e.target.value as string)}
              sx={{
                borderRadius: 2.5,
                fontWeight: 600,
                fontSize: "0.875rem",
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "#cbd5e1" },
                "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#064e3b" },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#064e3b",
                  borderWidth: 2,
                },
              }}
            >
              <MenuItem value="" sx={{ fontWeight: 600 }}>All Stages</MenuItem>
              <MenuItem value="DATA_CAPTURE_PENDING">Data Capture Pending</MenuItem>
              <MenuItem value="APPROVED">Approved</MenuItem>
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="REJECTED">Rejected</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {/* Action Buttons */}
        <Stack direction="row" spacing={1.5} sx={{ alignSelf: { xs: "stretch", xl: "auto" } }}>
          <ExportButton
            data={members}
            columns={exportColumns as any}
            filename="sacco_members_directory"
            title="Export"
          />

          <Button
            variant="outlined"
            startIcon={<IconRefresh size={18} />}
            onClick={onRefresh}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: 2.5,
              borderColor: "#cbd5e1",
              color: "#334155",
              px: 2.5,
              py: 1,
              "&:hover": { borderColor: "#064e3b", bgcolor: "#f0fdf4" },
            }}
          >
            Refresh
          </Button>

          <Button
            component={Link}
            href="/members/new"
            variant="contained"
            startIcon={<IconUserPlus size={18} />}
            sx={{
              textTransform: "none",
              fontWeight: 800,
              bgcolor: "#064e3b",
              color: "#ffffff",
              borderRadius: 2.5,
              px: 3,
              py: 1,
              whiteSpace: "nowrap",
              boxShadow: "0 4px 14px rgba(6, 78, 59, 0.3)",
              "&:hover": { bgcolor: "#047857" },
            }}
          >
            + Register Member
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}