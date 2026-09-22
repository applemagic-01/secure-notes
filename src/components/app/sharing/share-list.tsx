"use client";

import { useEffect, useState } from "react";
import {
    CheckCircle2,
    Clock3,
    Eye,
    KeyRound,
    Link2,
    Loader2,
    Lock,
    Globe2,
    RotateCcw,
    ShieldCheck,
    Trash2,
    XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { RevokeShareDialog } from "./revoke-share-dialog";

type ShareType = "ONE_TIME" | "TIME_BASED";
type AccessType = "PUBLIC" | "PASSWORD";

type ShareLink = {
    id: string;
    shareType: ShareType;
    accessType: AccessType;
    expiresAt: string | null;
    revokedAt: string | null;
    usedAt: string | null;
    viewCount: number;
    createdAt: string;
};

type ShareListProps = {
    noteId: string;
};

export function ShareList({ noteId }: ShareListProps) {
    const [shares, setShares] = useState<ShareLink[]>([]);
    const [loading, setLoading] = useState(true);
    const [revokingId, setRevokingId] = useState<string | null>(null);
    const [shareToRevoke, setShareToRevoke] =
        useState<ShareLink | null>(null);

    async function loadShares() {
        try {
            setLoading(true);

            const response = await fetch(`/api/notes/${noteId}/shares`, {
                cache: "no-store",
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to load share links");
            }

            setShares(data.shares ?? []);
        } catch (error) {
            console.error(error);

            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to load share links",
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadShares();
    }, [noteId]);

    async function revokeShare(shareId: string) {
        try {
            setRevokingId(shareId);

            const response = await fetch(
                `/api/notes/${noteId}/shares/${shareId}/revoke`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "Failed to revoke share link",
                );
            }

            toast.success("Share link revoked");

            setShareToRevoke(null);

            await loadShares();
        } catch (error) {
            console.error(error);

            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to revoke share link",
            );
        } finally {
            setRevokingId(null);
        }
    }

    function getStatus(share: ShareLink) {
        if (share.revokedAt) {
            return {
                label: "Revoked",
                className:
                    "border-red-400/20 bg-red-400/10 text-red-300",
                icon: XCircle,
            };
        }

        if (share.usedAt) {
            return {
                label: "Used",
                className:
                    "border-amber-400/20 bg-amber-400/10 text-amber-300",
                icon: CheckCircle2,
            };
        }

        if (
            share.expiresAt &&
            new Date(share.expiresAt).getTime() <= Date.now()
        ) {
            return {
                label: "Expired",
                className:
                    "border-zinc-400/20 bg-zinc-400/10 text-zinc-300",
                icon: Clock3,
            };
        }

        return {
            label: "Active",
            className:
                "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
            icon: ShieldCheck,
        };
    }

    function formatDate(date: string | null) {
        if (!date) return "No expiry";

        return new Intl.DateTimeFormat("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(new Date(date));
    }

    if (loading) {
        return (
            <section className="mt-8">
                <div className="mb-4">
                    <h2 className="text-lg font-semibold text-white">
                        Share links
                    </h2>

                    <p className="mt-1 text-sm text-white/45">
                        Manage links created for this note.
                    </p>
                </div>

                <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.035] py-12">
                    <Loader2 className="h-5 w-5 animate-spin text-white/50" />
                </div>
            </section>
        );
    }

    return (
        <section className="mt-8">
            <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                    <h2 className="text-lg font-semibold text-white">
                        Share links
                    </h2>

                    <p className="mt-1 text-sm text-white/45">
                        Manage links created for this note.
                    </p>
                </div>

                <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/50">
                    {shares.length} {shares.length === 1 ? "link" : "links"}
                </div>
            </div>

            {shares.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.025] px-6 py-12 text-center">
                    <Link2 className="mx-auto h-8 w-8 text-white/25" />

                    <h3 className="mt-4 text-sm font-medium text-white/70">
                        No share links yet
                    </h3>

                    <p className="mt-1 text-sm text-white/35">
                        Create a link above to securely share this note.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {shares.map((share) => {
                        const status = getStatus(share);
                        const StatusIcon = status.icon;

                        const isActive = status.label === "Active";

                        return (
                            <div
                                key={share.id}
                                className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 backdrop-blur-xl transition hover:border-white/15 hover:bg-white/[0.05]"
                            >
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    {/* Main information */}
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <div className="flex items-center gap-2 text-sm font-medium text-white">
                                                {share.accessType === "PASSWORD" ? (
                                                    <Lock className="h-4 w-4 text-violet-300" />
                                                ) : (
                                                    <Globe2 className="h-4 w-4 text-blue-300" />
                                                )}

                                                {share.accessType === "PASSWORD"
                                                    ? "Password protected"
                                                    : "Public"}
                                            </div>

                                            <span className="text-white/20">•</span>

                                            <span className="text-sm text-white/50">
                                                {share.shareType === "ONE_TIME"
                                                    ? "One-time"
                                                    : "Time-based"}
                                            </span>
                                        </div>

                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <span
                                                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${status.className}`}
                                            >
                                                <StatusIcon className="h-3.5 w-3.5" />
                                                {status.label}
                                            </span>

                                            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1 text-xs text-white/50">
                                                <Eye className="h-3.5 w-3.5" />
                                                {share.viewCount}{" "}
                                                {share.viewCount === 1 ? "view" : "views"}
                                            </span>

                                            {share.accessType === "PASSWORD" && (
                                                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1 text-xs text-white/50">
                                                    <KeyRound className="h-3.5 w-3.5" />
                                                    Protected
                                                </span>
                                            )}
                                        </div>

                                        <div className="mt-4 space-y-1 text-xs text-white/35">
                                            <p>
                                                Created:{" "}
                                                <span className="text-white/50">
                                                    {formatDate(share.createdAt)}
                                                </span>
                                            </p>

                                            {share.expiresAt && (
                                                <p>
                                                    Expires:{" "}
                                                    <span className="text-white/50">
                                                        {formatDate(share.expiresAt)}
                                                    </span>
                                                </p>
                                            )}

                                            {share.usedAt && (
                                                <p>
                                                    Used:{" "}
                                                    <span className="text-white/50">
                                                        {formatDate(share.usedAt)}
                                                    </span>
                                                </p>
                                            )}

                                            {share.revokedAt && (
                                                <p>
                                                    Revoked:{" "}
                                                    <span className="text-white/50">
                                                        {formatDate(share.revokedAt)}
                                                    </span>
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="shrink-0">
                                        {isActive && (
                                            <button
                                                type="button"
                                                onClick={() => setShareToRevoke(share)}
                                                disabled={revokingId === share.id}
                                                className="inline-flex items-center gap-2 rounded-xl border border-red-400/15 bg-red-400/[0.06] px-3 py-2 text-sm text-red-300 transition hover:border-red-400/25 hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {revokingId === share.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}

                                                Revoke
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            <RevokeShareDialog
                open={shareToRevoke !== null}
                loading={revokingId === shareToRevoke?.id}
                onCancel={() => {
                    if (!revokingId) {
                        setShareToRevoke(null);
                    }
                }}
                onConfirm={() => {
                    if (shareToRevoke) {
                        revokeShare(shareToRevoke.id);
                    }
                }}
            />
        </section>
        
    );
}