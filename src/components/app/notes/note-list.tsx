"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, Loader2, Search } from "lucide-react";

import { GlassPanel } from "@/components/app/glass/glass-panel";
import { NoteCard } from "@/components/app/notes/note-card";

interface Note {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    updatedAt: string;
}

export function NoteList() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [search, setSearch] = useState("");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadNotes() {
            try {
                const response = await fetch("/api/notes");

                const data = await response.json();

                if (!response.ok) {
                    setError(data.error ?? "Unable to load notes");
                    return;
                }

                setNotes(data.notes ?? []);
            } catch {
                setError("Something went wrong while loading your notes.");
            } finally {
                setLoading(false);
            }
        }

        loadNotes();
    }, []);

    const filteredNotes = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) {
            return notes;
        }

        return notes.filter(
            (note) =>
                note.title.toLowerCase().includes(query) ||
                note.content.toLowerCase().includes(query)
        );
    }, [notes, search]);

    return (
        <div>
            {/* Search */}
            <GlassPanel className="mb-6 flex h-12 items-center rounded-xl px-4">
                <Search className="mr-3 h-4 w-4 shrink-0 text-white/40" />

                <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search notes..."
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
                />
            </GlassPanel>

            {/* Loading */}
            {loading && (
                <div className="flex min-h-48 items-center justify-center">
                    <div className="flex items-center gap-3 text-sm text-white/50">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading your notes...
                    </div>
                </div>
            )}

            {/* Error */}
            {!loading && error && (
                <GlassPanel className="rounded-2xl border-red-400/20 bg-red-500/10 p-6">
                    <p className="text-sm text-red-200">
                        {error}
                    </p>
                </GlassPanel>
            )}

            {/* Empty */}
            {!loading && !error && notes.length === 0 && (
                <GlassPanel className="flex min-h-64 flex-col items-center justify-center rounded-2xl p-8 text-center">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                        <FileText className="h-5 w-5 text-white/50" />
                    </div>

                    <h2 className="font-medium text-white">
                        No notes yet
                    </h2>

                    <p className="mt-2 max-w-sm text-sm text-white/45">
                        Create your first secure note and keep your
                        information in one private place.
                    </p>
                </GlassPanel>
            )}

            {/* No search results */}
            {!loading &&
                !error &&
                notes.length > 0 &&
                filteredNotes.length === 0 && (
                    <GlassPanel className="rounded-2xl p-8 text-center">
                        <p className="text-sm text-white/50">
                            No notes match your search.
                        </p>
                    </GlassPanel>
                )}

            {/* Notes */}
            {!loading &&
                !error &&
                filteredNotes.length > 0 && (
                    <div className="grid gap-4">
                        {filteredNotes.map((note) => (
                            <NoteCard
                                key={note.id}
                                id={note.id}
                                title={note.title}
                                content={note.content}
                                updatedAt={formatUpdatedAt(note.updatedAt)}
                            />
                        ))}
                    </div>
                )}
        </div>
    );
}

function formatUpdatedAt(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return `Updated ${date.toLocaleString()}`;
}