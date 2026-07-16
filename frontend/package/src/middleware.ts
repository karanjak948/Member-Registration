import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/authentication/login",
  },
});

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/members/:path*",
    "/reports/:path*",
    "/profile/:path*",
    "/settings/:path*",
  ],
};