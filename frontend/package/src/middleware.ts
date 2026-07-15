export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/",
    "/register-member/:path*",
    "/view-members/:path*",
    "/reports/:path*",
    "/profile/:path*",
    "/settings/:path*",
  ],
};