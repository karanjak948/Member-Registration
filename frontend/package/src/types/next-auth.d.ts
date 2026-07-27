import NextAuth, { DefaultSession } from "next-auth";

export interface OrganizationInfo {
  id: number;
  name: string;
  code: string;
}

export interface RoleInfo {
  id: number;
  name: string;
  description: string;
  isSystemRole: boolean;
}

declare module "next-auth" {
  interface Session {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    accessTokenExpires: number;
    error?: string;

    user: {
      id: string;

      username: string;
      email: string;

      firstName: string;
      lastName: string;

      isStaff: boolean;
      isSuperuser: boolean;

      organization: OrganizationInfo | null;

      role: RoleInfo | null;

      permissions: string[];
    } & DefaultSession["user"];
  }

  interface User {
    id: string;

    username: string;
    email: string;

    firstName: string;
    lastName: string;

    isStaff: boolean;
    isSuperuser: boolean;

    organization: OrganizationInfo | null;

    role: RoleInfo | null;

    permissions: string[];

    accessToken: string;
    refreshToken: string;

    expiresIn: number;
    accessTokenExpires: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;

    username: string;
    email: string;

    firstName: string;
    lastName: string;

    isStaff: boolean;
    isSuperuser: boolean;

    organization: OrganizationInfo | null;

    role: RoleInfo | null;

    permissions: string[];

    accessToken: string;
    refreshToken: string;

    expiresIn: number;
    accessTokenExpires: number;

    error?: string;
  }
}