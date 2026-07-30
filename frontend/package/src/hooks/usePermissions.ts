"use client";

import { useSession } from "next-auth/react";

import { Permission } from "@/constants/permissions";

export function usePermissions() {
  const {
    data: session,
    status,
  } = useSession();

  const permissions = (
    session?.user.permissions ?? []
  ) as Permission[];

  const role =
    session?.user.role;

  const organization =
    session?.user.organization;

  const isSuperuser =
    session?.user.isSuperuser ?? false;

  const isStaff =
    session?.user.isStaff ?? false;

  const loading =
    status === "loading";

  /**
   * Returns true if the current user
   * has the specified permission.
   *
   * Superusers automatically pass.
   */
  const can = (
    permission: Permission
  ): boolean => {
    if (isSuperuser) {
      return true;
    }

    return permissions.includes(
      permission
    );
  };

  /**
   * Convenience helper.
   */
  const cannot = (
    permission: Permission
  ): boolean => {
    return !can(permission);
  };

  /**
   * Returns true if the user has
   * at least one of the supplied
   * permissions.
   */
  const hasAny = (
    required: Permission[]
  ): boolean => {
    if (isSuperuser) {
      return true;
    }

    return required.some(
      (permission) =>
        permissions.includes(permission)
    );
  };

  /**
   * Returns true if the user has
   * every supplied permission.
   */
  const hasAll = (
    required: Permission[]
  ): boolean => {
    if (isSuperuser) {
      return true;
    }

    return required.every(
      (permission) =>
        permissions.includes(permission)
    );
  };

  /**
   * Returns true if the current
   * user's role matches.
   */
  const hasRole = (
    roleName: string
  ): boolean => {
    return (
      role?.name === roleName
    );
  };

  return {
    /**
     * Session
     */
    session,

    loading,

    /**
     * Organization
     */
    organization,

    /**
     * Role
     */
    role,

    /**
     * Permissions
     */
    permissions,

    /**
     * Flags
     */
    isStaff,

    isSuperuser,

    /**
     * Permission helpers
     */
    can,

    cannot,

    hasAny,

    hasAll,

    /**
     * Role helper
     */
    hasRole,
  };
}