"use client";

import { useEffect, useState } from "react";

import { useParams, useRouter } from "next/navigation";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import memberService from "@/services/member.service";
import { Member } from "@/interfaces/member";

import MemberDetails from "@/components/members/details/MemberDetails";

export default function ViewMemberPage() {
  const params = useParams();

  const router = useRouter();

  const [member, setMember] = useState<Member | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    loadMember();
  }, []);

  async function loadMember() {
    try {
      const data = await memberService.getById(Number(params.id));

      setMember(data);
    } catch {
      setError("Unable to load member.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={10}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!member) {
    return <Alert severity="warning">Member not found.</Alert>;
  }

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4">Member Details</Typography>

        <Stack direction="row" spacing={2}>
          <Button
            startIcon={<ArrowBackIcon />}
            variant="outlined"
            onClick={() => router.push("/members")}
          >
            Back
          </Button>

          <Button
            startIcon={<EditIcon />}
            variant="contained"
            onClick={() => router.push(`/members/${member.id}/edit`)}
          >
            Edit
          </Button>
        </Stack>
      </Stack>

      <MemberDetails member={member} />
    </Box>
  );
}
