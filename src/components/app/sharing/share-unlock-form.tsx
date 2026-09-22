"use client";

import { FormEvent, useState } from "react";
import { KeyRound, Loader2, LockKeyhole } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ShareUnlockFormProps {
    token: string;
    onUnlocked: (data: {
        shareType: "ONE_TIME" | "TIME_BASED";
        accessType: "PASSWORD";
        expiresAt: string | null;
        note: {
            title: string;
            content: string;
        };
    }) => void;
}

export function ShareUnlockForm({
    token,
    onUnlocked,
}: ShareUnlockFormProps) {
    const [accessKey, setAccessKey] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!accessKey.trim()) {
            setError("Enter the access key.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/share/${token}/unlock`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    accessKey,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error ?? "Unable to unlock this note.");
                return;
            }

            onUnlocked(data);
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="mx-auto w-full max-w-md rounded-3xl border border-white/10 bg-black/60 p-8 shadow-2xl backdrop-blur-xl">
            {/* Icon */}
            <div className="mb-6 flex flex-col items-center text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
                    <LockKeyhole className="h-6 w-6 text-white" />
                </div>

                <h2 className="text-xl font-semibold text-white">
                    Protected note
                </h2>

                <p className="mt-2 text-sm leading-6 text-white/60">
                    This note requires an access key before it can be viewed.
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label
                        htmlFor="access-key"
                        className="mb-2 block text-sm font-medium text-white/80"
                    >
                        Access key
                    </label>

                    <div className="relative">
                        <KeyRound className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-white/40" />

                        <input
                            id="access-key"
                            name="accessKey"
                            type="password"
                            value={accessKey}
                            onChange={(event) => setAccessKey(event.target.value)}
                            placeholder="Enter your access key"
                            autoComplete="off"
                            disabled={loading}
                            className="h-12 w-full rounded-xl border border-white/20 bg-white/10 pl-10 pr-4 text-sm text-white outline-none transition-all placeholder:text-white/40 hover:border-white/30 focus:border-blue-400/60 focus:bg-white/[0.14] focus:ring-2 focus:ring-blue-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>
                </div>

                {error && (
                    <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                        {error}
                    </div>
                )}

                <Button
                    type="submit"
                    disabled={loading}
                    className="h-12 w-full rounded-xl bg-white text-black transition hover:bg-white/90"
                >
                    {loading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Unlocking...
                        </>
                    ) : (
                        <>
                            <LockKeyhole className="h-4 w-4" />
                            Unlock note
                        </>
                    )}
                </Button>
            </form>
        </div>
    );
}