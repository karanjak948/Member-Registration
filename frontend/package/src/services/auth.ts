import { getSession, signIn, signOut } from "next-auth/react";

class AuthService {
  async login(username: string, password: string) {
    return signIn("credentials", {
      username,
      password,
      redirect: false,
    });
  }

  async logout() {
    return signOut({
      callbackUrl: "/authentication/login",
    });
  }

  async getCurrentSession() {
    return getSession();
  }

  async getAccessToken(): Promise<string | null> {
    const session = await getSession();

    return session?.accessToken ?? null;
  }

  async isAuthenticated(): Promise<boolean> {
    const session = await getSession();

    return !!session?.accessToken;
  }
}

export default new AuthService();