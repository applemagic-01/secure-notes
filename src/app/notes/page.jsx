import Link from "next/link";
import { Plus } from "lucide-react";

import { AppShell } from "@/components/app/layout/app-shell";
import { NoteList } from "@/components/app/notes/note-list";
import { Button } from "@/components/ui/button";

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

                    <Button
                        asChild
                        className="h-11 rounded-xl border border-white/10 bg-gradient-to-r from-blue-500 to-violet-500 px-5 text-white shadow-lg shadow-blue-500/20 hover:from-blue-400 hover:to-violet-400"
                    >
                        <Link href="/notes/new">
                            <Plus className="mr-2 h-4 w-4" />
                            New Note
                        </Link>
                    </Button>
                </div>

                <NoteList />
            </div>
        </AppShell>
    );
}