import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_BASE_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not configured.");
}

async function refreshAccessToken(token: any) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/auth/refresh/`,
      {
        refresh_token: token.refreshToken,
      }
    );

    const refreshed = response.data;

    return {
      ...token,

      accessToken: refreshed.access_token,

      refreshToken:
        refreshed.refresh_token ??
        token.refreshToken,

      expiresIn: refreshed.expires_in,

      accessTokenExpires:
        Date.now() +
        refreshed.expires_in * 1000,

      error: undefined,
    };
  } catch (error) {
    console.error(
      "Failed to refresh access token:",
      error
    );

    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },

  providers: [
    CredentialsProvider({
      name: "Credentials",

      credentials: {
        username: {
          label: "Username",
          type: "text",
        },

        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {
        if (
          !credentials?.username ||
          !credentials?.password
        ) {
          return null;
        }

        try {
          /*
           * IMPORTANT:
           *
           * This is server-side NextAuth code.
           * Do not use src/services/api.ts here because
           * it depends on next-auth/react.
           */

          const loginResponse = await axios.post(
            `${API_BASE_URL}/auth/login/`,
            {
              username: credentials.username,
              password: credentials.password,
            }
          );

          const tokens = loginResponse.data;

          const meResponse = await axios.get(
            `${API_BASE_URL}/auth/me/`,
            {
              headers: {
                Authorization: `Bearer ${tokens.access_token}`,
              },
            }
          );

          const user = meResponse.data;

          return {
            id: String(user.id),

            username: user.username,
            email: user.email,

            firstName: user.first_name,
            lastName: user.last_name,

            isStaff: user.is_staff,
            isSuperuser: user.is_superuser,

            /*
             * RBAC Information
             */
            organization: user.organization,

            role: {
              id: user?.role?.id ?? 0,
              name: user?.role?.name ?? "Default User",
              description: user?.role?.description ?? "",
              isSystemRole: user?.role?.is_system_role ?? false,
            },

            permissions: user.permissions ?? [],

            /*
             * Tokens
             */
            accessToken: tokens.access_token,

            refreshToken: tokens.refresh_token,

            expiresIn: tokens.expires_in,

            accessTokenExpires:
              Date.now() +
              tokens.expires_in * 1000,
          };
        } catch (error) {
          if (axios.isAxiosError(error)) {
            console.error(
              "Login failed:",
              error.response?.status,
              error.response?.data
            );
          } else {
            console.error(
              "Login failed:",
              error
            );
          }

          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      /*
       * Initial login.
       */
      if (user) {
        token.id = user.id;

        token.username =
          user.username;

        token.email =
          user.email;

        token.firstName =
          user.firstName;

        token.lastName =
          user.lastName;

        token.isStaff =
          user.isStaff;

        token.isSuperuser =
          user.isSuperuser;

        /*
         * RBAC
         */
        token.organization =
          user.organization;

        token.role =
          user.role;

        token.permissions =
          user.permissions;

        /*
         * Tokens
         */
        token.accessToken =
          user.accessToken;

        token.refreshToken =
          user.refreshToken;

        token.expiresIn =
          user.expiresIn;

        token.accessTokenExpires =
          user.accessTokenExpires;

        return token;
      }

      /*
       * Refresh the access token
       * 30 seconds before expiration.
       */
      const accessTokenExpires =
        token.accessTokenExpires as
          | number
          | undefined;

      if (!accessTokenExpires) {
        return token;
      }

      const shouldRefresh =
        Date.now() >=
        accessTokenExpires - 30_000;

      if (!shouldRefresh) {
        return token;
      }

      return refreshAccessToken(token);
    },

    async session({
      session,
      token,
    }) {
      if (session.user) {
        session.user.id =
          token.id as string;

        session.user.username =
          token.username as string;

        session.user.email =
          token.email as string;

        session.user.firstName =
          token.firstName as string;

        session.user.lastName =
          token.lastName as string;

        session.user.isStaff =
          token.isStaff as boolean;

        session.user.isSuperuser =
          token.isSuperuser as boolean;

        /*
         * RBAC
         */
        session.user.organization =
          token.organization as any;

        session.user.role =
          token.role as any;

        session.user.permissions =
          (token.permissions as string[]) ?? [];
      }

      session.accessToken =
        token.accessToken as string;

      session.refreshToken =
        token.refreshToken as string;

      session.expiresIn =
        token.expiresIn as number;

      session.accessTokenExpires =
        token.accessTokenExpires as number;

      session.error =
        token.error as
          | string
          | undefined;

      return session;
    },
  },

  pages: {
    signIn:
      "/authentication/login",
  },

  secret:
    process.env.NEXTAUTH_SECRET,
};