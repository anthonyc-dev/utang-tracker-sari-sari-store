"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";
import { Layout } from "@/components/refine-ui/layout/layout";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (isPending) return;

    if (!session?.user) {
      router.replace("/sign-in");
    }
  }, [isPending, session, router]);

  if (isPending) {
    return (
      <main className="flex h-screen max-w-md flex-col items-center justify-center mx-auto p-6">
        <div className="flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <span>Loading...</span>
        </div>
      </main>
    );
  }

  if (!session?.user) {
    return null;
  }

  return <Layout>{children}</Layout>;
}
