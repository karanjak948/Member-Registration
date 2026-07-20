import axios from "axios";
import { getSession, signOut } from "next-auth/react";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Log once when the application starts
console.log("API Base URL:", process.env.NEXT_PUBLIC_API_URL);

/*
|--------------------------------------------------------------------------
| Request Interceptor
|--------------------------------------------------------------------------
|
| Automatically attach the latest OAuth access token from NextAuth.
|
*/

api.interceptors.request.use(
  async (config) => {
    const session = await getSession();

    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`;
    }

    const requestUrl = `${config.baseURL ?? ""}${config.url ?? ""}`;

    console.log("Request URL:", requestUrl);

    return config;
  },
  (error) => Promise.reject(error)
);

/*
|--------------------------------------------------------------------------
| Response Interceptor
|--------------------------------------------------------------------------
|
| If the user's session has expired, redirect to login.
|
*/

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    if (error.response?.status === 401) {
      await signOut({
        callbackUrl: "/authentication/login",
      });
    }

    return Promise.reject(error);
  }
);

export default api;