import { AppShell } from "@/components/app/layout/app-shell";
import { NoteEditor } from "@/components/app/notes/note-editor";

export default function NewNotePage() {
    return (
        <AppShell>
            <NoteEditor />
        </AppShell>
    );
}