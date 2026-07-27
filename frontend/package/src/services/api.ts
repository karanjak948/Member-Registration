import axios from "axios";
import {
  getSession,
  signOut,
} from "next-auth/react";

const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_URL,
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

    /*
     * Let the browser generate the multipart
     * Content-Type and boundary for FormData.
     */
    if (
      typeof FormData !== "undefined" &&
      config.data instanceof FormData
    ) {
      config.headers.delete(
        "Content-Type"
      );
    }

    return config;
  },

  (error) =>
    Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    /*
     * 401 means authentication has failed or
     * the session/token is no longer valid.
     *
     * 403 is deliberately not handled here.
     * It represents an authenticated user who
     * lacks the required RBAC permission.
     */
    if (
      error.response?.status === 401
    ) {
      await signOut({
        callbackUrl:
          "/authentication/login",
      });
    }

    return Promise.reject(error);
  }
);

export default api;