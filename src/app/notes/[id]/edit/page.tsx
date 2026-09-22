"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Edit3,
    Loader2,
    Save,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app/layout/app-shell";
import { GlassCard } from "@/components/app/glass/glass-card";
import { GlassPanel } from "@/components/app/glass/glass-panel";
import { Button } from "@/components/ui/button";

interface Note {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    updatedAt: string;
}

export default function EditNotePage() {
    const params = useParams();
    const router = useRouter();

    const noteId = params.id as string;

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function loadNote() {
            try {
                const response = await fetch(
                    `/api/notes/${noteId}`,
                    {
                        method: "GET",
                        cache: "no-store",
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    toast.error(
                        data.error ?? "Unable to load note."
                    );

                    router.push("/notes");
                    return;
                }

                const note: Note = data.note;

                setTitle(note.title);
                setContent(note.content);
            } catch {
                toast.error("Unable to load note.");
                router.push("/notes");
            } finally {
                setLoading(false);
            }
        }

        if (noteId) {
            loadNote();
        }
    }, [noteId, router]);

    async function handleSubmit(
        event: React.FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        if (!title.trim()) {
            toast.error("Please enter a note title.");
            return;
        }

        if (!content.trim()) {
            toast.error("Please enter some content.");
            return;
        }

        setSaving(true);

        try {
            const response = await fetch(
                `/api/notes/${noteId}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        title: title.trim(),
                        content,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                toast.error(
                    data.error ?? "Unable to update note."
                );
                return;
            }

            toast.success("Note updated successfully.");

            router.push(`/notes/${noteId}`);
        } catch {
            toast.error(
                "Something went wrong while updating the note."
            );
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <AppShell>
                <div className="flex min-h-[60vh] items-center justify-center">
                    <div className="flex items-center gap-3 text-sm text-white/50">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-300" />
                        Loading note...
                    </div>
                </div>
            </AppShell>
        );
    }

    return (
        <AppShell>
            <div className="mx-auto max-w-4xl">
                <Link
                    href={`/notes/${noteId}`}
                    className="mb-6 inline-flex items-center gap-2 text-sm text-white/50 transition hover:text-white"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Note
                </Link>

                <GlassCard className="overflow-hidden">
                    {/* Header */}
                    <div className="border-b border-white/10 px-6 py-6 sm:px-8">
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-violet-300/10 bg-violet-400/10">
                                <Edit3 className="h-5 w-5 text-violet-300" />
                            </div>

                            <div>
                                <h1 className="text-xl font-semibold tracking-tight text-white">
                                    Edit note
                                </h1>

                                <p className="mt-1 text-sm leading-6 text-white/45">
                                    Update your note and save the latest version.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-6 px-6 py-7 sm:px-8">
                            {/* Title */}
                            <GlassPanel className="rounded-2xl border-white/10 bg-white/[0.025] p-4">
                                <label
                                    htmlFor="title"
                                    className="text-sm font-medium text-white"
                                >
                                    Title
                                </label>

                                <input
                                    id="title"
                                    type="text"
                                    value={title}
                                    onChange={(event) =>
                                        setTitle(event.target.value)
                                    }
                                    placeholder="Enter note title"
                                    maxLength={200}
                                    className="mt-3 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/10"
                                />

                                <p className="mt-2 text-xs text-white/30">
                                    {title.length}/200 characters
                                </p>
                            </GlassPanel>

                            {/* Content */}
                            <GlassPanel className="rounded-2xl border-white/10 bg-white/[0.025] p-4">
                                <label
                                    htmlFor="content"
                                    className="text-sm font-medium text-white"
                                >
                                    Content
                                </label>

                                <textarea
                                    id="content"
                                    value={content}
                                    onChange={(event) =>
                                        setContent(event.target.value)
                                    }
                                    placeholder="Write your secure note here..."
                                    maxLength={10000}
                                    rows={4}
                                    className="mt-3 w-full resize-y rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/25 focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/10"
                                />

                                <p className="mt-2 text-xs text-white/30">
                                    {content.length}/10000 characters
                                </p>
                            </GlassPanel>
                        </div>

                        {/* Footer */}
                        <div className="flex flex-col-reverse gap-3 border-t border-white/10 bg-black/5 px-6 py-5 sm:flex-row sm:items-center sm:justify-end sm:px-8">
                            <Link
                                href={`/notes/${noteId}`}
                                className="inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium text-white/55 transition hover:bg-white/10 hover:text-white"
                            >
                                Cancel
                            </Link>

                            <Button
                                type="submit"
                                disabled={saving}
                                className="rounded-xl bg-gradient-to-r from-violet-500 to-blue-500 text-white shadow-lg shadow-violet-500/20 hover:from-violet-400 hover:to-blue-400"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </GlassCard>
            </div>
        </AppShell>
    );
}