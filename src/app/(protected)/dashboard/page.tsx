"use client";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Breadcrumb } from "@components/refine-ui/layout/breadcrumb";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { data: session } = authClient.useSession();

  async function handleSignOut() {
    setLoading(true);
    await authClient.signOut();
    router.push("/sign-in");
    setLoading(false);
  }

  return (
    <main className="max-w-md h-screen flex items-center justify-center flex-col mx-auto p-6 space-y-4 ">
      <Breadcrumb />
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p>Welcome, {session?.user?.name || "User"}!</p>
      <p>Email: {session?.user?.email || "No email"}</p>
      <Button
        onClick={handleSignOut}
        disabled={loading}
        className="w-full"
      >
        {loading ? "Signing out..." : "Sign Out"}
      </Button>
    </main>
  );
}