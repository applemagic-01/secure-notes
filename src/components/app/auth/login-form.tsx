"use client";

// Handles the client-side login flow: collects credentials, calls the session endpoint, and redirects after successful authentication.

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/app/glass/glass-card";
import { GlassPanel } from "@/components/app/glass/glass-panel";

export function LoginForm() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setError("");
        setLoading(true);

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error ?? "Invalid email or password");
                return;
            }

            router.push("/notes");
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <GlassCard className="p-7 sm:p-8">
            <div className="mb-7 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400 to-violet-500 shadow-lg shadow-blue-500/20">
                    <LockKeyhole className="h-6 w-6 text-white" />
                </div>

                <h1 className="text-2xl font-semibold tracking-tight text-white">
                    Welcome back
                </h1>

                <p className="mt-2 text-sm text-white/60">
                    Sign in to your secure workspace
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label
                        htmlFor="email"
                        className="mb-2 block text-sm font-medium text-white/80"
                    >
                        Email address
                    </label>

                    <GlassPanel className="flex items-center rounded-xl px-3">
                        <Mail className="mr-2 h-4 w-4 shrink-0 text-white/40" />

                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="you@example.com"
                            autoComplete="email"
                            required
                            className="h-12 w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
                        />
                    </GlassPanel>
                </div>

                <div>
                    <label
                        htmlFor="password"
                        className="mb-2 block text-sm font-medium text-white/80"
                    >
                        Password
                    </label>

                    <GlassPanel className="flex items-center rounded-xl px-3">
                        <LockKeyhole className="mr-2 h-4 w-4 shrink-0 text-white/40" />

                        <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="Your password"
                            autoComplete="current-password"
                            required
                            className="h-12 w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
                        />

                        <button
                            type="button"
                            onClick={() => setShowPassword((value) => !value)}
                            className="ml-2 text-white/40 transition hover:text-white"
                            aria-label={
                                showPassword
                                    ? "Hide password"
                                    : "Show password"
                            }
                        >
                            {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
                            )}
                        </button>
                    </GlassPanel>
                </div>

                {error && (
                    <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                        {error}
                    </div>
                )}

                <Button
                    type="submit"
                    disabled={loading}
                    className="h-12 w-full rounded-xl border-0 bg-gradient-to-r from-blue-500 to-violet-500 font-medium text-white shadow-lg shadow-blue-500/20 hover:from-blue-400 hover:to-violet-400"
                >
                    {loading ? "Signing in..." : "Sign in →"}
                </Button>
            </form>

            <p className="mt-6 text-center text-sm text-white/50">
                Don't have an account?{" "}
                <Link
                    href="/register"
                    className="font-medium text-white transition hover:text-blue-300"
                >
                    Create one
                </Link>
            </p>
        </GlassCard>
    );
}