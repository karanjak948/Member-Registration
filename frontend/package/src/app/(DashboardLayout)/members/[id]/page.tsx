"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { IconArrowLeft, IconUserX, IconUsers } from "@tabler/icons-react";

import memberService from "@/services/member.service";
import { Member } from "@/interfaces/member";
import MemberDetails from "@/components/members/details/MemberDetails";

export default function ViewMemberPage() {
  const params = useParams();
  const router = useRouter();

  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const rawId = params?.id as string;
  const memberId = Number(rawId);

  useEffect(() => {
    if (!rawId || isNaN(memberId) || memberId <= 0) {
      setLoading(false);
      setError(`Invalid member identifier "${rawId}". Please select a valid member from the directory.`);
      return;
    }
    loadMember();
  }, [rawId, memberId]);

  async function loadMember() {
    try {
      setLoading(true);
      setError("");
      const data = await memberService.getById(memberId);
      setMember(data);
    } catch {
      setError(`Member record #${memberId} was not found in your organization database.`);
    } finally {
      setLoading(false);
    }
  }

  async function refreshMember() {
    if (!member?.id) return;
    try {
      const updated = await memberService.getById(member.id);
      setMember(updated);
    } catch (err) {
      console.error("Failed to refresh member dossier:", err);
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress color="success" size={42} />
      </Box>
    );
  }

  if (error || !member) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            textAlign: "center",
            borderRadius: 3.5,
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05)",
            bgcolor: "#ffffff",
          }}
        >
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              bgcolor: "#fef2f2",
              color: "#ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 2,
            }}
          >
            <IconUserX size={30} />
          </Box>

          <Typography variant="h5" fontWeight={900} color="#0f172a" mb={1}>
            Member Dossier Not Found
          </Typography>

          <Typography variant="body2" color="#64748b" sx={{ maxWidth: 460, mx: "auto", mb: 3 }}>
            {error || `Member #${memberId} does not exist or was removed.`}
          </Typography>

          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="contained"
              color="success"
              startIcon={<IconUsers size={18} />}
              onClick={() => router.push("/members")}
              sx={{ fontWeight: 800, borderRadius: 2.5, px: 3, py: 1 }}
            >
              Return to Member Directory
            </Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 1 }}>
      <MemberDetails member={member} onRefresh={refreshMember} />
    </Container>
  );
}
