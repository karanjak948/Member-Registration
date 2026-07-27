"use client";

import { useSession } from "next-auth/react";

import { Permission } from "@/constants/permissions";

export function usePermissions() {
  const { data: session } = useSession();

  const permissions = (session?.user.permissions ??
    []) as Permission[];

  const can = (
    permission: Permission
  ): boolean => permissions.includes(permission);

  const hasAny = (
    required: Permission[]
  ): boolean =>
    required.some((permission) =>
      permissions.includes(permission)
    );

  const hasAll = (
    required: Permission[]
  ): boolean =>
    required.every((permission) =>
      permissions.includes(permission)
    );

  return {
    permissions,

    can,

    hasAny,

    hasAll,

    role: session?.user.role,

    organization: session?.user.organization,
  };
}