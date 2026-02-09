"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CircleAlert, Eye, EyeOff, Loader2, Store } from "lucide-react";

export default function SignUpPage() {
    const router = useRouter();
    const { data: session, isPending } = authClient.useSession();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Authenticated users cannot access sign-up; redirect to dashboard
    useEffect(() => {
        if (!isPending && session?.user) {
            router.replace("/dashboard");
        }
    }, [session?.user, isPending, router]);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        const formData = new FormData(e.currentTarget);

        const password = formData.get("password") as string;
        const confirmPassword = formData.get("confirmPassword") as string;
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            setIsLoading(false);
            return;
        }

        const res = await authClient.signUp.email({
            name: formData.get("name") as string,
            email: formData.get("email") as string,
            password,
        });

        if (res.error) {
            setError(res.error.message || "Something went wrong.");
        } else {
            router.push("/dashboard");
        }
        setIsLoading(false);
    }

    const handleGoogleSignIn = async () => {
        try {
            setIsLoading(true);
            await authClient.signIn.social({
                provider: "google",
                callbackURL: "/dashboard",
            });
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="w-full min-h-screen grid md:grid-cols-2 overflow-hidden shadow-xl bg-linear-to-b from-indigo-50/60 to-white bg-white">

            {/* Sign Up Card */}
            <div className="flex flex-col justify-center p-8 sm:p-12 bg-linear-to-b to-white">
                <div className="w-full max-w-lg mx-auto ">
                    {/* Branding */}
                    <div className="flex items-center gap-2 mb-12">
                        <div className="w-9 h-9 rounded-full bg-neutral-900 flex items-center justify-center">
                            <Store className="size-6 text-white" />
                        </div>
                        <span className="text-xl font-semibold text-neutral-900">Sari-Sari Store</span>
                    </div>

                    {/* Welcome for Sign Up */}
                    <h1 className="text-3xl font-bold text-neutral-900 mb-1">Create Your Account</h1>
                    <p className="text-neutral-500 text-sm mb-8">
                        Sign up to start managing your finances smartly. Enter your details below.
                    </p>

                    {error && (
                        <div className="flex items-center gap-2 mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
                            <CircleAlert className="text-red-600 w-5 h-5" />
                            <p className="text-red-600 text-sm">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4 w-full">
                        <Input
                            type="text"
                            id="name"
                            name="name"
                            placeholder="Full Name"
                            required
                            className="h-11 bg-white border-neutral-200 rounded-lg px-4 pr-12"
                        />
                        <Input
                            type="email"
                            id="email"
                            name="email"
                            placeholder="Email"
                            required
                            className="h-11 bg-white border-neutral-200 rounded-lg px-4 pr-12"
                        />
                        <div className="relative">
                            <Input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                required
                                className="h-11 bg-white border-neutral-200 rounded-lg px-4 pr-12"
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        <div className="relative">
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm Password"
                                required
                                className="h-11 bg-white border-neutral-200 rounded-lg px-4 pr-12"
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                                tabIndex={-1}
                            >
                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        <Button
                            type="submit"
                            className="w-full h-11 text-white font-semibold rounded-lg"
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign Up"}
                        </Button>
                    </form>
                    {/* Separator */}
                    <div className="flex items-center gap-3 my-8">
                        <div className="flex-1 h-px bg-neutral-200" />
                        <span className="text-sm text-neutral-400">or continue</span>
                        <div className="flex-1 h-px bg-neutral-200" />
                    </div>

                    {/* Google Sign Up */}
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full h-11 bg-white border-neutral-200 rounded-lg flex items-center justify-center gap-2 hover:bg-neutral-50"
                        onClick={handleGoogleSignIn}
                        disabled={isLoading}
                    >
                        {!isLoading && (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48">
                                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                            </svg>
                        )}
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign up with Google"}
                    </Button>

                    <p className="mt-8 text-center text-sm text-neutral-500">
                        Already have an account?{" "}
                        <Link href="/sign-in" className="text-black font-medium hover:underline">
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>

            {/* Marketing/Card Right Panel */}
            <div className="hidden md:flex flex-col justify-center items-center relative bg-neutral-900 overflow-hidden m-3 rounded-md rounded-bl-4xl">
                {/* Hexagon pattern background */}
                <div
                    className="absolute inset-0 opacity-30"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }}
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-linear-to-br from-emerald-500/10 via-transparent to-cyan-500/10" />

                {/* Decorative geometric shapes */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64">
                    <div className="absolute inset-0 border-2 border-emerald-400/40 rounded-lg rotate-12" />
                    <div className="absolute inset-4 border border-cyan-400/30 rounded-lg -rotate-6" />
                </div>
                <div className="absolute top-[20%] left-[15%] w-16 h-16 border border-purple-400/30 rotate-45" />
                <div className="absolute top-[25%] right-[20%] w-12 h-12 border border-amber-400/30 rotate-12" />
                <div className="absolute bottom-[30%] left-[25%] w-10 h-10 border border-emerald-400/30 -rotate-6" />
                <div className="absolute bottom-[25%] right-[15%] w-14 h-14 rounded-full border-2 border-cyan-400/30" />

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-center p-12">
                    <h2 className="text-3xl font-bold text-white mb-4">Utang Tracker for Sari-Sari Stores</h2>
                    <p className="text-neutral-300 text-base max-w-sm">
                        A Smart Solution for Sari-Sari Store Owners to Track Customer Utang, Record Payments, and Maintain Clear, Accurate Financial Records Every Day.
                    </p>

                    {/* Navigation dots */}
                    <div className="flex gap-2 mt-12">
                        <div className="w-2 h-2 rounded-full bg-emerald-400" />
                        <div className="w-2 h-2 rounded-full bg-neutral-600" />
                        <div className="w-2 h-2 rounded-full bg-neutral-600" />
                    </div>
                </div>
            </div>
        </main>
    );
}