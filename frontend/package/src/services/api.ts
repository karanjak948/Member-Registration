import axios from "axios";
import { getSession, signOut } from "next-auth/react";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

api.interceptors.request.use(
  async (config) => {
    const session = await getSession();

    if (session?.accessToken) {
      config.headers.set(
        "Authorization",
        `Bearer ${session.accessToken}`
      );
    }

    // Let Axios/browser determine the correct Content-Type.
    // If we're sending FormData, it will automatically use:
    // multipart/form-data; boundary=...
    // Otherwise, it will use application/json as appropriate.
    if (config.data instanceof FormData) {
      config.headers.delete("Content-Type");
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    if (error.response?.status === 401) {
      console.warn("Authentication expired.");

      await signOut({
        callbackUrl: "/authentication/login",
      });
    }

    return Promise.reject(error);
  }
);

export default api;