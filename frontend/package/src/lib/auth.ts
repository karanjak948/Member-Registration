import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import api from "./api";

import axios from "axios";

async function refreshAccessToken(token: any) {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh/`,
      {
        refresh_token: token.refreshToken,
      }
    );

    const refreshed = response.data;

    return {
      ...token,
      accessToken: refreshed.access_token,
      refreshToken:
        refreshed.refresh_token ?? token.refreshToken,
      expiresIn: refreshed.expires_in,
      accessTokenExpires:
        Date.now() + refreshed.expires_in * 1000,
      error: undefined,
    };
  } catch (error) {
    console.error(error);

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
        if (!credentials) {
          return null;
        }

        try {
          // Login
          const loginResponse = await api.post("/auth/login/", {
            username: credentials.username,
            password: credentials.password,
          });

          const tokens = loginResponse.data;

          // Current user
          const meResponse = await api.get("/auth/me/", {
            headers: {
              Authorization: `Bearer ${tokens.access_token}`,
            },
          });

          const user = meResponse.data;

          return {
            id: String(user.id),

            username: user.username,
            email: user.email,

            firstName: user.first_name,
            lastName: user.last_name,

            isStaff: user.is_staff,
            isSuperuser: user.is_superuser,

            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,

            expiresIn: tokens.expires_in,

            accessTokenExpires:
              Date.now() + tokens.expires_in * 1000,
          };
        } catch (error) {
          console.error("Login failed:", error);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // Initial login
      if (user) {
        token.id = user.id;

        token.username = user.username;
        token.email = user.email;

        token.firstName = user.firstName;
        token.lastName = user.lastName;

        token.isStaff = user.isStaff;
        token.isSuperuser = user.isSuperuser;

        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;

        token.expiresIn = user.expiresIn;

        token.accessTokenExpires =
          user.accessTokenExpires;

        return token;
      }

      /**
       * Refresh the token 30 seconds before it expires.
       * This prevents multiple simultaneous refresh requests.
       */
      const shouldRefresh =
        Date.now() >=
        ((token.accessTokenExpires as number) - 30000);

      if (!shouldRefresh) {
        return token;
      }

      console.log("Refreshing OAuth access token...");

      return await refreshAccessToken(token);
    },

    async session({ session, token }) {
      session.user.id = token.id as string;

      session.user.username = token.username as string;
      session.user.email = token.email as string;

      session.user.firstName =
        token.firstName as string;

      session.user.lastName =
        token.lastName as string;

      session.user.isStaff =
        token.isStaff as boolean;

      session.user.isSuperuser =
        token.isSuperuser as boolean;

      session.accessToken =
        token.accessToken as string;

      session.refreshToken =
        token.refreshToken as string;

      session.expiresIn =
        token.expiresIn as number;

      session.accessTokenExpires =
        token.accessTokenExpires as number;

      session.error =
        token.error as string | undefined;

      return session;
    },
  },

  pages: {
    signIn: "/authentication/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
};