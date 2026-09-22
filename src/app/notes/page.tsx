import Link from "next/link";

import { AppShell } from "@/components/app/layout/app-shell";
import { NoteList } from "@/components/app/notes/note-list";

export default function NotesPage() {
    return (
        <AppShell>
            <div className="mx-auto max-w-6xl">
                <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                    <div>
                        <p className="mb-2 text-sm font-medium text-blue-300">
                            Your workspace
                        </p>

                        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                            My Notes
                        </h1>

                        <p className="mt-2 text-sm text-white/50">
                            Your secure notes, all in one place.
                        </p>
                    </div>

                    <Link
                        href="/notes/new"
                        className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm transition hover:bg-white/90"
                    >
                        New Note
                    </Link>
                </div>

                <NoteList />
            </div>
        </AppShell>
    );
}