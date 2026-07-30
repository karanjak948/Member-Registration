"use client";

import { useSession } from "next-auth/react";

import { Permission } from "@/constants/permissions";

export function usePermissions() {
  const { data: session } = useSession();

  const permissions = (session?.user.permissions ??
    []) as Permission[];

  const role = session?.user.role;

  const organization =
    session?.user.organization;

  const isSuperuser =
    session?.user.isSuperuser ?? false;

  const isStaff =
    session?.user.isStaff ?? false;

  const can = (
    permission: Permission
  ): boolean => {
    if (isSuperuser) {
      return true;
    }

    return permissions.includes(permission);
  };

  const hasAny = (
    required: Permission[]
  ): boolean => {
    if (isSuperuser) {
      return true;
    }

    return required.some((permission) =>
      permissions.includes(permission)
    );
  };

  const hasAll = (
    required: Permission[]
  ): boolean => {
    if (isSuperuser) {
      return true;
    }

    return required.every((permission) =>
      permissions.includes(permission)
    );
  };

  return {
    permissions,

    role,

    organization,

    isStaff,

    isSuperuser,

    can,

    hasAny,

    hasAll,
  };
}