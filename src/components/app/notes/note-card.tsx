import Link from "next/link";
import { FileText } from "lucide-react";

import { GlassCard } from "@/components/app/glass/glass-card";

interface NoteCardProps {
    id: string;
    title: string;
    content: string;
    updatedAt: string;
}

export function NoteCard({
    id,
    title,
    content,
    updatedAt,
}: NoteCardProps) {
    return (
        <GlassCard className="group transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.09]">
            <Link href={`/notes/${id}`} className="block p-5">
                <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-300/10 bg-blue-400/10">
                        <FileText className="h-5 w-5 text-blue-300" />
                    </div>

                    <div className="min-w-0 flex-1">
                        <h2 className="font-medium text-white">
                            {title}
                        </h2>

                        <p className="mt-1 truncate text-sm text-white/50">
                            {content}
                        </p>

                        <p className="mt-3 text-xs text-white/35">
                            {updatedAt}
                        </p>
                    </div>
                </div>
            </Link>
        </GlassCard>
    );
}