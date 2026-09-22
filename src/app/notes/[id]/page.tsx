import { AppShell } from "@/components/app/layout/app-shell";
import { NoteView } from "@/components/app/notes/note-view";

interface NotePageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function NotePage({
    params,
}: NotePageProps) {
    const { id } = await params;

    return (
        <AppShell>
            <NoteView noteId={id} />
        </AppShell>
    );
}