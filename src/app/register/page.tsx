"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowRight,
    Loader2,
    LockKeyhole,
    UserPlus,
} from "lucide-react";
import { toast } from "sonner";

import { GlassBackground } from "@/components/app/background/glass-background";
import { GlassCard } from "@/components/app/glass/glass-card";
import { GlassPanel } from "@/components/app/glass/glass-panel";
import { Button } from "@/components/ui/button";
import { SecureNotesLogo } from "@/components/app/brand/secure-notes-logo";

export default function RegisterPage() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] =
        useState("");

    const [loading, setLoading] = useState(false);

    async function handleSubmit(
        event: React.FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        if (!email.trim()) {
            toast.error("Please enter your email.");
            return;
        }

        if (!password) {
            toast.error("Please enter a password.");
            return;
        }

        if (password.length < 8) {
            toast.error(
                "Password must be at least 8 characters."
            );
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: email.trim().toLowerCase(),
                    password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(
                    data.error ?? "Unable to create account."
                );
                return;
            }

            toast.success(
                "Account created successfully. Please log in."
            );

            router.push("/login");
        } catch {
            toast.error(
                "Something went wrong while creating your account."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <GlassBackground>
            <main className="flex min-h-screen items-center justify-center px-4 py-10">
                <div className="w-full max-w-md">
                    {/* Brand */}
                    <div className="mb-8 flex justify-center">
                        <Link href="/">
                            <SecureNotesLogo />
                        </Link>
                    </div>

                    <GlassCard className="overflow-hidden">
                        <div className="px-6 py-8 sm:px-8">
                            {/* Header */}
                            <div className="text-center">
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-300/10 bg-blue-400/10">
                                    <UserPlus className="h-5 w-5 text-blue-300" />
                                </div>

                                <h1 className="mt-5 text-2xl font-semibold tracking-tight text-white">
                                    Create your account
                                </h1>

                                <p className="mt-2 text-sm text-white/45">
                                    Start creating and securely sharing notes.
                                </p>
                            </div>

                            {/* Form */}
                            <form
                                onSubmit={handleSubmit}
                                className="mt-8 space-y-5"
                            >
                                {/* Email */}
                                <GlassPanel className="rounded-2xl border-white/10 bg-white/[0.025] p-4">
                                    <label
                                        htmlFor="email"
                                        className="text-sm font-medium text-white"
                                    >
                                        Email address
                                    </label>

                                    <input
                                        id="email"
                                        type="email"
                                        autoComplete="email"
                                        value={email}
                                        onChange={(event) =>
                                            setEmail(event.target.value)
                                        }
                                        placeholder="you@example.com"
                                        className="mt-3 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-blue-400/40 focus:ring-2 focus:ring-blue-500/10"
                                    />
                                </GlassPanel>

                                {/* Password */}
                                <GlassPanel className="rounded-2xl border-white/10 bg-white/[0.025] p-4">
                                    <label
                                        htmlFor="password"
                                        className="text-sm font-medium text-white"
                                    >
                                        Password
                                    </label>

                                    <input
                                        id="password"
                                        type="password"
                                        autoComplete="new-password"
                                        value={password}
                                        onChange={(event) =>
                                            setPassword(event.target.value)
                                        }
                                        placeholder="Create a password"
                                        className="mt-3 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-blue-400/40 focus:ring-2 focus:ring-blue-500/10"
                                    />

                                    <p className="mt-2 text-xs text-white/30">
                                        Use at least 8 characters.
                                    </p>
                                </GlassPanel>

                                {/* Confirm password */}
                                <GlassPanel className="rounded-2xl border-white/10 bg-white/[0.025] p-4">
                                    <label
                                        htmlFor="confirmPassword"
                                        className="text-sm font-medium text-white"
                                    >
                                        Confirm password
                                    </label>

                                    <input
                                        id="confirmPassword"
                                        type="password"
                                        autoComplete="new-password"
                                        value={confirmPassword}
                                        onChange={(event) =>
                                            setConfirmPassword(event.target.value)
                                        }
                                        placeholder="Enter your password again"
                                        className="mt-3 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-blue-400/40 focus:ring-2 focus:ring-blue-500/10"
                                    />
                                </GlassPanel>

                                {/* Security note */}
                                <div className="flex items-start gap-3 rounded-2xl border border-emerald-400/10 bg-emerald-500/[0.035] p-4">
                                    <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />

                                    <div>
                                        <p className="text-xs font-medium text-emerald-200">
                                            Secure account
                                        </p>

                                        <p className="mt-1 text-xs leading-5 text-white/35">
                                            Your password is securely hashed before
                                            it is stored.
                                        </p>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="h-11 w-full rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 text-white shadow-lg shadow-blue-500/20 hover:from-blue-400 hover:to-violet-400"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating account...
                                        </>
                                    ) : (
                                        <>
                                            Create account
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                            </form>

                            {/* Login link */}
                            <div className="mt-7 border-t border-white/10 pt-6 text-center">
                                <p className="text-sm text-white/40">
                                    Already have an account?
                                </p>

                                <Link
                                    href="/login"
                                    className="mt-2 inline-flex text-sm font-medium text-blue-300 transition hover:text-blue-200"
                                >
                                    Sign in
                                </Link>
                            </div>
                        </div>
                    </GlassCard>

                    <p className="mt-6 text-center text-xs text-white/25">
                        Secure Notes · Private by design
                    </p>
                </div>
            </main>
        </GlassBackground>
    );
}