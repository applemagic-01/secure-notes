"use client";

import { useEffect, useRef, useState } from "react";
import {
    AlertTriangle,
    Clock3,
    Eye,
    FileText,
    Loader2,
    LockKeyhole,
    ShieldCheck,
} from "lucide-react";

import { GlassCard } from "@/components/app/glass/glass-card";
import { GlassPanel } from "@/components/app/glass/glass-panel";
import { ShareUnlockForm } from "./share-unlock-form";

type ShareType = "ONE_TIME" | "TIME_BASED";
type AccessType = "PUBLIC" | "PASSWORD";

interface ShareResponse {
    shareType: ShareType;
    accessType: AccessType;
    expiresAt: string | null;
    note?: {
        title: string;
        content: string;
    };
}

interface ShareError {
    error?: string;
}
const pageClassName =
    "relative flex min-h-screen items-center justify-center overflow-hidden bg-[#05070d] px-4 py-10 text-white";
    
export function SharedNotePage({
    token,
}: {
    token: string;
}) {
    const [loading, setLoading] = useState(true);
    const [share, setShare] = useState<ShareResponse | null>(
        null
    );
    const [error, setError] = useState<string | null>(null);

    const hasLoaded = useRef(false);

    useEffect(() => {

        if (hasLoaded.current) {
            return;
        }

        hasLoaded.current = true;

        async function loadShare() {
            try {
                const response = await fetch(
                    `/api/share/${token}`
                );

                const data: ShareResponse & ShareError =
                    await response.json();

                if (!response.ok) {
                    setError(
                        data.error ?? "Unable to open this share link."
                    );
                    return;
                }

                setShare(data);

                if (data.accessType === "PUBLIC") {
                    const viewResponse = await fetch(
                        `/api/share/${token}/view`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                        }
                    );

                    const viewData: ShareResponse & ShareError =
                        await viewResponse.json();

                    if (!viewResponse.ok) {
                        setError(
                            viewData.error ??
                            "Unable to open the shared note."
                        );
                        return;
                    }

                    setShare(viewData);
                }
            } catch {
                setError(
                    "Something went wrong while opening this share link."
                );
            } finally {
                setLoading(false);
            }
        }

        loadShare();
    }, [token]);

    if (loading) {
        return (
            <SharePageShell>
                <GlassCard className="p-8">
                    <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
                        <Loader2 className="h-7 w-7 animate-spin text-blue-300" />

                        <p className="mt-4 text-sm text-white/60">
                            Opening secure share...
                        </p>
                    </div>
                </GlassCard>
            </SharePageShell>
        );
    }

    if (error) {
        return (
            <SharePageShell>
                <ShareState
                    icon={
                        <AlertTriangle className="h-7 w-7 text-amber-300" />
                    }
                    title="Unable to open this share"
                    description={error}
                />
            </SharePageShell>
        );
    }

    if (!share) {
        return (
            <SharePageShell>
                <ShareState
                    icon={
                        <AlertTriangle className="h-7 w-7 text-amber-300" />
                    }
                    title="Share unavailable"
                    description="This share link could not be loaded."
                />
            </SharePageShell>
        );
    }

    /*
     * Password-protected shares will be handled
     * in the next step.
     */
    if (share.accessType === "PASSWORD" && !share.note) {
        return (
            <main className={pageClassName}>
                {/* Ambient background */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute left-1/2 top-[-15rem] h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-blue-500/10 blur-[120px]" />

                    <div className="absolute bottom-[-15rem] left-[-10rem] h-[30rem] w-[30rem] rounded-full bg-violet-500/10 blur-[120px]" />

                    <div className="absolute right-[-10rem] top-1/3 h-[25rem] w-[25rem] rounded-full bg-cyan-500/5 blur-[120px]" />
                </div>

                <div className="relative z-10 w-full">
                    <ShareUnlockForm
                        token={token}
                        onUnlocked={(data) => {
                            setShare(data);
                        }}
                    />
                </div>
            </main>
        );
    }
    /*
     * Public shares include the note directly in the
     * GET response, so we can render it immediately.
     */
    if (!share.note) {
        return (
            <SharePageShell>
                <ShareState
                    icon={
                        <FileText className="h-7 w-7 text-blue-300" />
                    }
                    title="Note unavailable"
                    description="The shared note could not be loaded."
                />
            </SharePageShell>
        );
    }

    return (
        <SharePageShell>
            <GlassCard className="overflow-hidden">
                {/* Header */}
                <div className="border-b border-white/10 px-6 py-7 sm:px-8">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-300/10 bg-blue-400/10">
                            <FileText className="h-5 w-5 text-blue-300" />
                        </div>

                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h1 className="truncate text-xl font-semibold tracking-tight text-white">
                                    {share.note.title}
                                </h1>
                            </div>

                            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-white/35">
                                <span className="inline-flex items-center gap-1.5">
                                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                                    Secure share
                                </span>

                                {share.shareType === "ONE_TIME" ? (
                                    <span className="inline-flex items-center gap-1.5">
                                        <Eye className="h-3.5 w-3.5 text-blue-300" />
                                        One-time access
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5">
                                        <Clock3 className="h-3.5 w-3.5 text-violet-300" />
                                        Time-based access
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Note content */}
                <div className="px-6 py-7 sm:px-8">
                    <GlassPanel className="rounded-2xl border-white/10 bg-black/10 p-5 sm:p-6">
                        <div className="whitespace-pre-wrap break-words text-sm leading-7 text-white/75">
                            {share.note.content}
                        </div>
                    </GlassPanel>

                    {/* Expiry information */}
                    {share.expiresAt && (
                        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-violet-400/10 bg-violet-500/[0.035] p-4">
                            <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />

                            <div>
                                <p className="text-xs font-medium text-violet-200">
                                    Share expiry
                                </p>

                                <p className="mt-1 text-xs leading-5 text-white/35">
                                    This link expires on{" "}
                                    {new Date(
                                        share.expiresAt
                                    ).toLocaleString()}
                                    .
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </GlassCard>
        </SharePageShell>
    );
}

function SharePageShell({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <main className="relative min-h-screen overflow-hidden bg-[#07111f]">
            {/* Ambient background */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute left-[10%] top-[10%] h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

                <div className="absolute right-[10%] top-[20%] h-80 w-80 rounded-full bg-violet-500/10 blur-3xl" />

                <div className="absolute bottom-[5%] left-[35%] h-72 w-72 rounded-full bg-cyan-500/5 blur-3xl" />
            </div>

            <div className="relative mx-auto flex min-h-screen w-full max-w-4xl items-center px-5 py-12 sm:px-8">
                <div className="w-full">
                    <div className="mb-8 text-center">
                        <div className="inline-flex items-center gap-2 text-sm font-medium text-white/60">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                            </div>

                            SecureNotes
                        </div>

                        <p className="mt-3 text-xs text-white/30">
                            Securely shared note
                        </p>
                    </div>

                    {children}
                </div>
            </div>
        </main>
    );
}

function ShareState({
    icon,
    title,
    description,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
}) {
    return (
        <GlassCard className="p-8">
            <div className="mx-auto flex max-w-md flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                    {icon}
                </div>

                <h1 className="mt-5 text-xl font-semibold text-white">
                    {title}
                </h1>

                <p className="mt-2 text-sm leading-6 text-white/45">
                    {description}
                </p>
            </div>
        </GlassCard>
    );
}