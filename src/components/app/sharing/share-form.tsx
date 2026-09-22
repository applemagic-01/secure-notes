"use client";

import { useState } from "react";
import {
    CalendarClock,
    Clock3,
    Eye,
    EyeOff,
    Globe2,
    KeyRound,
    Link,
    Loader2,
    LockKeyhole,
    ShieldCheck,
    Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/app/glass/glass-card";
import { GlassPanel } from "@/components/app/glass/glass-panel";
import { ShareSuccess } from "@/components/app/sharing/share-success";
import { toast } from "sonner";

type ShareType = "ONE_TIME" | "TIME_BASED";
type AccessType = "PUBLIC" | "PASSWORD";

interface ShareFormProps {
    noteId: string;
}

export function ShareForm({ noteId }: ShareFormProps) {
    const [shareType, setShareType] =
        useState<ShareType>("ONE_TIME");

    const [accessType, setAccessType] =
        useState<AccessType>("PUBLIC");

    const [expiresAt, setExpiresAt] = useState("");

    const [accessKey, setAccessKey] = useState("");

    const [showAccessKey, setShowAccessKey] = useState(false);

    const [submitting, setSubmitting] = useState(false);

    const [createdShare, setCreatedShare] = useState<{
        shareUrl: string;
        accessKey?: string;
    } | null>(null);

    async function handleSubmit(
        event: React.FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setSubmitting(true);

        try {
            const payload: {
                shareType: ShareType;
                accessType: AccessType;
                expiresAt?: string;
                accessKey?: string;
            } = {
                shareType,
                accessType,
            };

            if (shareType === "TIME_BASED") {
                payload.expiresAt = new Date(
                    expiresAt
                ).toISOString();
            }

            if (accessType === "PASSWORD") {
                payload.accessKey = accessKey;
            }

            const response = await fetch(
                `/api/notes/${noteId}/shares`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                }
            );

            const data = await response.json();
            console.log("Create share response:", data);

            if (!response.ok) {
                toast.error(
                    data.error ??
                    "Unable to create share link."
                );
                return;
            }

            setCreatedShare({
                shareUrl: data.share.shareUrl,
                accessKey: data.accessKey,
            });

            toast.success(
                "Share link created successfully."
            );
        } catch {
            toast.error(
                "Something went wrong while creating the share link."
            );
        } finally {
            setSubmitting(false);
        }
    }

    /*
     * Once the share has been successfully created,
     * show the dedicated success component instead of
     * rendering the creation form again.
     */
    if (createdShare) {
        return (
            <ShareSuccess
                noteId={noteId}
                shareUrl={createdShare.shareUrl}
                accessKey={createdShare.accessKey}
                onCreateAnother={() => {
                    setCreatedShare(null);
                    setAccessKey("");
                    setExpiresAt("");
                    setShareType("ONE_TIME");
                    setAccessType("PUBLIC");
                    setShowAccessKey(false);
                }}
            />
        );
    }

    return (
        <GlassCard className="overflow-hidden">
            {/* Header */}
            <div className="border-b border-white/10 px-6 py-6 sm:px-8">
                <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-300/10 bg-blue-400/10">
                        <Sparkles className="h-5 w-5 text-blue-300" />
                    </div>

                    <div>
                        <h1 className="text-xl font-semibold tracking-tight text-white">
                            Create share link
                        </h1>

                        <p className="mt-1 text-sm leading-6 text-white/45">
                            Choose how this note can be accessed.
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="space-y-8 px-6 py-7 sm:px-8">
                    {/* Share type */}
                    <section>
                        <div className="mb-3">
                            <h2 className="text-sm font-medium text-white">
                                Share type
                            </h2>

                            <p className="mt-1 text-xs text-white/40">
                                Decide how long the link remains usable.
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            {/* One-time */}
                            <button
                                type="button"
                                onClick={() => {
                                    setShareType("ONE_TIME");
                                    setExpiresAt("");
                                }}
                                className={`rounded-2xl border p-4 text-left transition ${shareType === "ONE_TIME"
                                        ? "border-blue-400/40 bg-blue-500/10 shadow-lg shadow-blue-500/5"
                                        : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div
                                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${shareType === "ONE_TIME"
                                                ? "bg-blue-500/15"
                                                : "bg-white/5"
                                            }`}
                                    >
                                        <Clock3 className="h-4 w-4 text-blue-300" />
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-white">
                                            One-time access
                                        </p>

                                        <p className="mt-1 text-xs leading-5 text-white/40">
                                            The link becomes invalid after the first
                                            successful access.
                                        </p>
                                    </div>
                                </div>
                            </button>

                            {/* Time-based */}
                            <button
                                type="button"
                                onClick={() =>
                                    setShareType("TIME_BASED")
                                }
                                className={`rounded-2xl border p-4 text-left transition ${shareType === "TIME_BASED"
                                        ? "border-violet-400/40 bg-violet-500/10 shadow-lg shadow-violet-500/5"
                                        : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div
                                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${shareType === "TIME_BASED"
                                                ? "bg-violet-500/15"
                                                : "bg-white/5"
                                            }`}
                                    >
                                        <CalendarClock className="h-4 w-4 text-violet-300" />
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-white">
                                            Time-based access
                                        </p>

                                        <p className="mt-1 text-xs leading-5 text-white/40">
                                            The link remains available until the
                                            selected expiry time.
                                        </p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </section>

                    {/* Expiry */}
                    {shareType === "TIME_BASED" && (
                        <GlassPanel className="rounded-2xl border-violet-400/15 bg-violet-500/[0.04] p-4">
                            <div className="flex items-start gap-3">
                                <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />

                                <div className="w-full">
                                    <label
                                        htmlFor="expiresAt"
                                        className="text-sm font-medium text-white"
                                    >
                                        Expiry date and time
                                    </label>

                                    <p className="mt-1 text-xs text-white/40">
                                        The link will stop working after this time.
                                    </p>

                                    <input
                                        id="expiresAt"
                                        type="datetime-local"
                                        value={expiresAt}
                                        onChange={(event) =>
                                            setExpiresAt(
                                                event.target.value
                                            )
                                        }
                                        required
                                        className="mt-3 w-full rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2.5 text-sm text-white outline-none transition focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/10"
                                    />
                                </div>
                            </div>
                        </GlassPanel>
                    )}

                    {/* Access type */}
                    <section>
                        <div className="mb-3">
                            <h2 className="text-sm font-medium text-white">
                                Access protection
                            </h2>

                            <p className="mt-1 text-xs text-white/40">
                                Choose whether anyone with the link can access
                                the note.
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            {/* Public */}
                            <button
                                type="button"
                                onClick={() => {
                                    setAccessType("PUBLIC");
                                    setAccessKey("");
                                }}
                                className={`rounded-2xl border p-4 text-left transition ${accessType === "PUBLIC"
                                        ? "border-cyan-400/30 bg-cyan-500/10 shadow-lg shadow-cyan-500/5"
                                        : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div
                                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accessType === "PUBLIC"
                                                ? "bg-cyan-500/15"
                                                : "bg-white/5"
                                            }`}
                                    >
                                        <Globe2 className="h-4 w-4 text-cyan-300" />
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-white">
                                            Public link
                                        </p>

                                        <p className="mt-1 text-xs leading-5 text-white/40">
                                            Anyone who has the link can access the
                                            note.
                                        </p>
                                    </div>
                                </div>
                            </button>

                            {/* Password */}
                            <button
                                type="button"
                                onClick={() =>
                                    setAccessType("PASSWORD")
                                }
                                className={`rounded-2xl border p-4 text-left transition ${accessType === "PASSWORD"
                                        ? "border-amber-400/30 bg-amber-500/10 shadow-lg shadow-amber-500/5"
                                        : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div
                                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accessType === "PASSWORD"
                                                ? "bg-amber-500/15"
                                                : "bg-white/5"
                                            }`}
                                    >
                                        <LockKeyhole className="h-4 w-4 text-amber-300" />
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-white">
                                            Password protected
                                        </p>

                                        <p className="mt-1 text-xs leading-5 text-white/40">
                                            Visitors must provide an access key.
                                        </p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </section>

                    {/* Access key */}
                    {accessType === "PASSWORD" && (
                        <GlassPanel className="rounded-2xl border-amber-400/15 bg-amber-500/[0.04] p-4">
                            <div className="flex items-start gap-3">
                                <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />

                                <div className="w-full">
                                    <label
                                        htmlFor="accessKey"
                                        className="text-sm font-medium text-white"
                                    >
                                        Access key
                                    </label>

                                    <p className="mt-1 text-xs leading-5 text-white/40">
                                        Use at least 8 characters. This key will be
                                        required to unlock the shared note.
                                    </p>

                                    <div className="relative mt-3">
                                        <input
                                            id="accessKey"
                                            type={
                                                showAccessKey
                                                    ? "text"
                                                    : "password"
                                            }
                                            value={accessKey}
                                            onChange={(event) =>
                                                setAccessKey(
                                                    event.target.value
                                                )
                                            }
                                            minLength={8}
                                            maxLength={128}
                                            required
                                            placeholder="Enter a secure access key"
                                            className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2.5 pr-11 text-sm text-white outline-none placeholder:text-white/25 focus:border-amber-400/40 focus:ring-2 focus:ring-amber-500/10"
                                        />

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowAccessKey(
                                                    (value) => !value
                                                )
                                            }
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/35 transition hover:text-white"
                                            aria-label={
                                                showAccessKey
                                                    ? "Hide access key"
                                                    : "Show access key"
                                            }
                                        >
                                            {showAccessKey ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </GlassPanel>
                    )}

                    {/* Security information */}
                    <div className="flex items-start gap-3 rounded-2xl border border-emerald-400/10 bg-emerald-500/[0.04] p-4">
                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />

                        <div>
                            <p className="text-xs font-medium text-emerald-200">
                                Secure sharing
                            </p>

                            <p className="mt-1 text-xs leading-5 text-white/35">
                                Your share token is generated securely and the
                                access key is never stored in plain text.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex flex-col-reverse gap-3 border-t border-white/10 bg-black/5 px-6 py-5 sm:flex-row sm:items-center sm:justify-end sm:px-8">
                    <Link
                        href={`/notes/${noteId}`}
                        className="inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                    >
                        Cancel
                    </Link> 

                    <Button
                        type="submit"
                        disabled={submitting}
                        className="rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 text-white shadow-lg shadow-blue-500/20 hover:from-blue-400 hover:to-violet-400"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            "Create Share Link"
                        )}
                    </Button>
                </div>
            </form>
        </GlassCard>
    );
}