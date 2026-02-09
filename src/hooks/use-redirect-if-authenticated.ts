"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

const DEFAULT_REDIRECT = "/dashboard" as const;

/**
 * Redirects to the given path when the user already has a session.
 * Use on auth-only routes (sign-in, sign-up) so authenticated users are sent away.
 *
 * @param redirectTo - Path to redirect to when authenticated (default: "/dashboard")
 * @returns Session loading state and whether user is authenticated (for conditional UI)
 */
export function useRedirectIfAuthenticated(
  redirectTo: string = DEFAULT_REDIRECT,
) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const isAuthenticated = Boolean(session?.user);

  useEffect(() => {
    if (isPending) return;
    if (isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isPending, isAuthenticated, redirectTo, router]);

  return { isPending, isAuthenticated };
}
