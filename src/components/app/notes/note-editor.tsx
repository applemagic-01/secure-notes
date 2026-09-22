"use client";

import { FormEvent, useState } from "react";
import { ArrowLeft, FileText, Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";

import { GlassCard } from "@/components/app/glass/glass-card";
import { GlassPanel } from "@/components/app/glass/glass-panel";
import { Button } from "@/components/ui/button";

interface NoteEditorProps {
    mode?: "create" | "edit";
    noteId?: string;
    initialTitle?: string;
    initialContent?: string;
}

export function NoteEditor({
    mode = "create",
    noteId,
    initialTitle = "",
    initialContent = "",
}: NoteEditorProps) {
    const router = useRouter();

    const [title, setTitle] = useState(initialTitle);
    const [content, setContent] = useState(initialContent);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const isEditing = mode === "edit";

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setError("");

        if (!title.trim()) {
            setError("Title is required.");
            return;
        }

        if (!content.trim()) {
            setError("Content is required.");
            return;
        }

        setLoading(true);

        try {
            const url = isEditing
                ? `/api/notes/${noteId}`
                : "/api/notes";

            const method = isEditing ? "PATCH" : "POST";

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title,
                    content,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error ?? "Unable to save note.");
                return;
            }

            const savedNote = data.note;

            router.push(`/notes/${savedNote.id}`);
            router.refresh();
        } catch {
            setError("Something went wrong while saving the note.");
        } finally {
            setLoading(false);
        }
    }

    function handleCancel() {
        if (isEditing && noteId) {
            router.push(`/notes/${noteId}`);
            return;
        }

        router.push("/notes");
    }

    return (
        <div className="mx-auto max-w-4xl">
            {/* Back */}
            <button
                type="button"
                onClick={handleCancel}
                className="mb-6 flex items-center gap-2 text-sm text-white/50 transition hover:text-white"
            >
                <ArrowLeft className="h-4 w-4" />
                Back
            </button>

            <GlassCard className="overflow-hidden">
                {/* Header */}
                <div className="border-b border-white/10 px-6 py-6 sm:px-8">
                    <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-300/10 bg-blue-400/10">
                            <FileText className="h-5 w-5 text-blue-300" />
                        </div>

                        <div>
                            <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                                {isEditing ? "Edit Note" : "Create a New Note"}
                            </h1>

                            <p className="mt-1 text-sm text-white/45">
                                {isEditing
                                    ? "Update your secure note."
                                    : "Write and save your note securely."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="space-y-6 p-6 sm:p-8">
                        {/* Title */}
                        <div>
                            <label
                                htmlFor="note-title"
                                className="mb-2 block text-sm font-medium text-white/80"
                            >
                                Title
                            </label>

                            <GlassPanel className="rounded-xl">
                                <input
                                    id="note-title"
                                    type="text"
                                    value={title}
                                    onChange={(event) => setTitle(event.target.value)}
                                    placeholder="Enter a title for your note..."
                                    maxLength={200}
                                    required
                                    className="h-12 w-full bg-transparent px-4 text-sm text-white outline-none placeholder:text-white/30"
                                />
                            </GlassPanel>

                            <p className="mt-2 text-right text-xs text-white/30">
                                {title.length}/200
                            </p>
                        </div>

                        {/* Content */}
                        <div>
                            <label
                                htmlFor="note-content"
                                className="mb-2 block text-sm font-medium text-white/80"
                            >
                                Content
                            </label>

                            <GlassPanel className="rounded-xl">
                                <textarea
                                    id="note-content"
                                    value={content}
                                    onChange={(event) =>
                                        setContent(event.target.value)
                                    }
                                    placeholder="Start writing..."
                                    maxLength={10000}
                                    required
                                    rows={4}
                                    className="w-full resize-y bg-transparent px-4 py-4 text-sm leading-7 text-white outline-none placeholder:text-white/30"
                                />
                            </GlassPanel>

                            <p className="mt-2 text-right text-xs text-white/30">
                                {content.length}/10,000
                            </p>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                                {error}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex flex-col-reverse gap-3 border-t border-white/10 bg-black/5 px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={handleCancel}
                            disabled={loading}
                            className="rounded-xl text-white/60 hover:bg-white/10 hover:text-white"
                        >
                            Cancel
                        </Button>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="rounded-xl border border-white/10 bg-gradient-to-r from-blue-500 to-violet-500 px-6 text-white shadow-lg shadow-blue-500/20 hover:from-blue-400 hover:to-violet-400"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    {isEditing ? "Save Changes" : "Save Note"}
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </GlassCard>
        </div>
    );
}