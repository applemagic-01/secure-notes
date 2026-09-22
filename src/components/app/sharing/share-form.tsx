"use client";

// Collects the share policy selected by the note owner and sends it to the sharing API; the server remains responsible for token and key generation.

import { useState } from "react";

import {
    CalendarClock,
    Clock3,
    Globe2,
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

    const [submitting, setSubmitting] = useState(false);

    const [createdShare, setCreatedShare] = useState<{
        shareUrl: string;
        accessKey?: string;
    } | null>(null);

    async function handleSubmit(
        event: React.FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        /*
         * Time-based shares require an expiry value.
         * The UI already marks the field as required, but we
         * validate it here as well before sending the request.
         */
        if (shareType === "TIME_BASED" && !expiresAt) {
            toast.error("Please select an expiry date and time.");
            return;
        }

        setSubmitting(true);

        try {
            /*
             * The access key is intentionally NOT included here.
             *
             * The backend generates the access key securely.
             * This prevents the client from choosing or storing
             * the password itself.
             */
            const payload: {
                shareType: ShareType;
                accessType: AccessType;
                expiresAt?: string;
            } = {
                shareType,
                accessType,
            };

            if (shareType === "TIME_BASED") {
                const expiryDate = new Date(expiresAt);

                if (Number.isNaN(expiryDate.getTime())) {
                    toast.error("Please select a valid expiry date.");
                    return;
                }

                if (expiryDate <= new Date()) {
                    toast.error(
                        "Expiry date and time must be in the future."
                    );
                    return;
                }

                payload.expiresAt = expiryDate.toISOString();
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

            /*
             * The API response has this structure:
             *
             * {
             *   share: {
             *     shareUrl: "...",
             *     accessKey: "..."
             *   }
             * }
             *
             * The access key is only returned at creation time.
             */
            if (!data.share?.shareUrl) {
                toast.error(
                    "Share link was created but the response was invalid."
                );

                return;
            }

            setCreatedShare({
                shareUrl: data.share.shareUrl,
                accessKey: data.share.accessKey,
            });

            toast.success(
                "Share link created successfully."
            );
        } catch (error) {
            console.error(
                "Create share error:",
                error
            );

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
                    setExpiresAt("");
                    setShareType("ONE_TIME");
                    setAccessType("PUBLIC");
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
                                            The link becomes invalid after the
                                            first successful access.
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
                                            The link remains available until
                                            the selected expiry time.
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
                                        The link will stop working after
                                        this time.
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
                                Choose whether anyone with the link can
                                access the note.
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            {/* Public */}
                            <button
                                type="button"
                                onClick={() => {
                                    setAccessType("PUBLIC");
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
                                            Anyone who has the link can
                                            access the note.
                                        </p>
                                    </div>
                                </div>
                            </button>

                            {/* Password protected */}
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
                                            Visitors must provide an
                                            access key.
                                        </p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </section>

                    {/* Generated access key information */}
                    {accessType === "PASSWORD" && (
                        <GlassPanel className="rounded-2xl border-amber-400/15 bg-amber-500/[0.04] p-4">
                            <div className="flex items-start gap-3">
                                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />

                                <div>
                                    <p className="text-sm font-medium text-white">
                                        Secure access key
                                    </p>

                                    <p className="mt-1 text-xs leading-5 text-white/45">
                                        A unique access key will be generated
                                        automatically when you create this
                                        share link. You will be shown the key
                                        once after creation.
                                    </p>
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
                                Your share token is generated securely and
                                password-protected share keys are stored
                                only as secure hashes.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex flex-col-reverse gap-3 border-t border-white/10 bg-black/5 px-6 py-5 sm:flex-row sm:items-center sm:justify-end sm:px-8">
                    <a
                        href={`/notes/${noteId}`}
                        className="inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                    >
                        Cancel
                    </a>

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
                            <>
                                <Link className="mr-2 h-4 w-4" />
                                Create Share Link
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </GlassCard>
    );
}