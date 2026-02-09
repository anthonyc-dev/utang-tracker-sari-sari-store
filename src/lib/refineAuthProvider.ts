"use client";

import type { AuthProvider } from "@refinedev/core";
import { authClient } from "@/lib/auth-client";

export const refineAuthProvider: AuthProvider = {
  login: async () => {
    // Actual sign-in happens on /sign-in page with better-auth
    return { success: true, redirectTo: "/dashboard" };
  },
  logout: async () => {
    await authClient.signOut();
    return { success: true, redirectTo: "/sign-in" };
  },
  check: async () => {
    try {
      const session = await authClient.getSession();
      if (session?.data?.user) {
        return { authenticated: true };
      }
      return {
        authenticated: false,
        redirectTo: "/sign-in",
        logout: true,
      };
    } catch {
      return {
        authenticated: false,
        redirectTo: "/sign-in",
        logout: true,
      };
    }
  },
  onError: async (error) => {
    if (error?.status === 401) {
      return { logout: true, redirectTo: "/sign-in" };
    }
    return {};
  },
  getIdentity: async () => {
    try {
      const session = await authClient.getSession();
      const user = session?.data?.user;
      if (!user) return null;
      return {
        id: user.id,
        name: user.name ?? undefined,
        email: user.email ?? undefined,
        avatar: user.image ?? undefined,
      };
    } catch {
      return null;
    }
  },
};
