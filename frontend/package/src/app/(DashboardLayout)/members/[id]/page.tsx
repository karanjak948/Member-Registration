"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Alert,
  Box,
  CircularProgress,
  Container,
} from "@mui/material";

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
  }, [params.id]);

  async function loadMember() {
    try {
      setLoading(true);
      const data = await memberService.getById(Number(params.id));
      setMember(data);
    } catch {
      setError("Unable to load member dossier.");
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

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Alert severity="error" sx={{ borderRadius: 2.5, fontWeight: 700 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  if (!member) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Alert severity="warning" sx={{ borderRadius: 2.5, fontWeight: 700 }}>
          Member dossier not found.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 1 }}>
      <MemberDetails member={member} onRefresh={refreshMember} />
    </Container>
  );
}
