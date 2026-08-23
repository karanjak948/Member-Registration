import { useState } from "react";

import { useAppDispatch } from "@/store/hooks";

import { replaceMember } from "@/store/registration/registrationSlice";

import memberService from "@/services/member.service";

import { Member } from "@/interfaces/member";

import { memberToState } from "@/utils/memberMapper";

export default function useMemberWorkflow() {
  const dispatch = useAppDispatch();

  const [loading, setLoading] =
    useState(false);

  async function run(
    action: () => Promise<Member>
  ) {
    setLoading(true);

    try {
      const updatedMember =
        await action();

      dispatch(
        replaceMember(
          memberToState(updatedMember)
        )
      );

      return updatedMember;
    } finally {
      setLoading(false);
    }
  }

  return {
    loading,

    approve(
      id: number,
      remarks?: string
    ) {
      return run(() =>
        memberService.approve(
          id,
          remarks
        )
      );
    },

    reject(
      id: number,
      remarks?: string
    ) {
      return run(() =>
        memberService.reject(
          id,
          remarks
        )
      );
    },

    activate(id: number) {
      return run(() =>
        memberService.activate(id)
      );
    },

    deactivate(id: number, remarks?: string) {
      return run(() =>
        memberService.deactivate(id, remarks)
      );
    },

    completeRegistration(
      id: number
    ) {
      return run(() =>
        memberService.completeRegistration(
          id
        )
      );
    },
  };
}