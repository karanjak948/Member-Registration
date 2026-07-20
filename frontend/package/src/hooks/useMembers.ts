"use client";

import { useCallback, useEffect, useState } from "react";

import memberService from "@/services/member.service";
import { Member } from "@/interfaces/member";

export function useMembers() {
  const [members, setMembers] = useState<Member[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    try {
      setLoading(true);

      const data =
        await memberService.getAll();

      setMembers(data);

      setError(null);
    } catch (err) {
      console.error(err);

      setError("Failed to load members.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  return {
    members,
    loading,
    error,
    refresh: loadMembers,
  };
}