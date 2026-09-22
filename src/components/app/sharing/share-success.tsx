"use client";

import { useState } from "react";
import Link from "next/link";

import {
    Check,
    CheckCircle2,
    Copy,
    KeyRound,
    Link2,
    ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/app/glass/glass-card";
import { GlassPanel } from "@/components/app/glass/glass-panel";
import { toast } from "sonner";

interface ShareSuccessProps {
    noteId: string;
    shareUrl: string;
    accessKey?: string;
    onCreateAnother: () => void;
}

export function ShareSuccess({
    noteId,
    shareUrl,
    accessKey,
    onCreateAnother,
}: ShareSuccessProps) {
    const [copiedUrl, setCopiedUrl] = useState(false);
    const [copiedKey, setCopiedKey] = useState(false);

    async function copyToClipboard(
        value: string,
        type: "url" | "key"
    ) {
        try {
            await navigator.clipboard.writeText(value);

            if (type === "url") {
                setCopiedUrl(true);

                setTimeout(() => {
                    setCopiedUrl(false);
                }, 2000);

                toast.success("Share link copied.");
            } else {
                setCopiedKey(true);

                setTimeout(() => {
                    setCopiedKey(false);
                }, 2000);

                toast.success("Access key copied.");
            }
        } catch {
            toast.error("Unable to copy to clipboard.");
        }
    }

    return (
        <GlassCard className="overflow-hidden">
            <div className="px-6 py-10 sm:px-8">
                <div className="mx-auto max-w-2xl text-center">
                    {/* Success icon */}
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-500/10">
                        <CheckCircle2 className="h-7 w-7 text-emerald-300" />
                    </div>

                    <h1 className="mt-5 text-2xl font-semibold tracking-tight text-white">
                        Share link created
                    </h1>

                    <p className="mt-2 text-sm text-white/45">
                        Your secure share link is ready.
                    </p>
                </div>

                <div className="mt-8 space-y-5">
                    {/* Share URL */}
                    <GlassPanel className="rounded-2xl border-white/10 bg-white/[0.025] p-4">
                        <div className="flex items-start gap-3">
                            <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" />

                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-white/70">
                                    Share link
                                </p>

                                <div className="mt-2 flex gap-2">
                                    <div className="min-w-0 flex-1 overflow-hidden rounded-xl border border-white/10 bg-black/10 px-3 py-2.5">
                                        <p className="truncate text-xs text-white/55">
                                            {shareUrl}
                                        </p>
                                    </div>

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() =>
                                            copyToClipboard(shareUrl, "url")
                                        }
                                        className="shrink-0 rounded-xl border border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/10 hover:text-white"
                                    >
                                        {copiedUrl ? (
                                            <Check className="mr-2 h-4 w-4 text-emerald-300" />
                                        ) : (
                                            <Copy className="mr-2 h-4 w-4" />
                                        )}

                                        {copiedUrl ? "Copied" : "Copy"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </GlassPanel>

                    {/* Access key */}
                    {accessKey && (
                        <GlassPanel className="rounded-2xl border-amber-400/15 bg-amber-500/[0.04] p-4">
                            <div className="flex items-start gap-3">
                                <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />

                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-medium text-amber-200">
                                        Access key
                                    </p>

                                    <div className="mt-2 flex gap-2">
                                        <div className="min-w-0 flex-1 overflow-hidden rounded-xl border border-amber-300/10 bg-black/10 px-3 py-2.5">
                                            <p className="truncate font-mono text-xs tracking-wider text-white/70">
                                                {accessKey}
                                            </p>
                                        </div>

                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() =>
                                                copyToClipboard(accessKey, "key")
                                            }
                                            className="shrink-0 rounded-xl border border-amber-300/10 bg-white/[0.04] text-white/70 hover:bg-white/10 hover:text-white"
                                        >
                                            {copiedKey ? (
                                                <Check className="mr-2 h-4 w-4 text-emerald-300" />
                                            ) : (
                                                <Copy className="mr-2 h-4 w-4" />
                                            )}

                                            {copiedKey ? "Copied" : "Copy"}
                                        </Button>
                                    </div>

                                    <p className="mt-2 text-xs leading-5 text-white/35">
                                        Save this key now. It is shown only once and is
                                        required to unlock the protected share.
                                    </p>
                                </div>
                            </div>
                        </GlassPanel>
                    )}

                    {/* Security message */}
                    <div className="flex items-start gap-3 rounded-2xl border border-emerald-400/10 bg-emerald-500/[0.035] p-4">
                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />

                        <div>
                            <p className="text-xs font-medium text-emerald-200">
                                Secure sharing
                            </p>

                            <p className="mt-1 text-xs leading-5 text-white/35">
                                The share token is securely generated and only its
                                hash is stored by the server.
                                {accessKey
                                    ? " The access key is also stored as a secure hash."
                                    : ""}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col-reverse gap-3 border-t border-white/10 bg-black/5 px-6 py-5 sm:flex-row sm:items-center sm:justify-end sm:px-8">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={onCreateAnother}
                    className="rounded-xl text-white/55 hover:bg-white/10 hover:text-white"
                >
                    Create another link
                </Button>

                <Link
                    href={`/notes/${noteId}`}
                    className="inline-flex h-10 items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-4 text-sm font-medium text-white shadow-lg shadow-blue-500/20 transition-colors hover:from-blue-400 hover:to-violet-400"
                >
                    Back to Note
                </Link>
            </div>
        </GlassCard>
    );
}