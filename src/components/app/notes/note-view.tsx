"use client";

// Displays one note and coordinates its edit, delete, and sharing actions without moving authorization decisions into the UI.

import { useEffect, useState } from "react";
import {
    ArrowLeft,
    CalendarDays,
    FileText,
    Loader2,
    Pencil,
    Share2,
    Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { GlassCard } from "@/components/app/glass/glass-card";
import { GlassPanel } from "@/components/app/glass/glass-panel";
import { Button } from "@/components/ui/button";
import { DeleteNoteDialog } from "@/components/app/notes/delete-note-dialog";

interface Note {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    updatedAt: string;
}

interface NoteViewProps {
    noteId: string;
}

export function NoteView({ noteId }: NoteViewProps) {
    const router = useRouter();

    const [note, setNote] = useState<Note | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [deleting, setDeleting] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] =
        useState(false);

    useEffect(() => {
        async function loadNote() {
            try {
                const response = await fetch(`/api/notes/${noteId}`);

                const data = await response.json();

                if (!response.ok) {
                    setError(data.error ?? "Unable to load note.");
                    return;
                }

                setNote(data.note);
            } catch {
                setError("Something went wrong while loading the note.");
            } finally {
                setLoading(false);
            }
        }

        loadNote();
    }, [noteId]);

    async function handleDelete() {
        setDeleting(true);
        setError("");

        try {
            const response = await fetch(`/api/notes/${noteId}`, {
                method: "DELETE",
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error ?? "Unable to delete note.");
                return;
            }

            setDeleteDialogOpen(false);

            router.push("/notes");
            router.refresh();
        } catch {
            setError("Something went wrong while deleting the note.");
        } finally {
            setDeleting(false);
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <div className="flex items-center gap-3 text-sm text-white/50">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading note...
                </div>
            </div>
        );
    }

    if (error || !note) {
        return (
            <div className="mx-auto max-w-3xl">
                <GlassPanel className="rounded-2xl border-red-400/20 bg-red-500/10 p-8 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10">
                        <FileText className="h-5 w-5 text-red-300" />
                    </div>

                    <h1 className="font-medium text-white">
                        Unable to open note
                    </h1>

                    <p className="mt-2 text-sm text-red-200/70">
                        {error || "The requested note could not be found."}
                    </p>

                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => router.push("/notes")}
                        className="mt-5 rounded-xl text-white/70 hover:bg-white/10 hover:text-white"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Notes
                    </Button>
                </GlassPanel>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl">
            {/* Back */}
            <button
                type="button"
                onClick={() => router.push("/notes")}
                className="mb-6 flex items-center gap-2 text-sm text-white/50 transition hover:text-white"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Notes
            </button>

            <GlassCard className="overflow-hidden">
                {/* Header */}
                <div className="border-b border-white/10 px-6 py-6 sm:px-8">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex min-w-0 items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-blue-300/10 bg-blue-400/10">
                                <FileText className="h-5 w-5 text-blue-300" />
                            </div>

                            <div className="min-w-0">
                                <h1 className="break-words text-2xl font-semibold tracking-tight text-white">
                                    {note.title}
                                </h1>

                                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/35">
                                    <CalendarDays className="h-3.5 w-3.5" />

                                    <span>
                                        Updated {formatDate(note.updatedAt)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex shrink-0 items-center gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() =>
                                    router.push(`/notes/${note.id}/edit`)
                                }
                                className="rounded-xl text-white/60 hover:bg-white/10 hover:text-white"
                            >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </Button>

                            <Button
                                type="button"
                                className="rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 text-white shadow-lg shadow-blue-500/20 hover:from-blue-400 hover:to-violet-400"
                                onClick={() => {
                                    // Sharing UI will be connected here next.
                                    router.push(`/notes/${note.id}/share`);
                                }}
                            >
                                <Share2 className="mr-2 h-4 w-4" />
                                Share
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 py-8 sm:px-8 sm:py-10">
                    <div className="whitespace-pre-wrap break-words text-[15px] leading-8 text-white/80">
                        {note.content}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex flex-col gap-4 border-t border-white/10 bg-black/5 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                    <div className="text-xs text-white/30">
                        Created {formatDate(note.createdAt)}
                    </div>

                    <Button
                        type="button"
                        variant="ghost"
                        disabled={deleting}
                        onClick={() => setDeleteDialogOpen(true)}
                        className="rounded-xl text-red-300 hover:bg-red-500/10 hover:text-red-200"
                    >
                        {deleting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Trash2 className="mr-2 h-4 w-4" />
                        )}

                        {deleting ? "Deleting..." : "Delete Note"}
                    </Button>
                </div>

                {error && (
                    <div className="border-t border-red-400/10 bg-red-500/10 px-6 py-3 text-sm text-red-200 sm:px-8">
                        {error}
                    </div>
                )}
            </GlassCard>
            <DeleteNoteDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={handleDelete}
                loading={deleting}
            />
        </div>
    );
}

function formatDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toLocaleString();
}
