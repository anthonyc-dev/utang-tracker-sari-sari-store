"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { data: session, isPending } = authClient.useSession();

    useEffect(() => {
        if (isPending) return;
        if (session?.user) router.replace("/dashboard");
    }, [isPending, session, router]);

    if (isPending || session?.user) {
        return <main className="max-w-md h-screen flex items-center justify-center flex-col mx-auto p-6">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </main>;
    }

    return <>{children}</>;
}
