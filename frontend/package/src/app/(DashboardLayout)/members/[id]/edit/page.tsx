"use client";

import { useEffect, useState } from "react";

import { useParams, useRouter } from "next/navigation";

import {
  Alert,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Typography,
} from "@mui/material";

import memberService from "@/services/member.service";

import MemberDetailsStep from "@/components/members/forms/MemberDetailsStep";

export default function EditMemberPage() {
  const params = useParams();

  const router = useRouter();

  const [member, setMember] = useState<any>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    loadMember();
  }, []);

  async function loadMember() {
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

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return (
      <Alert severity="error">
        {error}
      </Alert>
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
          <MemberDetailsStep
            mode="edit"
            memberId={member.id}
            data={member}
            onBack={() => router.back()}
            onNext={() => {
              router.push(
                `/members/${member.id}`
              );
            }}
          />
        </CardContent>
      </Card>
    </Container>
  );
}