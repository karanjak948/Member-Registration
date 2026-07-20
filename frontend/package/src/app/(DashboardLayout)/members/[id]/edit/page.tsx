"use client";

import { useEffect, useState } from "react";

import { useParams, useRouter } from "next/navigation";

import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Typography,
} from "@mui/material";

import memberService from "@/services/member.service";

import { Member } from "@/interfaces/member";

import EditMemberForm from "@/components/members/forms/EditMemberForm";

export default function EditMemberPage() {
  const params = useParams();

  const router = useRouter();

  const [member, setMember] = useState<Member | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchMember() {
      try {
        const data = await memberService.getById(
          Number(params.id)
        );

        setMember(data);
      } catch {
        setError("Unable to load member.");
      } finally {
        setLoading(false);
      }
    }

    fetchMember();
  }, [params.id]);

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" py={10}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error">
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Typography
        variant="h4"
        mb={3}
      >
        Edit Member
      </Typography>

      <Card>
        <CardContent>
          {member && (
            <EditMemberForm
              member={member}
              onBack={() => router.back()}
              onSuccess={(updatedMember) => {
                router.push(
                  `/members/${updatedMember.id}`
                );
              }}
            />
          )}
        </CardContent>
      </Card>
    </Container>
  );
}