import NextAuth, { DefaultSession } from "next-auth";

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

    accessToken: string;
    refreshToken: string;

    expiresIn: number;
    accessTokenExpires: number;

    error?: string;
  }
}