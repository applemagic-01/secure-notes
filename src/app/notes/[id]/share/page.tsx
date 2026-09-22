import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";

import { ShareForm } from "@/components/app/sharing/share-form";
import { AppShell } from "@/components/app/layout/app-shell";

interface SharePageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function SharePage({
    params,
}: SharePageProps) {
    const { id } = await params;

    if (!id) {
        redirect("/notes");
    }

    return (
        <AppShell>
            <div className="mx-auto max-w-4xl">
                <Link
                    href={`/notes/${id}`}
                    className="mb-6 flex items-center gap-2 text-sm text-white/50 transition hover:text-white"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Note
                </Link>

                <ShareForm noteId={id} />
            </div>
        </AppShell>
    );
}